import React, {useCallback, useMemo} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {useTheme} from '../../../theme/ThemeContext';
import {hapticImpact} from '../../../utils/haptics';
import {BatchActionButton} from './BatchActionButton';
import {BatchSelectionSummary} from './BatchSelectionSummary';

interface BatchActionBarProps {
  visible: boolean;
  selectedCount: number;
  onDelete: () => void;
  onMove: () => void;
  onLabel: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  isAllSelected: boolean;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  visible,
  selectedCount,
  onDelete,
  onMove,
  onLabel,
  onSelectAll,
  onClearSelection,
  isAllSelected,
}) => {
  const {theme} = useTheme();

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        backgroundColor: theme.colors.background.elevated,
        borderTopColor: theme.colors.borderSubtle,
      },
      theme.shadows.lg,
    ],
    [theme],
  );

  const withHaptics = useCallback((handler: () => void) => {
    hapticImpact('medium');
    handler();
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={containerStyle}>
      <View style={styles.contentRow}>
        <BatchSelectionSummary
          selectedCount={selectedCount}
          isAllSelected={isAllSelected}
          onSelectAll={() => withHaptics(onSelectAll)}
          onClearSelection={() => withHaptics(onClearSelection)}
        />

        <View style={styles.actionsRow}>
          <BatchActionButton
            label="Move"
            icon="drive-file-move-outline"
            onPress={() => withHaptics(onMove)}
          />
          <BatchActionButton
            label="Label"
            icon="label"
            onPress={() => withHaptics(onLabel)}
          />
          <BatchActionButton
            label="Delete"
            icon="delete-outline"
            onPress={() => withHaptics(onDelete)}
            destructive
          />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 28,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
