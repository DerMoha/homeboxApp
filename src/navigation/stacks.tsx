import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useTheme} from '../theme/ThemeContext';

import SettingsScreen from '../screens/SettingsScreen';
import ServerConfigScreen from '../screens/ServerConfigScreen';
import AppearanceScreen from '../screens/AppearanceScreen';
import InventorySettingsScreen from '../screens/InventorySettingsScreen';
import AddItemSettingsScreen from '../screens/AddItemSettingsScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import LocationsScreen from '../screens/LocationsScreen';
import LocationItemsScreen from '../screens/LocationItemsScreen';
import AddItemScreen from '../screens/AddItemScreen';
import {
  AddItemStackParamList,
  InventoryStackParamList,
  LocationsStackParamList,
  SettingsStackParamList,
} from './types';

const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
const LocationsStack = createNativeStackNavigator<LocationsStackParamList>();
const InventoryStack = createNativeStackNavigator<InventoryStackParamList>();
const AddItemStack = createNativeStackNavigator<AddItemStackParamList>();

const useStackScreenOptions = () => {
  const {theme} = useTheme();

  return {
    headerStyle: {
      backgroundColor: theme.colors.background.primary,
    },
    headerTintColor: theme.colors.accent.primary,
    headerTitleStyle: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.semibold as '600',
      color: theme.colors.text.primary,
    },
    headerShadowVisible: false,
    headerBackTitle: '',
    contentStyle: {
      backgroundColor: theme.colors.background.primary,
    },
    headerBackButtonDisplayMode: 'minimal' as const,
  };
};

export const SettingsStackScreen: React.FC = () => {
  const screenOptions = useStackScreenOptions();

  return (
    <SettingsStack.Navigator screenOptions={screenOptions}>
      <SettingsStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{headerLargeTitle: true}}
      />
      <SettingsStack.Screen
        name="ServerConfig"
        component={ServerConfigScreen}
        options={{title: 'Server Configuration'}}
      />
      <SettingsStack.Screen
        name="Appearance"
        component={AppearanceScreen}
        options={{title: 'Appearance'}}
      />
      <SettingsStack.Screen
        name="InventorySettings"
        component={InventorySettingsScreen}
        options={{title: 'Inventory Display'}}
      />
      <SettingsStack.Screen
        name="AddItemSettings"
        component={AddItemSettingsScreen}
        options={{title: 'Add Fields'}}
      />
    </SettingsStack.Navigator>
  );
};

export const LocationsStackScreen: React.FC = () => {
  const screenOptions = useStackScreenOptions();

  return (
    <LocationsStack.Navigator screenOptions={screenOptions}>
      <LocationsStack.Screen
        name="LocationsList"
        component={LocationsScreen}
        options={{title: 'Locations', headerLargeTitle: true}}
      />
      <LocationsStack.Screen
        name="LocationItems"
        component={LocationItemsScreen}
      />
    </LocationsStack.Navigator>
  );
};

export const InventoryStackScreen: React.FC = () => {
  const screenOptions = useStackScreenOptions();

  return (
    <InventoryStack.Navigator screenOptions={screenOptions}>
      <InventoryStack.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{title: 'Inventory', headerLargeTitle: true}}
      />
      <InventoryStack.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={{title: 'Item Details'}}
      />
    </InventoryStack.Navigator>
  );
};

export const AddItemStackScreen: React.FC = () => {
  const screenOptions = useStackScreenOptions();

  return (
    <AddItemStack.Navigator screenOptions={screenOptions}>
      <AddItemStack.Screen
        name="AddItem"
        component={AddItemScreen}
        options={{title: 'Add Item', headerLargeTitle: true}}
      />
    </AddItemStack.Navigator>
  );
};
