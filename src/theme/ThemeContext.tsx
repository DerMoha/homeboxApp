import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, lightTheme, darkTheme, oledTheme } from './theme';

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

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
  const [customColors, setCustomColors] = useState<Partial<Theme['colors']>>({});

  useEffect(() => {
    // Load saved theme preferences
    const loadThemePreferences = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('themeMode');
        const savedColors = await AsyncStorage.getItem('customColors');
        
        if (savedMode) {
          setThemeMode(savedMode as ThemeMode);
        }
        if (savedColors) {
          setCustomColors(JSON.parse(savedColors));
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
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  const handleSetCustomColor = async (colorType: keyof Theme['colors'], value: string) => {
    try {
      const newColors = { ...customColors, [colorType]: value };
      setCustomColors(newColors);
      await AsyncStorage.setItem('customColors', JSON.stringify(newColors));
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
        // Auto mode - use system preference
        baseTheme = lightTheme; // TODO: Implement system preference detection
        break;
    }

    // Apply custom colors
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
    <ThemeContext.Provider value={{
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