import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/ThemeContext';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}) => {
  const { theme } = useTheme();

  const getBackgroundColor = (): string => {
    if (disabled) {return theme.colors.text.secondary;}

    switch (variant) {
      case 'primary':
        return theme.colors.button.primary;
      case 'secondary':
        return theme.colors.background.secondary;
      case 'danger':
        return theme.colors.error;
      case 'ghost':
        return 'transparent';
      default:
        return theme.colors.button.primary;
    }
  };

  const getTextColor = (): string => {
    if (disabled) {return theme.colors.text.tertiary;}

    switch (variant) {
      case 'primary':
      case 'danger':
        return theme.colors.button.text;
      case 'secondary':
      case 'ghost':
        return theme.colors.text.primary;
      default:
        return theme.colors.button.text;
    }
  };

  const getPadding = (): number => {
    switch (size) {
      case 'small':
        return 8;
      case 'medium':
        return 12;
      case 'large':
        return 16;
      default:
        return 12;
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'small':
        return 12;
      case 'medium':
        return 14;
      case 'large':
        return 16;
      default:
        return 14;
    }
  };

  const getIconSize = (): number => {
    switch (size) {
      case 'small':
        return 16;
      case 'medium':
        return 20;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          padding: getPadding(),
          borderWidth: variant === 'ghost' || variant === 'secondary' ? 1 : 0,
          borderColor: variant === 'ghost' ? theme.colors.border : theme.colors.border,
          opacity: disabled ? 0.5 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && (
            <MaterialIcons
              name={icon as any}
              size={getIconSize()}
              color={getTextColor()}
              style={styles.icon}
            />
          )}
          <Text style={[styles.text, { color: getTextColor(), fontSize: getFontSize() }]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    gap: 6,
  },
  fullWidth: {
    width: '100%',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
  },
});
