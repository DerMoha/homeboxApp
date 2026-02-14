import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import {useTheme} from '../theme/ThemeContext';
import {useHaptics} from '../hooks/useHaptics';
import {setHapticsEnabled} from '../utils/haptics';
import {hapticSelection} from '../utils/haptics';

const AppearanceScreen: React.FC = () => {
  const {theme, themeMode, setThemeMode} = useTheme();
  const {hapticsEnabled, setHapticsEnabled: setHapticsPref} = useHaptics();

  const handleThemeModeChange = (mode: 'light' | 'dark' | 'auto' | 'oled') => {
    hapticSelection();
    setThemeMode(mode);
  };

  const handleHapticsToggle = async (value: boolean) => {
    setHapticsEnabled(value);
    await setHapticsPref(value);
  };

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: theme.colors.background.primary},
      ]}>
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.colors.borderSubtle,
            borderBottomWidth: StyleSheet.hairlineWidth,
          },
        ]}>
        <Text
          style={[
            styles.headerTitle,
            {
              color: theme.colors.text.primary,
              fontFamily: theme.typography.fonts.semibold,
            },
          ]}>
          Appearance
        </Text>
        <Text
          style={[
            styles.headerSubtitle,
            {
              color: theme.colors.text.secondary,
              fontFamily: theme.typography.fonts.regular,
            },
          ]}>
          Customize the app's look and feel
        </Text>
      </View>

      <ScrollView
        style={[
          styles.scrollView,
          {backgroundColor: theme.colors.background.primary},
        ]}
        contentContainerStyle={styles.scrollContent}>
        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.colors.background.secondary,
              borderColor: theme.colors.borderSubtle,
            },
          ]}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.text.primary,
                fontFamily: theme.typography.fonts.semibold,
              },
            ]}>
            Theme Mode
          </Text>
          <View style={styles.themeModeContainer}>
            {(['light', 'dark', 'auto', 'oled'] as const).map(mode => {
              const isSelected = themeMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.themeModeButton,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.accent.muted
                        : theme.colors.background.primary,
                      borderColor: isSelected
                        ? theme.colors.accent.primary
                        : theme.colors.borderSubtle,
                    },
                  ]}
                  onPress={() => handleThemeModeChange(mode)}>
                  <Text
                    style={[
                      styles.themeModeText,
                      {
                        color: isSelected
                          ? theme.colors.accent.primary
                          : theme.colors.text.primary,
                        fontFamily: theme.typography.fonts.medium,
                      },
                    ]}>
                    {mode === 'auto'
                      ? 'Auto'
                      : mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.colors.background.secondary,
              borderColor: theme.colors.borderSubtle,
            },
          ]}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.text.primary,
                fontFamily: theme.typography.fonts.semibold,
              },
            ]}>
            Theme Colors
          </Text>
          <Text
            style={[
              styles.placeholderText,
              {
                color: theme.colors.text.secondary,
                fontFamily: theme.typography.fonts.regular,
              },
            ]}>
            Coming soon...
          </Text>
        </View>

        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.colors.background.secondary,
              borderColor: theme.colors.borderSubtle,
            },
          ]}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: theme.colors.text.primary,
                    fontFamily: theme.typography.fonts.semibold,
                    marginBottom: 4,
                  },
                ]}>
                Haptic Feedback
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  {
                    color: theme.colors.text.secondary,
                    fontFamily: theme.typography.fonts.regular,
                  },
                ]}>
                Vibrations for button presses and actions
              </Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={handleHapticsToggle}
              trackColor={{
                false: theme.colors.borderSubtle,
                true: theme.colors.accent.muted,
              }}
              thumbColor={
                hapticsEnabled
                  ? theme.colors.accent.primary
                  : theme.colors.text.tertiary
              }
            />
          </View>
        </View>
      </ScrollView>
    </View>
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
    padding: 16,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
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
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 80,
    alignItems: 'center',
  },
  themeModeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default AppearanceScreen;
