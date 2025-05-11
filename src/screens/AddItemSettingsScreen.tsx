import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';

const STORAGE_KEY = '@add_item_fields';
const DEFAULT_FIELDS = [
  { id: 'description', label: 'Description', enabled: true },
  { id: 'purchasePrice', label: 'Purchase Price', enabled: false },
  { id: 'insured', label: 'Insured', enabled: false },
  { id: 'labels', label: 'Labels', enabled: true },
];

const AddItemSettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [fields, setFields] = useState(DEFAULT_FIELDS);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedFields = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedFields) {
        const parsedFields = JSON.parse(savedFields);
        // Ensure all default fields are present
        const updatedFields = DEFAULT_FIELDS.map(defaultField => {
          const savedField = parsedFields.find((f: any) => f.id === defaultField.id);
          return savedField || defaultField;
        });
        setFields(updatedFields);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // If there's an error, use default fields
      setFields(DEFAULT_FIELDS);
    }
  };

  const handleToggle = (id: string) => {
    setFields(f => f.map(field => field.id === id ? { ...field, enabled: !field.enabled } : field));
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
      Alert.alert('Saved', 'Add Item fields updated');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}> 
      <Text style={[styles.header, { color: theme.colors.text.primary }]}>Customize Optional Fields</Text>
      {fields.map(field => (
        <View style={styles.fieldRow} key={field.id}>
          <Text style={[styles.fieldLabel, { color: theme.colors.text.primary }]}>{field.label}</Text>
          <View style={styles.switchContainer}>
            <Text style={[styles.switchLabel, { color: theme.colors.text.secondary }]}>Visible</Text>
            <Switch
              value={field.enabled}
              onValueChange={() => handleToggle(field.id)}
              trackColor={{ false: theme.colors.border, true: theme.colors.button.primary }}
              thumbColor={field.enabled ? theme.colors.button.primary : theme.colors.border}
            />
          </View>
        </View>
      ))}
      <View style={styles.buttonContainer}>
        <Text 
          style={[styles.saveButton, { color: theme.colors.button.primary }]}
          onPress={saveSettings}
        >
          Save Settings
        </Text>
      </View>
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
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    padding: 12,
  },
});

export default AddItemSettingsScreen;
