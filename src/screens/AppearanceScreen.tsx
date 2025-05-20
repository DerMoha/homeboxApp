import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const AppearanceScreen: React.FC = () => {
  const { theme, themeMode, setThemeMode } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <View style={styles.header}>
        <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>Customize the app's look and feel</Text>
      </View>

      <ScrollView 
        style={[styles.scrollView, { backgroundColor: theme.colors.background.primary }]}
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 10,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerSubtitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  section: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  themeModeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
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