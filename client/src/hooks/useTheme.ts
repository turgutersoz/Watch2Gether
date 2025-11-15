import { useState, useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'auto';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('watchTogether_theme') as Theme;
    return saved || 'dark';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const updateResolvedTheme = () => {
      if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(prefersDark ? 'dark' : 'light');
      } else {
        setResolvedTheme(theme);
      }
    };

    updateResolvedTheme();

    // System theme değişikliklerini dinle
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => updateResolvedTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  useEffect(() => {
    // HTML element'e tema class'ı ekle
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(resolvedTheme);
    
    // CSS variable'ları güncelle
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.style.setProperty('--bg-gradient', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
      root.style.setProperty('--bg-primary', 'rgba(0, 0, 0, 0.3)');
      root.style.setProperty('--bg-secondary', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', 'rgba(255, 255, 255, 0.6)');
    } else {
      root.style.setProperty('--bg-gradient', 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)');
      root.style.setProperty('--bg-primary', 'rgba(255, 255, 255, 0.3)');
      root.style.setProperty('--bg-secondary', 'rgba(0, 0, 0, 0.05)');
      root.style.setProperty('--text-primary', '#1a1a1a');
      root.style.setProperty('--text-secondary', 'rgba(0, 0, 0, 0.6)');
    }
  }, [resolvedTheme]);

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('watchTogether_theme', newTheme);
  };

  return { theme, resolvedTheme, changeTheme };
}

