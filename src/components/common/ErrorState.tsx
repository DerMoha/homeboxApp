import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Animated} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../theme/ThemeContext';

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
  const {theme} = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const errorMessage = error instanceof Error ? error.message : error;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: theme.colors.background.primary},
      ]}>
      <View
        style={[
          styles.glowContainer,
          {backgroundColor: `${theme.colors.error}12`},
        ]}>
        <Animated.View
          style={[
            styles.iconContainer,
            {
              backgroundColor: theme.colors.background.secondary,
              borderColor: theme.colors.borderSubtle,
              transform: [{scale: pulseAnim}],
            },
          ]}>
          <MaterialIcons name={icon} size={48} color={theme.colors.error} />
        </Animated.View>
      </View>

      <Text
        style={[
          styles.title,
          {
            color: theme.colors.text.primary,
            fontSize: theme.typography.sizes.xl,
            fontWeight: theme.typography.weights.semibold,
            fontFamily: theme.typography.fonts.semibold,
          },
        ]}>
        Something went wrong
      </Text>

      <Text
        style={[
          styles.errorText,
          {
            color: theme.colors.text.secondary,
            fontSize: theme.typography.sizes.md,
            fontFamily: theme.typography.fonts.regular,
          },
        ]}>
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
            theme.shadows.sm,
          ]}
          onPress={onRetry}
          activeOpacity={0.8}>
          <MaterialIcons
            name="refresh"
            size={20}
            color={theme.colors.text.inverse}
          />
          <Text
            style={[
              styles.retryButtonText,
              {
                color: theme.colors.text.inverse,
                fontSize: theme.typography.sizes.md,
                fontWeight: theme.typography.weights.semibold,
                fontFamily: theme.typography.fonts.semibold,
              },
            ]}>
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
    width: 112,
    height: 112,
    borderRadius: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0,
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
    letterSpacing: 0,
    textTransform: 'none',
  },
});
