import React, {useState} from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import {attachmentName} from '../../utils/attachmentNames';
import {Item} from '../../types';
import {openAttachment} from '../../services/attachmentService';
import ServerService from '../../services/serverService';
import {useTheme} from '../../theme/ThemeContext';
import {Button} from '../common/Button';
import {PhotoGallery} from './PhotoGallery';

export function AttachmentList({
  item,
  offline,
  onChanged,
}: {
  item: Item;
  offline: boolean;
  onChanged: () => void;
}) {
  const {theme} = useTheme();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const files = item.attachments || [];
  const perform = async (operation: () => Promise<void>) => {
    setBusy(true);
    try {
      await operation();
    } catch (error) {
      Alert.alert(
        'Attachment unavailable',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={styles.container}>
      <PhotoGallery
        itemId={item.id}
        photos={files.filter(file => file.type === 'photo')}
      />
      <Text
        accessibilityRole="header"
        style={{color: theme.colors.text.primary}}>
        Attachments ({files.length})
      </Text>
      {!files.length && (
        <Text style={{color: theme.colors.text.secondary}}>
          Edit this item to add photos, receipts, and manuals.
        </Text>
      )}
      {files.map(file => (
        <View key={file.id} style={styles.file}>
          <Text style={{color: theme.colors.text.primary}}>
            {attachmentName(file)}
            {file.primary ? ' · Primary photo' : ''}
          </Text>
          <Button
            title={`Open ${attachmentName(file)}`}
            variant="secondary"
            disabled={busy}
            onPress={() => perform(() => openAttachment(item.id, file))}
          />
          {file.type === 'photo' && !file.primary && (
            <Button
              title="Set as primary photo"
              variant="ghost"
              disabled={offline || busy}
              onPress={() =>
                perform(async () => {
                  const result =
                    await ServerService.getInstance().updateAttachment(
                      item.id,
                      file.id,
                      {primary: true, type: file.type, title: file.title},
                    );
                  if (!result.success) {
                    throw new Error(result.error);
                  }
                  onChanged();
                })
              }
            />
          )}
          <Button
            title="Rename attachment"
            variant="ghost"
            disabled={offline || busy}
            onPress={() => {
              setTitle(attachmentName(file));
              setEditing(file.id);
            }}
          />
          <Button
            title={`Remove ${attachmentName(file)}`}
            variant="danger"
            disabled={offline || busy}
            onPress={() =>
              Alert.alert(
                'Remove attachment?',
                'This removes the file from the server.',
                [
                  {text: 'Cancel', style: 'cancel'},
                  {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () =>
                      perform(async () => {
                        const result =
                          await ServerService.getInstance().deleteAttachment(
                            item.id,
                            file.id,
                          );
                        if (!result.success) {
                          throw new Error(result.error);
                        }
                        onChanged();
                      }),
                  },
                ],
              )
            }
          />
        </View>
      ))}
      <Modal
        visible={Boolean(editing)}
        onRequestClose={() => setEditing(null)}
        presentationStyle="pageSheet">
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          style={{backgroundColor: theme.colors.background.primary}}>
          <TextInput
            accessibilityLabel="Attachment title"
            value={title}
            onChangeText={setTitle}
            maxLength={255}
            style={{color: theme.colors.text.primary}}
          />
          <Button
            title="Save attachment title"
            disabled={busy || !title.trim()}
            onPress={() =>
              perform(async () => {
                const file = files.find(entry => entry.id === editing);
                if (!file) {
                  return;
                }
                const response =
                  await ServerService.getInstance().updateAttachment(
                    item.id,
                    file.id,
                    {
                      title: title.trim(),
                      type: file.type,
                      primary: file.primary,
                    },
                  );
                if (!response.success) {
                  throw new Error(response.error);
                }
                setEditing(null);
                onChanged();
              })
            }
          />
          <Button
            title="Cancel"
            variant="ghost"
            disabled={busy}
            onPress={() => setEditing(null)}
          />
        </ScrollView>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {padding: 16, gap: 12},
  file: {gap: 8, paddingVertical: 12},
});
