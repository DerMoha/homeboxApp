import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/ThemeContext';
import { SortOption } from '../../hooks/useInventoryData';

interface SortModalProps {
  visible: boolean;
  sortOption: SortOption;
  onClose: () => void;
  onSelectSort: (option: SortOption) => void;
}

interface SortOptionConfig {
  value: SortOption;
  label: string;
}

const SORT_OPTIONS: SortOptionConfig[] = [
  { value: 'name', label: 'Name' },
  { value: 'quantity', label: 'Quantity' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Updated Date' },
  { value: 'location', label: 'Location' },
];

export const SortModal: React.FC<SortModalProps> = ({
  visible,
  sortOption,
  onClose,
  onSelectSort,
}) => {
  const { theme } = useTheme();

  const handleSelectSort = (option: SortOption) => {
    onSelectSort(option);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background.primary }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>Sort By</Text>

          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.sortOption, { borderColor: theme.colors.border }]}
              onPress={() => handleSelectSort(option.value)}
            >
              <Text style={[styles.sortOptionText, { color: theme.colors.text.primary }]}>
                {option.label}
              </Text>
              {sortOption === option.value && (
                <MaterialIcons name="check" size={24} color={theme.colors.button.primary} />
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.modalCloseButton, { backgroundColor: theme.colors.button.primary }]}
            onPress={onClose}
          >
            <Text style={[styles.modalCloseButtonText, { color: theme.colors.button.text }]}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  sortOptionText: {
    fontSize: 16,
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
