import {act, renderHook} from '@testing-library/react-native';
import {Alert, PermissionsAndroid, Platform} from 'react-native';
import * as ImagePicker from 'react-native-image-picker';
import * as FileSystem from 'react-native-fs';
import {useImageHandler} from '../useImageHandler';

beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = 'android';
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

it('requests Android camera permission before launching the camera', async () => {
  const request = jest
    .spyOn(PermissionsAndroid, 'request')
    .mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
  (ImagePicker.launchCamera as jest.Mock).mockResolvedValue({didCancel: true});
  const {result} = await renderHook(() => useImageHandler());
  await act(async () => {
    await result.current.handleImagePicker('camera');
  });
  expect(request).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.CAMERA);
  expect(ImagePicker.launchCamera).toHaveBeenCalled();
});

it('does not launch the camera when permission is denied', async () => {
  jest
    .spyOn(PermissionsAndroid, 'request')
    .mockResolvedValue(PermissionsAndroid.RESULTS.DENIED);
  const {result} = await renderHook(() => useImageHandler());
  await act(async () => {
    await result.current.handleImagePicker('camera');
  });
  expect(ImagePicker.launchCamera).not.toHaveBeenCalled();
  expect(Alert.alert).toHaveBeenCalled();
});

it('does not delete the original library photo after resizing', async () => {
  (ImagePicker.launchImageLibrary as jest.Mock).mockResolvedValue({
    assets: [{uri: 'file:///photos/original.jpg'}],
  });
  const {result} = await renderHook(() => useImageHandler());
  await act(async () => {
    await result.current.handleImagePicker('library');
  });
  expect(result.current.selectedImage).toBe('mocked-uri');
  expect(FileSystem.unlink).not.toHaveBeenCalled();
});
