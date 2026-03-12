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
import {hapticSelection, hapticImpact} from '../../utils/haptics';

type FontWeight = TextStyle['fontWeight'];

const TAB_ICON_SIZE = 22;
const ADD_BUTTON_SIZE = 46;

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
      toValue: focused ? 1.06 : 1,
      useNativeDriver: true,
      friction: 6,
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
      {
        backgroundColor: theme.colors.accent.primary,
        borderColor: theme.colors.borderSubtle,
      },
      theme.shadows.sm,
    ],
    [theme.colors.accent.primary, theme.colors.borderSubtle, theme.shadows.sm],
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
        fontFamily: isFocused
          ? theme.typography.fonts.semibold
          : theme.typography.fonts.regular,
      },
    ],
    [
      isFocused,
      theme.colors.accent.primary,
      theme.colors.text.tertiary,
      theme.typography.fonts.regular,
      theme.typography.fonts.semibold,
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
        onPress={() => {
          hapticImpact('medium');
          onPress();
        }}
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
      onPress={() => {
        hapticSelection();
        onPress();
      }}
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
        backgroundColor: theme.colors.background.secondary,
        borderTopColor: theme.colors.borderSubtle,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
      },
    ],
    [
      insets.bottom,
      theme.colors.background.secondary,
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
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -2},
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 6,
  },
  iconContainer: {
    width: 42,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  addButton: {
    width: ADD_BUTTON_SIZE,
    height: ADD_BUTTON_SIZE,
    borderRadius: ADD_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 16,
    height: 2,
    borderRadius: 1,
  },
});
