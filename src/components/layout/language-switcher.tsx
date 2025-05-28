'use client';

import { usePathname, useRouter } from 'next-intl/client';
import { Button } from '@/components/ui/button'; // Assuming Button component from shadcn/ui is available

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const changeLanguage = (locale: string) => {
    router.push(pathname, { locale });
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => changeLanguage('en')}
      >
        English
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => changeLanguage('zh')}
      >
        中文
      </Button>
    </div>
  );
}
