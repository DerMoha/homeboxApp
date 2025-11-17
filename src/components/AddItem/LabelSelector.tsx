import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/ThemeContext';
import { Label } from '../../hooks/useItemData';

interface LabelSelectorProps {
  labels: Label[];
  selectedLabels: Label[];
  onToggleLabel: (label: Label) => void;
  enabled: boolean;
}

export const LabelSelector: React.FC<LabelSelectorProps> = ({
  labels,
  selectedLabels,
  onToggleLabel,
  enabled,
}) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLabels = useMemo(() => {
    return labels.filter(label =>
      label.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [labels, searchQuery]);

  const isLabelSelected = (labelId: string) => {
    return selectedLabels.some(l => l.id === labelId);
  };

  if (!enabled) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
        Labels (Optional)
      </Text>

      <TextInput
        style={[styles.searchInput, {
          backgroundColor: theme.colors.background.secondary,
          color: theme.colors.text.primary,
          borderColor: theme.colors.border,
        }]}
        placeholder="Search labels..."
        placeholderTextColor={theme.colors.text.secondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <ScrollView
        style={[styles.labelsList, {
          backgroundColor: theme.colors.background.secondary,
          borderColor: theme.colors.border,
        }]}
        nestedScrollEnabled
      >
        {filteredLabels.map(label => (
          <TouchableOpacity
            key={label.id}
            style={[
              styles.labelItem,
              {
                backgroundColor: isLabelSelected(label.id)
                  ? theme.colors.primary
                  : 'transparent',
              },
            ]}
            onPress={() => onToggleLabel(label)}
          >
            <View style={styles.labelInfo}>
              <Text
                style={[
                  styles.labelName,
                  {
                    color: isLabelSelected(label.id)
                      ? '#FFFFFF'
                      : theme.colors.text.primary,
                  },
                ]}
              >
                {label.name}
              </Text>
              {label.description && (
                <Text
                  style={[
                    styles.labelDescription,
                    {
                      color: isLabelSelected(label.id)
                        ? 'rgba(255, 255, 255, 0.8)'
                        : theme.colors.text.secondary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {label.description}
                </Text>
              )}
            </View>
            {isLabelSelected(label.id) && (
              <MaterialIcons name="check" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedLabels.length > 0 && (
        <View style={styles.selectedLabelsContainer}>
          <Text style={[styles.selectedLabelsTitle, { color: theme.colors.text.secondary }]}>
            Selected ({selectedLabels.length}):
          </Text>
          <View style={styles.selectedLabelsChips}>
            {selectedLabels.map(label => (
              <View
                key={label.id}
                style={[styles.labelChip, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={styles.labelChipText}>{label.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  searchInput: {
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  labelsList: {
    maxHeight: 160,
    borderRadius: 8,
    borderWidth: 1,
  },
  labelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  labelInfo: {
    flex: 1,
  },
  labelName: {
    fontSize: 14,
    fontWeight: '500',
  },
  labelDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  selectedLabelsContainer: {
    marginTop: 8,
  },
  selectedLabelsTitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  selectedLabelsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  labelChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  labelChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});
