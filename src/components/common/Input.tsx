import React from 'react';
import {View, Text, TextInput, StyleSheet, TextInputProps} from 'react-native';
import {useTheme} from '../../theme/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  required = false,
  style,
  ...props
}) => {
  const {theme} = useTheme();

  return (
    <View style={styles.container}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: theme.colors.text.secondary,
              fontSize: theme.typography.sizes.sm,
              fontWeight: theme.typography.weights.medium,
              fontFamily: theme.typography.fonts.medium,
            },
          ]}>
          {label}
          {required && <Text style={{color: theme.colors.error}}> *</Text>}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.background.tertiary,
            color: theme.colors.text.primary,
            borderColor: error ? theme.colors.error : theme.colors.borderSubtle,
            fontSize: theme.typography.sizes.md,
            fontFamily: theme.typography.fonts.regular,
          },
          style,
        ]}
        placeholderTextColor={theme.colors.text.secondary}
        {...props}
      />
      {error && (
        <Text
          style={[
            styles.error,
            {
              color: theme.colors.error,
              fontSize: theme.typography.sizes.xs,
              fontFamily: theme.typography.fonts.regular,
            },
          ]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  error: {
    marginTop: 4,
  },
});
