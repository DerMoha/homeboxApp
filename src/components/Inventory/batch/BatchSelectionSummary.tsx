import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTheme} from '../../../theme/ThemeContext';

interface BatchSelectionSummaryProps {
  selectedCount: number;
  isAllSelected: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

export const BatchSelectionSummary: React.FC<BatchSelectionSummaryProps> = ({
  selectedCount,
  isAllSelected,
  onSelectAll,
  onClearSelection,
}) => {
  const {theme} = useTheme();

  return (
    <View style={styles.leftSection}>
      <TouchableOpacity
        style={styles.selectAllButton}
        onPress={isAllSelected ? onClearSelection : onSelectAll}>
        <Text
          style={[
            styles.selectAllText,
            {
              color: theme.colors.accent.primary,
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.medium,
            },
          ]}>
          {isAllSelected ? 'Clear' : 'Select All'}
        </Text>
      </TouchableOpacity>
      <Text
        style={[
          styles.countText,
          {
            color: theme.colors.text.primary,
            fontSize: theme.typography.sizes.md,
            fontFamily: theme.typography.fonts.semibold,
          },
        ]}>
        {selectedCount} selected
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectAllText: {},
  countText: {},
});
