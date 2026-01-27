import React, {useMemo, useRef, useEffect} from 'react';
import {
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../theme/ThemeContext';
import {SortOption} from '../../hooks/useInventoryData';

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
  {value: 'name', label: 'Name'},
  {value: 'quantity', label: 'Quantity'},
  {value: 'createdAt', label: 'Created Date'},
  {value: 'updatedAt', label: 'Updated Date'},
  {value: 'location', label: 'Location'},
];

export const SortModal: React.FC<SortModalProps> = ({
  visible,
  sortOption,
  onClose,
  onSelectSort,
}) => {
  const {theme} = useTheme();
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
        padding: theme.spacing.lg,
        transform: [{translateY}, {scale}],
        opacity: slideAnim,
      },
      theme.shadows.lg,
    ],
    [
      scale,
      slideAnim,
      theme.borderRadius.xl,
      theme.colors.card.background,
      theme.shadows.lg,
      theme.spacing.lg,
      translateY,
    ],
  );

  const modalTitleStyle = useMemo(
    () => [
      styles.modalTitle,
      {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.xl,
        fontWeight: theme.typography.weights.semibold,
        marginBottom: theme.spacing.md,
      },
    ],
    [
      theme.colors.text.primary,
      theme.spacing.md,
      theme.typography.sizes.xl,
      theme.typography.weights.semibold,
    ],
  );

  const baseOptionStyle = useMemo(
    () => [
      styles.sortOption,
      {
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
      },
    ],
    [theme.borderRadius.md, theme.spacing.md, theme.spacing.sm],
  );

  const optionSelectedStyle = useMemo(
    () => ({
      backgroundColor: theme.colors.accent.muted,
      borderColor: theme.colors.accent.primary,
    }),
    [theme.colors.accent.muted, theme.colors.accent.primary],
  );

  const optionDefaultStyle = useMemo(
    () => ({
      backgroundColor: 'transparent',
      borderColor: theme.colors.border,
    }),
    [theme.colors.border],
  );

  const optionTextSelectedStyle = useMemo(
    () => [
      styles.sortOptionText,
      {
        color: theme.colors.accent.primary,
        fontSize: theme.typography.sizes.lg,
        fontWeight: theme.typography.weights.semibold,
      },
    ],
    [
      theme.colors.accent.primary,
      theme.typography.sizes.lg,
      theme.typography.weights.semibold,
    ],
  );

  const optionTextDefaultStyle = useMemo(
    () => [
      styles.sortOptionText,
      {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.lg,
        fontWeight: theme.typography.weights.regular,
      },
    ],
    [
      theme.colors.text.primary,
      theme.typography.sizes.lg,
      theme.typography.weights.regular,
    ],
  );

  const closeButtonStyle = useMemo(
    () => [
      styles.modalCloseButton,
      {
        backgroundColor: theme.colors.background.elevated,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginTop: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
    ],
    [
      theme.borderRadius.md,
      theme.colors.background.elevated,
      theme.colors.border,
      theme.spacing.lg,
      theme.spacing.md,
    ],
  );

  const closeButtonTextStyle = useMemo(
    () => [
      styles.modalCloseButtonText,
      {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.lg,
        fontWeight: theme.typography.weights.medium,
      },
    ],
    [
      theme.colors.text.primary,
      theme.typography.sizes.lg,
      theme.typography.weights.medium,
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
          <Text style={modalTitleStyle}>Sort By</Text>

          {SORT_OPTIONS.map((option, index) => {
            const isSelected = sortOption === option.value;
            const optionStyle = isSelected
              ? optionSelectedStyle
              : optionDefaultStyle;
            const textStyle = isSelected
              ? optionTextSelectedStyle
              : optionTextDefaultStyle;
            const isLast = index === SORT_OPTIONS.length - 1;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  baseOptionStyle,
                  optionStyle,
                  isLast ? styles.sortOptionLast : null,
                ]}
                onPress={() => handleSelectSort(option.value)}
                activeOpacity={0.7}>
                <Text style={textStyle}>{option.label}</Text>
                {isSelected && (
                  <MaterialIcons
                    name="check"
                    size={22}
                    color={theme.colors.accent.primary}
                  />
                )}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={closeButtonStyle}
            onPress={onClose}
            activeOpacity={0.7}>
            <Text style={closeButtonTextStyle}>Close</Text>
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
  sortOptionLast: {
    marginBottom: 0,
  },
  sortOptionText: {},
  modalCloseButton: {
    alignItems: 'center',
  },
  modalCloseButtonText: {},
});
