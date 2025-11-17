import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/ThemeContext';

interface EmptyStateProps {
  message: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  subtitle?: string;
}

/**
 * Empty state component for when no data is available
 *
 * @param message - Main message to display
 * @param icon - Optional Material icon name (default: "inbox")
 * @param actionLabel - Optional action button label
 * @param onAction - Optional action button callback
 * @param subtitle - Optional subtitle text
 *
 * @example
 * <EmptyState
 *   message="No items found"
 *   subtitle="Add your first item to get started"
 *   icon="add-circle-outline"
 *   actionLabel="Add Item"
 *   onAction={() => navigation.navigate('AddItem')}
 * />
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  icon = 'inbox',
  actionLabel,
  onAction,
  subtitle,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <MaterialIcons
        name={icon}
        size={80}
        color={theme.colors.text.secondary}
        style={styles.icon}
      />
      <Text style={[styles.message, { color: theme.colors.text.primary }]}>
        {message}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.button.primary }]}
          onPress={onAction}
        >
          <Text style={[styles.actionButtonText, { color: theme.colors.button.text }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
