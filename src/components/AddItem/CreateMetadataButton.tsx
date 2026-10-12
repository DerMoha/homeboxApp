import React, {useState} from 'react';
import {
  Modal,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {Button} from '../common/Button';
import {useTheme} from '../../theme/ThemeContext';
import ServerService from '../../services/serverService';
import {Label, Location} from '../../types';

type Props =
  | {kind: 'location'; onCreated: (location: Location) => void}
  | {kind: 'label'; onCreated: (label: Label) => void};
export function CreateMetadataButton(props: Props) {
  const {theme} = useTheme();
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [error, setError] = useState('');
  const open = async () => {
    setName('');
    setDescription('');
    setParentId('');
    setUncertain(false);
    setError('');
    setVisible(true);
    if (props.kind === 'location') {
      const response = await ServerService.getInstance().getLocations();
      setLocations(response.data?.locations || []);
    }
  };
  const submit = async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      const service = ServerService.getInstance();
      if (props.kind === 'location') {
        const response = await service.createLocation(
          name,
          description,
          parentId || null,
        );
        if (!response.success || !response.data) {
          setUncertain(Boolean(response.uncertain));
          throw new Error(response.error || 'Could not create location.');
        }
        props.onCreated(response.data);
      } else {
        const response = await service.createLabel(name, description);
        if (!response.success || !response.data) {
          setUncertain(Boolean(response.uncertain));
          throw new Error(response.error || 'Could not create label.');
        }
        props.onCreated(response.data);
      }
      setVisible(false);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not create. Try again when connected.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button title={`New ${props.kind}`} variant="secondary" onPress={open} />
      <Modal
        visible={visible}
        onRequestClose={() => {
          if (!busy) {
            setVisible(false);
          }
        }}
        animationType="slide"
        presentationStyle="pageSheet">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          style={{backgroundColor: theme.colors.background.primary}}>
          <Text
            accessibilityRole="header"
            style={{color: theme.colors.text.primary}}>
            New {props.kind}
          </Text>
          <TextInput
            accessibilityLabel={`${props.kind} name`}
            placeholder="Name"
            placeholderTextColor={theme.colors.text.secondary}
            value={name}
            onChangeText={setName}
            maxLength={255}
            style={[
              styles.input,
              {
                color: theme.colors.text.primary,
                borderColor: theme.colors.border,
              },
            ]}
          />
          <TextInput
            accessibilityLabel={`${props.kind} description`}
            placeholder="Description (optional)"
            placeholderTextColor={theme.colors.text.secondary}
            value={description}
            onChangeText={setDescription}
            maxLength={1000}
            multiline
            style={[
              styles.input,
              {
                color: theme.colors.text.primary,
                borderColor: theme.colors.border,
              },
            ]}
          />
          {props.kind === 'location' && (
            <>
              <Text style={{color: theme.colors.text.primary}}>
                Parent location
              </Text>
              <Picker
                accessibilityLabel="Parent location"
                selectedValue={parentId}
                onValueChange={setParentId}
                style={{color: theme.colors.text.primary}}>
                <Picker.Item label="No parent (top level)" value="" />
                {locations.map(location => (
                  <Picker.Item
                    key={location.id}
                    label={location.name}
                    value={location.id}
                  />
                ))}
              </Picker>
            </>
          )}
          {error ? (
            <Text
              accessibilityRole="alert"
              style={{color: theme.colors.text.primary}}>
              {error}
              {uncertain
                ? ' Check the server list before creating this again.'
                : ''}
            </Text>
          ) : null}
          <Button
            title={`Create ${props.kind}`}
            loading={busy}
            disabled={!name.trim() || uncertain}
            onPress={submit}
          />
          <Button
            title="Cancel"
            variant="ghost"
            disabled={busy}
            onPress={() => setVisible(false)}
          />
        </ScrollView>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  content: {padding: 24, gap: 16},
  input: {borderWidth: 1, borderRadius: 8, padding: 12, minHeight: 48},
});
