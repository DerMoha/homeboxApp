import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useTheme} from '../../theme/ThemeContext';
const destinations: Record<string, {label: string; icon: string}> = {
  Home: {label: 'Home', icon: 'home'},
  InventoryTab: {label: 'Items', icon: 'inventory-2'},
  Locations: {label: 'Locations', icon: 'place'},
  SettingsTab: {label: 'Settings', icon: 'settings'},
};
export const CustomTabBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.colors.background.primary,
          borderColor: theme.colors.borderSubtle,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}>
      {state.routes.map((route, index) => {
        const config = destinations[route.name];
        const selected = state.index === index;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={
              descriptors[route.key].options.tabBarAccessibilityLabel ||
              config.label
            }
            accessibilityState={{selected}}
            style={styles.tab}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!selected && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            onLongPress={() =>
              navigation.emit({type: 'tabLongPress', target: route.key})
            }>
            <MaterialIcons
              name={config.icon}
              size={24}
              color={
                selected
                  ? theme.colors.accent.primary
                  : theme.colors.text.secondary
              }
            />
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={1.5}
              style={[
                styles.label,
                {
                  color: selected
                    ? theme.colors.accent.primary
                    : theme.colors.text.secondary,
                },
              ]}>
              {config.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};
const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    gap: 4,
  },
  label: {fontSize: 12},
});
