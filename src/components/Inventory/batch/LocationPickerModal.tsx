import React, {useCallback, useMemo, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {Location} from '../../../types';
import {useTheme} from '../../../theme/ThemeContext';
import {hapticImpact} from '../../../utils/haptics';
import {PickerModalShell} from './PickerModalShell';

interface LocationPickerModalProps {
  visible: boolean;
  locations: Location[];
  onSelect: (locationId: string | null) => void;
  onClose: () => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  locations,
  onSelect,
  onClose,
}) => {
  const {theme} = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLocations = useMemo(
    () =>
      locations.filter(location =>
        location.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [locations, searchQuery],
  );

  const searchInputStyle = useMemo(
    () => [
      styles.searchInput,
      {
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.md,
        color: theme.colors.text.primary,
        borderColor: theme.colors.borderSubtle,
      },
    ],
    [theme],
  );

  const locationItemStyle = useMemo(
    () => [styles.locationItem, {borderBottomColor: theme.colors.borderSubtle}],
    [theme.colors.borderSubtle],
  );

  const handleSelect = useCallback(
    (locationId: string | null) => {
      hapticImpact('medium');
      setSearchQuery('');
      onSelect(locationId);
    },
    [onSelect],
  );

  const handleClose = useCallback(() => {
    setSearchQuery('');
    onClose();
  }, [onClose]);

  return (
    <PickerModalShell
      visible={visible}
      title="Move Items"
      onClose={handleClose}>
      <TextInput
        style={searchInputStyle}
        placeholder="Search locations..."
        placeholderTextColor={theme.colors.text.tertiary}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <ScrollView
        style={styles.locationList}
        showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={locationItemStyle}
          onPress={() => handleSelect(null)}>
          <MaterialIcons
            name="inventory-2"
            size={20}
            color={theme.colors.text.secondary}
          />
          <Text
            style={[
              styles.locationText,
              {
                color: theme.colors.text.primary,
                fontSize: theme.typography.sizes.md,
                fontFamily: theme.typography.fonts.medium,
              },
            ]}>
            No Location
          </Text>
        </TouchableOpacity>
        {filteredLocations.map(location => (
          <TouchableOpacity
            key={location.id}
            style={locationItemStyle}
            onPress={() => handleSelect(location.id)}>
            <MaterialIcons
              name="location-on"
              size={20}
              color={theme.colors.accent.primary}
            />
            <Text
              style={[
                styles.locationText,
                {
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.sizes.md,
                  fontFamily: theme.typography.fonts.medium,
                },
              ]}>
              {location.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </PickerModalShell>
  );
};

const styles = StyleSheet.create({
  searchInput: {
    height: 44,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  locationList: {
    maxHeight: 300,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  locationText: {},
});
