import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'https://foodshare777.web.app';
const API_URL = process.env.E2E_API_URL || 'https://api.et3am.com';

export { BASE_URL, API_URL };