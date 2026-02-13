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
    fonts: {
      regular: string;
      medium: string;
      semibold: string;
      bold: string;
    };
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
      primary: '#14120F',
      secondary: '#1C1916',
      tertiary: '#24201C',
      elevated: '#2B2622',
    },
    text: {
      primary: '#F2ECE6',
      secondary: '#B7AA9E',
      tertiary: '#877C72',
      inverse: '#14120F',
    },
    accent: {
      primary: '#E0A05B',
      secondary: '#C78643',
      muted: 'rgba(224, 160, 91, 0.18)',
    },
    button: {
      primary: '#E0A05B',
      secondary: '#2B2622',
      text: '#1C140E',
      ghost: 'transparent',
    },
    border: '#2F2A25',
    borderSubtle: '#24201C',
    success: '#2CA37B',
    error: '#E07A6E',
    warning: '#E0A05B',
    primary: '#E0A05B',
    card: {
      background: '#1C1916',
      border: '#2F2A25',
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
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    full: 9999,
  },
  typography: {
    fonts: {
      regular: 'Sora',
      medium: 'Sora',
      semibold: 'Sora',
      bold: 'Sora',
    },
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 22,
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
      tight: -0.2,
      normal: 0,
      wide: 0.2,
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.24,
      shadowRadius: 10,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: {width: 0, height: 8},
      shadowOpacity: 0.28,
      shadowRadius: 18,
      elevation: 6,
    },
  },
};

// Industrial Minimalism - Light Theme
export const lightTheme: Theme = {
  colors: {
    background: {
      primary: '#F9F4ED',
      secondary: '#F3EDE5',
      tertiary: '#ECE4DA',
      elevated: '#FFF9F2',
    },
    text: {
      primary: '#2B241D',
      secondary: '#6F6258',
      tertiary: '#9B8E82',
      inverse: '#F9F4ED',
    },
    accent: {
      primary: '#D28A3F',
      secondary: '#B87333',
      muted: 'rgba(210, 138, 63, 0.16)',
    },
    button: {
      primary: '#D28A3F',
      secondary: '#EDE3D7',
      text: '#1F1812',
      ghost: 'transparent',
    },
    border: '#E3D6C8',
    borderSubtle: '#EFE6DC',
    success: '#1F8A6B',
    error: '#D45A4F',
    warning: '#D28A3F',
    primary: '#D28A3F',
    card: {
      background: '#FFF9F2',
      border: '#E6D8CA',
      shadow: '#2B241D',
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
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    full: 9999,
  },
  typography: {
    fonts: {
      regular: 'Sora',
      medium: 'Sora',
      semibold: 'Sora',
      bold: 'Sora',
    },
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 22,
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
      tight: -0.2,
      normal: 0,
      wide: 0.2,
    },
  },
  shadows: {
    sm: {
      shadowColor: '#2B241D',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 1,
    },
    md: {
      shadowColor: '#2B241D',
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 2,
    },
    lg: {
      shadowColor: '#2B241D',
      shadowOffset: {width: 0, height: 6},
      shadowOpacity: 0.12,
      shadowRadius: 14,
      elevation: 4,
    },
  },
};

// OLED theme - true black with amber accents
export const oledTheme: Theme = {
  colors: {
    background: {
      primary: '#000000',
      secondary: '#0E0B09',
      tertiary: '#15110F',
      elevated: '#1C1714',
    },
    text: {
      primary: '#F2ECE6',
      secondary: '#B5A89D',
      tertiary: '#857A70',
      inverse: '#000000',
    },
    accent: {
      primary: '#E5A765',
      secondary: '#C68B49',
      muted: 'rgba(229, 167, 101, 0.18)',
    },
    button: {
      primary: '#E5A765',
      secondary: '#1C1714',
      text: '#17120E',
      ghost: 'transparent',
    },
    border: '#201A17',
    borderSubtle: '#15110F',
    success: '#2CA37B',
    error: '#E07A6E',
    warning: '#E5A765',
    primary: '#E5A765',
    card: {
      background: '#0E0B09',
      border: '#201A17',
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
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    full: 9999,
  },
  typography: {
    fonts: {
      regular: 'Sora',
      medium: 'Sora',
      semibold: 'Sora',
      bold: 'Sora',
    },
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 22,
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
      tight: -0.2,
      normal: 0,
      wide: 0.2,
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.35,
      shadowRadius: 6,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: {width: 0, height: 8},
      shadowOpacity: 0.45,
      shadowRadius: 18,
      elevation: 6,
    },
  },
};
