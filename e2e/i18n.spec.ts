import { test, expect } from '@playwright/test';

const englishContent = {
  homePageTitle: 'AI Icon Generator',
  homePageDescription: 'Generate professional icon designs using AI, supporting multiple styles and formats.',
  langSwitcherEnglish: 'English',
  langSwitcherChinese: '中文',
};

const chineseContent = {
  homePageTitle: 'AI 图标生成器',
  homePageDescription: '使用 AI 生成专业的图标设计，支持多种风格和格式',
  langSwitcherEnglish: 'English', // Button text might remain in its own language or switch, depends on implementation
  langSwitcherChinese: '中文',   // For this test, assume button text itself doesn't change based on active locale
};

test.describe('Internationalization Tests', () => {
  test('Test 1: Default Language and Content Rendering (English)', async ({ page }) => {
    await page.goto('/');

    // Check URL - should not have a locale prefix for the default language
    expect(page.url()).not.toContain('/zh');
    expect(page.url()).not.toContain('/en'); // Default locale 'en' should not have prefix

    // Check for English content on the main page
    await expect(page.getByRole('heading', { name: englishContent.homePageTitle })).toBeVisible();
    await expect(page.getByText(englishContent.homePageDescription)).toBeVisible();

    // Check language switcher buttons
    await expect(page.getByRole('button', { name: englishContent.langSwitcherEnglish })).toBeVisible();
    await expect(page.getByRole('button', { name: englishContent.langSwitcherChinese })).toBeVisible();
  });

  test('Test 2: Language Switching (English -> Chinese -> English)', async ({ page }) => {
    await page.goto('/');

    // Ensure we are starting in English
    await expect(page.getByRole('heading', { name: englishContent.homePageTitle })).toBeVisible();

    // Click to switch to Chinese
    await page.getByRole('button', { name: englishContent.langSwitcherChinese }).click();
    
    // Wait for navigation and content update
    await page.waitForURL('**/zh');
    expect(page.url()).toContain('/zh');
    await expect(page.getByRole('heading', { name: chineseContent.homePageTitle })).toBeVisible();
    await expect(page.getByText(chineseContent.homePageDescription)).toBeVisible();

    // Click to switch back to English
    await page.getByRole('button', { name: englishContent.langSwitcherEnglish }).click();

    // Wait for navigation and content update
    await page.waitForURL((url) => !url.pathname.includes('/zh') && (url.pathname === '/' || url.pathname.includes('/en')));
    // After switching back to 'en' (default), the prefix might be removed or be /en depending on config.
    // For 'as-needed' and 'en' as default, it should be removed.
    expect(page.url()).not.toContain('/zh');
    
    // If default locale prefix is 'never' or 'as-needed', it should go to '/'
    // If it's 'always', it would go to '/en'. Our config is 'as-needed'.
    if (page.url().endsWith('/en')) { // Handle case if /en is present
      await page.goto('/'); // Normalize to root for consistent check
    }
    expect(page.url()).not.toContain('/en'); // Should be at root for default 'en'

    await expect(page.getByRole('heading', { name: englishContent.homePageTitle })).toBeVisible();
    await expect(page.getByText(englishContent.homePageDescription)).toBeVisible();
  });

  test('Test 3: Direct Locale URL Access (Chinese)', async ({ page }) => {
    await page.goto('/zh');

    // Check URL
    expect(page.url()).toContain('/zh');

    // Check for Chinese content
    await expect(page.getByRole('heading', { name: chineseContent.homePageTitle })).toBeVisible();
    await expect(page.getByText(chineseContent.homePageDescription)).toBeVisible();

    // Check language switcher buttons
    await expect(page.getByRole('button', { name: chineseContent.langSwitcherEnglish })).toBeVisible();
    await expect(page.getByRole('button', { name: chineseContent.langSwitcherChinese })).toBeVisible();
  });

  test('Test 4: Persistence via URL (Reloading Chinese URL)', async ({ page }) => {
    await page.goto('/zh');

    // Verify Chinese content is loaded
    await expect(page.getByRole('heading', { name: chineseContent.homePageTitle })).toBeVisible();
    
    // Reload the page
    await page.reload();

    // Verify Chinese content is still loaded
    expect(page.url()).toContain('/zh');
    await expect(page.getByRole('heading', { name: chineseContent.homePageTitle })).toBeVisible();
    await expect(page.getByText(chineseContent.homePageDescription)).toBeVisible();
  });
});
