import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import {useTheme} from '../../theme/ThemeContext';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
}

const PulsingDot: React.FC<{
  delay: number;
  color: string;
  size: number;
}> = ({delay, color, size}) => {
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
      ]),
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
          transform: [{scale: scaleAnim}],
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
  const {theme} = useTheme();
  const dotSize = size === 'large' ? 10 : 6;
  const gradientOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(gradientOpacity, {
          toValue: 0.35,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(gradientOpacity, {
          toValue: 0.18,
          duration: 2200,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [gradientOpacity]);

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: theme.colors.background.primary},
      ]}>
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
        <PulsingDot
          delay={0}
          color={theme.colors.accent.primary}
          size={dotSize}
        />
        <PulsingDot
          delay={150}
          color={theme.colors.accent.primary}
          size={dotSize}
        />
        <PulsingDot
          delay={300}
          color={theme.colors.accent.primary}
          size={dotSize}
        />
      </View>
      {message && (
        <Text
          style={[
            styles.message,
            {
              color: theme.colors.text.secondary,
              fontSize: theme.typography.sizes.md,
              fontWeight: theme.typography.weights.medium,
              fontFamily: theme.typography.fonts.medium,
              letterSpacing: theme.typography.letterSpacing.normal,
            },
          ]}>
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
    width: 220,
    height: 220,
    borderRadius: 110,
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
  },
});
