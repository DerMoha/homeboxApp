import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import SettingsScreen from './src/screens/SettingsScreen';
import ServerConfigScreen from './src/screens/ServerConfigScreen';

const Tab = createBottomTabNavigator();
const SettingsStack = createNativeStackNavigator();

// Placeholder screens
const HomeScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Home Screen</Text>
  </View>
);

const InventoryScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Inventory Screen</Text>
  </View>
);

const SearchScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Search Screen</Text>
  </View>
);

const ProfileScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Profile Screen</Text>
  </View>
);

const SettingsStackScreen = () => (
  <SettingsStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#f8f8f8',
      },
      headerTintColor: '#333',
      headerTitleStyle: {
        fontWeight: '600',
      },
      headerShadowVisible: false,
      headerBackTitle: '',
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
        title: 'Server Configuration',
      }}
    />
  </SettingsStack.Navigator>
);

const App = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: size }}>🏠</Text>
            ),
          }}
        />
        <Tab.Screen 
          name="Inventory" 
          component={InventoryScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: size }}>📦</Text>
            ),
          }}
        />
        <Tab.Screen 
          name="Search" 
          component={SearchScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: size }}>🔍</Text>
            ),
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: size }}>👤</Text>
            ),
          }}
        />
        <Tab.Screen 
          name="SettingsTab" 
          component={SettingsStackScreen}
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: size }}>⚙️</Text>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default App; 