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
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 2600,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2600,
          useNativeDriver: true,
        }),
      ]),
    );
    floatAnimation.start();

    return () => {
      floatAnimation.stop();
    };
  }, [floatAnim]);

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: theme.colors.background.primary},
      ]}>
      <View
        style={[
          styles.backgroundHalo,
          {backgroundColor: theme.colors.accent.muted},
        ]}
      />
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [{translateY: floatAnim}],
          },
        ]}>
        <View
          style={[
            styles.iconBackground,
            {
              backgroundColor: theme.colors.background.secondary,
              borderRadius: theme.borderRadius.lg,
              borderColor: theme.colors.borderSubtle,
              borderWidth: 1,
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
            fontWeight: theme.typography.weights.semibold,
            fontFamily: theme.typography.fonts.semibold,
            letterSpacing: theme.typography.letterSpacing.normal,
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
              fontSize: theme.typography.sizes.sm,
              fontWeight: theme.typography.weights.regular,
              fontFamily: theme.typography.fonts.regular,
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
  backgroundHalo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.45,
  },
  iconContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBackground: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
    lineHeight: 20,
  },
  actionContainer: {
    marginTop: 8,
  },
});
