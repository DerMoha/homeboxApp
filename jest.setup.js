/* eslint-env jest */

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
  },
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock react-native-image-picker
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));

// Mock react-native-fs
jest.mock('react-native-fs', () => ({
  readFile: jest.fn(() => Promise.resolve('')),
  writeFile: jest.fn(() => Promise.resolve()),
  unlink: jest.fn(() => Promise.resolve()),
  exists: jest.fn(() => Promise.resolve(true)),
  stat: jest.fn(() => Promise.resolve({size: 0})),
}));

// Mock react-native-image-resizer
jest.mock('@bam.tech/react-native-image-resizer', () => ({
  __esModule: true,
  default: {
    createResizedImage: jest.fn(() =>
      Promise.resolve({
        uri: 'mocked-uri',
        path: 'mocked-path',
        name: 'mocked-name',
        size: 1000,
      }),
    ),
  },
}));

// Mock react-native-image-crop-picker
jest.mock('react-native-image-crop-picker', () => ({
  openPicker: jest.fn(),
  openCamera: jest.fn(),
}));

// Mock react-native-camera-kit
jest.mock('react-native-camera-kit', () => {
  const React = require('react');
  const {View} = require('react-native');

  const MockCamera = React.forwardRef((_props, ref) => {
    React.useImperativeHandle(ref, () => ({
      requestDeviceCameraAuthorization: jest.fn(() => Promise.resolve(true)),
    }));

    return React.createElement(View, {testID: 'mock-camera-kit'});
  });

  return {
    __esModule: true,
    default: MockCamera,
    CameraType: {
      Back: 'back',
      Front: 'front',
    },
  };
});
