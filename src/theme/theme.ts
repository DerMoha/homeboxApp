export type Theme = {
  colors: {
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
      elevated: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
    };
    accent: {
      primary: string;
      secondary: string;
      muted: string;
    };
    button: {
      primary: string;
      secondary: string;
      text: string;
      ghost: string;
    };
    border: string;
    borderSubtle: string;
    success: string;
    error: string;
    warning: string;
    primary: string;
    card: {
      background: string;
      border: string;
      shadow: string;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  typography: {
    sizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
      display: number;
    };
    weights: {
      regular: '400' | 400;
      medium: '500' | 500;
      semibold: '600' | 600;
      bold: '700' | 700;
    };
    letterSpacing: {
      tight: number;
      normal: number;
      wide: number;
    };
  };
  shadows: {
    sm: {
      shadowColor: string;
      shadowOffset: {width: number; height: number};
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    md: {
      shadowColor: string;
      shadowOffset: {width: number; height: number};
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    lg: {
      shadowColor: string;
      shadowOffset: {width: number; height: number};
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
};

// Industrial Minimalism - Dark Theme (Default)
export const darkTheme: Theme = {
  colors: {
    background: {
      primary: '#0C0C0E',
      secondary: '#161618',
      tertiary: '#1E1E21',
      elevated: '#252528',
    },
    text: {
      primary: '#FAFAFA',
      secondary: '#A1A1AA',
      tertiary: '#71717A',
      inverse: '#0C0C0E',
    },
    accent: {
      primary: '#F59E0B',
      secondary: '#D97706',
      muted: 'rgba(245, 158, 11, 0.15)',
    },
    button: {
      primary: '#F59E0B',
      secondary: '#252528',
      text: '#0C0C0E',
      ghost: 'transparent',
    },
    border: '#2A2A2E',
    borderSubtle: '#1E1E21',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    primary: '#F59E0B',
    card: {
      background: '#161618',
      border: '#2A2A2E',
      shadow: '#000000',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  typography: {
    sizes: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 17,
      xl: 20,
      xxl: 28,
      display: 36,
    },
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 0.5,
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: {width: 0, height: 8},
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

// Industrial Minimalism - Light Theme
export const lightTheme: Theme = {
  colors: {
    background: {
      primary: '#FEFDFB',
      secondary: '#F7F6F3',
      tertiary: '#EFEEE9',
      elevated: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#6B6B6B',
      tertiary: '#9A9A9A',
      inverse: '#FEFDFB',
    },
    accent: {
      primary: '#D97706',
      secondary: '#B45309',
      muted: 'rgba(217, 119, 6, 0.12)',
    },
    button: {
      primary: '#D97706',
      secondary: '#EFEEE9',
      text: '#FFFFFF',
      ghost: 'transparent',
    },
    border: '#E5E4E0',
    borderSubtle: '#EFEEE9',
    success: '#059669',
    error: '#DC2626',
    warning: '#D97706',
    primary: '#D97706',
    card: {
      background: '#FFFFFF',
      border: '#E5E4E0',
      shadow: '#1A1A1A',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  typography: {
    sizes: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 17,
      xl: 20,
      xxl: 28,
      display: 36,
    },
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 0.5,
    },
  },
  shadows: {
    sm: {
      shadowColor: '#1A1A1A',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 1,
    },
    md: {
      shadowColor: '#1A1A1A',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: '#1A1A1A',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 6,
    },
  },
};

// OLED theme - true black with amber accents
export const oledTheme: Theme = {
  colors: {
    background: {
      primary: '#000000',
      secondary: '#0A0A0A',
      tertiary: '#141414',
      elevated: '#1A1A1A',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#8A8A8A',
      tertiary: '#5A5A5A',
      inverse: '#000000',
    },
    accent: {
      primary: '#FBBF24',
      secondary: '#F59E0B',
      muted: 'rgba(251, 191, 36, 0.12)',
    },
    button: {
      primary: '#FBBF24',
      secondary: '#1A1A1A',
      text: '#000000',
      ghost: 'transparent',
    },
    border: '#1F1F1F',
    borderSubtle: '#141414',
    success: '#10B981',
    error: '#F87171',
    warning: '#FBBF24',
    primary: '#FBBF24',
    card: {
      background: '#0A0A0A',
      border: '#1F1F1F',
      shadow: '#000000',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  typography: {
    sizes: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 17,
      xl: 20,
      xxl: 28,
      display: 36,
    },
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 0.5,
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.5,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.6,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: {width: 0, height: 8},
      shadowOpacity: 0.7,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};
