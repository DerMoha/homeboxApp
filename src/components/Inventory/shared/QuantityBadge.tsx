import React, {memo, useMemo} from 'react';
import {View, Text, StyleSheet, ViewStyle} from 'react-native';
import {Theme} from '../../../theme/theme';

interface QuantityBadgeProps {
  quantity: number;
  theme: Theme;
  style?: ViewStyle;
}

const QuantityBadgeComponent: React.FC<QuantityBadgeProps> = ({
  quantity,
  theme,
  style,
}) => {
  const isZero = quantity === 0;

  const badgeStyle = useMemo(
    () => [
      styles.badge,
      {
        backgroundColor: isZero
          ? theme.colors.error
          : theme.colors.accent.muted,
        borderRadius: theme.borderRadius.full,
        borderColor: isZero ? theme.colors.error : theme.colors.accent.primary,
        borderWidth: StyleSheet.hairlineWidth,
      },
      style,
    ],
    [
      isZero,
      style,
      theme.borderRadius.full,
      theme.colors.accent.muted,
      theme.colors.accent.primary,
      theme.colors.error,
    ],
  );

  const textStyle = useMemo(
    () => [
      styles.text,
      {
        fontSize: theme.typography.sizes.xs,
        fontWeight: theme.typography.weights.semibold,
        fontFamily: theme.typography.fonts.semibold,
        color: isZero ? theme.colors.text.inverse : theme.colors.accent.primary,
      },
    ],
    [
      isZero,
      theme.colors.accent.primary,
      theme.colors.text.inverse,
      theme.typography.fonts.semibold,
      theme.typography.sizes.xs,
      theme.typography.weights.semibold,
    ],
  );

  return (
    <View style={badgeStyle}>
      <Text style={textStyle}>{quantity}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
  },
});

export const QuantityBadge = memo(QuantityBadgeComponent);
