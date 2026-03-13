import React, {memo, useMemo, ReactNode} from 'react';
import {View, TouchableOpacity, StyleSheet, ViewStyle} from 'react-native';
import {Theme} from '../../../theme/theme';
import {hapticImpact} from '../../../utils/haptics';

interface ItemCardBaseProps {
  children: ReactNode;
  theme: Theme;
  style?: ViewStyle;
  onPress?: () => void;
  onLongPress?: () => void;
  isSelected?: boolean;
  isSelectionMode?: boolean;
}

const ItemCardBaseComponent: React.FC<ItemCardBaseProps> = ({
  children,
  theme,
  style,
  onPress,
  onLongPress,
  isSelected = false,
  isSelectionMode = false,
}) => {
  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        backgroundColor: theme.colors.card.background,
        borderColor: isSelected
          ? theme.colors.accent.primary
          : theme.colors.card.border,
        borderRadius: theme.borderRadius.lg,
        borderWidth: isSelected ? 1.5 : StyleSheet.hairlineWidth,
      },
      theme.shadows.sm,
      style,
    ],
    [
      isSelected,
      style,
      theme.borderRadius.lg,
      theme.colors.accent.primary,
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

  const selectionBadgeStyle = useMemo(
    () => [
      styles.selectionBadge,
      {
        backgroundColor: isSelected
          ? theme.colors.accent.primary
          : theme.colors.background.secondary,
        borderColor: isSelected
          ? theme.colors.accent.primary
          : theme.colors.borderSubtle,
        borderRadius: theme.borderRadius.full,
      },
    ],
    [isSelected, theme],
  );

  const cardContent = (
    <View style={containerStyle}>
      <View style={accentStripeStyle} />
      {isSelectionMode && <View style={selectionBadgeStyle} />}
      <View style={contentStyle}>{children}</View>
    </View>
  );

  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={() => {
          hapticImpact('light');
          onPress?.();
        }}
        onLongPress={() => {
          hapticImpact('medium');
          onLongPress?.();
        }}
        activeOpacity={0.8}>
        <View style={accentStripeStyle} />
        {isSelectionMode && <View style={selectionBadgeStyle} />}
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
  selectionBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 14,
    height: 14,
    borderWidth: StyleSheet.hairlineWidth,
    zIndex: 2,
  },
  content: {
    paddingLeft: 18,
  },
});

export const ItemCardBase = memo(ItemCardBaseComponent);
