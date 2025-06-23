import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  getSystemTheme: () => 'light' | 'dark';
  getEffectiveTheme: () => 'light' | 'dark';
}

export const useThemeStore = create<ThemeState>()((set, get) => {
  // Load theme from localStorage or default to 'system'
  const savedTheme = (localStorage.getItem('theme') as Theme) || 'system';

  const getSystemTheme = (): 'light' | 'dark' => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const getEffectiveTheme = (): 'light' | 'dark' => {
    const { theme } = get();
    return theme === 'system' ? getSystemTheme() : theme;
  };

  const applyTheme = (theme: Theme) => {
    const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;
    const root = document.documentElement;
    
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  // Apply initial theme
  applyTheme(savedTheme);

  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemThemeChange = () => {
    const { theme } = get();
    if (theme === 'system') {
      applyTheme('system');
    }
  };
  
  mediaQuery.addEventListener('change', handleSystemThemeChange);

  return {
    theme: savedTheme,
    
    setTheme: (theme: Theme) => {
      localStorage.setItem('theme', theme);
      applyTheme(theme);
      set({ theme });
    },

    getSystemTheme,
    getEffectiveTheme,
  };
});