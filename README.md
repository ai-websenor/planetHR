# PlanetsHR Backend API 🚀

AI-Powered HR Analytics Platform - Backend API built with NestJS, MongoDB, and advanced AI integrations.

## 🏗️ Tech Stack

- **Framework**: NestJS v11.x with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Queue System**: BullMQ with Redis
- **Authentication**: JWT with Passport
- **AI Integration**: OpenAI GPT-4 + Mastra.ai
- **Payments**: Stripe
- **Email**: Nodemailer
- **WebSockets**: Socket.io
- **Documentation**: Swagger/OpenAPI
- **Package Manager**: pnpm

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x LTS
- pnpm 10.x
- MongoDB 7.x
- Redis 7.x

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd planetshr-backend

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start development server
pnpm run start:dev
```

### Using Docker (Recommended)

```bash
# Development with Docker Compose
pnpm run docker:dev

# Production build
pnpm run docker:run
```

## 📚 API Documentation

When running in development mode, API documentation is available at:
- **Swagger UI**: http://localhost:3000/api/docs

## 🔧 Development

### Available Scripts

```bash
# Development
pnpm run start:dev          # Start with file watching
pnpm run start:debug        # Start with debugging enabled

# Building
pnpm run build             # Build for production
pnpm run build:prod        # Build with webpack optimization

# Testing
pnpm run test              # Run unit tests
pnpm run test:watch        # Run tests in watch mode
pnpm run test:cov          # Run tests with coverage
pnpm run test:e2e          # Run end-to-end tests

# Code Quality
pnpm run lint              # Run ESLint
pnpm run format            # Format code with Prettier

# Docker
pnpm run docker:build      # Build Docker image
pnpm run docker:dev        # Run development environment
pnpm run docker:run        # Run production environment
pnpm run docker:down       # Stop all containers
```

### Project Structure

```
src/
├── main.ts                 # Application entry point
├── app.module.ts           # Root module
├── config/                 # Configuration files
├── common/                 # Shared utilities
│   ├── decorators/         # Custom decorators
│   ├── guards/             # Authentication guards
│   ├── interceptors/       # Request/response interceptors
│   ├── pipes/              # Validation pipes
│   └── exceptions/         # Custom exceptions
├── modules/                # Feature modules
│   ├── auth/               # Authentication
│   ├── users/              # User management
│   ├── organizations/      # Organization management
│   ├── employees/          # Employee management
│   ├── reports/            # AI report generation
│   ├── payments/           # Stripe integration
│   ├── email/              # Email services
│   ├── chat/               # WebSocket chat
│   └── cron/               # Scheduled tasks
└── shared/                 # Shared services
    ├── services/           # Global services
    ├── utils/              # Utility functions
    └── types/              # Type definitions
```

## 🌍 Environment Variables

Copy `.env.example` to `.env` and configure:

### Required Variables

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/planetshr_dev
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key

# Application
PORT=3000
NODE_ENV=development
```

### Optional Variables

```bash
# AI Services
OPENAI_API_KEY=sk-your-openai-key
MASTRA_API_KEY=your-mastra-key

# Payments
STRIPE_SECRET_KEY=sk_test_your-stripe-key

# Email
SMTP_HOST=smtp.mailtrap.io
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm run test:cov

# Run e2e tests
pnpm run test:e2e

# Run tests in watch mode
pnpm run test:watch
```

## 🔐 Security Features

- **Helmet**: Security headers
- **Rate Limiting**: API endpoint protection
- **CORS**: Cross-origin request handling
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Request data validation
- **Password Hashing**: bcrypt password security

## 📊 Health Checks

- **Health Endpoint**: `GET /api/health`
- **Application Status**: `GET /api/`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is private and proprietary.

---

Built with ❤️ by the PlanetsHR Team