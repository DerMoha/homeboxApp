import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';

const STORAGE_KEY = '@add_item_fields';
const DEFAULT_FIELDS = [
  { id: 'name', label: 'Name', type: 'text', required: true, enabled: true },
  { id: 'quantity', label: 'Quantity', type: 'number', required: true, enabled: true },
  { id: 'description', label: 'Description', type: 'text', required: false, enabled: true },
  { id: 'purchasePrice', label: 'Purchase Price', type: 'number', required: false, enabled: false },
  { id: 'insured', label: 'Insured', type: 'boolean', required: false, enabled: false },
];

const AddItemSettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [fields, setFields] = useState(DEFAULT_FIELDS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (saved) {
        // Ensure all fields have an 'enabled' property
        let loaded = JSON.parse(saved);
        loaded = loaded.map((f: any, idx: number) => ({
          ...f,
          enabled: typeof f.enabled === 'boolean' ? f.enabled : DEFAULT_FIELDS[idx]?.enabled ?? true
        }));
        setFields(loaded);
      }
    });
  }, []);

  const handleToggle = (id: string) => {
    setFields(f => f.map(field => field.id === id ? { ...field, enabled: !field.enabled } : field));
  };
  const handleLabelChange = (id: string, label: string) => {
    setFields(f => f.map(field => field.id === id ? { ...field, label } : field));
  };

  const saveSettings = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
    Alert.alert('Saved', 'Add Item fields updated');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}> 
      <Text style={[styles.header, { color: theme.colors.text.primary }]}>Customize Add Item Fields</Text>
      {fields.map(field => (
        <View style={styles.fieldRow} key={field.id}>
          <TextInput
            style={[styles.labelInput, { color: theme.colors.text.primary, borderColor: theme.colors.border }]}
            value={field.label}
            onChangeText={text => handleLabelChange(field.id, text)}
          />
          <Text style={{ color: theme.colors.text.secondary, marginRight: 8 }}>Visible</Text>
          <Switch
            value={field.enabled}
            onValueChange={() => handleToggle(field.id)}
            trackColor={{ false: theme.colors.border, true: theme.colors.button.primary }}
            thumbColor={field.enabled ? theme.colors.button.primary : theme.colors.border}
          />
        </View>
      ))}
      <Button title="Save" onPress={saveSettings} color={theme.colors.button.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  labelInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    marginRight: 8,
    backgroundColor: 'transparent',
  },
});

export default AddItemSettingsScreen;
