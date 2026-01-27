import React, {useEffect, useMemo, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  TextStyle,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useTheme} from '../../theme/ThemeContext';
import type {Theme} from '../../theme/theme';

type FontWeight = TextStyle['fontWeight'];

const TAB_ICON_SIZE = 24;
const ADD_BUTTON_SIZE = 52;

interface TabConfig {
  name: string;
  icon: string;
  label: string;
  isSpecial: boolean;
}

const TAB_CONFIG: TabConfig[] = [
  {name: 'Home', icon: 'home', label: 'Home', isSpecial: false},
  {name: 'InventoryTab', icon: 'inventory-2', label: 'Items', isSpecial: false},
  {name: 'AddItemTab', icon: 'add', label: 'Add', isSpecial: true},
  {name: 'Locations', icon: 'folder', label: 'Places', isSpecial: false},
  {name: 'SettingsTab', icon: 'tune', label: 'Settings', isSpecial: false},
];

interface TabIconProps {
  name: string;
  focused: boolean;
  theme: Theme;
}

const TabIcon: React.FC<TabIconProps> = ({name, focused, theme}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.1 : 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [focused, scaleAnim]);

  const iconContainerStyle = useMemo(
    () => [
      styles.iconContainer,
      {
        backgroundColor: focused ? theme.colors.accent.muted : 'transparent',
        transform: [{scale: scaleAnim}],
      },
    ],
    [focused, scaleAnim, theme.colors.accent.muted],
  );

  return (
    <Animated.View style={iconContainerStyle}>
      <MaterialIcons
        name={name}
        size={TAB_ICON_SIZE}
        color={
          focused ? theme.colors.accent.primary : theme.colors.text.tertiary
        }
      />
    </Animated.View>
  );
};

interface AddButtonProps {
  theme: Theme;
}

const AddButton: React.FC<AddButtonProps> = ({theme}) => {
  const addButtonStyle = useMemo(
    () => [
      styles.addButton,
      {backgroundColor: theme.colors.accent.primary},
      theme.shadows.md,
    ],
    [theme.colors.accent.primary, theme.shadows.md],
  );

  return (
    <View style={addButtonStyle}>
      <MaterialIcons name="add" size={28} color={theme.colors.text.inverse} />
    </View>
  );
};

interface TabItemProps {
  routeKey: string;
  config: TabConfig;
  isFocused: boolean;
  accessibilityLabel?: string;
  onPress: () => void;
  onLongPress: () => void;
  theme: Theme;
}

const TabItem: React.FC<TabItemProps> = ({
  routeKey,
  config,
  isFocused,
  accessibilityLabel,
  onPress,
  onLongPress,
  theme,
}) => {
  const labelStyle = useMemo(
    () => [
      styles.label,
      {
        color: isFocused
          ? theme.colors.accent.primary
          : theme.colors.text.tertiary,
        fontWeight: isFocused
          ? (theme.typography.weights.semibold as FontWeight)
          : (theme.typography.weights.regular as FontWeight),
      },
    ],
    [
      isFocused,
      theme.colors.accent.primary,
      theme.colors.text.tertiary,
      theme.typography.weights.regular,
      theme.typography.weights.semibold,
    ],
  );

  const activeIndicatorStyle = useMemo(
    () => [
      styles.activeIndicator,
      {backgroundColor: theme.colors.accent.primary},
    ],
    [theme.colors.accent.primary],
  );

  if (config.isSpecial) {
    return (
      <TouchableOpacity
        key={routeKey}
        accessibilityRole="button"
        accessibilityState={isFocused ? {selected: true} : {}}
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.tab}
        activeOpacity={0.8}>
        <AddButton theme={theme} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      key={routeKey}
      accessibilityRole="button"
      accessibilityState={isFocused ? {selected: true} : {}}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tab}
      activeOpacity={0.7}>
      <TabIcon name={config.icon} focused={isFocused} theme={theme} />
      <Text style={labelStyle}>{config.label}</Text>
      {isFocused && <View style={activeIndicatorStyle} />}
    </TouchableOpacity>
  );
};

export const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        backgroundColor: theme.colors.background.elevated,
        borderTopColor: theme.colors.borderSubtle,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
      },
    ],
    [
      insets.bottom,
      theme.colors.background.elevated,
      theme.colors.borderSubtle,
    ],
  );

  return (
    <View style={containerStyle}>
      {state.routes.map((route, index) => {
        const {options} = descriptors[route.key];
        const isFocused = state.index === index;
        const config = TAB_CONFIG[index];

        const handlePress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const handleLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabItem
            key={route.key}
            routeKey={route.key}
            config={config}
            isFocused={isFocused}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={handlePress}
            onLongPress={handleLongPress}
            theme={theme}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -4},
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 4,
  },
  iconContainer: {
    width: 48,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  addButton: {
    width: ADD_BUTTON_SIZE,
    height: ADD_BUTTON_SIZE,
    borderRadius: ADD_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
