import React, {useState} from 'react';
import {
  FlatList,
  Keyboard,
  Pressable,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import {useTheme} from '../../theme/ThemeContext';
import {Location} from '../../types';
import {Sheet} from '../common/Sheet';
import {Input} from '../common/Input';
import {Button} from '../common/Button';
import {MetadataForm} from './MetadataForm';
interface Props {
  compact?: boolean;
  locations: Location[];
  selectedLocation: Location | null;
  onSelectLocation: (location: Location) => void;
  onLocationCreated?: () => void;
}
export const LocationSelector = ({
  locations,
  selectedLocation,
  onSelectLocation,
  onLocationCreated,
}: Props) => {
  const {theme} = useTheme();
  const [visible, setVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const close = () => {
    Keyboard.dismiss();
    setVisible(false);
    setCreating(false);
    setQuery('');
  };
  return (
    <>
      <Button
        title={selectedLocation ? selectedLocation.name : 'Choose location'}
        icon="place"
        variant="secondary"
        onPress={() => setVisible(true)}
      />
      <Sheet
        visible={visible}
        title={creating ? 'New location' : 'Choose location'}
        onClose={close}
        scrollable={creating}>
        {creating ? (
          <MetadataForm
            kind="location"
            onCancel={() => setCreating(false)}
            onCreated={value => {
              onSelectLocation(value as Location);
              onLocationCreated?.();
              close();
            }}
          />
        ) : (
          <View style={styles.body}>
            <Input
              label="Search locations"
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            <FlatList
              style={styles.list}
              data={locations.filter(location =>
                location.name
                  .toLocaleLowerCase()
                  .includes(query.toLocaleLowerCase()),
              )}
              keyExtractor={location => location.id}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={{color: theme.colors.text.secondary}}>
                  No matching locations
                </Text>
              }
              renderItem={({item}) => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{
                    selected: selectedLocation?.id === item.id,
                  }}
                  onPress={() => {
                    onSelectLocation(item);
                    close();
                  }}
                  style={[
                    styles.row,
                    {borderColor: theme.colors.borderSubtle},
                  ]}>
                  <View style={styles.text}>
                    <Text style={{color: theme.colors.text.primary}}>
                      {item.name}
                    </Text>
                    {item.description ? (
                      <Text style={{color: theme.colors.text.secondary}}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                  {selectedLocation?.id === item.id ? (
                    <Text style={{color: theme.colors.accent.primary}}>✓</Text>
                  ) : null}
                </Pressable>
              )}
            />
            <Button
              title="New location"
              icon="add"
              variant="ghost"
              onPress={() => {
                Keyboard.dismiss();
                setCreating(true);
              }}
            />
          </View>
        )}
      </Sheet>
    </>
  );
};
const styles = StyleSheet.create({
  body: {flexShrink: 1},
  list: {height: 240, flexGrow: 0, flexShrink: 1},
  row: {
    minHeight: 52,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  text: {flex: 1},
});
