import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { StoreProvider } from '@/store/store';
import 'maplibre-gl/dist/maplibre-gl.css';
import './globals.css';

const sans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'QuakeVision — Global Seismic Monitor',
  description:
    'Explore earthquakes worldwide using real USGS data, interactive maps and seismic analytics.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#07090d',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={sans.variable + ' ' + mono.variable}>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
