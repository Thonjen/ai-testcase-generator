'use client';

import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  onThemeChange?: (theme: Theme) => void;
}

export default function ThemeToggle({ onThemeChange }: ThemeToggleProps) {
  const [currentTheme, setCurrentTheme] = useState<Theme>('light');

  useEffect(() => {
    // Get saved theme from localStorage or default to 'system'
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setCurrentTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      setCurrentTheme('system');
      applyTheme('system');
    }
  }, []);

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
    
    localStorage.setItem('theme', theme);
    onThemeChange?.(theme);
  };

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    applyTheme(theme);
  };

  const themes = [
    {
      id: 'light' as Theme,
      label: 'Switch to light theme',
      icon: '☀️',
      ariaChecked: currentTheme === 'light'
    },
    {
      id: 'system' as Theme,
      label: 'Switch to system theme', 
      icon: '💻',
      ariaChecked: currentTheme === 'system'
    },
    {
      id: 'dark' as Theme,
      label: 'Switch to dark theme',
      icon: '🌙',
      ariaChecked: currentTheme === 'dark'
    }
  ];

  return (
    <div className="flex h-fit items-stretch justify-start overflow-hidden gap-2" role="radiogroup">
      {themes.map((theme) => (
        <button
          key={theme.id}
          type="button"
          className={`
            inline-flex items-center gap-2 rounded-md border transition-all
            px-3 py-2 text-sm font-semibold
            hover:scale-105 focus-visible:outline-none focus-visible:ring-2
            ${theme.ariaChecked 
              ? 'bg-amber-900 border-amber-700 text-amber-100 dark:bg-amber-100 dark:border-amber-300 dark:text-amber-900' 
              : 'bg-transparent border-amber-700 text-amber-700 hover:bg-amber-50 dark:border-amber-300 dark:text-amber-300 dark:hover:bg-amber-900/20'
            }
          `}
          aria-label={theme.label}
          role="radio"
          aria-checked={theme.ariaChecked}
          onClick={() => handleThemeChange(theme.id)}
        >
          <span className="text-base">{theme.icon}</span>
        </button>
      ))}
    </div>
  );
}