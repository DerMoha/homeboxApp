import React, {useCallback, useRef} from 'react';
import {View, TouchableOpacity, StyleSheet, Animated} from 'react-native';
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
}

interface AnimatedButtonProps {
  onPress: () => void;
  disabled?: boolean;
  isActive?: boolean;
  icon: string;
}

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
}) => {
  const {theme} = useTheme();

  const AnimatedButton: React.FC<AnimatedButtonProps> = ({
    onPress,
    disabled = false,
    isActive = false,
    icon,
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

    return (
      <Animated.View style={{transform: [{scale: scaleAnim}]}}>
        <TouchableOpacity
          style={[
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
          ]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          activeOpacity={1}>
          <MaterialIcons
            name={icon}
            size={20}
            color={
              isActive ? theme.colors.text.inverse : theme.colors.text.primary
            }
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.headerControls, {gap: theme.spacing.sm}]}>
      {viewMode === 'grid' ? (
        <>
          <AnimatedButton
            onPress={onDecreaseItemsPerRow}
            disabled={itemsPerRow <= 1}
            icon="remove"
          />
          <AnimatedButton
            onPress={onIncreaseItemsPerRow}
            disabled={itemsPerRow >= 5}
            icon="add"
          />
        </>
      ) : (
        <>
          <AnimatedButton
            onPress={onIncreaseZoom}
            disabled={listZoom >= 2}
            icon="zoom-in"
          />
          <AnimatedButton
            onPress={onDecreaseZoom}
            disabled={listZoom <= 0}
            icon="zoom-out"
          />
        </>
      )}
      <AnimatedButton
        onPress={onToggleView}
        icon={viewMode === 'list' ? 'grid-view' : 'view-list'}
        isActive={false}
      />
      <AnimatedButton onPress={onOpenSort} icon="sort" isActive={false} />
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
});
