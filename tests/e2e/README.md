# Test Suite Organization

```
tests/
├── e2e/
│   ├── scenarios/     # Happy path user flows
│   │   ├── fixtures.ts
│   │   ├── donation-flow.spec.ts
│   │   └── user-flow.spec.ts
│   ├── bugs/          # Regression tests for fixed bugs
│   │   └── geolocation-bugs.spec.ts
│   └── README.md
├── api/               # Backend API tests (future)
└── integration/      # Integration tests (future)
```

## Running Tests

```bash
# E2E Tests
npx playwright test              # Run all e2e tests
npx playwright test tests/e2e/scenarios   # Run scenarios only
npx playwright test tests/e2e/bugs        # Run bug regression only
npx playwright test --project=chromium     # Run on Chromium only

# Unit Tests
npm run test:frontend            # Frontend vitest
npm run test:backend             # Backend vitest

# All tests
npm test
```

## Adding New Tests

- **Bug regression tests**: Add to `tests/e2e/bugs/` with clear description of the bug
- **New user flows**: Add to `tests/e2e/scenarios/`
- **API tests**: Add to `tests/api/`