import React, {useCallback, useEffect, useMemo} from 'react';
import {Text, TextStyle} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {ThemeProvider, useTheme} from './src/theme/ThemeContext';
import {CustomTabBar} from './src/components/navigation/CustomTabBar';
import {LoadingState} from './src/components/common';
import {
  SettingsStackScreen,
  LocationsStackScreen,
  InventoryStackScreen,
  AddItemStackScreen,
} from './src/navigation/stacks';
import HomeScreen from './src/screens/HomeScreen';
import {useServerConnection} from './src/hooks/useServerConnection';
import {RootTabParamList} from './src/types/navigation';
import {logger} from './src/utils/logger';

type FontWeight = TextStyle['fontWeight'];

const Tab = createBottomTabNavigator<RootTabParamList>();

const defaultFontFamily = 'Sora';
const TextComponent = Text as unknown as {
  defaultProps?: {style?: TextStyle | TextStyle[]};
};
const existingDefaultStyle = TextComponent.defaultProps?.style;
const baseTextStyle: TextStyle = {fontFamily: defaultFontFamily};
const mergedTextStyle = Array.isArray(existingDefaultStyle)
  ? [baseTextStyle, ...existingDefaultStyle]
  : existingDefaultStyle
  ? [baseTextStyle, existingDefaultStyle]
  : [baseTextStyle];
TextComponent.defaultProps = {
  ...TextComponent.defaultProps,
  style: mergedTextStyle,
};

const AppContent: React.FC = () => {
  const {theme, isDarkMode} = useTheme();
  const {isConnecting} = useServerConnection();

  useEffect(() => {
    const errorUtils = (
      global as typeof global & {
        ErrorUtils?: {
          getGlobalHandler?: () => (error: Error, isFatal?: boolean) => void;
          setGlobalHandler?: (
            handler: (error: Error, isFatal?: boolean) => void,
          ) => void;
        };
      }
    ).ErrorUtils;

    const previousHandler = errorUtils?.getGlobalHandler?.();

    errorUtils?.setGlobalHandler?.((error, isFatal) => {
      logger.error('Unhandled JavaScript error', {
        error,
        isFatal: Boolean(isFatal),
      });

      previousHandler?.(error, isFatal);
    });

    return () => {
      if (previousHandler) {
        errorUtils?.setGlobalHandler?.(previousHandler);
      }
    };
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
        regular: {
          fontFamily: theme.typography.fonts.regular,
          fontWeight: '400' as const,
        },
        medium: {
          fontFamily: theme.typography.fonts.medium,
          fontWeight: '500' as const,
        },
        bold: {
          fontFamily: theme.typography.fonts.bold,
          fontWeight: '700' as const,
        },
        heavy: {
          fontFamily: theme.typography.fonts.bold,
          fontWeight: '800' as const,
        },
      },
    }),
    [isDarkMode, theme],
  );

  const screenOptions = useMemo(
    () => ({
      headerStyle: {backgroundColor: theme.colors.background.primary},
      headerTintColor: theme.colors.text.primary,
      headerTitleStyle: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.xl,
        fontWeight: theme.typography.weights.semibold as FontWeight,
        fontFamily: theme.typography.fonts.semibold,
      },
      headerShadowVisible: false,
    }),
    [theme],
  );

  const renderTabBar = useCallback(
    (props: BottomTabBarProps) => <CustomTabBar {...props} />,
    [],
  );

  if (isConnecting) {
    return <LoadingState message="Connecting..." />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Tab.Navigator tabBar={renderTabBar} screenOptions={screenOptions}>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen
          name="InventoryTab"
          component={InventoryStackScreen}
          options={{headerShown: false}}
        />
        <Tab.Screen
          name="AddItemTab"
          component={AddItemStackScreen}
          options={{headerShown: false}}
        />
        <Tab.Screen
          name="Locations"
          component={LocationsStackScreen}
          options={{headerShown: false}}
        />
        <Tab.Screen
          name="SettingsTab"
          component={SettingsStackScreen}
          options={{headerShown: false}}
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
