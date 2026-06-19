import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // قراءة الـ theme المحفوظ أو استخدام الـ dark كوضع افتراضي فخم لمنصة لوفيا
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('luvia-theme') as Theme) || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    // مسح الكلاسات القديمة وإضافة الكلاس الجديد للـ HTML tag
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('luvia-theme', theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}