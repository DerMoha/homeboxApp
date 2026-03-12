import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../theme/ThemeContext';
import {Button} from './Button';
import {hapticImpact} from '../../utils/haptics';

type EmptyStateVariant =
  | 'default'
  | 'empty-inventory'
  | 'no-results'
  | 'no-location-items'
  | 'error';

interface EmptyStateProps {
  message?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  subtitle?: string;
  variant?: EmptyStateVariant;
}

const VARIANT_CONFIG: Record<
  EmptyStateVariant,
  {
    icon: string;
    message: string;
    subtitle?: string;
    actionLabel?: string;
  }
> = {
  default: {
    icon: 'inbox',
    message: 'No items found',
  },
  'empty-inventory': {
    icon: 'inventory-2',
    message: 'Your inventory is empty',
    subtitle: 'Start tracking your items by adding your first one.',
    actionLabel: 'Add Your First Item',
  },
  'no-results': {
    icon: 'search-off',
    message: 'No matching items',
    subtitle: 'Try different keywords or adjust your filters.',
  },
  'no-location-items': {
    icon: 'place',
    message: 'No items here yet',
    subtitle: 'Items you add to this location will appear here.',
  },
  error: {
    icon: 'error-outline',
    message: 'Something went wrong',
    subtitle: 'Please try again later.',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  icon,
  actionLabel,
  onAction,
  subtitle,
  variant = 'default',
}) => {
  const config = VARIANT_CONFIG[variant];
  const finalMessage = message ?? config.message;
  const finalIcon = icon ?? config.icon;
  const finalSubtitle = subtitle ?? config.subtitle;
  const finalActionLabel = actionLabel ?? config.actionLabel;
  const {theme} = useTheme();
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    );
    floatAnimation.start();

    return () => {
      floatAnimation.stop();
    };
  }, [floatAnim]);

  const handleActionPress = () => {
    hapticImpact('medium');
    onAction?.();
  };

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
            styles.iconBorder,
            styles.iconShadow,
            {
              backgroundColor: theme.colors.background.secondary,
              borderRadius: theme.borderRadius.full,
              borderColor: theme.colors.borderSubtle,
              shadowColor: theme.colors.accent.primary,
              shadowOffset: {width: 0, height: 4},
            },
          ]}>
          <MaterialIcons
            name={finalIcon}
            size={56}
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
        {finalMessage}
      </Text>
      {finalSubtitle && (
        <Text
          style={[
            styles.subtitle,
            {
              color: theme.colors.text.secondary,
              fontSize: theme.typography.sizes.md,
              fontWeight: theme.typography.weights.regular,
              fontFamily: theme.typography.fonts.regular,
            },
          ]}>
          {finalSubtitle}
        </Text>
      )}
      {finalActionLabel && onAction && (
        <View style={styles.actionContainer}>
          <Button
            title={finalActionLabel}
            onPress={handleActionPress}
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
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.4,
  },
  iconContainer: {
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBackground: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBorder: {
    borderWidth: 1,
  },
  iconShadow: {
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  message: {
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 28,
    maxWidth: 320,
    lineHeight: 22,
  },
  actionContainer: {
    marginTop: 8,
  },
});
