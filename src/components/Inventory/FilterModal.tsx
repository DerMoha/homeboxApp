import React, {useMemo, useRef, useEffect, useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  TextInput,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../theme/ThemeContext';
import type {FilterState, InsuranceFilter, Location, Label} from '../../types';

interface FilterModalProps {
  visible: boolean;
  filters: FilterState;
  locations: Location[];
  labels: Label[];
  onUpdateFilters: (updates: Partial<FilterState>) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  filters,
  locations,
  labels,
  onUpdateFilters,
  onApply,
  onClear,
  onClose,
}) => {
  const {theme} = useTheme();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [labelSearchQuery, setLabelSearchQuery] = useState('');

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 1,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const scale = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });

  const filteredLocations = useMemo(() => {
    return locations.filter(location =>
      location.name.toLowerCase().includes(locationSearchQuery.toLowerCase()),
    );
  }, [locations, locationSearchQuery]);

  const filteredLabels = useMemo(() => {
    return labels.filter(label =>
      label.name.toLowerCase().includes(labelSearchQuery.toLowerCase()),
    );
  }, [labels, labelSearchQuery]);

  const handleApply = () => {
    onApply();
    onClose();
  };

  const handleClear = () => {
    onClear();
    setLocationSearchQuery('');
    setLabelSearchQuery('');
  };

  const modalOverlayStyle = useMemo(
    () => [styles.modalOverlay, {opacity: fadeAnim}],
    [fadeAnim],
  );

  const modalContentStyle = useMemo(
    () => [
      styles.modalContent,
      {
        backgroundColor: theme.colors.card.background,
        borderRadius: theme.borderRadius.xl,
        borderColor: theme.colors.borderSubtle,
        borderWidth: StyleSheet.hairlineWidth,
        padding: theme.spacing.lg,
        transform: [{translateY}, {scale}],
        opacity: slideAnim,
      },
      theme.shadows.md,
    ],
    [
      scale,
      slideAnim,
      theme.borderRadius.xl,
      theme.colors.card.background,
      theme.colors.borderSubtle,
      theme.shadows.md,
      theme.spacing.lg,
      translateY,
    ],
  );

  const sectionTitleStyle = useMemo(
    () => [
      styles.sectionTitle,
      {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.sm,
        fontWeight: theme.typography.weights.semibold,
        fontFamily: theme.typography.fonts.semibold,
        marginBottom: theme.spacing.xs,
        marginTop: theme.spacing.lg,
      },
    ],
    [
      theme.colors.text.secondary,
      theme.spacing.lg,
      theme.spacing.xs,
      theme.typography.sizes.sm,
      theme.typography.weights.semibold,
      theme.typography.fonts.semibold,
    ],
  );

  const searchInputStyle = useMemo(
    () => [
      styles.searchInput,
      {
        backgroundColor: theme.colors.background.tertiary,
        color: theme.colors.text.primary,
        borderColor: theme.colors.borderSubtle,
        borderRadius: theme.borderRadius.md,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        fontSize: theme.typography.sizes.sm,
        fontFamily: theme.typography.fonts.regular,
      },
    ],
    [
      theme.borderRadius.md,
      theme.colors.background.tertiary,
      theme.colors.borderSubtle,
      theme.colors.text.primary,
      theme.spacing.md,
      theme.spacing.sm,
      theme.typography.sizes.sm,
      theme.typography.fonts.regular,
    ],
  );

  const scrollViewStyle = useMemo(
    () => [
      styles.scrollView,
      {
        backgroundColor: theme.colors.background.secondary,
        borderColor: theme.colors.borderSubtle,
        borderRadius: theme.borderRadius.md,
      },
    ],
    [
      theme.borderRadius.md,
      theme.colors.background.secondary,
      theme.colors.borderSubtle,
    ],
  );

  const filterOptionStyle = useMemo(
    () => [styles.filterOption, {borderBottomColor: theme.colors.borderSubtle}],
    [theme.colors.borderSubtle],
  );

  const primaryButtonStyle = useMemo(
    () => [
      styles.primaryButton,
      {
        backgroundColor: theme.colors.accent.primary,
        borderRadius: theme.borderRadius.lg,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
      },
    ],
    [theme.borderRadius.lg, theme.colors.accent.primary, theme.spacing.md],
  );

  const secondaryButtonStyle = useMemo(
    () => [
      styles.secondaryButton,
      {
        borderRadius: theme.borderRadius.lg,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        borderColor: theme.colors.borderSubtle,
        borderWidth: StyleSheet.hairlineWidth,
        backgroundColor: theme.colors.background.secondary,
      },
    ],
    [
      theme.borderRadius.lg,
      theme.colors.background.secondary,
      theme.colors.borderSubtle,
      theme.spacing.md,
    ],
  );

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <Animated.View style={modalOverlayStyle}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          onPress={onClose}
          activeOpacity={1}
        />
        <Animated.View style={modalContentStyle}>
          <Text
            style={[
              styles.modalTitle,
              {
                color: theme.colors.text.primary,
                fontSize: theme.typography.sizes.xl,
                fontWeight: theme.typography.weights.semibold,
                fontFamily: theme.typography.fonts.semibold,
                marginBottom: theme.spacing.md,
              },
            ]}>
            Filter Items
          </Text>

          <ScrollView
            style={styles.contentScroll}
            showsVerticalScrollIndicator={false}>
            {/* Location Filter */}
            <Text style={sectionTitleStyle}>Location</Text>
            <TextInput
              style={searchInputStyle}
              placeholder="Search locations..."
              placeholderTextColor={theme.colors.text.secondary}
              value={locationSearchQuery}
              onChangeText={setLocationSearchQuery}
            />
            <ScrollView
              style={scrollViewStyle}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  filterOptionStyle,
                  filters.locationId === null && {
                    backgroundColor: theme.colors.accent.muted,
                  },
                ]}
                onPress={() => onUpdateFilters({locationId: null})}>
                <Text
                  style={[
                    styles.filterOptionText,
                    {
                      color:
                        filters.locationId === null
                          ? theme.colors.accent.primary
                          : theme.colors.text.primary,
                      fontSize: theme.typography.sizes.sm,
                      fontFamily: theme.typography.fonts.medium,
                    },
                  ]}>
                  All Locations
                </Text>
                {filters.locationId === null && (
                  <MaterialIcons
                    name="check"
                    size={18}
                    color={theme.colors.accent.primary}
                  />
                )}
              </TouchableOpacity>
              {filteredLocations.map(location => (
                <TouchableOpacity
                  key={location.id}
                  style={[
                    filterOptionStyle,
                    filters.locationId === location.id && {
                      backgroundColor: theme.colors.accent.muted,
                    },
                  ]}
                  onPress={() => onUpdateFilters({locationId: location.id})}>
                  <Text
                    style={[
                      styles.filterOptionText,
                      {
                        color:
                          filters.locationId === location.id
                            ? theme.colors.accent.primary
                            : theme.colors.text.primary,
                        fontSize: theme.typography.sizes.sm,
                        fontFamily: theme.typography.fonts.medium,
                      },
                    ]}>
                    {location.name}
                  </Text>
                  {filters.locationId === location.id && (
                    <MaterialIcons
                      name="check"
                      size={18}
                      color={theme.colors.accent.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Label Filter */}
            <Text style={sectionTitleStyle}>Labels</Text>
            <TextInput
              style={searchInputStyle}
              placeholder="Search labels..."
              placeholderTextColor={theme.colors.text.secondary}
              value={labelSearchQuery}
              onChangeText={setLabelSearchQuery}
            />
            <ScrollView
              style={scrollViewStyle}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}>
              {filteredLabels.map(label => {
                const isSelected = filters.labelIds.includes(label.id);
                return (
                  <TouchableOpacity
                    key={label.id}
                    style={[
                      filterOptionStyle,
                      isSelected && {
                        backgroundColor: theme.colors.accent.muted,
                      },
                    ]}
                    onPress={() => {
                      const newLabelIds = isSelected
                        ? filters.labelIds.filter(
                            (id: string) => id !== label.id,
                          )
                        : [...filters.labelIds, label.id];
                      onUpdateFilters({labelIds: newLabelIds});
                    }}>
                    <Text
                      style={[
                        styles.filterOptionText,
                        {
                          color: isSelected
                            ? theme.colors.accent.primary
                            : theme.colors.text.primary,
                          fontSize: theme.typography.sizes.sm,
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
            </ScrollView>

            {/* Insurance Filter */}
            <Text style={sectionTitleStyle}>Insurance Status</Text>
            <View style={styles.radioGroup}>
              {(['all', 'insured', 'uninsured'] as InsuranceFilter[]).map(
                status => {
                  const isSelected = filters.insuranceStatus === status;
                  const statusLabels: Record<InsuranceFilter, string> = {
                    all: 'All Items',
                    insured: 'Insured Only',
                    uninsured: 'Uninsured Only',
                  };
                  return (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.radioOption,
                        {
                          borderColor: theme.colors.borderSubtle,
                          borderRadius: theme.borderRadius.md,
                        },
                        isSelected && {
                          backgroundColor: theme.colors.accent.muted,
                          borderColor: theme.colors.accent.primary,
                        },
                      ]}
                      onPress={() =>
                        onUpdateFilters({insuranceStatus: status})
                      }>
                      <View
                        style={[
                          styles.radio,
                          {borderColor: theme.colors.borderSubtle},
                          isSelected && {
                            borderColor: theme.colors.accent.primary,
                            backgroundColor: theme.colors.accent.primary,
                          },
                        ]}>
                        {isSelected && (
                          <View
                            style={[
                              styles.radioInner,
                              {backgroundColor: theme.colors.text.inverse},
                            ]}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.radioLabel,
                          {
                            color: isSelected
                              ? theme.colors.accent.primary
                              : theme.colors.text.primary,
                            fontSize: theme.typography.sizes.sm,
                            fontFamily: theme.typography.fonts.medium,
                          },
                        ]}>
                        {statusLabels[status]}
                      </Text>
                    </TouchableOpacity>
                  );
                },
              )}
            </View>

            {/* Quantity Range Filter */}
            <Text style={sectionTitleStyle}>Quantity Range (Optional)</Text>
            <View style={styles.rangeInputs}>
              <View style={styles.rangeInputContainer}>
                <Text
                  style={[
                    styles.rangeLabel,
                    {
                      color: theme.colors.text.secondary,
                      fontSize: theme.typography.sizes.xs,
                      fontFamily: theme.typography.fonts.regular,
                    },
                  ]}>
                  Min
                </Text>
                <TextInput
                  style={[
                    searchInputStyle,
                    styles.rangeInput,
                    styles.rangeInputNoMargin,
                  ]}
                  placeholder="0"
                  placeholderTextColor={theme.colors.text.secondary}
                  keyboardType="numeric"
                  value={
                    filters.quantityMin !== null
                      ? String(filters.quantityMin)
                      : ''
                  }
                  onChangeText={text => {
                    const value = text === '' ? null : parseInt(text, 10);
                    if (value === null || !isNaN(value)) {
                      onUpdateFilters({quantityMin: value});
                    }
                  }}
                />
              </View>
              <View style={styles.rangeInputContainer}>
                <Text
                  style={[
                    styles.rangeLabel,
                    {
                      color: theme.colors.text.secondary,
                      fontSize: theme.typography.sizes.xs,
                      fontFamily: theme.typography.fonts.regular,
                    },
                  ]}>
                  Max
                </Text>
                <TextInput
                  style={[
                    searchInputStyle,
                    styles.rangeInput,
                    styles.rangeInputNoMargin,
                  ]}
                  placeholder="∞"
                  placeholderTextColor={theme.colors.text.secondary}
                  keyboardType="numeric"
                  value={
                    filters.quantityMax !== null
                      ? String(filters.quantityMax)
                      : ''
                  }
                  onChangeText={text => {
                    const value = text === '' ? null : parseInt(text, 10);
                    if (value === null || !isNaN(value)) {
                      onUpdateFilters({quantityMax: value});
                    }
                  }}
                />
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={primaryButtonStyle}
              onPress={handleApply}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.primaryButtonText,
                  {
                    color: theme.colors.text.inverse,
                    fontSize: theme.typography.sizes.md,
                    fontWeight: theme.typography.weights.semibold,
                    fontFamily: theme.typography.fonts.semibold,
                  },
                ]}>
                Apply Filters
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={secondaryButtonStyle}
              onPress={handleClear}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.secondaryButtonText,
                  {
                    color: theme.colors.text.secondary,
                    fontSize: theme.typography.sizes.md,
                    fontFamily: theme.typography.fonts.medium,
                  },
                ]}>
                Clear All
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
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
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalTitle: {
    textAlign: 'left',
  },
  contentScroll: {
    maxHeight: 450,
  },
  sectionTitle: {},
  searchInput: {
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  scrollView: {
    maxHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterOptionText: {},
  radioGroup: {
    marginBottom: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  radioLabel: {},
  rangeInputs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  rangeInputContainer: {
    flex: 1,
  },
  rangeLabel: {
    marginBottom: 4,
  },
  rangeInput: {},
  rangeInputNoMargin: {
    marginBottom: 0,
  },
  actions: {
    marginTop: 16,
    gap: 8,
  },
  primaryButton: {
    alignItems: 'center',
  },
  primaryButtonText: {},
  secondaryButton: {
    alignItems: 'center',
  },
  secondaryButtonText: {},
});
