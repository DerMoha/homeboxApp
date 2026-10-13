import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {Input} from '../common/Input';
import {Button} from '../common/Button';
import {useTheme} from '../../theme/ThemeContext';
import ServerService from '../../services/serverService';
import {Location, Label} from '../../types';
export function MetadataForm({
  kind,
  onCreated,
  onCancel,
}: {
  kind: 'location' | 'label';
  onCreated: (value: Location | Label) => void;
  onCancel: () => void;
}) {
  const {theme} = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parent, setParent] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    if (kind === 'location') {
      ServerService.getInstance()
        .getLocations()
        .then(result => {
          if (active && result.success && result.data) {
            setLocations(result.data.locations);
          }
        });
    }
    return () => {
      active = false;
    };
  }, [kind]);
  const create = async () => {
    if (!name.trim() || busy || uncertain) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      const service = ServerService.getInstance();
      const result =
        kind === 'location'
          ? await service.createLocation(
              name.trim(),
              description,
              parent || null,
            )
          : await service.createLabel(name.trim(), description);
      if (!result.success || !result.data) {
        setUncertain(Boolean(result.uncertain));
        throw new Error(result.error || `Could not create ${kind}`);
      }
      onCreated(result.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <View>
      <Input
        label="Name"
        required
        value={name}
        onChangeText={setName}
        maxLength={255}
        editable={!busy && !uncertain}
      />
      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={1000}
        editable={!busy && !uncertain}
      />
      {kind === 'location' && (
        <>
          <Text style={{color: theme.colors.text.primary}}>
            Parent location
          </Text>
          <Picker
            accessibilityLabel="Parent location"
            selectedValue={parent}
            onValueChange={setParent}
            enabled={!busy && !uncertain}
            style={{color: theme.colors.text.primary}}
            dropdownIconColor={theme.colors.text.primary}>
            <Picker.Item label="No parent" value="" />
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
        <Text accessibilityRole="alert" style={{color: theme.colors.error}}>
          {error}
          {uncertain ? ' Check the server before creating again.' : ''}
        </Text>
      ) : null}
      <Button
        title={`Create ${kind}`}
        onPress={create}
        disabled={!name.trim() || uncertain}
        loading={busy}
      />
      <Button
        title="Cancel"
        onPress={onCancel}
        disabled={busy}
        variant="ghost"
      />
    </View>
  );
}
