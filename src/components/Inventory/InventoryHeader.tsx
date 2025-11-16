import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/ThemeContext';

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
  const { theme } = useTheme();

  return (
    <View style={styles.headerControls}>
      {viewMode === 'grid' ? (
        <>
          <TouchableOpacity
            style={[
              styles.headerButton,
              {
                backgroundColor: theme.colors.button.primary,
                opacity: itemsPerRow <= 1 ? 0.5 : 1,
              },
            ]}
            onPress={onDecreaseItemsPerRow}
            disabled={itemsPerRow <= 1}
          >
            <MaterialIcons name="remove" size={20} color={theme.colors.button.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.headerButton,
              {
                backgroundColor: theme.colors.button.primary,
                opacity: itemsPerRow >= 5 ? 0.5 : 1,
              },
            ]}
            onPress={onIncreaseItemsPerRow}
            disabled={itemsPerRow >= 5}
          >
            <MaterialIcons name="add" size={20} color={theme.colors.button.text} />
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity
            style={[
              styles.headerButton,
              {
                backgroundColor: theme.colors.button.primary,
                opacity: listZoom >= 2 ? 0.5 : 1,
              },
            ]}
            onPress={onIncreaseZoom}
            disabled={listZoom >= 2}
          >
            <MaterialIcons name="zoom-in" size={20} color={theme.colors.button.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.headerButton,
              {
                backgroundColor: theme.colors.button.primary,
                opacity: listZoom <= 0 ? 0.5 : 1,
              },
            ]}
            onPress={onDecreaseZoom}
            disabled={listZoom <= 0}
          >
            <MaterialIcons name="zoom-out" size={20} color={theme.colors.button.text} />
          </TouchableOpacity>
        </>
      )}
      <TouchableOpacity
        style={[styles.headerButton, { backgroundColor: theme.colors.button.primary }]}
        onPress={onToggleView}
      >
        <MaterialIcons
          name={viewMode === 'list' ? 'grid-view' : 'view-list'}
          size={20}
          color={theme.colors.button.text}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.headerButton, { backgroundColor: theme.colors.button.primary }]}
        onPress={onOpenSort}
      >
        <MaterialIcons name="sort" size={20} color={theme.colors.button.text} />
      </TouchableOpacity>
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
