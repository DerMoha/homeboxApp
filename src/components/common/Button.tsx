import React, {useRef} from 'react';
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

  const getBackgroundColor = (): string => {
    if (disabled) return theme.colors.text.tertiary;

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
  };

  const getTextColor = (): string => {
    if (disabled) return theme.colors.text.tertiary;

    switch (variant) {
      case 'primary':
        return theme.colors.text.inverse;
      case 'danger':
        return theme.colors.button.text;
      case 'secondary':
      case 'ghost':
        return theme.colors.text.primary;
      default:
        return theme.colors.text.inverse;
    }
  };

  const getHeight = (): number => {
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
  };

  const getPaddingHorizontal = (): number => {
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
  };

  const getFontSize = (): number => {
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
  };

  const getIconSize = (): number => {
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
  };

  const getBorderRadius = (): number => {
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
  };

  return (
    <Animated.View
      style={[
        {transform: [{scale: scaleAnim}]},
        fullWidth && styles.fullWidth,
      ]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={({pressed}) => [
          styles.button,
          {
            backgroundColor: getBackgroundColor(),
            height: getHeight(),
            paddingHorizontal: getPaddingHorizontal(),
            borderRadius: getBorderRadius(),
            borderWidth:
              variant === 'ghost' || variant === 'secondary' ? 1.5 : 0,
            borderColor:
              variant === 'ghost'
                ? pressed
                  ? theme.colors.border
                  : theme.colors.borderSubtle
                : theme.colors.border,
            opacity: disabled ? 0.5 : 1,
            ...(variant === 'primary' && !disabled ? theme.shadows.sm : {}),
          },
          style,
        ]}>
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
            <Text
              style={[
                styles.text,
                {
                  color: getTextColor(),
                  fontSize: getFontSize(),
                  fontWeight: theme.typography.weights.semibold as any,
                  letterSpacing: theme.typography.letterSpacing.wide,
                },
              ]}>
              {title.toUpperCase()}
            </Text>
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
    textTransform: 'uppercase',
  },
});
