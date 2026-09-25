'use client';

import { useEffect, useRef, useState } from 'react';
import {
  type Locale,
  useExperience,
} from '@/components/experience-provider';

const languageOptions: Array<{
  locale: Locale;
  code: string;
  label: string;
}> = [
  { locale: 'pt', code: 'PT', label: 'Português' },
  { locale: 'en', code: 'EN', label: 'English' },
  { locale: 'es', code: 'ES', label: 'Español' },
];

function LanguageFlag({ locale }: { locale: Locale }) {
  if (locale === 'pt') {
    return (
      <svg viewBox="0 0 28 20" aria-hidden="true" focusable="false">
        <rect width="28" height="20" rx="2" fill="#169B3A" />
        <path d="M14 3 24 10 14 17 4 10Z" fill="#FFDF00" />
        <circle cx="14" cy="10" r="4.2" fill="#002776" />
        <path
          d="M10.5 9.2c2.5-.8 5.1-.4 7.2 1"
          fill="none"
          stroke="#fff"
          strokeWidth=".8"
        />
      </svg>
    );
  }

  if (locale === 'en') {
    return (
      <svg viewBox="0 0 28 20" aria-hidden="true" focusable="false">
        <rect width="28" height="20" rx="2" fill="#fff" />
        <path
          d="M0 0h28v2H0zm0 4h28v2H0zm0 4h28v2H0zm0 4h28v2H0zm0 4h28v2H0z"
          fill="#B22234"
        />
        <path d="M0 0h12v10H0z" fill="#3C3B6E" />
        <g fill="#fff">
          <circle cx="2.2" cy="2" r=".55" />
          <circle cx="5.8" cy="2" r=".55" />
          <circle cx="9.4" cy="2" r=".55" />
          <circle cx="4" cy="4.7" r=".55" />
          <circle cx="7.6" cy="4.7" r=".55" />
          <circle cx="2.2" cy="7.4" r=".55" />
          <circle cx="5.8" cy="7.4" r=".55" />
          <circle cx="9.4" cy="7.4" r=".55" />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 28 20" aria-hidden="true" focusable="false">
      <rect width="28" height="20" rx="2" fill="#AA151B" />
      <path d="M0 5h28v10H0z" fill="#F1BF00" />
      <rect x="7" y="8" width="2.2" height="4.2" rx=".5" fill="#AA151B" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 15.4A8.4 8.4 0 0 1 8.6 4a8.5 8.5 0 1 0 11.4 11.4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ExperienceControls() {
  const { locale, setLocale, theme, setTheme, t } = useExperience();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected =
    languageOptions.find((option) => option.locale === locale) ??
    languageOptions[0]!;

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <div className="experience-controls">
      <div className="language-picker" ref={rootRef}>
        <button
          className="language-trigger"
          type="button"
          aria-label={t('languageLabel')}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <span className="language-flag">
            <LanguageFlag locale={selected.locale} />
          </span>
          <span className="language-code">{selected.code}</span>
          <span className="language-chevron" aria-hidden="true">⌄</span>
        </button>

        {open ? (
          <div
            className="language-menu"
            role="listbox"
            aria-label={t('languageLabel')}
          >
            {languageOptions.map((option) => (
              <button
                key={option.locale}
                className="language-option"
                type="button"
                role="option"
                aria-selected={option.locale === locale}
                onClick={() => {
                  setLocale(option.locale);
                  setOpen(false);
                }}
              >
                <span className="language-flag">
                  <LanguageFlag locale={option.locale} />
                </span>
                <span className="language-option-copy">
                  <strong>{option.code}</strong>
                  <small>{option.label}</small>
                </span>
                <span className="language-check" aria-hidden="true">
                  {option.locale === locale ? '✓' : ''}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <button
        className="theme-switcher"
        type="button"
        data-theme={theme}
        onClick={() => setTheme(nextTheme)}
        aria-label={
          t('themeLabel') +
          ': ' +
          (nextTheme === 'dark' ? t('themeDark') : t('themeLight'))
        }
        title={nextTheme === 'dark' ? t('themeDark') : t('themeLight')}
      >
        <span className="theme-switcher-icon theme-switcher-sun">
          <SunIcon />
        </span>
        <span className="theme-switcher-icon theme-switcher-moon">
          <MoonIcon />
        </span>
      </button>
    </div>
  );
}
