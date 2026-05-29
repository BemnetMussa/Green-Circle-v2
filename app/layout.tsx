import type { Metadata } from 'next';
import type React from 'react';
import Script from 'next/script';
import { Source_Sans_3, Fraunces } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const THEME_INIT = `(function(){try{var k='gc-theme';var t=localStorage.getItem(k);var d=t==='dark'||(t!=='light'&&typeof matchMedia!=='undefined'&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',!!d);}catch(e){}})();`;

/** UI + body — swap back to Inter if you prefer after comparing. */
const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['SOFT', 'opsz'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://greencircle.et';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Green Circle',
    template: '%s · Green Circle',
  },
  description:
    'Discover Ethiopian startups and connect with founders. A living directory of innovation, investment opportunities, and ecosystem growth.',
  openGraph: {
    title: 'Green Circle',
    description:
      'Discover Ethiopian startups and connect with founders.',
    url: siteUrl,
    siteName: 'Green Circle',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Green Circle',
    description:
      'Discover Ethiopian startups and connect with founders.',
  },
  icons: {
    icon: '/icon',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sourceSans.variable} ${fraunces.variable}`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Script id="gc-theme-init" strategy="beforeInteractive">
          {THEME_INIT}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
