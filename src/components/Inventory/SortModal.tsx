import React, { useRef, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Animated } from 'react-native';
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
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  const handleSelectSort = (option: SortOption) => {
    onSelectSort(option);
    onClose();
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const scale = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.backdropTouchable} onPress={onClose} activeOpacity={1} />
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.card.background,
              borderRadius: theme.borderRadius.xl,
              padding: theme.spacing.lg,
              transform: [{ translateY }, { scale }],
              opacity: slideAnim,
            },
            theme.shadows.lg,
          ]}
        >
          <Text
            style={[
              styles.modalTitle,
              {
                color: theme.colors.text.primary,
                fontSize: theme.typography.sizes.xl,
                fontWeight: theme.typography.weights.semibold,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            Sort By
          </Text>

          {SORT_OPTIONS.map((option, index) => {
            const isSelected = sortOption === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortOption,
                  {
                    backgroundColor: isSelected ? theme.colors.accent.muted : 'transparent',
                    borderRadius: theme.borderRadius.md,
                    borderWidth: 1,
                    borderColor: isSelected ? theme.colors.accent.primary : theme.colors.border,
                    padding: theme.spacing.md,
                    marginBottom: index === SORT_OPTIONS.length - 1 ? 0 : theme.spacing.sm,
                  },
                ]}
                onPress={() => handleSelectSort(option.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    {
                      color: isSelected ? theme.colors.accent.primary : theme.colors.text.primary,
                      fontSize: theme.typography.sizes.lg,
                      fontWeight: isSelected ? theme.typography.weights.semibold : theme.typography.weights.regular,
                    },
                  ]}
                >
                  {option.label}
                </Text>
                {isSelected && (
                  <MaterialIcons name="check" size={22} color={theme.colors.accent.primary} />
                )}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[
              styles.modalCloseButton,
              {
                backgroundColor: theme.colors.background.elevated,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                marginTop: theme.spacing.lg,
                borderWidth: 1,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modalCloseButtonText,
                {
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.sizes.lg,
                  fontWeight: theme.typography.weights.medium,
                },
              ]}
            >
              Close
            </Text>
          </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    textAlign: 'center',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sortOptionText: {},
  modalCloseButton: {
    alignItems: 'center',
  },
  modalCloseButtonText: {},
});
