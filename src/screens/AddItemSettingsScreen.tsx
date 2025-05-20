import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Switch, 
  StyleSheet, 
  Alert,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';

const STORAGE_KEY = '@add_item_fields';
const IMAGE_QUALITY_KEY = '@image_quality';
const DEFAULT_IMAGE_QUALITY = 0.8; // 80% quality by default

const DEFAULT_FIELDS = [
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
        const parsedFields = JSON.parse(savedFields);
        // Ensure all default fields are present
        const updatedFields = DEFAULT_FIELDS.map(defaultField => {
          const savedField = parsedFields.find((f: any) => f.id === defaultField.id);
          return savedField || defaultField;
        });
        setFields(updatedFields);
      }

      if (savedQuality) {
        setImageQuality(parseFloat(savedQuality));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
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
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <View style={styles.header}>
        <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
          Customize which fields to show when adding new items
        </Text>
      </View>

      <ScrollView 
        style={[styles.scrollView, { backgroundColor: theme.colors.background.primary }]}
        contentContainerStyle={styles.contentContainer}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.section, { backgroundColor: theme.colors.background.secondary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Optional Fields</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>
            Choose which fields to display when adding new items
          </Text>
          {fields.map(field => (
            <View 
              style={[
                styles.fieldRow,
                { 
                  backgroundColor: theme.colors.background.primary,
                  borderColor: theme.colors.border,
                }
              ]} 
              key={field.id}
            >
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
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.background.secondary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Image Quality</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>
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

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.button.primary }]}
          onPress={saveSettings}
        >
          <Text style={[styles.saveButtonText, { color: theme.colors.button.text }]}>
            Save Settings
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    padding: 10,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerSubtitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  section: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
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
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
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
  saveButton: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddItemSettingsScreen;
