import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../theme/ThemeContext';
import {Label} from '../../hooks/useItemData';

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
  const {theme} = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLabels = useMemo(() => {
    return labels.filter(label =>
      label.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [labels, searchQuery]);

  const sectionTitleStyle = useMemo(
    () => [styles.sectionTitle, {color: theme.colors.text.primary}],
    [theme.colors.text.primary],
  );

  const searchInputStyle = useMemo(
    () => [
      styles.searchInput,
      {
        backgroundColor: theme.colors.background.secondary,
        color: theme.colors.text.primary,
        borderColor: theme.colors.border,
      },
    ],
    [
      theme.colors.background.secondary,
      theme.colors.border,
      theme.colors.text.primary,
    ],
  );

  const labelsListStyle = useMemo(
    () => [
      styles.labelsList,
      {
        backgroundColor: theme.colors.background.secondary,
        borderColor: theme.colors.border,
      },
    ],
    [theme.colors.background.secondary, theme.colors.border],
  );

  const labelItemSelectedStyle = useMemo(
    () => ({backgroundColor: theme.colors.primary}),
    [theme.colors.primary],
  );

  const labelNameStyle = useMemo(
    () => [styles.labelName, {color: theme.colors.text.primary}],
    [theme.colors.text.primary],
  );

  const labelNameSelectedStyle = useMemo(
    () => [styles.labelName, {color: theme.colors.text.inverse}],
    [theme.colors.text.inverse],
  );

  const labelDescriptionStyle = useMemo(
    () => [styles.labelDescription, {color: theme.colors.text.secondary}],
    [theme.colors.text.secondary],
  );

  const labelDescriptionSelectedStyle = useMemo(
    () => [styles.labelDescription, styles.labelDescriptionSelected],
    [],
  );

  const selectedLabelsTitleStyle = useMemo(
    () => [styles.selectedLabelsTitle, {color: theme.colors.text.secondary}],
    [theme.colors.text.secondary],
  );

  const labelChipStyle = useMemo(
    () => [styles.labelChip, {backgroundColor: theme.colors.primary}],
    [theme.colors.primary],
  );

  const labelChipTextStyle = useMemo(
    () => [styles.labelChipText, {color: theme.colors.text.inverse}],
    [theme.colors.text.inverse],
  );

  const isLabelSelected = (labelId: string) => {
    return selectedLabels.some(l => l.id === labelId);
  };

  if (!enabled) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={sectionTitleStyle}>Labels (Optional)</Text>

      <TextInput
        style={searchInputStyle}
        placeholder="Search labels..."
        placeholderTextColor={theme.colors.text.secondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <ScrollView style={labelsListStyle} nestedScrollEnabled>
        {filteredLabels.map(label =>
          (() => {
            const isSelected = isLabelSelected(label.id);
            const labelItemStyle = isSelected
              ? [styles.labelItem, labelItemSelectedStyle]
              : styles.labelItem;
            const labelTextStyle = isSelected
              ? labelNameSelectedStyle
              : labelNameStyle;
            const descriptionStyle = isSelected
              ? labelDescriptionSelectedStyle
              : labelDescriptionStyle;
            return (
              <TouchableOpacity
                key={label.id}
                style={labelItemStyle}
                onPress={() => onToggleLabel(label)}>
                <View style={styles.labelInfo}>
                  <Text style={labelTextStyle}>{label.name}</Text>
                  {label.description && (
                    <Text style={descriptionStyle} numberOfLines={1}>
                      {label.description}
                    </Text>
                  )}
                </View>
                {isSelected && (
                  <MaterialIcons
                    name="check"
                    size={20}
                    color={theme.colors.text.inverse}
                  />
                )}
              </TouchableOpacity>
            );
          })(),
        )}
      </ScrollView>

      {selectedLabels.length > 0 && (
        <View style={styles.selectedLabelsContainer}>
          <Text style={selectedLabelsTitleStyle}>
            Selected ({selectedLabels.length}):
          </Text>
          <View style={styles.selectedLabelsChips}>
            {selectedLabels.map(label => (
              <View key={label.id} style={labelChipStyle}>
                <Text style={labelChipTextStyle}>{label.name}</Text>
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
  labelDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
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
    fontSize: 12,
    fontWeight: '500',
  },
});
