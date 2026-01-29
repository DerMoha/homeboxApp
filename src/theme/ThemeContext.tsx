import React, {createContext, useContext, useState, useEffect} from 'react';
import {Theme, lightTheme, darkTheme, oledTheme} from './theme';
import {storageService, STORAGE_KEYS} from '../services/storageService';

type ThemeMode = 'auto' | 'light' | 'dark' | 'oled';

type ThemeContextType = {
  theme: Theme;
  isDarkMode: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  setCustomColor: (colorType: keyof Theme['colors'], value: string) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
  const [customColors, setCustomColors] = useState<Partial<Theme['colors']>>(
    {},
  );

  useEffect(() => {
    const loadThemePreferences = async () => {
      try {
        const savedMode = await storageService.getItem<ThemeMode>(
          STORAGE_KEYS.THEME_MODE,
        );
        const savedColors = await storageService.getItem<
          Partial<Theme['colors']>
        >(STORAGE_KEYS.CUSTOM_COLORS);

        if (savedMode) {
          setThemeMode(savedMode);
        }
        if (savedColors) {
          setCustomColors(savedColors);
        }
      } catch (error) {
        console.error('Error loading theme preferences:', error);
      }
    };

    loadThemePreferences();
  }, []);

  const handleSetThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeMode(mode);
      await storageService.setItem(STORAGE_KEYS.THEME_MODE, mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  const handleSetCustomColor = async (
    colorType: keyof Theme['colors'],
    value: string,
  ) => {
    try {
      const newColors = {...customColors, [colorType]: value};
      setCustomColors(newColors);
      await storageService.setItem(STORAGE_KEYS.CUSTOM_COLORS, newColors);
    } catch (error) {
      console.error('Error saving custom color:', error);
    }
  };

  const getCurrentTheme = () => {
    let baseTheme: Theme;

    switch (themeMode) {
      case 'light':
        baseTheme = lightTheme;
        break;
      case 'dark':
        baseTheme = darkTheme;
        break;
      case 'oled':
        baseTheme = oledTheme;
        break;
      default:
        baseTheme = lightTheme;
        break;
    }

    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        ...customColors,
      },
    };
  };

  const theme = getCurrentTheme();
  const isDarkMode = themeMode === 'dark' || themeMode === 'oled';

  const toggleTheme = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkMode,
        themeMode,
        setThemeMode: handleSetThemeMode,
        setCustomColor: handleSetCustomColor,
        toggleTheme,
      }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
