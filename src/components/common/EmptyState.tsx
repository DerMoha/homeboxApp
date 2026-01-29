import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../theme/ThemeContext';
import {Button} from './Button';

interface EmptyStateProps {
  message: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  subtitle?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  icon = 'inbox',
  actionLabel,
  onAction,
  subtitle,
}) => {
  const {theme} = useTheme();
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const bgRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.7,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    );

    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ]),
    );

    const bgAnimation = Animated.loop(
      Animated.timing(bgRotation, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      }),
    );

    glowAnimation.start();
    floatAnimation.start();
    bgAnimation.start();

    return () => {
      glowAnimation.stop();
      floatAnimation.stop();
      bgAnimation.stop();
    };
  }, [glowAnim, floatAnim, bgRotation]);

  const rotation = bgRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: theme.colors.background.primary},
      ]}>
      <Animated.View
        style={[
          styles.backgroundElement,
          {
            borderColor: theme.colors.accent.muted,
            transform: [{rotate: rotation}],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [{translateY: floatAnim}],
          },
        ]}>
        <Animated.View
          style={[
            styles.glow,
            {
              backgroundColor: theme.colors.accent.primary,
              opacity: glowAnim,
            },
          ]}
        />
        <View
          style={[
            styles.iconBackground,
            {
              backgroundColor: theme.colors.accent.muted,
              borderRadius: theme.borderRadius.xl,
            },
          ]}>
          <MaterialIcons
            name={icon}
            size={48}
            color={theme.colors.accent.primary}
          />
        </View>
      </Animated.View>
      <Text
        style={[
          styles.message,
          {
            color: theme.colors.text.primary,
            fontSize: theme.typography.sizes.xl,
            fontWeight: theme.typography.weights.bold,
            letterSpacing: theme.typography.letterSpacing.tight,
          },
        ]}>
        {message}
      </Text>
      {subtitle && (
        <Text
          style={[
            styles.subtitle,
            {
              color: theme.colors.text.secondary,
              fontSize: theme.typography.sizes.md,
              fontWeight: theme.typography.weights.regular,
            },
          ]}>
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <Button
            title={actionLabel}
            onPress={onAction}
            variant="primary"
            size="large"
          />
        </View>
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
  backgroundElement: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderWidth: 1,
    borderRadius: 140,
    borderStyle: 'dashed',
  },
  iconContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  iconBackground: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 280,
    lineHeight: 22,
  },
  actionContainer: {
    marginTop: 8,
  },
});
