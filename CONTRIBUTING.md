# Contributing to Et3am

Thank you for your interest in contributing to Et3am! This document will help you get started.

## Quick Start

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/et3am.git
cd et3am

# 3. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 4. Set up environment
cp backend/.env.example backend/.env
# Edit .env with your local settings

# 5. Run development servers
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend  
cd frontend && npm run dev
```

## Development Setup

### Requirements
- Node.js 20+
- PostgreSQL (local or Neon cloud)
- Firebase project (create at console.firebase.google.com)

### Environment Variables

Create `backend/.env` based on `.env.example`:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/et3am
JWT_SECRET=your-random-64-char-secret
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# Firebase (get from Project Settings > Service Accounts)
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
FIREBASE_PROJECT_ID=your-project
```

## Pull Request Process

1. **Create a branch** from `master`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Add tests** if applicable (backend has Vitest, frontend has Playwright)

4. **Run checks locally:**
   ```bash
   # Backend tests
   cd backend && npm run test:run
   
   # Frontend build
   cd frontend && npm run build
   ```

5. **Submit PR** with clear description:
   - What does this change do?
   - Why is it needed?
   - How can someone test it?

6. **Wait for review** - typically 1-2 business days

## Coding Standards

### Git Commits
We use Conventional Commits:
```
feat: add new feature
fix: resolve a bug
docs: update documentation
refactor: restructure code
test: add tests
chore: maintenance
```

### Code Style
- ESLint + Prettier (automatic on save)
- TypeScript - strict mode
- Meaningful variable/function names
- Comment complex logic, not obvious code

### Testing
- New features should have tests
- Bug fixes should include regression tests
- Run tests before committing

## Project Structure

```
et3am/
├── backend/           # Express API server
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # Business logic
│   │   ├── middleware/ # Auth, rate limiting
│   │   └── config/   # Configuration
│   └── tests/        # Integration tests
│
├── frontend/         # React application
│   ├── src/
│   │   ├── pages/   # Page components
│   │   ├── components/ # Reusable components
│   │   ├── context/ # React contexts
│   │   ├── hooks/   # Custom hooks
│   │   └── services/ # API calls
│   └── tests/        # E2E tests
│
└── docs/             # Documentation
```

## Getting Help

- **Issues:** Open a GitHub issue for bugs/features
- **Discussions:** Use GitHub Discussions for questions
- **Security:** See SECURITY.md for vulnerability reporting

## Recognition

Contributors will be added to CONTRIBUTORS.md after their first PR is merged.

---

*Last updated: 2026-04-07*