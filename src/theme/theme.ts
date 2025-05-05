export type Theme = {
  colors: {
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    button: {
      primary: string;
      secondary: string;
      text: string;
    };
    border: string;
    success: string;
    error: string;
    primary: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
};

export const lightTheme: Theme = {
  colors: {
    background: {
      primary: '#FFFFFF',
      secondary: '#F5F5F5',
      tertiary: '#E0E0E0',
    },
    text: {
      primary: '#000000',
      secondary: '#666666',
      tertiary: '#AAAAAA',
    },
    button: {
      primary: '#007AFF',
      secondary: '#CCCCCC', // Added secondary button color for light theme
      text: '#FFFFFF',
    },
    border: '#E0E0E0',
    success: '#34C759',
    error: '#FF3B30',
    primary: '#007AFF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

export const darkTheme: Theme = {
  colors: {
    background: {
      primary: '#1C1C1E',
      secondary: '#2C2C2E',
      tertiary: '#3A3A3C',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#999999',
      tertiary: '#CCCCCC',
    },
    button: {
      primary: '#0A84FF',
      secondary: '#444444', // Added secondary button color for dark theme and #222222 for oled theme
      text: '#FFFFFF',
    },
    border: '#38383A',
    success: '#32D74B',
    error: '#FF453A',
    primary: '#0A84FF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

export const oledTheme: Theme = {
  colors: {
    background: {
      primary: '#000000',
      secondary: '#111111',
      tertiary: '#222222',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#888888',
      tertiary: '#BBBBBB',
    },
    button: {
      primary: '#0A84FF',
      secondary: '#444444', // Added secondary button color for dark theme and #222222 for oled theme
      text: '#FFFFFF',
    },
    border: '#222222',
    success: '#32D74B',
    error: '#FF453A',
    primary: '#0A84FF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
}; 