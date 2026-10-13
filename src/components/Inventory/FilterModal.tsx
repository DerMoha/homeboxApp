import React from 'react';
import {Text, Pressable, StyleSheet, View} from 'react-native';
import {Sheet} from '../common/Sheet';
import {Input} from '../common/Input';
import {Button} from '../common/Button';
import {useTheme} from '../../theme/ThemeContext';
import {
  FilterState,
  Location,
  Label,
  InsuranceFilter,
  DateRangeFilter,
} from '../../types';
interface Props {
  visible: boolean;
  filters: FilterState;
  locations: Location[];
  labels: Label[];
  onUpdateFilters: (updates: Partial<FilterState>) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
}
export const FilterModal = (props: Props) => {
  const {theme} = useTheme();
  const [locationQuery, setLocationQuery] = React.useState('');
  const [labelQuery, setLabelQuery] = React.useState('');
  const heading = (title: string) => (
    <Text
      accessibilityRole="header"
      style={[styles.heading, {color: theme.colors.text.primary}]}>
      {title}
    </Text>
  );
  const choice = (
    label: string,
    selected: boolean,
    onPress: () => void,
    multi = false,
  ) => (
    <Pressable
      key={label}
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={multi ? {checked: selected} : {selected}}
      onPress={onPress}
      style={[styles.choice, {borderColor: theme.colors.borderSubtle}]}>
      <Text style={{color: theme.colors.text.primary}}>{label}</Text>
      <Text style={{color: theme.colors.accent.primary}}>
        {selected ? '✓' : ''}
      </Text>
    </Pressable>
  );
  return (
    <Sheet title="Filter items" visible={props.visible} onClose={props.onClose}>
      {heading('Location')}
      <Input
        label="Find a location"
        value={locationQuery}
        onChangeText={setLocationQuery}
      />
      {choice('Any location', props.filters.locationId === null, () =>
        props.onUpdateFilters({locationId: null}),
      )}
      {props.locations
        .filter(l =>
          l.name
            .toLocaleLowerCase()
            .includes(locationQuery.toLocaleLowerCase()),
        )
        .map(l =>
          choice(l.name, props.filters.locationId === l.id, () =>
            props.onUpdateFilters({locationId: l.id}),
          ),
        )}
      {heading('Labels · match all selected')}
      <Input
        label="Find a label"
        value={labelQuery}
        onChangeText={setLabelQuery}
      />
      {props.labels
        .filter(l =>
          l.name.toLocaleLowerCase().includes(labelQuery.toLocaleLowerCase()),
        )
        .map(l =>
          choice(
            l.name,
            props.filters.labelIds.includes(l.id),
            () =>
              props.onUpdateFilters({
                labelIds: props.filters.labelIds.includes(l.id)
                  ? props.filters.labelIds.filter(id => id !== l.id)
                  : [...props.filters.labelIds, l.id],
              }),
            true,
          ),
        )}
      {heading('Insurance')}
      {(['all', 'insured', 'uninsured'] as InsuranceFilter[]).map(value =>
        choice(
          value === 'all' ? 'Any status' : value,
          props.filters.insuranceStatus === value,
          () => props.onUpdateFilters({insuranceStatus: value}),
        ),
      )}
      {heading('Quantity')}
      <View style={styles.range}>
        <View style={styles.field}>
          <Input
            label="Minimum"
            keyboardType="number-pad"
            value={
              props.filters.quantityMin === null
                ? ''
                : String(props.filters.quantityMin)
            }
            onChangeText={text =>
              props.onUpdateFilters({
                quantityMin: text.replace(/\D/g, '')
                  ? Number(text.replace(/\D/g, ''))
                  : null,
              })
            }
          />
        </View>
        <View style={styles.field}>
          <Input
            label="Maximum"
            keyboardType="number-pad"
            value={
              props.filters.quantityMax === null
                ? ''
                : String(props.filters.quantityMax)
            }
            onChangeText={text =>
              props.onUpdateFilters({
                quantityMax: text.replace(/\D/g, '')
                  ? Number(text.replace(/\D/g, ''))
                  : null,
              })
            }
          />
        </View>
      </View>
      {heading('Date added')}
      {(['all', 'week', 'month', 'quarter'] as DateRangeFilter[]).map(value =>
        choice(
          value === 'all' ? 'Any date' : `Last ${value}`,
          props.filters.dateRange === value,
          () => props.onUpdateFilters({dateRange: value}),
        ),
      )}
      <Button
        title="Apply filters"
        disabled={
          props.filters.quantityMin !== null &&
          props.filters.quantityMax !== null &&
          props.filters.quantityMin > props.filters.quantityMax
        }
        onPress={() => {
          props.onApply();
          props.onClose();
        }}
      />
      <Button title="Clear filters" variant="ghost" onPress={props.onClear} />
    </Sheet>
  );
};
const styles = StyleSheet.create({
  heading: {fontSize: 16, fontWeight: '600', marginTop: 12},
  choice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  range: {flexDirection: 'row', gap: 12},
  field: {flex: 1},
});
