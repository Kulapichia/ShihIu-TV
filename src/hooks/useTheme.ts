import { useState, useEffect, useCallback } from 'react';

interface ThemeConfig {
  defaultTheme: string;
  customCSS: string;
  allowUserCustomization: boolean;
}

export const useTheme = () => {
  const [theme, setTheme] = useState('default');
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(null);

  const applyTheme = useCallback((themeName: string, config: ThemeConfig | null) => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', themeName);
      
      let styleElement = document.getElementById('custom-theme-style');
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'custom-theme-style';
        document.head.appendChild(styleElement);
      }
      styleElement.innerHTML = config?.customCSS || '';
    }
  }, []);

  useEffect(() => {
    fetch('/api/admin/theme')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const config = data.data as ThemeConfig;
          setThemeConfig(config);
          
          let currentTheme = config.defaultTheme;
          if (config.allowUserCustomization) {
            const userTheme = localStorage.getItem('theme');
            if (userTheme) {
              currentTheme = userTheme;
            }
          }
          
          setTheme(currentTheme);
          applyTheme(currentTheme, config);
        }
      });
  }, [applyTheme]);

  const changeTheme = (newTheme: string) => {
    if (themeConfig?.allowUserCustomization) {
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      applyTheme(newTheme, themeConfig);
    }
  };

  return { theme, changeTheme, isCustomizationAllowed: themeConfig?.allowUserCustomization ?? true };
};
