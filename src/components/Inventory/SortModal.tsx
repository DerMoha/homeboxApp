import React from 'react';
import {Sheet} from '../common/Sheet';
import {Button} from '../common/Button';
import {SortOption} from '../../types';
export const SortModal = ({
  visible,
  sortOption,
  onClose,
  onSelectSort,
}: {
  visible: boolean;
  sortOption: SortOption;
  onClose: () => void;
  onSelectSort: (option: SortOption) => void;
}) => (
  <Sheet title="Sort items" visible={visible} onClose={onClose}>
    {(
      ['name', 'quantity', 'createdAt', 'updatedAt', 'location'] as SortOption[]
    ).map(value => (
      <Button
        key={value}
        title={value + (sortOption === value ? ' ✓' : '')}
        variant="ghost"
        onPress={() => {
          onSelectSort(value);
          onClose();
        }}
      />
    ))}
  </Sheet>
);
