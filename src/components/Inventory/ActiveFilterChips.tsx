import React from 'react';
import {ScrollView, Pressable, Text, StyleSheet} from 'react-native';
import {FilterState, Location, Label} from '../../types';
import {ReviewList} from '../../services/savedSearchService';
import {useTheme} from '../../theme/ThemeContext';
export function ActiveFilterChips({
  filters,
  locations,
  labels,
  review,
  onChange,
  onReviewChange,
}: {
  filters: FilterState;
  locations: Location[];
  labels: Label[];
  review: ReviewList;
  onChange: (filters: FilterState) => void;
  onReviewChange: (review: ReviewList) => void;
}) {
  const {theme} = useTheme();
  const chips: {id: string; name: string; remove: () => void}[] = [];
  const change = (value: Partial<FilterState>) =>
    onChange({...filters, ...value});
  if (filters.locationId) {
    chips.push({
      id: 'location',
      name:
        locations.find(l => l.id === filters.locationId)?.name || 'Location',
      remove: () => change({locationId: null}),
    });
  }
  filters.labelIds.forEach(id =>
    chips.push({
      id,
      name: labels.find(l => l.id === id)?.name || 'Label',
      remove: () =>
        change({labelIds: filters.labelIds.filter(value => value !== id)}),
    }),
  );
  if (filters.insuranceStatus !== 'all') {
    chips.push({
      id: 'insurance',
      name: filters.insuranceStatus,
      remove: () => change({insuranceStatus: 'all'}),
    });
  }
  if (filters.quantityMin !== null || filters.quantityMax !== null) {
    chips.push({
      id: 'quantity',
      name: `Quantity ${filters.quantityMin ?? 0}–${filters.quantityMax ?? 'any'}`,
      remove: () => change({quantityMin: null, quantityMax: null}),
    });
  }
  if (filters.dateRange !== 'all') {
    chips.push({
      id: 'date',
      name: `Added this ${filters.dateRange}`,
      remove: () => change({dateRange: 'all'}),
    });
  }
  if (review !== 'all') {
    chips.push({
      id: 'review',
      name: (
        {
          'no-photo': 'Missing photos',
          'no-location': 'Missing locations',
          recent: 'Added this week',
          'uninsured-value': 'Uninsured value ≥ 500',
        } as const
      )[review],
      remove: () => onReviewChange('all'),
    });
  }
  if (!chips.length) {
    return null;
  }
  return (
    <ScrollView horizontal contentContainerStyle={styles.row}>
      {chips.map(chip => (
        <Pressable
          key={chip.id}
          accessibilityRole="button"
          accessibilityLabel={`Remove filter: ${chip.name}`}
          onPress={chip.remove}
          style={[
            styles.chip,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.background.tertiary,
            },
          ]}>
          <Text style={{color: theme.colors.text.primary}}>{chip.name} ×</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  row: {gap: 8, paddingVertical: 4},
  chip: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
});
