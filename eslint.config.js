const reactNative = require('@react-native/eslint-config/flat');

module.exports = [
  {ignores: ['coverage/**', 'node_modules/**', 'ios/Pods/**', '**/build/**', 'vendor/**']},
  // This app uses TypeScript, so it does not need the legacy Flow rules.
  {files: ['jest.setup.js'], languageOptions: {globals: {jest: 'readonly'}}},
  ...reactNative.filter(config => !config.plugins?.['ft-flow']),
  {files: ['**/*.ts', '**/*.tsx'], rules: {'@typescript-eslint/no-unused-vars': ['error', {caughtErrors: 'none', argsIgnorePattern: '^_', varsIgnorePattern: '^_'}]}},
];
