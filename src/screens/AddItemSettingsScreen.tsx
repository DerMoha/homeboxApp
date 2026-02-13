import React, {useState, useEffect} from 'react';
import {View, Text, Switch, StyleSheet, Alert, ScrollView} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';
import {useTheme} from '../theme/ThemeContext';
import {Button} from '../components/common/Button';
import {logger} from '../utils/logger';
import {storageService, STORAGE_KEYS} from '../services/storageService';

const DEFAULT_IMAGE_QUALITY = 0.8;

interface FieldConfig {
  id: string;
  label: string;
  enabled: boolean;
}

const DEFAULT_FIELDS: FieldConfig[] = [
  {id: 'description', label: 'Description', enabled: true},
  {id: 'purchasePrice', label: 'Purchase Price', enabled: false},
  {id: 'insured', label: 'Insured', enabled: false},
  {id: 'labels', label: 'Labels', enabled: true},
];

const FIELD_ICONS: Record<string, string> = {
  description: 'notes',
  purchasePrice: 'attach-money',
  insured: 'verified',
  labels: 'label',
};

const AddItemSettingsScreen: React.FC = () => {
  const {theme} = useTheme();
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [imageQuality, setImageQuality] = useState(DEFAULT_IMAGE_QUALITY);
  const qualityPercent = Math.round(imageQuality * 100);

  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.colors.background.secondary,
      borderColor: theme.colors.borderSubtle,
      borderRadius: theme.borderRadius.lg,
    },
    theme.shadows.sm,
  ];

  const cardStyleWithMargin = [...cardStyle, {marginTop: theme.spacing.lg}];
  const headerIconStyle = [
    styles.headerIcon,
    {
      backgroundColor: theme.colors.background.secondary,
      borderColor: theme.colors.borderSubtle,
    },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedFields = await storageService.getItem<FieldConfig[]>(
        STORAGE_KEYS.ADD_ITEM_FIELDS,
      );
      const savedQuality = await storageService.getItem<number>(
        STORAGE_KEYS.IMAGE_QUALITY,
      );

      if (savedFields) {
        const updatedFields = DEFAULT_FIELDS.map(defaultField => {
          const savedField = savedFields.find(
            field => field.id === defaultField.id,
          );
          return savedField || defaultField;
        });
        setFields(updatedFields);
      }

      if (typeof savedQuality === 'number') {
        setImageQuality(savedQuality);
      }
    } catch (error) {
      logger.error('Error loading settings:', {error});
      setFields(DEFAULT_FIELDS);
      setImageQuality(DEFAULT_IMAGE_QUALITY);
    }
  };

  const handleToggle = (id: string) => {
    setFields(current =>
      current.map(field =>
        field.id === id ? {...field, enabled: !field.enabled} : field,
      ),
    );
  };

  const handleQualityChange = (value: number) => {
    setImageQuality(value);
  };

  const saveSettings = async () => {
    try {
      await storageService.setItem(STORAGE_KEYS.ADD_ITEM_FIELDS, fields);
      await storageService.setItem(STORAGE_KEYS.IMAGE_QUALITY, imageQuality);
      Alert.alert('Saved', 'Settings updated successfully');
    } catch (error) {
      logger.error('Error saving settings:', {error});
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  return (
    <ScrollView
      style={[
        styles.container,
        {backgroundColor: theme.colors.background.primary},
      ]}
      contentContainerStyle={[
        styles.content,
        {paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.xl},
      ]}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={headerIconStyle}>
          <MaterialIcons
            name="tune"
            size={20}
            color={theme.colors.accent.primary}
          />
        </View>
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.text.primary,
              fontSize: theme.typography.sizes.xl,
              fontWeight: theme.typography.weights.semibold,
              fontFamily: theme.typography.fonts.semibold,
            },
          ]}>
          Item Settings
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              color: theme.colors.text.secondary,
              fontFamily: theme.typography.fonts.regular,
            },
          ]}>
          Choose which optional fields appear when creating items.
        </Text>
      </View>

      <View style={cardStyle}>
        <View style={styles.cardHeader}>
          <MaterialIcons
            name="view-list"
            size={16}
            color={theme.colors.accent.primary}
          />
          <Text
            style={[
              styles.cardTitle,
              {
                color: theme.colors.text.primary,
                fontSize: theme.typography.sizes.sm,
                fontWeight: theme.typography.weights.semibold,
                fontFamily: theme.typography.fonts.semibold,
                letterSpacing: theme.typography.letterSpacing.normal,
              },
            ]}>
            Optional fields
          </Text>
        </View>
        {fields.map((field, index) => (
          <View
            key={field.id}
            style={[
              styles.fieldRow,
              {borderBottomColor: theme.colors.borderSubtle},
              index === fields.length - 1 && styles.fieldRowLast,
            ]}>
            <View style={styles.fieldLabelRow}>
              <View
                style={[
                  styles.fieldIcon,
                  {
                    backgroundColor: theme.colors.background.tertiary,
                    borderRadius: theme.borderRadius.sm,
                  },
                ]}>
                <MaterialIcons
                  name={FIELD_ICONS[field.id] ?? 'tune'}
                  size={16}
                  color={theme.colors.text.secondary}
                />
              </View>
              <Text
                style={[
                  styles.fieldLabel,
                  {
                    color: theme.colors.text.primary,
                    fontSize: theme.typography.sizes.md,
                    fontFamily: theme.typography.fonts.medium,
                  },
                ]}>
                {field.label}
              </Text>
            </View>
            <Switch
              value={field.enabled}
              onValueChange={() => handleToggle(field.id)}
              trackColor={{
                false: theme.colors.borderSubtle,
                true: theme.colors.accent.primary,
              }}
              thumbColor={
                field.enabled
                  ? theme.colors.accent.primary
                  : theme.colors.background.primary
              }
            />
          </View>
        ))}
      </View>

      <View style={cardStyleWithMargin}>
        <View style={styles.qualityHeader}>
          <View style={styles.qualityTitleRow}>
            <MaterialIcons
              name="photo"
              size={16}
              color={theme.colors.accent.primary}
            />
            <View>
              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: theme.colors.text.primary,
                    fontSize: theme.typography.sizes.sm,
                    fontWeight: theme.typography.weights.semibold,
                    fontFamily: theme.typography.fonts.semibold,
                  },
                ]}>
                Image Quality
              </Text>
              <Text
                style={[
                  styles.qualitySubtitle,
                  {
                    color: theme.colors.text.secondary,
                    fontFamily: theme.typography.fonts.regular,
                  },
                ]}>
                Balance clarity and storage size.
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.qualityBadge,
              {
                backgroundColor: theme.colors.accent.muted,
                borderRadius: theme.borderRadius.full,
                borderColor: theme.colors.borderSubtle,
                borderWidth: StyleSheet.hairlineWidth,
              },
            ]}>
            <Text
              style={[
                styles.qualityBadgeText,
                {
                  color: theme.colors.accent.primary,
                  fontFamily: theme.typography.fonts.semibold,
                },
              ]}>
              {qualityPercent}%
            </Text>
          </View>
        </View>

        <Slider
          style={styles.slider}
          minimumValue={0.1}
          maximumValue={1}
          step={0.1}
          value={imageQuality}
          onValueChange={handleQualityChange}
          minimumTrackTintColor={theme.colors.accent.primary}
          maximumTrackTintColor={theme.colors.borderSubtle}
          thumbTintColor={theme.colors.accent.primary}
        />
        <View style={styles.qualityRange}>
          <Text
            style={[
              styles.qualityRangeText,
              {
                color: theme.colors.text.tertiary,
                fontFamily: theme.typography.fonts.regular,
              },
            ]}>
            Smaller
          </Text>
          <Text
            style={[
              styles.qualityRangeText,
              {
                color: theme.colors.text.tertiary,
                fontFamily: theme.typography.fonts.regular,
              },
            ]}>
            Higher quality
          </Text>
        </View>
      </View>

      <View style={[styles.actions, {marginTop: theme.spacing.xl}]}>
        <Button
          title="Save Settings"
          icon="save"
          onPress={saveSettings}
          fullWidth
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 12,
  },
  header: {
    marginTop: 8,
    marginBottom: 20,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    textTransform: 'none',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fieldRowLast: {
    borderBottomWidth: 0,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fieldIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontWeight: '500',
  },
  qualityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  qualityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qualitySubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  qualityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  qualityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  slider: {
    height: 40,
  },
  qualityRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  qualityRangeText: {
    fontSize: 12,
  },
  actions: {
    paddingBottom: 16,
  },
});

export default AddItemSettingsScreen;
