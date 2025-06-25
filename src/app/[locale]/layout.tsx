import type { Metadata } from "next";
import { Oxanium, Merriweather, Fira_Code } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { RateLimitStatus } from "@/components/RateLimitStatus";
import { Analytics } from "@vercel/analytics/react";
import "../globals.css";

const oxanium = Oxanium({
  subsets: ['latin'],
  variable: '--font-sans',
});

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-serif',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: "AI Icon Generator",
  description: "Generate professional icon designs using AI",
  manifest: "/manifest.json",
  openGraph: {
    title: "AI Icon Generator",
    description: "Generate professional icon designs using AI",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "AI Icon Generator",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "AI Icon Generator Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "AI Icon Generator",
    description: "Generate professional icon designs using AI",
    images: ["/logo.png"],
  },
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  try {
    // Await the params since it's now a Promise in Next.js 15
    const { locale } = await params;
    
    // The i18n configuration will handle invalid locales safely
    // so we don't need to call notFound() here
    
    // Providing all messages to the client
    // side is the easiest way to get started
    const messages = await getMessages({ locale });

    return (
      <html lang={locale} suppressHydrationWarning>
        <body className={`${oxanium.variable} ${merriweather.variable} ${firaCode.variable} font-sans`}>
          <NextIntlClientProvider messages={messages}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <div className="min-h-screen bg-background">
                <SiteHeader />
                <RateLimitStatus />
                <main className="container mx-auto py-6">{children}</main>
              </div>
            </ThemeProvider>
            <Analytics />
          </NextIntlClientProvider>
        </body>
      </html>
    );
  } catch (error) {
    // During static generation, if there's an error with params or messages,
    // return a fallback layout to prevent build failures
    console.warn('Error in LocaleLayout:', error);
    
    // Try to get default messages for fallback
    try {
      const fallbackMessages = await getMessages({ locale: 'en' });
      return (
        <html lang="en" suppressHydrationWarning>
          <body className={`${oxanium.variable} ${merriweather.variable} ${firaCode.variable} font-sans`}>
            <NextIntlClientProvider messages={fallbackMessages}>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <div className="min-h-screen bg-background">
                  <SiteHeader />
                  <RateLimitStatus />
                  <main className="container mx-auto py-6">{children}</main>
                </div>
              </ThemeProvider>
              <Analytics />
            </NextIntlClientProvider>
          </body>
        </html>
      );
    } catch (_fallbackError) {
      // If even fallback fails, return children without i18n provider
      console.warn('Fallback messages also failed:', _fallbackError);
      return (
        <html lang="en" suppressHydrationWarning>
          <body className={`${oxanium.variable} ${merriweather.variable} ${firaCode.variable} font-sans`}>
            <div className="min-h-screen bg-background">
              <main className="container mx-auto py-6">{children}</main>
            </div>
          </body>
        </html>
      );
    }
  }
} 