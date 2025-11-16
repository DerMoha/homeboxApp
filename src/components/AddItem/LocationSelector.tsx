import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/ThemeContext';
import { Location } from '../../hooks/useItemData';

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
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLocations = useMemo(() => {
    return locations.filter(location =>
      location.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [locations, searchQuery]);

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
        Location *
      </Text>

      <TextInput
        style={[styles.searchInput, {
          backgroundColor: theme.colors.background.secondary,
          color: theme.colors.text.primary,
          borderColor: theme.colors.border,
        }]}
        placeholder="Search locations..."
        placeholderTextColor={theme.colors.text.secondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <ScrollView
        style={[styles.locationList, {
          backgroundColor: theme.colors.background.secondary,
          borderColor: theme.colors.border,
        }]}
        nestedScrollEnabled
      >
        {filteredLocations.map(location => (
          <TouchableOpacity
            key={location.id}
            style={[
              styles.locationItem,
              {
                backgroundColor: selectedLocation?.id === location.id
                  ? theme.colors.primary
                  : 'transparent',
              },
            ]}
            onPress={() => onSelectLocation(location)}
          >
            <View style={styles.locationInfo}>
              <Text
                style={[
                  styles.locationName,
                  {
                    color: selectedLocation?.id === location.id
                      ? '#FFFFFF'
                      : theme.colors.text.primary,
                  },
                ]}
              >
                {location.name}
              </Text>
              {location.description && (
                <Text
                  style={[
                    styles.locationDescription,
                    {
                      color: selectedLocation?.id === location.id
                        ? 'rgba(255, 255, 255, 0.8)'
                        : theme.colors.text.secondary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {location.description}
                </Text>
              )}
            </View>
            {selectedLocation?.id === location.id && (
              <MaterialIcons name="check" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        ))}
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
});
