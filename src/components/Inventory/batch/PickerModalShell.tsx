import React, {ReactNode, useMemo} from 'react';
import {Modal, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../../theme/ThemeContext';

interface PickerModalShellProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export const PickerModalShell: React.FC<PickerModalShellProps> = ({
  visible,
  title,
  onClose,
  children,
}) => {
  const {theme} = useTheme();

  const modalContentStyle = useMemo(
    () => [
      styles.modalContent,
      {
        backgroundColor: theme.colors.card.background,
        borderRadius: theme.borderRadius.xl,
        borderColor: theme.colors.card.border,
      },
      theme.shadows.lg,
    ],
    [theme],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
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
              {title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons
                name="close"
                size={24}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>
          </View>
          {children}
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
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%',
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {},
});
