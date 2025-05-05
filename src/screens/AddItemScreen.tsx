import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, SafeAreaView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import ServerService from '../services/serverService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default fields for adding an item
type AddItemField = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  enabled?: boolean;
};

const DEFAULT_FIELDS: AddItemField[] = [
  { id: 'name', label: 'Name', type: 'text', required: true, enabled: true },
  { id: 'quantity', label: 'Quantity', type: 'number', required: true, enabled: true },
  { id: 'description', label: 'Description', type: 'text', required: false, enabled: true },
  { id: 'purchasePrice', label: 'Purchase Price', type: 'number', required: false, enabled: false },
  { id: 'insured', label: 'Insured', type: 'boolean', required: false, enabled: false },
];

const STORAGE_KEY = '@add_item_fields';

import { useIsFocused } from '@react-navigation/native';

const AddItemScreen: React.FC = () => {
  const { theme } = useTheme();
  const isFocused = useIsFocused();
  const [fields, setFields] = useState<AddItemField[]>(DEFAULT_FIELDS);
  const [values, setValues] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // Reload fields from storage whenever this screen is focused
  React.useEffect(() => {
    if (isFocused) {
      AsyncStorage.getItem(STORAGE_KEY).then(saved => {
        if (saved) {
          setFields(JSON.parse(saved));
        } else {
          setFields(DEFAULT_FIELDS);
        }
      });
    }
  }, [isFocused]);

  const handleChange = (id: string, value: any) => {
    setValues((prev: any) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload: any = {};
      fields.forEach(f => {
        if (values[f.id] !== undefined && values[f.id] !== null && values[f.id] !== '') {
          payload[f.id] = f.type === 'number' ? Number(values[f.id]) : values[f.id];
        }
      });
      // POST /api/v1/items
      const service = ServerService.getInstance();
      const axiosInstance = service.getAxiosInstance();
      if (!axiosInstance) throw new Error('No active server connection');
      const res = await axiosInstance.post('/api/v1/items', payload);
      Alert.alert('Success', 'Item added successfully');
      setValues({});
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}> 
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Text style={[styles.header, { color: theme.colors.text.primary }]}>Add New Item</Text>
        {fields.filter(field => field.enabled).map(field => (
          <View style={styles.fieldContainer} key={field.id}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>{field.label}{field.required ? ' *' : ''}</Text>
            {field.type === 'boolean' ? (
              <Button
                title={values[field.id] ? 'Yes' : 'No'}
                onPress={() => handleChange(field.id, !values[field.id])}
                color={theme.colors.button.primary}
              />
            ) : (
              <TextInput
                style={[styles.input, { color: theme.colors.text.primary, borderColor: theme.colors.border }]}
                value={values[field.id] !== undefined ? String(values[field.id]) : ''}
                onChangeText={text => handleChange(field.id, text)}
                keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                placeholder={field.label}
                placeholderTextColor={theme.colors.text.secondary}
              />
            )}
          </View>
        ))}
        <Button
          title={loading ? 'Adding...' : 'Add Item'}
          onPress={handleSubmit}
          color={theme.colors.button.primary}
          disabled={loading}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: 'transparent',
  },
});

export default AddItemScreen;
