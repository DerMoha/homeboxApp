import React, {useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Button} from '../common/Button';
import {Sheet} from '../common/Sheet';
import {useTheme} from '../../theme/ThemeContext';
import {SortOption} from '../../types';
export type ViewMode = 'list' | 'grid';
interface Props {
  viewMode: ViewMode;
  itemsPerRow: number;
  listZoom: number;
  sortOption: SortOption;
  onToggleView: () => void;
  onIncreaseItemsPerRow: () => void;
  onDecreaseItemsPerRow: () => void;
  onIncreaseZoom: () => void;
  onDecreaseZoom: () => void;
  onSelectSort: (value: SortOption) => void;
  onOpenFilter: () => void;
  activeFilterCount?: number;
  savedSearches?: React.ReactNode;
}
const sorts: [SortOption, string][] = [
  ['name', 'Name'],
  ['quantity', 'Quantity'],
  ['createdAt', 'Date added'],
  ['updatedAt', 'Last updated'],
  ['location', 'Location'],
];
export const InventoryHeader = (props: Props) => {
  const [visible, setVisible] = useState(false);
  const {theme} = useTheme();
  const heading = (title: string) => (
    <Text
      accessibilityRole="header"
      style={[styles.heading, {color: theme.colors.text.primary}]}>
      {title}
    </Text>
  );
  return (
    <>
      <View style={styles.toolbar}>
        <Button
          title={
            props.activeFilterCount
              ? `Filters (${props.activeFilterCount})`
              : 'Filters'
          }
          icon="filter-list"
          variant="secondary"
          size="small"
          onPress={props.onOpenFilter}
        />
        <Button
          title="Display"
          icon="tune"
          variant="secondary"
          size="small"
          onPress={() => setVisible(true)}
        />
        {props.savedSearches}
      </View>
      <Sheet
        title="Display items"
        visible={visible}
        onClose={() => setVisible(false)}>
        {heading('View')}
        <Button
          title={props.viewMode === 'list' ? 'List ✓' : 'List'}
          variant="ghost"
          onPress={() => {
            if (props.viewMode !== 'list') {
              props.onToggleView();
            }
          }}
        />
        <Button
          title={props.viewMode === 'grid' ? 'Grid ✓' : 'Grid'}
          variant="ghost"
          onPress={() => {
            if (props.viewMode !== 'grid') {
              props.onToggleView();
            }
          }}
        />
        {heading(
          props.viewMode === 'grid'
            ? `Columns: ${props.itemsPerRow}`
            : `Details: ${['Compact', 'Standard', 'Detailed'][props.listZoom]}`,
        )}
        <View style={styles.toolbar}>
          <Button
            title="Less"
            variant="secondary"
            disabled={
              props.viewMode === 'grid'
                ? props.itemsPerRow <= 1
                : props.listZoom <= 0
            }
            onPress={
              props.viewMode === 'grid'
                ? props.onDecreaseItemsPerRow
                : props.onDecreaseZoom
            }
          />
          <Button
            title="More"
            variant="secondary"
            disabled={
              props.viewMode === 'grid'
                ? props.itemsPerRow >= 5
                : props.listZoom >= 2
            }
            onPress={
              props.viewMode === 'grid'
                ? props.onIncreaseItemsPerRow
                : props.onIncreaseZoom
            }
          />
        </View>
        {heading('Sort loaded items')}
        {sorts.map(([value, label]) => (
          <Button
            key={value}
            title={label + (value === props.sortOption ? ' ✓' : '')}
            variant="ghost"
            onPress={() => props.onSelectSort(value)}
          />
        ))}
      </Sheet>
    </>
  );
};
const styles = StyleSheet.create({
  toolbar: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 8},
  heading: {fontSize: 16, fontWeight: '600', marginTop: 8},
});
