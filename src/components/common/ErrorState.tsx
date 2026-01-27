import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/ThemeContext';

interface ErrorStateProps {
  error: string | Error;
  onRetry?: () => void;
  retryText?: string;
  icon?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  retryText = 'Try Again',
  icon = 'error-outline',
}) => {
  const { theme } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const errorMessage = error instanceof Error ? error.message : error;

  useEffect(() => {
    // Subtle pulse animation for the icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Initial shake animation
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [pulseAnim, shakeAnim]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Error glow effect */}
      <View style={[styles.glowContainer, { backgroundColor: `${theme.colors.error}15` }]}>
        <Animated.View
          style={[
            styles.iconContainer,
            {
              backgroundColor: `${theme.colors.error}20`,
              transform: [{ scale: pulseAnim }, { translateX: shakeAnim }],
            },
          ]}
        >
          <MaterialIcons name={icon} size={48} color={theme.colors.error} />
        </Animated.View>
      </View>

      <Text
        style={[
          styles.title,
          {
            color: theme.colors.text.primary,
            fontSize: theme.typography.sizes.xl,
            fontWeight: theme.typography.weights.semibold as any,
          },
        ]}
      >
        Something went wrong
      </Text>

      <Text
        style={[
          styles.errorText,
          {
            color: theme.colors.text.secondary,
            fontSize: theme.typography.sizes.md,
          },
        ]}
      >
        {errorMessage}
      </Text>

      {onRetry && (
        <TouchableOpacity
          style={[
            styles.retryButton,
            {
              backgroundColor: theme.colors.accent.primary,
              borderRadius: theme.borderRadius.md,
            },
            theme.shadows.md,
          ]}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <MaterialIcons name="refresh" size={20} color={theme.colors.text.inverse} />
          <Text
            style={[
              styles.retryButtonText,
              {
                color: theme.colors.text.inverse,
                fontSize: theme.typography.sizes.md,
                fontWeight: theme.typography.weights.semibold as any,
              },
            ]}
          >
            {retryText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  glowContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    maxWidth: 280,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  retryButtonText: {
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
