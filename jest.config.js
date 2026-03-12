module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-vector-icons|react-native-image-picker|react-native-image-crop-picker|@bam.tech/react-native-image-resizer|react-native-fs|@react-native-async-storage|@react-native-picker|@react-native-community|react-native-camera-kit)/)',
  ],
  setupFiles: ['./jest.setup.js'],
};
