import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { AppProvider } from '@/store/app-store';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'hey. — say hey.',
  description:
    'HEY is a social discovery app for young queer men. Less swiping. More saying hey.',
  applicationName: 'hey.',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'hey.' },
  formatDetection: { telephone: false },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#0B0B0D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Loaded at runtime rather than build time so the app still
            builds and renders with system fonts when offline. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font --
            this is the App Router; the rule targets pages/_document. Loading
            at runtime rather than via next/font keeps the build offline-safe. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-sm focus:bg-ultraviolet focus:px-4 focus:py-2 focus:text-white"
        >
          skip to content
        </a>
        <AppProvider>
          <ToastProvider>{children}</ToastProvider>
        </AppProvider>
      </body>
    </html>
  );
}
