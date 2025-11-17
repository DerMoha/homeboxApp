import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
}

/**
 * Loading state component with spinner and optional message
 *
 * @param message - Optional loading message to display
 * @param size - Size of the spinner (default: "large")
 *
 * @example
 * <LoadingState message="Loading items..." />
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  size = 'large',
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <ActivityIndicator size={size} color={theme.colors.primary} />
      {message && (
        <Text style={[styles.message, { color: theme.colors.text.secondary }]}>
          {message}
        </Text>
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
  message: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});
