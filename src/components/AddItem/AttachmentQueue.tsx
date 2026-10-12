import React, {useState} from 'react';
import {Alert, Text, View, Image, StyleSheet} from 'react-native';
import {
  LocalAttachment,
  newAttachmentId,
  pickDocuments,
} from '../../services/attachmentService';
import {Button} from '../common/Button';
import {useTheme} from '../../theme/ThemeContext';

export function AttachmentQueue({
  attachments,
  onChange,
  imageUri,
  clearImage,
  disabled,
}: {
  attachments: LocalAttachment[];
  onChange: (files: LocalAttachment[]) => void;
  imageUri: string | null;
  clearImage: () => void;
  disabled: boolean;
}) {
  const {theme} = useTheme();
  const [picking, setPicking] = useState(false);
  const addDocuments = async (type: 'receipt' | 'manual' | 'attachment') => {
    setPicking(true);
    try {
      const files = await pickDocuments(type);
      onChange([...attachments, ...files]);
    } catch (error) {
      Alert.alert(
        'Attachment unavailable',
        error instanceof Error
          ? error.message
          : 'Try selecting the file again.',
      );
    } finally {
      setPicking(false);
    }
  };
  return (
    <View style={styles.container}>
      <Text
        accessibilityRole="header"
        style={{color: theme.colors.text.primary}}>
        Photos and documents
      </Text>
      {imageUri && (
        <Button
          title="Keep this photo and add another"
          disabled={disabled || picking}
          variant="secondary"
          onPress={() => {
            const id = newAttachmentId();
            onChange([
              ...attachments,
              {
                id,
                uri: imageUri,
                name: `photo-${attachments.length + 1}.jpg`,
                type: 'photo',
                mimeType: 'image/jpeg',
                primary: !attachments.some(a => a.type === 'photo'),
              },
            ]);
            clearImage();
          }}
        />
      )}
      <Button
        title="Add receipt"
        disabled={disabled || picking}
        variant="secondary"
        onPress={() => addDocuments('receipt')}
      />
      <Button
        title="Add manual"
        disabled={disabled || picking}
        variant="secondary"
        onPress={() => addDocuments('manual')}
      />
      <Button
        title="Add document"
        disabled={disabled || picking}
        variant="secondary"
        onPress={() => addDocuments('attachment')}
      />
      {attachments.map(file => (
        <View key={file.id} style={styles.file}>
          {file.type === 'photo' && !file.missing && (
            <Image
              accessible
              accessibilityLabel={file.name}
              source={{uri: file.uri}}
              style={styles.thumbnail}
            />
          )}
          <Text style={{color: theme.colors.text.primary}}>
            {file.name} · {file.type}
            {file.primary ? ' · Primary' : ''}
            {file.missing ? ' · File unavailable; select it again' : ''}
          </Text>
          {file.type === 'photo' && (
            <Button
              title={`Make ${file.name} primary`}
              disabled={disabled || picking || file.primary}
              variant="ghost"
              onPress={() =>
                onChange(
                  attachments.map(a => ({...a, primary: a.id === file.id})),
                )
              }
            />
          )}
          <Button
            title={`Remove ${file.name}`}
            disabled={disabled || picking}
            variant="ghost"
            onPress={() => onChange(attachments.filter(a => a.id !== file.id))}
          />
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {gap: 10, marginVertical: 16},
  file: {gap: 6},
  thumbnail: {width: 96, height: 96, borderRadius: 8},
});
