import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
}

const PulsingDot: React.FC<{
  delay: number;
  color: string;
  size: number;
}> = ({ delay, color, size }) => {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0.6,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.4,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [delay, scaleAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          backgroundColor: color,
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    />
  );
};

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  size = 'large',
}) => {
  const { theme } = useTheme();
  const dotSize = size === 'large' ? 12 : 8;
  const gradientOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(gradientOpacity, {
          toValue: 0.6,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(gradientOpacity, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [gradientOpacity]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <Animated.View
        style={[
          styles.backgroundPattern,
          {
            backgroundColor: theme.colors.accent.muted,
            opacity: gradientOpacity,
          },
        ]}
      />
      <View style={styles.dotsContainer}>
        <PulsingDot delay={0} color={theme.colors.accent.primary} size={dotSize} />
        <PulsingDot delay={150} color={theme.colors.accent.primary} size={dotSize} />
        <PulsingDot delay={300} color={theme.colors.accent.primary} size={dotSize} />
      </View>
      {message && (
        <Text
          style={[
            styles.message,
            {
              color: theme.colors.text.secondary,
              fontSize: theme.typography.sizes.md,
              fontWeight: theme.typography.weights.medium as any,
              letterSpacing: theme.typography.letterSpacing.wide,
            },
          ]}
        >
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backgroundPattern: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {},
  message: {
    marginTop: 24,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
