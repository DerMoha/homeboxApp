import React, {useState} from 'react';
import {Text, Pressable, View, StyleSheet} from 'react-native';
import {Label} from '../../types';
import {useTheme} from '../../theme/ThemeContext';
import {Sheet} from '../common/Sheet';
import {Button} from '../common/Button';
import {Input} from '../common/Input';
export const LabelSelector = ({
  labels,
  selectedLabels,
  onToggleLabel,
  enabled,
}: {
  labels: Label[];
  selectedLabels: Label[];
  onToggleLabel: (label: Label) => void;
  enabled: boolean;
}) => {
  const {theme} = useTheme();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  if (!enabled) {
    return null;
  }
  return (
    <>
      <Button
        title={
          selectedLabels.length
            ? `${selectedLabels.length} labels selected`
            : 'Choose labels'
        }
        variant="secondary"
        onPress={() => setVisible(true)}
      />
      <View style={styles.selected}>
        {selectedLabels.map(label => (
          <Button
            key={label.id}
            title={`${label.name} ×`}
            variant="ghost"
            size="small"
            onPress={() => onToggleLabel(label)}
          />
        ))}
      </View>
      <Sheet
        title="Choose labels"
        visible={visible}
        onClose={() => setVisible(false)}>
        <Input label="Search labels" value={query} onChangeText={setQuery} />
        {labels
          .filter(label =>
            label.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
          )
          .map(label => (
            <Pressable
              key={label.id}
              accessibilityRole="checkbox"
              accessibilityState={{
                checked: selectedLabels.some(value => value.id === label.id),
              }}
              onPress={() => onToggleLabel(label)}
              style={styles.row}>
              <Text style={{color: theme.colors.text.primary}}>
                {label.name}
              </Text>
              <Text style={{color: theme.colors.accent.primary}}>
                {selectedLabels.some(value => value.id === label.id) ? '✓' : ''}
              </Text>
            </Pressable>
          ))}
      </Sheet>
    </>
  );
};
const styles = StyleSheet.create({
  selected: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  row: {
    minHeight: 48,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
