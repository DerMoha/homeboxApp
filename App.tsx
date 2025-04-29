import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import SettingsScreen from './src/screens/SettingsScreen';
import ServerConfigScreen from './src/screens/ServerConfigScreen';
import AppearanceScreen from './src/screens/AppearanceScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import InventorySettingsScreen from './src/screens/InventorySettingsScreen';
import LocationsScreen from './src/screens/LocationsScreen';
import LocationItemsScreen from './src/screens/LocationItemsScreen';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { darkTheme } from './src/theme/theme';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Tab = createBottomTabNavigator();
const SettingsStack = createNativeStackNavigator();
const LocationsStack = createNativeStackNavigator();

// Placeholder screens
const HomeScreen = () => {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background.primary }}>
      <Text style={{ color: theme.colors.text.primary }}>Home Screen</Text>
    </View>
  );
};

const SearchScreen = () => {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background.primary }}>
      <Text style={{ color: theme.colors.text.primary }}>Search Screen</Text>
    </View>
  );
};

const SettingsStackScreen = () => {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <SettingsStack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background.primary,
          },
          headerTintColor: theme.colors.text.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShadowVisible: false,
          headerBackTitle: '',
          contentStyle: {
            backgroundColor: theme.colors.background.primary,
          },
        }}
      >
        <SettingsStack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ headerShown: false }}
        />
        <SettingsStack.Screen 
          name="ServerConfig" 
          component={ServerConfigScreen}
          options={{ 
            headerShown: false,
          }}
        />
        <SettingsStack.Screen 
          name="Appearance" 
          component={AppearanceScreen}
          options={{ 
            headerShown: false,
          }}
        />
        <SettingsStack.Screen 
          name="InventorySettings" 
          component={InventorySettingsScreen}
          options={{ 
            headerShown: false,
          }}
        />
      </SettingsStack.Navigator>
    </SafeAreaView>
  );
};

const LocationsStackScreen = () => {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <LocationsStack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background.primary,
          },
          headerTintColor: theme.colors.text.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShadowVisible: false,
          headerBackTitle: '',
          contentStyle: {
            backgroundColor: theme.colors.background.primary,
          },
        }}
      >
        <LocationsStack.Screen 
          name="LocationsList" 
          component={LocationsScreen}
          options={{ 
            headerShown: false,
          }}
        />
        <LocationsStack.Screen 
          name="LocationItems" 
          component={LocationItemsScreen}
          options={{ 
            headerShown: true,
          }}
        />
      </LocationsStack.Navigator>
    </SafeAreaView>
  );
};

const AppContent = () => {
  const { theme, isDarkMode } = useTheme();
  return (
    <NavigationContainer theme={{
      dark: isDarkMode,
      colors: {
        primary: theme.colors.button.primary,
        background: theme.colors.background.primary,
        card: theme.colors.background.secondary,
        text: theme.colors.text.primary,
        border: theme.colors.border,
        notification: theme.colors.error,
      },
      fonts: {
        regular: {
          fontFamily: 'System',
          fontWeight: '400',
        },
        medium: {
          fontFamily: 'System',
          fontWeight: '500',
        },
        bold: {
          fontFamily: 'System',
          fontWeight: '700',
        },
        heavy: {
          fontFamily: 'System',
          fontWeight: '800',
        },
      },
    }}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.colors.button.primary,
          tabBarInactiveTintColor: theme.colors.text.secondary,
          tabBarStyle: {
            backgroundColor: theme.colors.background.secondary,
            borderTopColor: theme.colors.border,
          },
          headerStyle: {
            backgroundColor: theme.colors.background.primary,
          },
          headerTintColor: theme.colors.text.primary,
          headerTitleStyle: {
            color: theme.colors.text.primary,
          },
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="Inventory" 
          component={InventoryScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="inventory" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="Search" 
          component={SearchScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="search" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="Locations" 
          component={LocationsStackScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="location-on" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="SettingsTab" 
          component={SettingsStackScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="settings" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App; 