import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {useTheme} from '../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {STORAGE_KEYS} from '../constants/storage';
import {logger} from '../utils/logger';

interface DisplayPreference {
  id: string;
  label: string;
  enabled: boolean;
  isCore?: boolean;
}

const defaultPreferences: DisplayPreference[] = [
  {id: 'quantity', label: 'Quantity', enabled: true, isCore: true},
  {id: 'description', label: 'Description', enabled: true, isCore: true},
  {id: 'location', label: 'Location', enabled: true, isCore: true},
  {id: 'labels', label: 'Labels', enabled: true},
  {id: 'image', label: 'Image', enabled: true},
  {id: 'purchasePrice', label: 'Purchase Price', enabled: false},
  {id: 'insured', label: 'Insurance Status', enabled: false},
  {id: 'archived', label: 'Archive Status', enabled: false},
  {id: 'createdAt', label: 'Created Date', enabled: false},
  {id: 'updatedAt', label: 'Last Updated', enabled: false},
];

const InventorySettingsScreen: React.FC = () => {
  const {theme} = useTheme();
  const [preferences, setPreferences] =
    useState<DisplayPreference[]>(defaultPreferences);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  const preferenceItemBaseStyle = useMemo(
    () => [
      styles.preferenceItem,
      {
        backgroundColor: theme.colors.background.secondary,
        borderColor: theme.colors.border,
      },
    ],
    [theme.colors.background.secondary, theme.colors.border],
  );

  const dragHandleDotStyle = useMemo(
    () => [
      styles.dragHandleDots,
      {backgroundColor: theme.colors.text.secondary},
    ],
    [theme.colors.text.secondary],
  );

  const getPreferenceItemStyle = useCallback(
    (isDragged: boolean) => [
      preferenceItemBaseStyle,
      isDragged ? styles.preferenceItemDragged : styles.preferenceItemIdle,
    ],
    [preferenceItemBaseStyle],
  );

  const loadPreferences = useCallback(async () => {
    try {
      const savedPreferences = await AsyncStorage.getItem(
        STORAGE_KEYS.INVENTORY_DISPLAY_PREFERENCES,
      );
      logger.log('Loading preferences from storage:', savedPreferences);

      if (savedPreferences) {
        const parsedPreferences = JSON.parse(savedPreferences);
        // Ensure core preferences are in the correct order
        const corePreferences = defaultPreferences.filter(p => p.isCore);
        const nonCorePreferences = parsedPreferences.filter(
          (p: DisplayPreference) => !p.isCore,
        );
        const mergedPreferences = [...corePreferences, ...nonCorePreferences];
        logger.log('Loaded preferences:', mergedPreferences);
        setPreferences(mergedPreferences);
        setIsFirstLoad(false);
      } else {
        logger.log('No saved preferences, using defaults:', defaultPreferences);
        setPreferences(defaultPreferences);
        if (isFirstLoad) {
          await AsyncStorage.setItem(
            STORAGE_KEYS.INVENTORY_DISPLAY_PREFERENCES,
            JSON.stringify(defaultPreferences),
          );
          setIsFirstLoad(false);
        }
      }
    } catch (error) {
      logger.error('Error loading preferences:', error);
    }
  }, [isFirstLoad]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const savePreferences = async (newPreferences: DisplayPreference[]) => {
    try {
      logger.log('Saving preferences:', newPreferences);
      await AsyncStorage.setItem(
        STORAGE_KEYS.INVENTORY_DISPLAY_PREFERENCES,
        JSON.stringify(newPreferences),
      );
      setPreferences(newPreferences);
    } catch (error) {
      logger.error('Error saving preferences:', error);
    }
  };

  const resetToDefaults = async () => {
    try {
      logger.log('Resetting to default preferences');
      await AsyncStorage.setItem(
        STORAGE_KEYS.INVENTORY_DISPLAY_PREFERENCES,
        JSON.stringify(defaultPreferences),
      );
      setPreferences(defaultPreferences);
    } catch (error) {
      logger.error('Error resetting preferences:', error);
    }
  };

  const togglePreference = (id: string) => {
    const newPreferences = preferences.map(pref =>
      pref.id === id ? {...pref, enabled: !pref.enabled} : pref,
    );
    savePreferences(newPreferences);
  };

  const handleDragStart = (index: number) => {
    if (!preferences[index].isCore) {
      setDraggedItem(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: theme.colors.background.primary},
      ]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, {color: theme.colors.text.primary}]}>
          Inventory Display
        </Text>
        <Text
          style={[styles.headerSubtitle, {color: theme.colors.text.secondary}]}>
          Customize which item attributes to display and their order
        </Text>
      </View>

      <ScrollView
        style={[
          styles.scrollView,
          {backgroundColor: theme.colors.background.primary},
        ]}
        contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, {color: theme.colors.text.primary}]}>
            Core Attributes
          </Text>
          <Text
            style={[
              styles.sectionSubtitle,
              {color: theme.colors.text.secondary},
            ]}>
            Essential information that cannot be reordered and should stay
            toggled on
          </Text>
          <View style={styles.preferencesContainer}>
            {preferences
              .filter(p => p.isCore)
              .map(preference => (
                <View
                  key={preference.id}
                  style={[
                    styles.preferenceItem,
                    {
                      backgroundColor: theme.colors.background.secondary,
                      borderColor: theme.colors.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.preferenceLabel,
                      {color: theme.colors.text.primary},
                    ]}>
                    {preference.label}
                  </Text>
                  <Switch
                    value={preference.enabled}
                    onValueChange={() => togglePreference(preference.id)}
                    trackColor={{
                      false: theme.colors.border,
                      true: theme.colors.button.primary,
                    }}
                    thumbColor={theme.colors.button.text}
                  />
                </View>
              ))}
          </View>
        </View>

        <View style={styles.additionalAttributesSection}>
          <Text
            style={[styles.sectionTitle, {color: theme.colors.text.primary}]}>
            Additional Attributes
          </Text>
          <Text
            style={[
              styles.sectionSubtitle,
              {color: theme.colors.text.secondary},
            ]}>
            Optional information that can be reordered
          </Text>
          <View style={styles.preferencesContainer}>
            {preferences
              .filter(p => !p.isCore)
              .map((preference, index) =>
                (() => {
                  const isDragged = draggedItem === index;
                  return (
                    <Animated.View
                      key={preference.id}
                      style={getPreferenceItemStyle(isDragged)}>
                      <TouchableOpacity
                        style={styles.dragHandle}
                        onPressIn={() => handleDragStart(index)}
                        onPressOut={handleDragEnd}>
                        <View style={dragHandleDotStyle} />
                        <View style={dragHandleDotStyle} />
                      </TouchableOpacity>
                      <Text
                        style={[
                          styles.preferenceLabel,
                          {color: theme.colors.text.primary},
                        ]}>
                        {preference.label}
                      </Text>
                      <Switch
                        value={preference.enabled}
                        onValueChange={() => togglePreference(preference.id)}
                        trackColor={{
                          false: theme.colors.border,
                          true: theme.colors.button.primary,
                        }}
                        thumbColor={theme.colors.button.text}
                      />
                    </Animated.View>
                  );
                })(),
              )}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.resetButton,
            {backgroundColor: theme.colors.button.primary},
          ]}
          onPress={resetToDefaults}>
          <Text
            style={[styles.resetButtonText, {color: theme.colors.button.text}]}>
            Reset to Default View
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  section: {
    marginBottom: 16,
  },
  additionalAttributesSection: {
    marginTop: 24,
    marginBottom: 16,
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
  preferenceItemIdle: {
    opacity: 1,
    transform: [{translateY: 0}],
  },
  preferenceItemDragged: {
    opacity: 0.5,
    transform: [{translateY: 10}],
  },
  dragHandle: {
    marginRight: 12,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragHandleDots: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginVertical: 2,
  },
  preferenceLabel: {
    fontSize: 16,
    flex: 1,
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
