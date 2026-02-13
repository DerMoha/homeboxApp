import React, {useMemo, useRef} from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  Animated,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../theme/ThemeContext';

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
  const {theme} = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const backgroundColor = useMemo((): string => {
    if (disabled) {
      return theme.colors.background.tertiary;
    }

    switch (variant) {
      case 'primary':
        return theme.colors.accent.primary;
      case 'secondary':
        return theme.colors.button.secondary;
      case 'danger':
        return theme.colors.error;
      case 'ghost':
        return 'transparent';
      default:
        return theme.colors.accent.primary;
    }
  }, [
    disabled,
    theme.colors.accent.primary,
    theme.colors.button.secondary,
    theme.colors.error,
    theme.colors.text.tertiary,
    variant,
  ]);

  const textColor = useMemo((): string => {
    if (disabled) {
      return theme.colors.text.tertiary;
    }

    switch (variant) {
      case 'primary':
        return theme.colors.text.inverse;
      case 'danger':
        return theme.colors.text.inverse;
      case 'secondary':
      case 'ghost':
        return theme.colors.text.primary;
      default:
        return theme.colors.text.inverse;
    }
  }, [
    disabled,
    theme.colors.button.text,
    theme.colors.text.inverse,
    theme.colors.text.primary,
    theme.colors.text.tertiary,
    variant,
  ]);

  const buttonHeight = useMemo((): number => {
    switch (size) {
      case 'small':
        return 40;
      case 'medium':
        return 48;
      case 'large':
        return 56;
      default:
        return 48;
    }
  }, [size]);

  const buttonPaddingHorizontal = useMemo((): number => {
    switch (size) {
      case 'small':
        return 16;
      case 'medium':
        return 24;
      case 'large':
        return 32;
      default:
        return 24;
    }
  }, [size]);

  const buttonFontSize = useMemo((): number => {
    switch (size) {
      case 'small':
        return theme.typography.sizes.sm;
      case 'medium':
        return theme.typography.sizes.md;
      case 'large':
        return theme.typography.sizes.lg;
      default:
        return theme.typography.sizes.md;
    }
  }, [
    size,
    theme.typography.sizes.lg,
    theme.typography.sizes.md,
    theme.typography.sizes.sm,
  ]);

  const iconSize = useMemo((): number => {
    switch (size) {
      case 'small':
        return 18;
      case 'medium':
        return 20;
      case 'large':
        return 24;
      default:
        return 20;
    }
  }, [size]);

  const buttonBorderRadius = useMemo((): number => {
    switch (size) {
      case 'small':
        return theme.borderRadius.sm;
      case 'medium':
        return theme.borderRadius.md;
      case 'large':
        return theme.borderRadius.lg;
      default:
        return theme.borderRadius.md;
    }
  }, [
    size,
    theme.borderRadius.lg,
    theme.borderRadius.md,
    theme.borderRadius.sm,
  ]);

  const animatedContainerStyle = useMemo(
    () => [
      {transform: [{scale: scaleAnim}]},
      fullWidth ? styles.fullWidth : null,
    ],
    [fullWidth, scaleAnim],
  );

  const baseButtonStyle = useMemo(
    () => ({
      backgroundColor,
      height: buttonHeight,
      paddingHorizontal: buttonPaddingHorizontal,
      borderRadius: buttonBorderRadius,
      borderWidth: variant === 'ghost' || variant === 'secondary' ? 1 : 0,
      borderColor: theme.colors.borderSubtle,
      opacity: disabled ? 0.5 : 1,
    }),
    [
      backgroundColor,
      buttonBorderRadius,
      buttonHeight,
      buttonPaddingHorizontal,
      disabled,
      theme.colors.borderSubtle,
      variant,
    ],
  );

  const ghostBorderStyle = useMemo(
    () => ({borderColor: theme.colors.borderSubtle}),
    [theme.colors.borderSubtle],
  );

  const ghostPressedBorderStyle = useMemo(
    () => ({borderColor: theme.colors.border}),
    [theme.colors.border],
  );

  const shadowStyle = useMemo(
    () => (variant === 'primary' && !disabled ? theme.shadows.sm : null),
    [disabled, theme.shadows.sm, variant],
  );

  const textStyle = useMemo(
    () => [
      styles.text,
      {
        color: textColor,
        fontSize: buttonFontSize,
        fontWeight: theme.typography.weights.semibold,
        fontFamily: theme.typography.fonts.semibold,
        letterSpacing: theme.typography.letterSpacing.normal,
      },
    ],
    [
      buttonFontSize,
      textColor,
      theme.typography.fonts.semibold,
      theme.typography.letterSpacing.normal,
      theme.typography.weights.semibold,
    ],
  );

  return (
    <Animated.View style={animatedContainerStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={({pressed}) => [
          styles.button,
          baseButtonStyle,
          variant === 'ghost'
            ? pressed
              ? ghostPressedBorderStyle
              : ghostBorderStyle
            : null,
          shadowStyle,
          style,
        ]}>
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <>
            {icon && (
              <MaterialIcons
                name={icon}
                size={iconSize}
                color={textColor}
                style={styles.icon}
              />
            )}
            <Text style={textStyle}>{title}</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  icon: {
    marginRight: 2,
  },
  text: {
    textTransform: 'none',
  },
});
