import React from 'react';
import {render} from '@testing-library/react-native';
import {ThemeProvider} from '../../../theme/ThemeContext';
import {Button} from '../Button';
import {Input} from '../Input';
it('exposes button purpose and busy/disabled state to screen readers', async () => {
  const screen = await render(
    <ThemeProvider>
      <Button title="Save changes" loading onPress={() => {}} />
    </ThemeProvider>,
  );
  const button = screen.getByRole('button', {name: 'Save changes'});
  expect(button.props.accessibilityState).toEqual({disabled: true, busy: true});
});
it('announces required inputs and errors with a usable label', async () => {
  const screen = await render(
    <ThemeProvider>
      <Input label="Host" required error="Enter a server address" />
    </ThemeProvider>,
  );
  expect(screen.getByLabelText('Host, required').props.accessibilityHint).toBe(
    'Enter a server address',
  );
  expect(screen.getByRole('alert')).toBeTruthy();
});
