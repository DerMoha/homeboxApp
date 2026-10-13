import React from 'react';
import {StyleSheet} from 'react-native';
import {render} from '@testing-library/react-native';
import {ItemFormFields} from '../ItemFormFields';
import {useTheme} from '../../../theme/ThemeContext';
import {lightTheme, darkTheme} from '../../../theme/theme';
jest.mock('../../../theme/ThemeContext', () => ({useTheme: jest.fn()}));
it.each([
  ['light', lightTheme],
  ['dark', darkTheme],
] as const)(
  'keeps quick-entry input distinct from the card in %s mode',
  async (_name, theme) => {
    (useTheme as jest.Mock).mockReturnValue({theme});
    const screen = await render(
      <ItemFormFields
        quickEntry
        formData={{}}
        enabledFields={{
          description: false,
          insured: false,
          labels: false,
          purchasePrice: false,
        }}
        isQuantityFocused={false}
        onUpdateField={() => {}}
        onQuantityFocus={() => {}}
        onQuantityBlur={() => {}}
      />,
    );
    const input = screen.getByLabelText('Item name, required');
    const style = StyleSheet.flatten(input.props.style);
    expect(style.backgroundColor).not.toBe(theme.colors.card.background);
    expect(style.borderColor).not.toBe(style.backgroundColor);
    expect(style.borderWidth).toBeGreaterThanOrEqual(1);
    expect(style.minHeight).toBeGreaterThanOrEqual(48);
    expect(style.color).toBe(theme.colors.text.primary);
  },
);
