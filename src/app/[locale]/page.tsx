import { IconGenerator } from "@/components/icon-generator"
import { getTranslations } from 'next-intl/server'

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function Home({ params }: PageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'page' })
  
  return (
    <div className="container py-8">
      <div className="mx-auto max-w-[800px] space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        <IconGenerator />
      </div>
    </div>
  )
}
