import React, {useCallback, useMemo, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {Label} from '../../../types';
import {useTheme} from '../../../theme/ThemeContext';
import {hapticImpact} from '../../../utils/haptics';
import {PickerModalShell} from './PickerModalShell';

interface LabelPickerModalProps {
  visible: boolean;
  labels: Label[];
  selectedLabelIds: string[];
  onToggleLabel: (labelId: string) => void;
  onApply: () => void;
  onClose: () => void;
}

export const LabelPickerModal: React.FC<LabelPickerModalProps> = ({
  visible,
  labels,
  selectedLabelIds,
  onToggleLabel,
  onApply,
  onClose,
}) => {
  const {theme} = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLabels = useMemo(
    () =>
      labels.filter(label =>
        label.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [labels, searchQuery],
  );

  const searchInputStyle = useMemo(
    () => [
      styles.searchInput,
      {
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.md,
        color: theme.colors.text.primary,
        borderColor: theme.colors.borderSubtle,
      },
    ],
    [theme],
  );

  const labelItemStyle = useMemo(
    () => [
      styles.labelItem,
      {
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.md,
        borderColor: theme.colors.borderSubtle,
      },
    ],
    [theme],
  );

  const labelItemActiveStyle = useMemo(
    () => [
      styles.labelItem,
      {
        backgroundColor: theme.colors.accent.muted,
        borderRadius: theme.borderRadius.md,
        borderColor: theme.colors.accent.primary,
      },
    ],
    [theme],
  );

  const handleToggle = useCallback(
    (labelId: string) => {
      hapticImpact('light');
      onToggleLabel(labelId);
    },
    [onToggleLabel],
  );

  const handleApply = useCallback(() => {
    hapticImpact('medium');
    setSearchQuery('');
    onApply();
  }, [onApply]);

  const handleClose = useCallback(() => {
    setSearchQuery('');
    onClose();
  }, [onClose]);

  return (
    <PickerModalShell
      visible={visible}
      title="Apply Labels"
      onClose={handleClose}>
      <TextInput
        style={searchInputStyle}
        placeholder="Search labels..."
        placeholderTextColor={theme.colors.text.tertiary}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <ScrollView style={styles.labelList} showsVerticalScrollIndicator={false}>
        <View style={styles.labelGrid}>
          {filteredLabels.map(label => {
            const isSelected = selectedLabelIds.includes(label.id);
            return (
              <TouchableOpacity
                key={label.id}
                style={isSelected ? labelItemActiveStyle : labelItemStyle}
                onPress={() => handleToggle(label.id)}>
                <Text
                  style={[
                    styles.labelText,
                    {
                      color: theme.colors.text.primary,
                      fontSize: theme.typography.sizes.md,
                      fontFamily: theme.typography.fonts.medium,
                    },
                  ]}>
                  {label.name}
                </Text>
                {isSelected && (
                  <MaterialIcons
                    name="check"
                    size={18}
                    color={theme.colors.accent.primary}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      <TouchableOpacity
        style={[
          styles.applyButton,
          {
            backgroundColor: theme.colors.accent.primary,
            borderRadius: theme.borderRadius.md,
          },
        ]}
        onPress={handleApply}>
        <Text
          style={[
            styles.applyButtonText,
            {
              color: theme.colors.text.inverse,
              fontSize: theme.typography.sizes.md,
              fontFamily: theme.typography.fonts.semibold,
            },
          ]}>
          Apply Labels
        </Text>
      </TouchableOpacity>
    </PickerModalShell>
  );
};

const styles = StyleSheet.create({
  searchInput: {
    height: 44,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  labelList: {
    maxHeight: 280,
  },
  labelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  labelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  labelText: {},
  applyButton: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyButtonText: {},
});
