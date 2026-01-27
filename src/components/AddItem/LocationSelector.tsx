import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../theme/ThemeContext';
import {Location} from '../../hooks/useItemData';

interface LocationSelectorProps {
  locations: Location[];
  selectedLocation: Location | null;
  onSelectLocation: (location: Location) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
}) => {
  const {theme} = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLocations = useMemo(() => {
    return locations.filter(location =>
      location.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [locations, searchQuery]);

  const sectionTitleStyle = useMemo(
    () => [styles.sectionTitle, {color: theme.colors.text.primary}],
    [theme.colors.text.primary],
  );

  const searchInputStyle = useMemo(
    () => [
      styles.searchInput,
      {
        backgroundColor: theme.colors.background.secondary,
        color: theme.colors.text.primary,
        borderColor: theme.colors.border,
      },
    ],
    [
      theme.colors.background.secondary,
      theme.colors.border,
      theme.colors.text.primary,
    ],
  );

  const locationListStyle = useMemo(
    () => [
      styles.locationList,
      {
        backgroundColor: theme.colors.background.secondary,
        borderColor: theme.colors.border,
      },
    ],
    [theme.colors.background.secondary, theme.colors.border],
  );

  const locationItemSelectedStyle = useMemo(
    () => ({backgroundColor: theme.colors.primary}),
    [theme.colors.primary],
  );

  const locationNameStyle = useMemo(
    () => [styles.locationName, {color: theme.colors.text.primary}],
    [theme.colors.text.primary],
  );

  const locationNameSelectedStyle = useMemo(
    () => [styles.locationName, {color: theme.colors.text.inverse}],
    [theme.colors.text.inverse],
  );

  const locationDescriptionStyle = useMemo(
    () => [styles.locationDescription, {color: theme.colors.text.secondary}],
    [theme.colors.text.secondary],
  );

  const locationDescriptionSelectedStyle = useMemo(
    () => [styles.locationDescription, styles.locationDescriptionSelected],
    [],
  );

  return (
    <View style={styles.section}>
      <Text style={sectionTitleStyle}>Location *</Text>

      <TextInput
        style={searchInputStyle}
        placeholder="Search locations..."
        placeholderTextColor={theme.colors.text.secondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <ScrollView style={locationListStyle} nestedScrollEnabled>
        {filteredLocations.map(location =>
          (() => {
            const isSelected = selectedLocation?.id === location.id;
            const locationItemStyle = isSelected
              ? [styles.locationItem, locationItemSelectedStyle]
              : styles.locationItem;
            const locationTextStyle = isSelected
              ? locationNameSelectedStyle
              : locationNameStyle;
            const descriptionStyle = isSelected
              ? locationDescriptionSelectedStyle
              : locationDescriptionStyle;
            return (
              <TouchableOpacity
                key={location.id}
                style={locationItemStyle}
                onPress={() => onSelectLocation(location)}>
                <View style={styles.locationInfo}>
                  <Text style={locationTextStyle}>{location.name}</Text>
                  {location.description && (
                    <Text style={descriptionStyle} numberOfLines={1}>
                      {location.description}
                    </Text>
                  )}
                </View>
                {isSelected && (
                  <MaterialIcons
                    name="check"
                    size={20}
                    color={theme.colors.text.inverse}
                  />
                )}
              </TouchableOpacity>
            );
          })(),
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  searchInput: {
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  locationList: {
    maxHeight: 200,
    borderRadius: 8,
    borderWidth: 1,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '500',
  },
  locationDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  locationDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
