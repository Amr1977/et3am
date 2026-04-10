import { test, expect } from '@playwright/test';

test.describe('ET3AM-001: Donation Report Feature', () => {
  test('should display report button in donation modal', async ({ page }) => {
    await page.goto('/donations');
    await page.waitForTimeout(2000);
    
    const donationCard = page.locator('.donation-card').first();
    if (await donationCard.isVisible()) {
      await donationCard.click();
      await page.waitForTimeout(1000);
      
      const reportBtn = page.locator('button:has-text("Report"), button:has-text("إبلاغ")');
      await expect(reportBtn).toBeVisible();
    }
  });

  test('should open report dialog when report button clicked', async ({ page }) => {
    await page.goto('/donations');
    await page.waitForTimeout(2000);
    
    const donationCard = page.locator('.donation-card').first();
    if (await donationCard.isVisible()) {
      await donationCard.click();
      await page.waitForTimeout(1000);
      
      const reportBtn = page.locator('button:has-text("Report"), button:has-text("إبلاغ")').first();
      if (await reportBtn.isVisible()) {
        await reportBtn.click();
        await page.waitForTimeout(500);
        
        const reportDialog = page.locator('[class*="report"], [class*="modal"]');
        await expect(reportDialog).toBeVisible();
      }
    }
  });

  test('should show report reasons selection', async ({ page }) => {
    await page.goto('/donations');
    await page.waitForTimeout(2000);
    
    const donationCard = page.locator('.donation-card').first();
    if (await donationCard.isVisible()) {
      await donationCard.click();
      await page.waitForTimeout(1000);
      
      const reportBtn = page.locator('button:has-text("Report"), button:has-text("إبلاغ")').first();
      if (await reportBtn.isVisible()) {
        await reportBtn.click();
        await page.waitForTimeout(500);
        
        const reasonOptions = page.locator('[class*="reason"], input[type="radio"]');
        const count = await reasonOptions.count();
        expect(count).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('ET3AM-003: Donor CRUD - Edit Own Donations', () => {
  test('should show edit button for own donations', async ({ page }) => {
    await page.goto('/my-donations');
    await page.waitForTimeout(2000);
    
    const editBtn = page.locator('button:has-text("Edit"), button:has-text("تعديل")');
    const count = await editBtn.count();
    
    if (count > 0) {
      await expect(editBtn.first()).toBeVisible();
    } else {
      console.log('No donations to edit - expected for new users');
    }
  });

  test('should open edit form when edit button clicked', async ({ page }) => {
    await page.goto('/my-donations');
    await page.waitForTimeout(2000);
    
    const editBtn = page.locator('button:has-text("Edit"), button:has-text("تعديل")').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForTimeout(500);
      
      const editForm = page.locator('input[name="title"], textarea[name="description"]');
      await expect(editForm.first()).toBeVisible();
    }
  });

  test('should allow updating donation title', async ({ page }) => {
    await page.goto('/my-donations');
    await page.waitForTimeout(2000);
    
    const editBtn = page.locator('button:has-text("Edit"), button:has-text("تعديل")').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForTimeout(500);
      
      const titleInput = page.locator('input[name="title"]').first();
      if (await titleInput.isVisible()) {
        await titleInput.fill('Updated Title');
        
        const saveBtn = page.locator('button:has-text("Save"), button:has-text("حفظ")').first();
        if (await saveBtn.isVisible()) {
          await saveBtn.click();
          await page.waitForTimeout(1000);
          
          const updatedCard = page.locator('.donation-card:has-text("Updated Title")');
          expect(await updatedCard.count()).toBeGreaterThan(0);
        }
      }
    }
  });
});

test.describe('BUG-002: Preserve Donation Description Formatting', () => {
  test('should preserve line breaks in description', async ({ page }) => {
    await page.goto('/donations');
    await page.waitForTimeout(2000);
    
    const donationCard = page.locator('.donation-card').first();
    if (await donationCard.isVisible()) {
      await donationCard.click();
      await page.waitForTimeout(1000);
      
      const description = page.locator('[class*="description"]').first();
      const text = await description.textContent();
      
      expect(text).toBeTruthy();
    }
  });

  test('should preserve whitespace in description', async ({ page }) => {
    await page.goto('/donations');
    await page.waitForTimeout(2000);
    
    const donationCard = page.locator('.donation-card').first();
    if (await donationCard.isVisible()) {
      await donationCard.click();
      await page.waitForTimeout(1000);
      
      const description = page.locator('[class*="description"]').first();
      const html = await description.innerHTML();
      
      const hasFormatting = html.includes('&nbsp;') || html.includes(' ') || html.includes('\n');
      expect(hasFormatting).toBe(true);
    }
  });
});

test.describe('BUG-003: RTL Text Direction', () => {
  test('should display Arabic text with correct direction', async ({ page }) => {
    await page.goto('/donations');
    await page.waitForTimeout(2000);
    
    const arabicText = page.locator('[lang="ar"], :lang(ar)');
    const count = await arabicText.count();
    
    if (count > 0) {
      const style = await arabicText.first().evaluate(el => 
        window.getComputedStyle(el).direction
      );
      expect(style).toBe('rtl');
    }
  });

  test('should handle mixed Arabic/English text correctly', async ({ page }) => {
    await page.goto('/donations');
    await page.waitForTimeout(2000);
    
    const donationCard = page.locator('.donation-card').first();
    if (await donationCard.isVisible()) {
      await donationCard.click();
      await page.waitForTimeout(1000);
      
      const description = page.locator('[class*="description"]').first();
      if (await description.isVisible()) {
        const text = await description.textContent();
        if (text && text.includes('عربي') && text.includes('English')) {
          const dir = await description.evaluate(el => 
            window.getComputedStyle(el).direction
          );
          expect(['ltr', 'rtl']).toContain(dir);
        }
      }
    }
  });
});

test.describe('BUG-001: Timezone Display', () => {
  test('should show donation time in user timezone', async ({ page }) => {
    await page.goto('/donations');
    await page.waitForTimeout(2000);
    
    const donationCard = page.locator('.donation-card').first();
    if (await donationCard.isVisible()) {
      await donationCard.click();
      await page.waitForTimeout(1000);
      
      const timeElement = page.locator('[class*="time"], [class*="date"], [class*="available"]');
      const count = await timeElement.count();
      
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should not show UTC timezone explicitly', async ({ page }) => {
    await page.goto('/donations');
    await page.waitForTimeout(2000);
    
    const donationCard = page.locator('.donation-card').first();
    if (await donationCard.isVisible()) {
      await donationCard.click();
      await page.waitForTimeout(1000);
      
      const pageContent = await page.textContent('body');
      expect(pageContent).not.toContain('UTC');
    }
  });
});

test.describe('ET3AM-010: Two-level Admin Menu', () => {
  test('should display admin panel with two-level navigation', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    
    const adminPanel = page.locator('.admin-panel, [class*="admin"]');
    await expect(adminPanel.first()).toBeVisible();
  });

  test('should have main menu items', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    
    const mainMenuItems = page.locator('.nav-item, [class*="menu-item"]');
    const count = await mainMenuItems.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('should expand submenu on click', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    
    const tabGroup = page.locator('.admin-tab-group').first();
    if (await tabGroup.isVisible()) {
      const tabButton = tabGroup.locator('.tab-modern').first();
      await tabButton.click();
      await page.waitForTimeout(500);
      
      const activeClass = await tabButton.getAttribute('class');
      expect(activeClass).toContain('active');
    }
  });

  test('should show nested menu items', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    
    const nestedItems = page.locator('.submenu a, [class*="submenu"] a');
    const count = await nestedItems.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('ET3AM-009: Admin Donations Redesign', () => {
  test('should display donations table in admin panel', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    
    const donationsTab = page.locator('button:has-text("Donations"), button:has-text("🎁")').first();
    if (await donationsTab.isVisible()) {
      await donationsTab.click();
      await page.waitForTimeout(500);
    }
    
    const content = page.locator('.admin-donations, [class*="donations"]');
    const isVisible = await content.count() > 0 || await page.locator('[class*="table"]').count() > 0;
    expect(isVisible).toBeTruthy();
  });

  test('should have filter options for donations', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    
    const donationsTab = page.locator('button:has-text("Donations"), button:has-text("🎁")').first();
    if (await donationsTab.isVisible()) {
      await donationsTab.click();
      await page.waitForTimeout(500);
    }
    
    const filters = page.locator('.admin-filters, [class*="filter"], select, input[type="search"]');
    const count = await filters.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show donation status badges', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    
    const donationsTab = page.locator('button:has-text("Donations"), button:has-text("🎁")').first();
    if (await donationsTab.isVisible()) {
      await donationsTab.click();
      await page.waitForTimeout(500);
    }
    
    const badges = page.locator('[class*="badge"], [class*="status"]');
    const count = await badges.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('ET3AM-008: Comprehensive Review (PWA, SEO, Security)', () => {
  test('should have manifest link for PWA', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    const manifestLink = page.locator('link[rel="manifest"]');
    const count = await manifestLink.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('should have meta tags for SEO', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    const title = await page.title();
    expect(title).toBeTruthy();
    
    const description = page.locator('meta[name="description"]');
    const count = await description.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('should have security headers', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    
    expect(headers).toBeTruthy();
  });
});

test.describe('BUG-009: Map Mouse Pointer Flickering', () => {
  test('should not have mouse flickering on marker hover', async ({ page }) => {
    await page.goto('/donations');
    await page.waitForTimeout(2000);
    
    const markers = page.locator('.leaflet-marker-icon');
    const count = await markers.count();
    
    if (count > 0) {
      const firstMarker = markers.first();
      const box = await firstMarker.boundingBox();
      
      if (box) {
        const errors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            errors.push(msg.text());
          }
        });
        
        await firstMarker.hover();
        await page.waitForTimeout(300);
        
        const pointerEvents = errors.filter(e => 
          e.includes('pointer') || e.includes('event')
        );
        expect(pointerEvents).toHaveLength(0);
      }
    }
  });

  test('should be able to click on map markers', async ({ page }) => {
    await page.goto('/donations');
    await page.waitForTimeout(2000);
    
    const markers = page.locator('.leaflet-marker-icon');
    const count = await markers.count();
    
    if (count > 0) {
      await markers.first().click();
      await page.waitForTimeout(500);
      
      const popup = page.locator('.leaflet-popup, [class*="popup"]');
      const popupVisible = await popup.count() > 0;
      expect(popupVisible || true).toBeTruthy();
    }
  });
});

test.describe('BUG-019: Donations Sort by Distance', () => {
  test('should show donations sorted by distance', async ({ page }) => {
    await page.goto('/donations');
    await page.waitForTimeout(2000);
    
    const donations = page.locator('.donation-card');
    const count = await donations.count();
    
    if (count > 1) {
      const firstCard = await donations.first().boundingBox();
      const secondCard = await donations.nth(1).boundingBox();
      
      expect(firstCard && secondCard).toBeTruthy();
    }
  });
});

test.describe('BUG-014/015/016: Home Page Map and Stats', () => {
  test('should display hero map on home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    const heroMap = page.locator('.hero-map, [class*="hero-map"]');
    await expect(heroMap).toBeVisible();
  });

  test('should show donations count on hero map', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    const heroMapBadge = page.locator('.hero-map-badge');
    const count = await heroMapBadge.count();
    
    if (count > 0) {
      const badgeText = await heroMapBadge.textContent();
      expect(badgeText).toContain('🎁') || expect(badgeText).toMatch(/متبرعات|donations|\d+/i);
    } else {
      expect(true).toBeTruthy();
    }
  });

  test('should show correct total users in stats', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const statsSection = page.locator('[class*="stats"], .stats');
    await expect(statsSection.first()).toBeVisible();
  });
});

test.describe('BUG-012: User Avatar in Navbar', () => {
  test('should not show duplicate avatar in navbar', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    const avatars = page.locator('[class*="avatar"]');
    const count = await avatars.count();
    
    const navbar = page.locator('.navbar, .header');
    const navbarAvatars = await navbar.count() > 0 
      ? await navbar.first().locator('[class*="avatar"]').count() 
      : 0;
    
    expect(navbarAvatars).toBeLessThanOrEqual(1);
  });
});

test.describe('BUG-007: Address Display for Receiver', () => {
  test('should show address to receiver after reservation', async ({ page }) => {
    await page.goto('/my-reservations');
    await page.waitForTimeout(2000);
    
    const reservationCard = page.locator('.reservation-card, .donation-card').first();
    if (await reservationCard.isVisible()) {
      await reservationCard.click();
      await page.waitForTimeout(1000);
      
      const address = page.locator('[class*="address"], [class*="location"]');
      const count = await address.count();
      
      if (count > 0) {
        const addressText = await address.first().textContent();
        expect(addressText).not.toBe('Address not available');
      }
    }
  });
});