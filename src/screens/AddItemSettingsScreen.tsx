import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { logger } from '../utils/logger';

const STORAGE_KEY = '@add_item_fields';
const IMAGE_QUALITY_KEY = '@image_quality';
const DEFAULT_IMAGE_QUALITY = 0.8; // 80% quality by default

interface FieldConfig {
  id: string;
  label: string;
  enabled: boolean;
}

const DEFAULT_FIELDS: FieldConfig[] = [
  { id: 'description', label: 'Description', enabled: true },
  { id: 'purchasePrice', label: 'Purchase Price', enabled: false },
  { id: 'insured', label: 'Insured', enabled: false },
  { id: 'labels', label: 'Labels', enabled: true },
];

const AddItemSettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [imageQuality, setImageQuality] = useState(DEFAULT_IMAGE_QUALITY);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedFields = await AsyncStorage.getItem(STORAGE_KEY);
      const savedQuality = await AsyncStorage.getItem(IMAGE_QUALITY_KEY);

      if (savedFields) {
        const parsedFields: FieldConfig[] = JSON.parse(savedFields);
        // Ensure all default fields are present
        const updatedFields = DEFAULT_FIELDS.map(defaultField => {
          const savedField = parsedFields.find((f: FieldConfig) => f.id === defaultField.id);
          return savedField || defaultField;
        });
        setFields(updatedFields);
      }

      if (savedQuality) {
        setImageQuality(parseFloat(savedQuality));
      }
    } catch (error) {
      logger.error('Error loading settings:', error);
      // If there's an error, use default values
      setFields(DEFAULT_FIELDS);
      setImageQuality(DEFAULT_IMAGE_QUALITY);
    }
  };

  const handleToggle = (id: string) => {
    setFields(f => f.map(field => field.id === id ? { ...field, enabled: !field.enabled } : field));
  };

  const handleQualityChange = (value: number) => {
    setImageQuality(value);
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
      await AsyncStorage.setItem(IMAGE_QUALITY_KEY, imageQuality.toString());
      Alert.alert('Saved', 'Settings updated successfully');
    } catch (error) {
      logger.error('Error saving settings:', error);
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

      {/* Image Quality Section */}
      <View style={styles.qualitySection}>
        <Text style={[styles.qualityHeader, { color: theme.colors.text.primary }]}>Image Quality</Text>
        <Text style={[styles.qualityDescription, { color: theme.colors.text.secondary }]}>
          Adjust the quality of uploaded images to save storage space
        </Text>
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0.1}
            maximumValue={1}
            step={0.1}
            value={imageQuality}
            onValueChange={handleQualityChange}
            minimumTrackTintColor={theme.colors.button.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.button.primary}
          />
          <Text style={[styles.qualityValue, { color: theme.colors.text.primary }]}>
            {Math.round(imageQuality * 100)}%
          </Text>
        </View>
      </View>

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
  qualitySection: {
    marginTop: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  qualityHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  qualityDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  qualityValue: {
    fontSize: 16,
    fontWeight: '500',
    minWidth: 48,
    textAlign: 'right',
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
