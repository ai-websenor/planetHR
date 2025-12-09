import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { OrganizationsService } from '../../organizations/organizations.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { AuthEmailService } from '../../email/services/auth-email.service';
import { User, UserRole, UserStatus } from '../../users/schemas/user.schema';
import { RefreshToken } from '../schemas/refresh-token.schema';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { SignupDto } from '../dto/signup.dto';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: UserRole;
  organizationId: string;
  assignedBranches: string[];
  assignedDepartments: string[];
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface OnboardingStatus {
  isCompleted: boolean;
  currentStep: number;
}

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
  onboarding: OnboardingStatus;
}

@Injectable()
export class AuthService {
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly TEST_OTP = '123456';

  constructor(
    private readonly usersService: UsersService,
    private readonly organizationsService: OrganizationsService,
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly authEmailService: AuthEmailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshToken>,
  ) {}

  /**
   * Register a new organization owner
   */
  async register(
    registerDto: RegisterDto,
    ipAddress: string,
  ): Promise<{ user: User; organization: any; tokens: AuthTokens }> {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate password strength
    const passwordValidation = this.passwordService.validatePasswordStrength(registerDto.password);
    if (!passwordValidation.valid) {
      throw new BadRequestException(passwordValidation.errors.join(', '));
    }

    // Create organization
    const organization = await this.organizationsService.create({
      name: registerDto.organizationName,
      industry: registerDto.industry,
      website: registerDto.website,
    });

    // Hash password
    const passwordHash = await this.passwordService.hashPassword(registerDto.password);

    // Create owner user
    const user = await this.usersService.create(
      {
        email: registerDto.email,
        password: registerDto.password,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: UserRole.OWNER,
      },
      organization._id as Types.ObjectId,
      organization._id as Types.ObjectId,
    );

    // Mark user as active (no email verification for owner during registration)
    // Note: For registration, we bypass the update validation by using a system update
    // Instead of using update(), directly update the user object
    user.status = UserStatus.ACTIVE;
    await user.save();

    // Generate tokens
    const tokens = await this.generateTokens(user, ipAddress);

    return { user, organization, tokens };
  }

  /**
   * Signup new user (creates pending verification user and sends OTP)
   * If user exists but is unverified, updates their data and resends OTP
   */
  async signup(signupDto: SignupDto): Promise<{ message: string; email: string }> {
    // Validate terms acceptance
    if (!signupDto.termsAccepted) {
      throw new BadRequestException('You must accept the terms and conditions');
    }

    // Validate password strength
    const passwordValidation = this.passwordService.validatePasswordStrength(signupDto.password);
    if (!passwordValidation.valid) {
      throw new BadRequestException(passwordValidation.errors.join(', '));
    }

    // Split name into firstName and lastName
    const nameParts = signupDto.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    // Generate OTP
    const otp = this.generateOtp();
    const otpExpires = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Check if user exists and is unverified - reuse their organization
    const existingUser = await this.usersService.findByEmail(signupDto.email);
    let organizationId: Types.ObjectId;

    if (existingUser && existingUser.status === UserStatus.PENDING_VERIFICATION) {
      // Reuse existing organization for re-registration
      organizationId = existingUser.organizationId;
    } else {
      // Create new organization (minimal - will be completed during onboarding)
      const organization = await this.organizationsService.create({
        name: `${firstName}'s Organization`,
      });
      organizationId = organization._id as Types.ObjectId;
    }

    // Create or update user with pending verification
    const { user, isReregistration } = await this.usersService.createWithOtp({
      email: signupDto.email,
      password: signupDto.password,
      firstName,
      lastName,
      phone: signupDto.phone,
      dialingCode: signupDto.dialing_code,
      termsAcceptedAt: new Date(),
      otpCode: otp,
      otpExpires,
      role: UserRole.OWNER,
      organizationId,
    });

    // Send OTP email (skip in test mode)
    if (!this.isTestMode()) {
      await this.authEmailService.sendOtpEmail(signupDto.email, {
        userName: firstName,
        otp,
        expiryMinutes: this.OTP_EXPIRY_MINUTES,
      });
    }

    const baseMessage = this.isTestMode()
      ? `Test mode: Use OTP ${this.TEST_OTP} to verify`
      : 'OTP sent to your email. Please verify to continue.';

    return {
      message: isReregistration
        ? `${baseMessage} (Previous unverified registration updated)`
        : baseMessage,
      email: signupDto.email,
    };
  }

  /**
   * Verify OTP and activate user
   */
  async verifyOtp(
    email: string,
    otp: string,
    ipAddress: string,
  ): Promise<AuthResult> {
    const user = await this.usersService.findByEmailWithOtp(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('Email is already verified');
    }

    if (!user.otpCode || !user.otpExpires) {
      throw new BadRequestException('No OTP request found. Please request a new OTP.');
    }

    if (new Date() > user.otpExpires) {
      throw new BadRequestException('OTP has expired. Please request a new OTP.');
    }

    if (user.otpCode !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Activate user and clear OTP
    await this.usersService.activateUser(user._id as Types.ObjectId);

    // Send welcome email (skip in test mode)
    if (!this.isTestMode()) {
      await this.authEmailService.sendWelcomeEmail(email, {
        userName: user.firstName,
      });
    }

    // Generate tokens
    const activatedUser = await this.usersService.findById(user._id as Types.ObjectId);
    const tokens = await this.generateTokens(activatedUser, ipAddress);

    // Get onboarding status
    const organization = await this.organizationsService.findById(activatedUser.organizationId);
    const onboarding = {
      isCompleted: organization.onboardingCompleted,
      currentStep: organization.onboardingStep,
    };

    return { user: activatedUser, tokens, onboarding };
  }

  /**
   * Resend OTP to user
   */
  async resendOtp(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate new OTP
    const otp = this.generateOtp();
    const otpExpires = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Update user with new OTP
    await this.usersService.updateOtp(user._id as Types.ObjectId, otp, otpExpires);

    // Send OTP email (skip in test mode)
    if (!this.isTestMode()) {
      await this.authEmailService.sendOtpEmail(email, {
        userName: user.firstName,
        otp,
        expiryMinutes: this.OTP_EXPIRY_MINUTES,
      });
    }

    return {
      message: this.isTestMode()
        ? `Test mode: Use OTP ${this.TEST_OTP} to verify`
        : 'OTP has been resent to your email',
    };
  }

  /**
   * Generate 6-digit OTP (returns fixed OTP in test mode)
   */
  private generateOtp(): string {
    const appMode = this.configService.get<string>('appMode');

    if (appMode === 'test') {
      return this.TEST_OTP;
    }

    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Check if app is in test mode
   */
  private isTestMode(): boolean {
    return this.configService.get<string>('appMode') === 'test';
  }

  /**
   * Validate user credentials
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmailWithPassword(email);

    if (!user) {
      return null;
    }

    // Check if account is locked
    if (user.isLocked) {
      throw new UnauthorizedException(
        `Account is locked until ${user.lockedUntil.toISOString()}. Please try again later.`,
      );
    }

    // Check if account is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    // Validate password
    const isPasswordValid = await this.passwordService.comparePassword(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      // Increment failed login attempts
      await this.usersService.incrementFailedLoginAttempts(user._id as Types.ObjectId);
      return null;
    }

    // Reset failed login attempts on successful login
    await this.usersService.resetFailedLoginAttempts(user._id as Types.ObjectId);

    return user;
  }

  /**
   * Login user
   */
  async login(
    loginDto: LoginDto,
    ipAddress: string,
  ): Promise<AuthResult> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login timestamp
    await this.usersService.updateLastLogin(user._id as Types.ObjectId);

    // Generate tokens
    const tokens = await this.generateTokens(user, ipAddress);

    // Get onboarding status
    const organization = await this.organizationsService.findById(user.organizationId);
    const onboarding = {
      isCompleted: organization.onboardingCompleted,
      currentStep: organization.onboardingStep,
    };

    // Remove password from response
    const userObject = user.toObject();
    delete userObject.passwordHash;

    return { user: userObject as User, tokens, onboarding };
  }

  /**
   * Logout user
   */
  async logout(userId: string, sessionId: string, accessToken: string): Promise<void> {
    // Delete session
    await this.sessionService.deleteSession(userId, sessionId);

    // Blacklist access token
    const decoded = this.jwtService.decode(accessToken) as JwtPayload;
    if (decoded && decoded.exp) {
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
      if (expiresIn > 0) {
        await this.tokenBlacklistService.blacklistToken(accessToken, expiresIn);
      }
    }

    // Revoke refresh tokens
    await this.refreshTokenModel.updateMany(
      { userId: new Types.ObjectId(userId), isRevoked: false },
      { isRevoked: true, revokedAt: new Date() },
    );
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    refreshTokenString: string,
    ipAddress: string,
  ): Promise<AuthTokens> {
    // Find refresh token
    const refreshToken = await this.refreshTokenModel.findOne({
      token: refreshTokenString,
      isRevoked: false,
    });

    if (!refreshToken || !refreshToken.isActive) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Get user
    const user = await this.usersService.findById(refreshToken.userId);

    // Revoke old refresh token
    refreshToken.isRevoked = true;
    refreshToken.revokedAt = new Date();
    await refreshToken.save();

    // Generate new tokens
    const tokens = await this.generateTokens(user, ipAddress);

    // Store the replacement token reference
    refreshToken.replacedByToken = tokens.refreshToken;
    await refreshToken.save();

    return tokens;
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(
    user: User,
    ipAddress: string,
  ): Promise<AuthTokens> {
    // Create session
    const sessionId = await this.sessionService.createSession(
      user._id as Types.ObjectId,
      user.organizationId,
      user.email,
      user.role,
      user.assignedBranches,
      user.assignedDepartments,
      ipAddress,
    );

    const userId = (user._id as Types.ObjectId).toString();

    // JWT payload
    const payload: JwtPayload = {
      sub: userId,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId.toString(),
      assignedBranches: user.assignedBranches.map(b => b.toString()),
      assignedDepartments: user.assignedDepartments.map(d => d.toString()),
      sessionId,
    };

    // Generate access token
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRATION', '24h'),
    });

    // Generate refresh token
    const refreshTokenString = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
      },
    );

    // Store refresh token in database
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days

    const refreshToken = new this.refreshTokenModel({
      token: refreshTokenString,
      userId: user._id,
      organizationId: user.organizationId,
      expiresAt: refreshTokenExpiry,
      ipAddress,
    });

    await refreshToken.save();

    return {
      accessToken,
      refreshToken: refreshTokenString,
    };
  }

  /**
   * Forgot password - generate reset token and send email
   */
  async forgotPassword(email: string): Promise<{ resetToken: string }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      // Don't reveal if user exists
      throw new NotFoundException('If the email exists, a reset link will be sent');
    }

    // Generate reset token
    const resetToken = this.passwordService.generateResetToken();
    const hashedToken = this.passwordService.hashToken(resetToken);

    // Store hashed token and expiry (1 hour)
    const resetExpiry = new Date();
    resetExpiry.setHours(resetExpiry.getHours() + 1);

    await this.usersService.update(
      user._id as Types.ObjectId,
      {
        passwordResetToken: hashedToken,
        passwordResetExpires: resetExpiry,
      } as any,
      user._id as Types.ObjectId,
    );

    return { resetToken };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = this.passwordService.hashToken(token);

    // Find user with valid reset token
    const user = await this.usersService.findByEmailWithPassword(''); // Need to implement findByResetToken

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Validate new password
    const passwordValidation = this.passwordService.validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new BadRequestException(passwordValidation.errors.join(', '));
    }

    // Update password
    await this.usersService.updatePassword(user._id as Types.ObjectId, newPassword);

    // Clear reset token
    await this.usersService.update(
      user._id as Types.ObjectId,
      {
        passwordResetToken: null,
        passwordResetExpires: null,
      } as any,
      user._id as Types.ObjectId,
    );

    // Invalidate all sessions
    await this.sessionService.deleteAllUserSessions((user._id as Types.ObjectId).toString());
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersService.findByEmailWithPassword(''); // Need user by ID with password

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isValid = await this.passwordService.comparePassword(
      currentPassword,
      user.passwordHash,
    );

    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Validate new password
    const passwordValidation = this.passwordService.validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new BadRequestException(passwordValidation.errors.join(', '));
    }

    // Check password history
    const isInHistory = await this.passwordService.isPasswordInHistory(
      newPassword,
      user.passwordHistory || [],
    );

    if (isInHistory) {
      throw new BadRequestException('Cannot reuse a recent password');
    }

    // Update password
    await this.usersService.updatePassword(new Types.ObjectId(userId), newPassword);

    // Invalidate all sessions except current
    await this.sessionService.deleteAllUserSessions(userId);
  }

  /**
   * Validate access token
   */
  async validateAccessToken(token: string): Promise<JwtPayload> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Verify token
      const payload = this.jwtService.verify(token) as JwtPayload;

      // Validate session
      const sessionValidation = await this.sessionService.validateSession(
        payload.sub,
        payload.sessionId,
        '', // IP address validation (optional)
      );

      if (!sessionValidation.valid) {
        throw new UnauthorizedException(sessionValidation.reason);
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
