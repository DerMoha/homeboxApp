import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/ThemeContext';

interface ErrorStateProps {
  error: string | Error;
  onRetry?: () => void;
  retryText?: string;
  icon?: string;
}

/**
 * Error state component with retry functionality
 *
 * @param error - Error message or Error object
 * @param onRetry - Optional callback for retry button
 * @param retryText - Optional custom retry button text (default: "Retry")
 * @param icon - Optional Material icon name (default: "error-outline")
 *
 * @example
 * <ErrorState error="Failed to load data" onRetry={loadData} />
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  retryText = 'Retry',
  icon = 'error-outline',
}) => {
  const { theme } = useTheme();

  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <MaterialIcons name={icon} size={64} color={theme.colors.error} />
      <Text style={[styles.errorText, { color: theme.colors.error }]}>
        {errorMessage}
      </Text>
      {onRetry && (
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.button.primary }]}
          onPress={onRetry}
        >
          <Text style={[styles.retryButtonText, { color: theme.colors.button.text }]}>
            {retryText}
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
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
