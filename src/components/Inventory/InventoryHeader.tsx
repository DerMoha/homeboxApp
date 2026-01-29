import React, {useCallback, useMemo, useRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Animated} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../theme/ThemeContext';

export type ViewMode = 'list' | 'grid';

interface InventoryHeaderProps {
  viewMode: ViewMode;
  itemsPerRow: number;
  listZoom: number;
  onToggleView: () => void;
  onIncreaseItemsPerRow: () => void;
  onDecreaseItemsPerRow: () => void;
  onIncreaseZoom: () => void;
  onDecreaseZoom: () => void;
  onOpenSort: () => void;
  onOpenFilter: () => void;
  activeFilterCount?: number;
}

interface AnimatedButtonProps {
  onPress: () => void;
  disabled?: boolean;
  isActive?: boolean;
  icon: string;
  theme: ReturnType<typeof useTheme>['theme'];
}

const AnimatedHeaderButton: React.FC<AnimatedButtonProps> = ({
  onPress,
  disabled = false,
  isActive = false,
  icon,
  theme,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [scaleAnim]);

  const animatedStyle = useMemo(
    () => ({transform: [{scale: scaleAnim}]}),
    [scaleAnim],
  );

  const buttonStyle = useMemo(
    () => [
      styles.headerButton,
      {
        backgroundColor: isActive
          ? theme.colors.accent.primary
          : theme.colors.background.elevated,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: isActive
          ? theme.colors.accent.primary
          : theme.colors.border,
        opacity: disabled ? 0.4 : 1,
      },
    ],
    [
      disabled,
      isActive,
      theme.borderRadius.md,
      theme.colors.accent.primary,
      theme.colors.background.elevated,
      theme.colors.border,
    ],
  );

  const iconColor = isActive
    ? theme.colors.text.inverse
    : theme.colors.text.primary;

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={buttonStyle}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}>
        <MaterialIcons name={icon} size={20} color={iconColor} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export const InventoryHeader: React.FC<InventoryHeaderProps> = ({
  viewMode,
  itemsPerRow,
  listZoom,
  onToggleView,
  onIncreaseItemsPerRow,
  onDecreaseItemsPerRow,
  onIncreaseZoom,
  onDecreaseZoom,
  onOpenSort,
  onOpenFilter,
  activeFilterCount = 0,
}) => {
  const {theme} = useTheme();

  const headerControlsStyle = useMemo(
    () => [styles.headerControls, {gap: theme.spacing.sm}],
    [theme.spacing.sm],
  );

  const badgeStyle = useMemo(
    () => [
      styles.badge,
      {
        backgroundColor: theme.colors.accent.primary,
        borderRadius: theme.borderRadius.full,
      },
    ],
    [theme.borderRadius.full, theme.colors.accent.primary],
  );

  const badgeTextStyle = useMemo(
    () => [
      styles.badgeText,
      {
        color: theme.colors.text.inverse,
        fontSize: theme.typography.sizes.xs,
        fontWeight: theme.typography.weights.bold,
      },
    ],
    [
      theme.colors.text.inverse,
      theme.typography.sizes.xs,
      theme.typography.weights.bold,
    ],
  );

  return (
    <View style={headerControlsStyle}>
      {viewMode === 'grid' ? (
        <>
          <AnimatedHeaderButton
            onPress={onDecreaseItemsPerRow}
            disabled={itemsPerRow <= 1}
            icon="remove"
            theme={theme}
          />
          <AnimatedHeaderButton
            onPress={onIncreaseItemsPerRow}
            disabled={itemsPerRow >= 5}
            icon="add"
            theme={theme}
          />
        </>
      ) : (
        <>
          <AnimatedHeaderButton
            onPress={onIncreaseZoom}
            disabled={listZoom >= 2}
            icon="zoom-in"
            theme={theme}
          />
          <AnimatedHeaderButton
            onPress={onDecreaseZoom}
            disabled={listZoom <= 0}
            icon="zoom-out"
            theme={theme}
          />
        </>
      )}
      <AnimatedHeaderButton
        onPress={onToggleView}
        icon={viewMode === 'list' ? 'grid-view' : 'view-list'}
        isActive={false}
        theme={theme}
      />
      <View>
        <AnimatedHeaderButton
          onPress={onOpenFilter}
          icon="filter-list"
          isActive={activeFilterCount > 0}
          theme={theme}
        />
        {activeFilterCount > 0 && (
          <View style={badgeStyle}>
            <Text style={badgeTextStyle}>
              {activeFilterCount > 9 ? '9+' : activeFilterCount}
            </Text>
          </View>
        )}
      </View>
      <AnimatedHeaderButton
        onPress={onOpenSort}
        icon="sort"
        isActive={false}
        theme={theme}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  headerButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  badgeText: {
    lineHeight: 18,
  },
});
