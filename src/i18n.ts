import {getRequestConfig} from 'next-intl/server';

const locales = ['en', 'zh-CN'] as const;
type Locale = typeof locales[number];

export default getRequestConfig(async ({locale}) => {
  let validLocale: Locale = 'en';
  
  if (locale) {
    const normalizedLocale = locale === 'zh' ? 'zh-CN' : locale;
    
    if (locales.includes(normalizedLocale as Locale)) {
      validLocale = normalizedLocale as Locale;
    }
  }

  try {
    return {
      locale: validLocale,
      messages: (await import(`./locales/${validLocale}/common.json`)).default
    };
  } catch (error) {
    console.warn(`Failed to load locale ${validLocale}, falling back to English:`, error);
    return {
      locale: 'en',
      messages: (await import(`./locales/en/common.json`)).default
    };
  }
});
