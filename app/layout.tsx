import './globals.css';
import SudoRedirectListener from '@/features/auth/sudo/sudo-redirect-listener';
import { Toaster } from '@/shared/components/ui/sonner';
import { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from 'next-themes';
import localFont from 'next/font/local';

const inter = localFont({
  src: '../public/fonts/Inter[opsz,wght].ttf',
  variable: '--font-sans',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
});
const siteName = process.env.SITE_NAME ?? '';

const geistSans = localFont({
  src: '../public/fonts/Geist[wght].ttf',
  variable: '--font-geist-sans',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
});

const geistMono = localFont({
  src: '../public/fonts/GeistMono[wght].ttf',
  variable: '--font-geist-mono',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: `%s - ${siteName}`,
    default: siteName,
  },
  description:
    'A modern, AI-ready online judge platform for competitive programmers.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          enableColorScheme
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            <SudoRedirectListener />
            {children}
            <Toaster richColors position="top-right" />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
