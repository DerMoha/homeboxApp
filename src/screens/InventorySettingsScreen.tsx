import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';

interface DisplayPreference {
  id: string;
  label: string;
  enabled: boolean;
}

const defaultPreferences: DisplayPreference[] = [
  { id: 'quantity', label: 'Quantity', enabled: true },
  { id: 'location', label: 'Location', enabled: true },
  { id: 'labels', label: 'Labels', enabled: true },
  { id: 'image', label: 'Image', enabled: true },
  { id: 'description', label: 'Description', enabled: true },
  { id: 'purchasePrice', label: 'Purchase Price', enabled: false },
  { id: 'insured', label: 'Insurance Status', enabled: false },
  { id: 'archived', label: 'Archive Status', enabled: false },
  { id: 'createdAt', label: 'Created Date', enabled: false },
  { id: 'updatedAt', label: 'Last Updated', enabled: false },
];

const InventorySettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [preferences, setPreferences] = useState<DisplayPreference[]>(defaultPreferences);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedPreferences = await AsyncStorage.getItem(STORAGE_KEYS.INVENTORY_DISPLAY_PREFERENCES);
      console.log('Loading preferences from storage:', savedPreferences);
      
      if (savedPreferences) {
        const parsedPreferences = JSON.parse(savedPreferences);
        console.log('Parsed preferences:', parsedPreferences);
        setPreferences(parsedPreferences);
        setIsFirstLoad(false);
      } else {
        console.log('No saved preferences, using defaults:', defaultPreferences);
        setPreferences(defaultPreferences);
        // Save default preferences only on first load
        if (isFirstLoad) {
          await AsyncStorage.setItem(STORAGE_KEYS.INVENTORY_DISPLAY_PREFERENCES, JSON.stringify(defaultPreferences));
          setIsFirstLoad(false);
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async (newPreferences: DisplayPreference[]) => {
    try {
      console.log('Saving preferences:', newPreferences);
      await AsyncStorage.setItem(STORAGE_KEYS.INVENTORY_DISPLAY_PREFERENCES, JSON.stringify(newPreferences));
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const resetToDefaults = async () => {
    try {
      console.log('Resetting to default preferences');
      await AsyncStorage.setItem(STORAGE_KEYS.INVENTORY_DISPLAY_PREFERENCES, JSON.stringify(defaultPreferences));
      setPreferences(defaultPreferences);
    } catch (error) {
      console.error('Error resetting preferences:', error);
    }
  };

  const togglePreference = (id: string) => {
    const newPreferences = preferences.map(pref => 
      pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
    );
    savePreferences(newPreferences);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Inventory Display</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>Customize which item attributes to display</Text>
      </View>

      <ScrollView 
        style={[styles.scrollView, { backgroundColor: theme.colors.background.primary }]}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.preferencesContainer}>
          {preferences.map((preference) => (
            <View 
              key={preference.id}
              style={[
                styles.preferenceItem,
                { 
                  backgroundColor: theme.colors.background.secondary,
                  borderColor: theme.colors.border
                }
              ]}
            >
              <Text style={[styles.preferenceLabel, { color: theme.colors.text.primary }]}>
                {preference.label}
              </Text>
              <Switch
                value={preference.enabled}
                onValueChange={() => togglePreference(preference.id)}
                trackColor={{ false: theme.colors.border, true: theme.colors.button.primary }}
                thumbColor={theme.colors.button.text}
              />
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: theme.colors.button.primary }]}
          onPress={resetToDefaults}
        >
          <Text style={[styles.resetButtonText, { color: theme.colors.button.text }]}>
            Reset to Default View
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
  header: {
    padding: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  contentContainer: {
    padding: 16,
  },
  preferencesContainer: {
    gap: 12,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  preferenceLabel: {
    fontSize: 16,
  },
  resetButton: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InventorySettingsScreen; 