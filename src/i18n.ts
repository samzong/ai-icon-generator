import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!['en', 'zh'].includes(locale)) {
    throw new Error(`Unsupported locale: ${locale}`);
  }
 
  return {
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
