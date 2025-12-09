export type AppMode = 'production' | 'development' | 'test';

export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  appMode: (process.env.APP_MODE || 'development') as AppMode,
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/planetshr_dev',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4',
  },
  mastra: {
    apiKey: process.env.MASTRA_API_KEY,
    baseUrl: process.env.MASTRA_BASE_URL || 'https://api.mastra.ai',
  },
  astrology: {
    userId: process.env.ASTROLOGY_USER_ID,
    apiKey: process.env.ASTROLOGY_API_KEY,
  },
  stripe: {
    publicKey: process.env.STRIPE_PUBLIC_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    from: process.env.SMTP_FROM || 'PlanetsHR <noreply@planetshr.com>',
  },
  app: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  features: {
    enableSwagger: process.env.ENABLE_SWAGGER === 'true',
    enableCors: process.env.ENABLE_CORS !== 'false',
  },
});
