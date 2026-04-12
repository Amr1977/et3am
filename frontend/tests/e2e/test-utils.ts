import { test as base, Page } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    const loggedPage = wrapPageWithLogging(page);
    await use(loggedPage);
  },
});

function wrapPageWithLogging(page: Page): Page {
  const originalGoto = page.goto.bind(page);
  page.goto = async (url, options) => {
    console.log(`\n🔄 NAVIGATE: ${url}`);
    const result = await originalGoto(url, options);
    console.log(`✅ LOADED: ${url} (status: ${result?.status()})`);
    return result;
  };

  const originalClick = page.click.bind(page);
  page.click = async (selector, options) => {
    console.log(`👆 CLICK: ${selector}`);
    try {
      await originalClick(selector, options);
      console.log(`✅ CLICKED: ${selector}`);
    } catch (e) {
      console.log(`❌ CLICK FAILED: ${selector} - ${e}`);
      throw e;
    }
    return undefined;
  };

  const originalFill = page.fill.bind(page);
  page.fill = async (selector, value, options) => {
    console.log(`📝 FILL: ${selector} = "${value}"`);
    try {
      await originalFill(selector, value, options);
      console.log(`✅ FILLED: ${selector}`);
    } catch (e) {
      console.log(`❌ FILL FAILED: ${selector} - ${e}`);
      throw e;
    }
    return undefined;
  };

  return page;
}

export { expect } from '@playwright/test';
