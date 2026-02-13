import React, {memo, useMemo, ReactNode} from 'react';
import {View, TouchableOpacity, StyleSheet, ViewStyle} from 'react-native';
import {Theme} from '../../../theme/theme';

interface ItemCardBaseProps {
  children: ReactNode;
  theme: Theme;
  style?: ViewStyle;
  onPress?: () => void;
}

const ItemCardBaseComponent: React.FC<ItemCardBaseProps> = ({
  children,
  theme,
  style,
  onPress,
}) => {
  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        backgroundColor: theme.colors.card.background,
        borderColor: theme.colors.card.border,
        borderRadius: theme.borderRadius.lg,
      },
      theme.shadows.sm,
      style,
    ],
    [
      style,
      theme.borderRadius.lg,
      theme.colors.card.background,
      theme.colors.card.border,
      theme.shadows.sm,
    ],
  );

  const accentStripeStyle = useMemo(
    () => [
      styles.accentStripe,
      {
        backgroundColor: theme.colors.accent.primary,
        borderTopLeftRadius: theme.borderRadius.lg,
        borderBottomLeftRadius: theme.borderRadius.lg,
      },
    ],
    [theme.borderRadius.lg, theme.colors.accent.primary],
  );

  const contentStyle = useMemo(
    () => [styles.content, {padding: theme.spacing.md}],
    [theme.spacing.md],
  );

  const cardContent = (
    <View style={containerStyle}>
      <View style={accentStripeStyle} />
      <View style={contentStyle}>{children}</View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        activeOpacity={0.8}>
        <View style={accentStripeStyle} />
        <View style={contentStyle}>{children}</View>
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    position: 'relative',
  },
  accentStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
  },
  content: {
    paddingLeft: 18,
  },
});

export const ItemCardBase = memo(ItemCardBaseComponent);
