# Test info

- Name: Internationalization Tests >> Test 2: Language Switching (English -> Chinese -> English)
- Location: /app/e2e/i18n.spec.ts:34:7

# Error details

```
Error: browserType.launch: Executable doesn't exist at /home/swebot/.cache/ms-playwright/chromium_headless_shell-1169/chrome-linux/headless_shell
╔═════════════════════════════════════════════════════════════════════════╗
║ Looks like Playwright Test or Playwright was just installed or updated. ║
║ Please run the following command to download new browsers:              ║
║                                                                         ║
║     npx playwright install                                              ║
║                                                                         ║
║ <3 Playwright Team                                                      ║
╚═════════════════════════════════════════════════════════════════════════╝
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | const englishContent = {
   4 |   homePageTitle: 'AI Icon Generator',
   5 |   homePageDescription: 'Generate professional icon designs using AI, supporting multiple styles and formats.',
   6 |   langSwitcherEnglish: 'English',
   7 |   langSwitcherChinese: '中文',
   8 | };
   9 |
  10 | const chineseContent = {
  11 |   homePageTitle: 'AI 图标生成器',
  12 |   homePageDescription: '使用 AI 生成专业的图标设计，支持多种风格和格式',
  13 |   langSwitcherEnglish: 'English', // Button text might remain in its own language or switch, depends on implementation
  14 |   langSwitcherChinese: '中文',   // For this test, assume button text itself doesn't change based on active locale
  15 | };
  16 |
  17 | test.describe('Internationalization Tests', () => {
  18 |   test('Test 1: Default Language and Content Rendering (English)', async ({ page }) => {
  19 |     await page.goto('/');
  20 |
  21 |     // Check URL - should not have a locale prefix for the default language
  22 |     expect(page.url()).not.toContain('/zh');
  23 |     expect(page.url()).not.toContain('/en'); // Default locale 'en' should not have prefix
  24 |
  25 |     // Check for English content on the main page
  26 |     await expect(page.getByRole('heading', { name: englishContent.homePageTitle })).toBeVisible();
  27 |     await expect(page.getByText(englishContent.homePageDescription)).toBeVisible();
  28 |
  29 |     // Check language switcher buttons
  30 |     await expect(page.getByRole('button', { name: englishContent.langSwitcherEnglish })).toBeVisible();
  31 |     await expect(page.getByRole('button', { name: englishContent.langSwitcherChinese })).toBeVisible();
  32 |   });
  33 |
> 34 |   test('Test 2: Language Switching (English -> Chinese -> English)', async ({ page }) => {
     |       ^ Error: browserType.launch: Executable doesn't exist at /home/swebot/.cache/ms-playwright/chromium_headless_shell-1169/chrome-linux/headless_shell
  35 |     await page.goto('/');
  36 |
  37 |     // Ensure we are starting in English
  38 |     await expect(page.getByRole('heading', { name: englishContent.homePageTitle })).toBeVisible();
  39 |
  40 |     // Click to switch to Chinese
  41 |     await page.getByRole('button', { name: englishContent.langSwitcherChinese }).click();
  42 |     
  43 |     // Wait for navigation and content update
  44 |     await page.waitForURL('**/zh');
  45 |     expect(page.url()).toContain('/zh');
  46 |     await expect(page.getByRole('heading', { name: chineseContent.homePageTitle })).toBeVisible();
  47 |     await expect(page.getByText(chineseContent.homePageDescription)).toBeVisible();
  48 |
  49 |     // Click to switch back to English
  50 |     await page.getByRole('button', { name: englishContent.langSwitcherEnglish }).click();
  51 |
  52 |     // Wait for navigation and content update
  53 |     await page.waitForURL((url) => !url.pathname.includes('/zh') && (url.pathname === '/' || url.pathname.includes('/en')));
  54 |     // After switching back to 'en' (default), the prefix might be removed or be /en depending on config.
  55 |     // For 'as-needed' and 'en' as default, it should be removed.
  56 |     expect(page.url()).not.toContain('/zh');
  57 |     
  58 |     // If default locale prefix is 'never' or 'as-needed', it should go to '/'
  59 |     // If it's 'always', it would go to '/en'. Our config is 'as-needed'.
  60 |     if (page.url().endsWith('/en')) { // Handle case if /en is present
  61 |       await page.goto('/'); // Normalize to root for consistent check
  62 |     }
  63 |     expect(page.url()).not.toContain('/en'); // Should be at root for default 'en'
  64 |
  65 |     await expect(page.getByRole('heading', { name: englishContent.homePageTitle })).toBeVisible();
  66 |     await expect(page.getByText(englishContent.homePageDescription)).toBeVisible();
  67 |   });
  68 |
  69 |   test('Test 3: Direct Locale URL Access (Chinese)', async ({ page }) => {
  70 |     await page.goto('/zh');
  71 |
  72 |     // Check URL
  73 |     expect(page.url()).toContain('/zh');
  74 |
  75 |     // Check for Chinese content
  76 |     await expect(page.getByRole('heading', { name: chineseContent.homePageTitle })).toBeVisible();
  77 |     await expect(page.getByText(chineseContent.homePageDescription)).toBeVisible();
  78 |
  79 |     // Check language switcher buttons
  80 |     await expect(page.getByRole('button', { name: chineseContent.langSwitcherEnglish })).toBeVisible();
  81 |     await expect(page.getByRole('button', { name: chineseContent.langSwitcherChinese })).toBeVisible();
  82 |   });
  83 |
  84 |   test('Test 4: Persistence via URL (Reloading Chinese URL)', async ({ page }) => {
  85 |     await page.goto('/zh');
  86 |
  87 |     // Verify Chinese content is loaded
  88 |     await expect(page.getByRole('heading', { name: chineseContent.homePageTitle })).toBeVisible();
  89 |     
  90 |     // Reload the page
  91 |     await page.reload();
  92 |
  93 |     // Verify Chinese content is still loaded
  94 |     expect(page.url()).toContain('/zh');
  95 |     await expect(page.getByRole('heading', { name: chineseContent.homePageTitle })).toBeVisible();
  96 |     await expect(page.getByText(chineseContent.homePageDescription)).toBeVisible();
  97 |   });
  98 | });
  99 |
```