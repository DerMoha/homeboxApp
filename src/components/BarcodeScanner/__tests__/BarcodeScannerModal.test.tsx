import React from 'react';
import {render, waitFor} from '@testing-library/react-native';
import {PermissionsAndroid, Platform} from 'react-native';
import BarcodeScannerModal from '../BarcodeScannerModal';
import {ThemeProvider} from '../../../theme/ThemeContext';

it('opens the Android scanner after permission is granted before a camera ref exists', async () => {
  Platform.OS = 'android';
  jest
    .spyOn(PermissionsAndroid, 'request')
    .mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
  const screen = render(
    <ThemeProvider>
      <BarcodeScannerModal
        visible
        onClose={jest.fn()}
        onBarcodeDetected={jest.fn()}
      />
    </ThemeProvider>,
  );
  await waitFor(() =>
    expect(screen.getByTestId('mock-camera-kit')).toBeTruthy(),
  );
  screen.unmount();
});
