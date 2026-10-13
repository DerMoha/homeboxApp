import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../theme/ThemeContext';
import {Button} from './Button';
export const ErrorState = ({
  error,
  onRetry,
  retryText = 'Try again',
  icon = 'error-outline',
}: {
  error: string | Error;
  onRetry?: () => void;
  retryText?: string;
  icon?: string;
}) => {
  const {theme} = useTheme();
  return (
    <View style={styles.container}>
      <MaterialIcons name={icon} size={32} color={theme.colors.error} />
      <Text
        accessibilityRole="alert"
        style={[styles.text, {color: theme.colors.text.primary}]}>
        {error instanceof Error ? error.message : error}
      </Text>
      {onRetry ? (
        <Button
          title={retryText}
          variant="secondary"
          size="small"
          onPress={onRetry}
        />
      ) : null}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {padding: 24, gap: 12, alignItems: 'center'},
  text: {textAlign: 'center', fontSize: 16},
});
