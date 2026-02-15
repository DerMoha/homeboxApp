import React, {useMemo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../theme/ThemeContext';

export interface BreadcrumbItem {
  id: string;
  name: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onItemPress?: (item: BreadcrumbItem, index: number) => void;
  maxVisibleItems?: number;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  onItemPress,
  maxVisibleItems = 4,
}) => {
  const {theme} = useTheme();

  const {displayItems, hasHiddenItems} = useMemo(() => {
    if (items.length <= maxVisibleItems) {
      return {displayItems: items, hasHiddenItems: false};
    }
    const firstItem = items[0];
    const lastItems = items.slice(-(maxVisibleItems - 1));
    return {
      displayItems: [firstItem, ...lastItems],
      hasHiddenItems: true,
    };
  }, [items, maxVisibleItems]);

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        gap: theme.spacing.xs,
      },
    ],
    [theme.spacing.xs],
  );

  const segmentStyle = useMemo(
    () => [
      styles.segment,
      {
        backgroundColor: theme.colors.background.tertiary,
        borderRadius: theme.borderRadius.sm,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
      },
    ],
    [
      theme.borderRadius.sm,
      theme.colors.background.tertiary,
      theme.spacing.sm,
      theme.spacing.xs,
    ],
  );

  const textStyle = useMemo(
    () => [
      styles.text,
      {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.xs,
        fontFamily: theme.typography.fonts.medium,
      },
    ],
    [
      theme.colors.text.secondary,
      theme.typography.fonts.medium,
      theme.typography.sizes.xs,
    ],
  );

  const activeTextStyle = useMemo(
    () => [
      styles.text,
      {
        color: theme.colors.accent.primary,
        fontSize: theme.typography.sizes.xs,
        fontFamily: theme.typography.fonts.medium,
      },
    ],
    [
      theme.colors.accent.primary,
      theme.typography.fonts.medium,
      theme.typography.sizes.xs,
    ],
  );

  const chevronStyle = useMemo(
    () => [
      styles.chevron,
      {
        color: theme.colors.text.tertiary,
      },
    ],
    [theme.colors.text.tertiary],
  );

  const ellipsisStyle = useMemo(
    () => [
      styles.ellipsis,
      {
        color: theme.colors.text.tertiary,
        fontSize: theme.typography.sizes.xs,
      },
    ],
    [theme.colors.text.tertiary, theme.typography.sizes.xs],
  );

  if (items.length === 0) {
    return null;
  }

  const handlePress = (item: BreadcrumbItem, index: number) => {
    if (onItemPress) {
      let actualIndex = index;
      if (hasHiddenItems && index > 0) {
        actualIndex = items.length - (displayItems.length - index);
      }
      onItemPress(item, actualIndex);
    }
  };

  return (
    <View style={containerStyle}>
      {displayItems.map((item, index) => {
        const isLast = index === displayItems.length - 1;
        const showEllipsis = hasHiddenItems && index === 1;

        return (
          <React.Fragment key={item.id}>
            {index > 0 && (
              <View style={styles.chevronContainer}>
                {showEllipsis ? (
                  <Text style={ellipsisStyle} numberOfLines={1}>
                    ...
                  </Text>
                ) : null}
                <MaterialIcons
                  name="chevron-right"
                  size={14}
                  style={chevronStyle}
                />
              </View>
            )}
            <TouchableOpacity
              style={segmentStyle}
              onPress={() => handlePress(item, index)}
              disabled={isLast && !onItemPress}
              activeOpacity={0.7}>
              <Text
                style={isLast ? activeTextStyle : textStyle}
                numberOfLines={1}
                ellipsizeMode="tail">
                {item.name}
              </Text>
            </TouchableOpacity>
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  segment: {
    maxWidth: 120,
  },
  text: {
    maxWidth: 100,
  },
  chevronContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    marginHorizontal: 2,
  },
  ellipsis: {
    marginHorizontal: 2,
  },
});
