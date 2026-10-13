import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../theme/ThemeContext';
import {Button} from './Button';
export function Sheet({
  visible,
  title,
  onClose,
  children,
  scrollable = true,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  scrollable?: boolean;
}) {
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel={`Close ${title}`}
          onPress={onClose}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.background.primary,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}>
          <View style={styles.heading}>
            <Text
              accessibilityRole="header"
              style={[styles.title, {color: theme.colors.text.primary}]}>
              {title}
            </Text>
            <Button
              title="Close"
              variant="ghost"
              size="small"
              onPress={onClose}
            />
          </View>
          {scrollable ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.content}>
              {children}
            </ScrollView>
          ) : (
            children
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    maxHeight: '90%',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  title: {fontSize: 22, fontWeight: '600', flex: 1},
  content: {gap: 8, paddingBottom: 8},
});
