import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  /**
   * Create a new user
   */
  async create(
    createUserDto: CreateUserDto,
    creatorId: Types.ObjectId,
    organizationId: Types.ObjectId,
  ): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
      deletedAt: null,
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate role-specific requirements
    if (createUserDto.role === UserRole.LEADER && (!createUserDto.assignedBranches || createUserDto.assignedBranches.length === 0)) {
      throw new BadRequestException('LEADER role requires at least one assigned branch');
    }

    if (createUserDto.role === UserRole.MANAGER && (!createUserDto.assignedDepartments || createUserDto.assignedDepartments.length === 0)) {
      throw new BadRequestException('MANAGER role requires at least one assigned department');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(createUserDto.password, 12);

    // Create user
    const user = new this.userModel({
      email: createUserDto.email,
      passwordHash,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      role: createUserDto.role,
      organizationId,
      status: UserStatus.ACTIVE,
      assignedBranches: createUserDto.assignedBranches?.map(id => new Types.ObjectId(id)) || [],
      assignedDepartments: createUserDto.assignedDepartments?.map(id => new Types.ObjectId(id)) || [],
      createdBy: creatorId,
    });

    return user.save();
  }

  /**
   * Find all users with filters and pagination
   */
  async findAll(
    queryDto: QueryUsersDto,
    organizationId: Types.ObjectId,
    currentUserRole: UserRole,
    currentUserBranches: Types.ObjectId[],
    currentUserDepartments: Types.ObjectId[],
  ) {
    const { page = 1, limit = 10, role, status, branchId, departmentId, search, includeDeleted = false } = queryDto;

    // Build query
    const query: any = { organizationId };

    if (!includeDeleted) {
      query.deletedAt = null;
    }

    if (role) {
      query.role = role;
    }

    if (status) {
      query.status = status;
    }

    if (branchId) {
      query.assignedBranches = new Types.ObjectId(branchId);
    }

    if (departmentId) {
      query.assignedDepartments = new Types.ObjectId(departmentId);
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Apply scope filtering for non-OWNER users
    if (currentUserRole !== UserRole.OWNER) {
      if (currentUserRole === UserRole.LEADER) {
        // Leaders can only see users within their assigned branches
        query.assignedBranches = { $in: currentUserBranches };
      } else if (currentUserRole === UserRole.MANAGER) {
        // Managers can only see users within their assigned departments
        query.assignedDepartments = { $in: currentUserDepartments };
      }
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .select('-passwordHash')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      this.userModel.countDocuments(query),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find user by ID
   */
  async findById(userId: Types.ObjectId): Promise<User> {
    const user = await this.userModel
      .findOne({ _id: userId, deletedAt: null })
      .select('-passwordHash')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase(), deletedAt: null })
      .select('+passwordHash')
      .exec();
  }

  /**
   * Find user by email with password
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase(), deletedAt: null })
      .select('+passwordHash')
      .exec();
  }

  /**
   * Find user by email with OTP fields
   */
  async findByEmailWithOtp(email: string): Promise<User | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase(), deletedAt: null })
      .select('+otpCode +otpExpires')
      .exec();
  }

  /**
   * Create user with OTP (for signup flow)
   * If user exists but is unverified (PENDING_VERIFICATION), update their data and resend OTP
   */
  async createWithOtp(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    dialingCode: string;
    termsAcceptedAt: Date;
    otpCode: string;
    otpExpires: Date;
    role: UserRole;
    organizationId: Types.ObjectId;
  }): Promise<{ user: User; isReregistration: boolean }> {
    // Check if user already exists
    const existingUser = await this.userModel
      .findOne({
        email: data.email.toLowerCase(),
        deletedAt: null,
      })
      .select('+otpCode +otpExpires');

    if (existingUser) {
      // If user exists but is not verified, allow re-registration
      if (existingUser.status === UserStatus.PENDING_VERIFICATION) {
        // Hash new password
        const passwordHash = await bcrypt.hash(data.password, 12);

        // Update existing unverified user with new data
        existingUser.passwordHash = passwordHash;
        existingUser.firstName = data.firstName;
        existingUser.lastName = data.lastName;
        existingUser.phone = data.phone;
        existingUser.dialingCode = data.dialingCode;
        existingUser.termsAcceptedAt = data.termsAcceptedAt;
        existingUser.otpCode = data.otpCode;
        existingUser.otpExpires = data.otpExpires;
        existingUser.organizationId = data.organizationId;

        await existingUser.save();
        return { user: existingUser, isReregistration: true };
      }

      // User exists and is verified - don't allow re-registration
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user with pending verification
    const user = new this.userModel({
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      dialingCode: data.dialingCode,
      termsAcceptedAt: data.termsAcceptedAt,
      otpCode: data.otpCode,
      otpExpires: data.otpExpires,
      role: data.role,
      organizationId: data.organizationId,
      status: UserStatus.PENDING_VERIFICATION,
      assignedBranches: [],
      assignedDepartments: [],
    });

    return { user: await user.save(), isReregistration: false };
  }

  /**
   * Activate user after OTP verification
   */
  async activateUser(userId: Types.ObjectId): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      {
        status: UserStatus.ACTIVE,
        otpCode: null,
        otpExpires: null,
      },
    );
  }

  /**
   * Update OTP for user
   */
  async updateOtp(userId: Types.ObjectId, otpCode: string, otpExpires: Date): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { otpCode, otpExpires },
    );
  }

  /**
   * Update user
   */
  async update(
    userId: Types.ObjectId,
    updateUserDto: UpdateUserDto,
    currentUserId: Types.ObjectId,
  ): Promise<User> {
    const user = await this.findById(userId);

    // Prevent users from updating themselves
    if (userId.equals(currentUserId)) {
      throw new BadRequestException('You cannot update your own account through this endpoint');
    }

    // Update fields
    Object.assign(user, updateUserDto);

    if (updateUserDto.assignedBranches) {
      user.assignedBranches = updateUserDto.assignedBranches.map(id => new Types.ObjectId(id));
    }

    if (updateUserDto.assignedDepartments) {
      user.assignedDepartments = updateUserDto.assignedDepartments.map(id => new Types.ObjectId(id));
    }

    return user.save();
  }

  /**
   * Soft delete user
   */
  async remove(userId: Types.ObjectId, currentUserId: Types.ObjectId): Promise<void> {
    const user = await this.findById(userId);

    // Prevent self-deletion
    if (userId.equals(currentUserId)) {
      throw new BadRequestException('You cannot delete your own account');
    }

    user.deletedAt = new Date();
    user.status = UserStatus.INACTIVE;
    await user.save();
  }

  /**
   * Change user role (Owner only)
   */
  async changeRole(userId: Types.ObjectId, newRole: UserRole): Promise<User> {
    const user = await this.findById(userId);

    user.role = newRole;

    // Clear scope assignments if changing to OWNER
    if (newRole === UserRole.OWNER) {
      user.assignedBranches = [];
      user.assignedDepartments = [];
    }

    return user.save();
  }

  /**
   * Update password
   */
  async updatePassword(userId: Types.ObjectId, newPassword: string): Promise<void> {
    const user = await this.userModel
      .findOne({ _id: userId, deletedAt: null })
      .select('+passwordHash +passwordHistory')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Add old password to history
    if (!user.passwordHistory) {
      user.passwordHistory = [];
    }
    user.passwordHistory.push(user.passwordHash);

    // Keep only last 5 passwords
    if (user.passwordHistory.length > 5) {
      user.passwordHistory = user.passwordHistory.slice(-5);
    }

    user.passwordHash = passwordHash;
    await user.save();
  }

  /**
   * Increment failed login attempts
   */
  async incrementFailedLoginAttempts(userId: Types.ObjectId): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) return;

    user.failedLoginAttempts += 1;

    // Lock account after 5 failed attempts for 15 minutes
    if (user.failedLoginAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    }

    await user.save();
  }

  /**
   * Reset failed login attempts
   */
  async resetFailedLoginAttempts(userId: Types.ObjectId): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { failedLoginAttempts: 0, lockedUntil: null },
    );
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: Types.ObjectId): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { lastLoginAt: new Date() },
    );
  }

  /**
   * Validate user scope access
   */
  validateScope(
    user: User,
    branchId?: Types.ObjectId,
    departmentId?: Types.ObjectId,
  ): boolean {
    // Owners have access to everything
    if (user.role === UserRole.OWNER) {
      return true;
    }

    // Leaders: check branch access
    if (user.role === UserRole.LEADER && branchId) {
      return user.assignedBranches.some(b => b.equals(branchId));
    }

    // Managers: check department access
    if (user.role === UserRole.MANAGER && departmentId) {
      return user.assignedDepartments.some(d => d.equals(departmentId));
    }

    return false;
  }
}
