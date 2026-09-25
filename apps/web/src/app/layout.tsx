import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ExperienceProvider } from '@/components/experience-provider';
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

const experienceBootstrap = `
(function () {
  try {
    var savedTheme = localStorage.getItem('quakevision-theme');
    var resolvedTheme =
      savedTheme === 'light' || savedTheme === 'dark'
        ? savedTheme
        : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;

    var savedLocale = localStorage.getItem('quakevision-locale');
    if (savedLocale === 'en') document.documentElement.lang = 'en-US';
    else if (savedLocale === 'es') document.documentElement.lang = 'es-ES';
    else document.documentElement.lang = 'pt-BR';
  } catch (_) {}
})();
`;

export const metadata: Metadata = {
  title: 'QuakeVision — Global Seismic Monitor',
  description:
    'Explore earthquakes worldwide using real USGS data, interactive maps and seismic analytics.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f6f2' },
    { media: '(prefers-color-scheme: dark)', color: '#07090d' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={sans.variable + ' ' + mono.variable}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: experienceBootstrap }} />
      </head>
      <body>
        <StoreProvider>
          <ExperienceProvider>{children}</ExperienceProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
