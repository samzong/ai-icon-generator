import { IconGenerator } from "@/components/icon-generator";
import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('HomePage');

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-[800px] space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <IconGenerator />
      </div>
    </div>
  )
}
