import React, {useMemo, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../theme/ThemeContext';
import {hapticImpact} from '../../utils/haptics';
import type {Location, Label} from '../../types';

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

  const handleDelete = useCallback(() => {
    hapticImpact('medium');
    onDelete();
  }, [onDelete]);

  const handleMove = useCallback(() => {
    hapticImpact('medium');
    onMove();
  }, [onMove]);

  const handleLabel = useCallback(() => {
    hapticImpact('medium');
    onLabel();
  }, [onLabel]);

  const handleSelectAll = useCallback(() => {
    hapticImpact('light');
    onSelectAll();
  }, [onSelectAll]);

  const handleClear = useCallback(() => {
    hapticImpact('light');
    onClearSelection();
  }, [onClearSelection]);

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

  const actionButtonStyle = useMemo(
    () => [
      styles.actionButton,
      {
        backgroundColor: theme.colors.background.tertiary,
        borderRadius: theme.borderRadius.md,
      },
    ],
    [theme],
  );

  const destructiveButtonStyle = useMemo(
    () => [
      styles.actionButton,
      {
        backgroundColor: `${theme.colors.error}20`,
        borderRadius: theme.borderRadius.md,
      },
    ],
    [theme],
  );

  const actionTextStyle = useMemo(
    () => [
      styles.actionText,
      {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.xs,
        fontFamily: theme.typography.fonts.medium,
      },
    ],
    [theme],
  );

  const destructiveTextStyle = useMemo(
    () => [
      styles.actionText,
      {
        color: theme.colors.error,
        fontSize: theme.typography.sizes.xs,
        fontFamily: theme.typography.fonts.medium,
      },
    ],
    [theme],
  );

  const countTextStyle = useMemo(
    () => [
      styles.countText,
      {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.sm,
        fontFamily: theme.typography.fonts.semibold,
      },
    ],
    [theme],
  );

  const selectAllButtonStyle = useMemo(
    () => [
      styles.selectAllButton,
      {
        backgroundColor: theme.colors.accent.muted,
        borderRadius: theme.borderRadius.md,
      },
    ],
    [theme],
  );

  const selectAllTextStyle = useMemo(
    () => [
      styles.selectAllText,
      {
        color: theme.colors.accent.primary,
        fontSize: theme.typography.sizes.sm,
        fontFamily: theme.typography.fonts.medium,
      },
    ],
    [theme],
  );

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={containerStyle}>
      <View style={styles.contentRow}>
        <View style={styles.leftSection}>
          <TouchableOpacity
            style={selectAllButtonStyle}
            onPress={isAllSelected ? handleClear : handleSelectAll}>
            <Text style={selectAllTextStyle}>
              {isAllSelected ? 'Clear' : 'Select All'}
            </Text>
          </TouchableOpacity>
          <Text style={countTextStyle}>
            {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
          </Text>
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={actionButtonStyle} onPress={handleMove}>
            <MaterialIcons
              name="drive-file-move-outline"
              size={22}
              color={theme.colors.text.primary}
            />
            <Text style={actionTextStyle}>Move</Text>
          </TouchableOpacity>
          <TouchableOpacity style={actionButtonStyle} onPress={handleLabel}>
            <MaterialIcons
              name="label-outline"
              size={22}
              color={theme.colors.text.primary}
            />
            <Text style={actionTextStyle}>Label</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={destructiveButtonStyle}
            onPress={handleDelete}>
            <MaterialIcons
              name="delete-outline"
              size={22}
              color={theme.colors.error}
            />
            <Text style={destructiveTextStyle}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

interface LocationPickerModalProps {
  visible: boolean;
  locations: Location[];
  onSelect: (locationId: string | null) => void;
  onClose: () => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  locations,
  onSelect,
  onClose,
}) => {
  const {theme} = useTheme();
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredLocations = useMemo(() => {
    return locations.filter(loc =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [locations, searchQuery]);

  const handleSelect = useCallback(
    (locationId: string | null) => {
      hapticImpact('medium');
      onSelect(locationId);
    },
    [onSelect],
  );

  const modalOverlayStyle = useMemo(
    () => [styles.modalOverlay, {backgroundColor: 'rgba(0, 0, 0, 0.5)'}],
    [],
  );

  const modalContentStyle = useMemo(
    () => [
      styles.modalContent,
      {
        backgroundColor: theme.colors.card.background,
        borderRadius: theme.borderRadius.xl,
      },
    ],
    [theme],
  );

  const searchInputStyle = useMemo(
    () => [
      styles.searchInput,
      {
        backgroundColor: theme.colors.background.tertiary,
        color: theme.colors.text.primary,
        borderRadius: theme.borderRadius.md,
      },
    ],
    [theme],
  );

  const locationItemStyle = useMemo(
    () => [
      styles.locationItem,
      {
        borderBottomColor: theme.colors.borderSubtle,
      },
    ],
    [theme],
  );

  const locationTextStyle = useMemo(
    () => [
      styles.locationText,
      {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.md,
        fontFamily: theme.typography.fonts.medium,
      },
    ],
    [theme],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={modalOverlayStyle}>
        <View style={modalContentStyle}>
          <View style={styles.modalHeader}>
            <Text
              style={[
                styles.modalTitle,
                {
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.sizes.xl,
                  fontFamily: theme.typography.fonts.semibold,
                },
              ]}>
              Move to Location
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons
                name="close"
                size={24}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>
          </View>
          <TextInput
            style={searchInputStyle}
            placeholder="Search locations..."
            placeholderTextColor={theme.colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <ScrollView
            style={styles.locationList}
            showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={locationItemStyle}
              onPress={() => handleSelect(null)}>
              <MaterialIcons
                name="inventory-2"
                size={20}
                color={theme.colors.text.secondary}
              />
              <Text style={locationTextStyle}>No Location</Text>
            </TouchableOpacity>
            {filteredLocations.map(location => (
              <TouchableOpacity
                key={location.id}
                style={locationItemStyle}
                onPress={() => handleSelect(location.id)}>
                <MaterialIcons
                  name="location-on"
                  size={20}
                  color={theme.colors.text.secondary}
                />
                <Text style={locationTextStyle}>{location.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

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
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredLabels = useMemo(() => {
    return labels.filter(lbl =>
      lbl.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [labels, searchQuery]);

  const handleToggle = useCallback(
    (labelId: string) => {
      hapticImpact('light');
      onToggleLabel(labelId);
    },
    [onToggleLabel],
  );

  const handleApply = useCallback(() => {
    hapticImpact('medium');
    onApply();
  }, [onApply]);

  const modalOverlayStyle = useMemo(
    () => [styles.modalOverlay, {backgroundColor: 'rgba(0, 0, 0, 0.5)'}],
    [],
  );

  const modalContentStyle = useMemo(
    () => [
      styles.modalContent,
      {
        backgroundColor: theme.colors.card.background,
        borderRadius: theme.borderRadius.xl,
      },
    ],
    [theme],
  );

  const searchInputStyle = useMemo(
    () => [
      styles.searchInput,
      {
        backgroundColor: theme.colors.background.tertiary,
        color: theme.colors.text.primary,
        borderRadius: theme.borderRadius.md,
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

  const labelTextStyle = useMemo(
    () => [
      styles.labelText,
      {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.md,
        fontFamily: theme.typography.fonts.medium,
      },
    ],
    [theme],
  );

  const applyButtonStyle = useMemo(
    () => [
      styles.applyButton,
      {
        backgroundColor: theme.colors.accent.primary,
        borderRadius: theme.borderRadius.md,
      },
    ],
    [theme],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={modalOverlayStyle}>
        <View style={modalContentStyle}>
          <View style={styles.modalHeader}>
            <Text
              style={[
                styles.modalTitle,
                {
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.sizes.xl,
                  fontFamily: theme.typography.fonts.semibold,
                },
              ]}>
              Apply Labels
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons
                name="close"
                size={24}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>
          </View>
          <TextInput
            style={searchInputStyle}
            placeholder="Search labels..."
            placeholderTextColor={theme.colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <ScrollView
            style={styles.labelList}
            showsVerticalScrollIndicator={false}>
            <View style={styles.labelGrid}>
              {filteredLabels.map(label => {
                const isSelected = selectedLabelIds.includes(label.id);
                return (
                  <TouchableOpacity
                    key={label.id}
                    style={isSelected ? labelItemActiveStyle : labelItemStyle}
                    onPress={() => handleToggle(label.id)}>
                    <Text style={labelTextStyle}>{label.name}</Text>
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
          <TouchableOpacity style={applyButtonStyle} onPress={handleApply}>
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
        </View>
      </View>
    </Modal>
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
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
    minWidth: 56,
  },
  actionText: {
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {},
  searchInput: {
    height: 44,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  locationList: {
    maxHeight: 300,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  locationText: {},
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
