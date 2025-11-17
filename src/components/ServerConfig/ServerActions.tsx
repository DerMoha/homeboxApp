import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from '../common';

interface ServerActionsProps {
  onTest: () => void;
  onSave: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
  isSaving?: boolean;
  canDelete?: boolean;
}

export const ServerActions: React.FC<ServerActionsProps> = ({
  onTest,
  onSave,
  onDelete,
  isLoading = false,
  isSaving = false,
  canDelete = false,
}) => {
  const isProcessing = isLoading || isSaving;

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <View style={styles.buttonWrapper}>
          <Button
            title="Test Connection"
            onPress={onTest}
            variant="secondary"
            size="medium"
            loading={isLoading}
            disabled={isProcessing}
            fullWidth
          />
        </View>

        <View style={styles.buttonWrapper}>
          <Button
            title="Save Server"
            onPress={onSave}
            variant="primary"
            size="medium"
            loading={isSaving}
            disabled={isProcessing}
            fullWidth
          />
        </View>
      </View>

      {canDelete && onDelete && (
        <View style={styles.deleteButtonWrapper}>
          <Button
            title="Delete Server"
            onPress={onDelete}
            variant="danger"
            size="medium"
            fullWidth
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonWrapper: {
    flex: 1,
  },
  deleteButtonWrapper: {
    marginTop: 12,
  },
});
