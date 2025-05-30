'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export default function LocaleNotFound() {
  const t = useTranslations('notFound');

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <h2 className="text-2xl font-bold mb-4">
        {t('title') || 'Page Not Found'}
      </h2>
      <p className="text-muted-foreground mb-4">
        {t('description') || 'The page you are looking for does not exist.'}
      </p>
      <Link 
        href="/" 
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
      >
        {t('goHome') || 'Go Home'}
      </Link>
    </div>
  );
} 