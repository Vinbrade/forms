import { createContext, useState, useContext, useEffect } from 'react';

const THEME_STORAGE_KEY = 'forms-theme-dark';

function getStoredDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'true';
  } catch {
    return false;
  }
}

export const ThemeContext = createContext({
  darkMode: false,
  toggleDarkMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// provider component
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkMode] = useState(getStoredDarkMode);

  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, String(darkMode));
    } catch {
      // ignore
    }
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
