import React, { useCallback, useEffect, useMemo } from 'react';
import { TextStyle } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { CustomTabBar } from './src/components/navigation/CustomTabBar';
import {
  SettingsStackScreen,
  LocationsStackScreen,
  InventoryStackScreen,
  AddItemStackScreen,
} from './src/navigation/stacks';
import HomeScreen from './src/screens/HomeScreen';
import ServerService from './src/services/serverService';

type FontWeight = TextStyle['fontWeight'];

const Tab = createBottomTabNavigator();

const AppContent: React.FC = () => {
  const { theme, isDarkMode } = useTheme();

  useEffect(() => {
    ServerService.getInstance().autoConnect();
  }, []);

  const navigationTheme = useMemo(
    () => ({
      dark: isDarkMode,
      colors: {
        primary: theme.colors.accent.primary,
        background: theme.colors.background.primary,
        card: theme.colors.background.elevated,
        text: theme.colors.text.primary,
        border: theme.colors.border,
        notification: theme.colors.error,
      },
      fonts: {
        regular: { fontFamily: 'System', fontWeight: '400' as const },
        medium: { fontFamily: 'System', fontWeight: '500' as const },
        bold: { fontFamily: 'System', fontWeight: '700' as const },
        heavy: { fontFamily: 'System', fontWeight: '800' as const },
      },
    }),
    [isDarkMode, theme]
  );

  const screenOptions = useMemo(
    () => ({
      headerStyle: { backgroundColor: theme.colors.background.primary },
      headerTintColor: theme.colors.text.primary,
      headerTitleStyle: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.xl,
        fontWeight: theme.typography.weights.semibold as FontWeight,
      },
      headerShadowVisible: false,
    }),
    [theme]
  );

  const renderTabBar = useCallback(
    (props: BottomTabBarProps) => <CustomTabBar {...props} />,
    []
  );

  return (
    <NavigationContainer theme={navigationTheme}>
      <Tab.Navigator tabBar={renderTabBar} screenOptions={screenOptions}>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen
          name="InventoryTab"
          component={InventoryStackScreen}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="AddItemTab"
          component={AddItemStackScreen}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="Locations"
          component={LocationsStackScreen}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="SettingsTab"
          component={SettingsStackScreen}
          options={{ headerShown: false }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const App: React.FC = () => (
  <SafeAreaProvider>
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  </SafeAreaProvider>
);

export default App;
