import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const AppearanceScreen: React.FC = () => {
  const { theme, themeMode, setThemeMode } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <View style={[styles.section, { backgroundColor: theme.colors.background.secondary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Theme Mode</Text>
        <View style={styles.themeModeContainer}>
          <TouchableOpacity
            style={[
              styles.themeModeButton,
              themeMode === 'light' && styles.selectedThemeMode,
              { backgroundColor: theme.colors.background.primary }
            ]}
            onPress={() => setThemeMode('light')}
          >
            <Text style={[styles.themeModeText, { color: theme.colors.text.primary }]}>Light</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.themeModeButton,
              themeMode === 'dark' && styles.selectedThemeMode,
              { backgroundColor: theme.colors.background.primary }
            ]}
            onPress={() => setThemeMode('dark')}
          >
            <Text style={[styles.themeModeText, { color: theme.colors.text.primary }]}>Dark</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.themeModeButton,
              themeMode === 'auto' && styles.selectedThemeMode,
              { backgroundColor: theme.colors.background.primary }
            ]}
            onPress={() => setThemeMode('auto')}
          >
            <Text style={[styles.themeModeText, { color: theme.colors.text.primary }]}>Auto</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.themeModeButton,
              themeMode === 'oled' && styles.selectedThemeMode,
              { backgroundColor: theme.colors.background.primary }
            ]}
            onPress={() => setThemeMode('oled')}
          >
            <Text style={[styles.themeModeText, { color: theme.colors.text.primary }]}>OLED</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.colors.background.secondary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Theme Colors</Text>
        <Text style={[styles.placeholderText, { color: theme.colors.text.secondary }]}>Coming soon...</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 15,
    marginBottom: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  themeModeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  themeModeButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedThemeMode: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  themeModeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
});

export default AppearanceScreen; 