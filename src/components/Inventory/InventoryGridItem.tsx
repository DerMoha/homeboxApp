import React, {useMemo, useCallback, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../theme/ThemeContext';
import {InventoryItem} from '../../hooks/useInventoryData';
import {DisplayPreference} from '../../hooks/useDisplayPreferences';
import {getImageSource} from '../../utils/imageUtils';

interface InventoryGridItemProps {
  item: InventoryItem;
  displayPreferences: DisplayPreference[];
  onPress: (itemId: string) => void;
  itemsPerRow: number;
}

const InventoryGridItemComponent: React.FC<InventoryGridItemProps> = ({
  item,
  displayPreferences,
  onPress,
  itemsPerRow,
}) => {
  const {theme} = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const getPreference = useCallback(
    (id: string): boolean => {
      const preference = displayPreferences.find(p => p.id === id);
      return preference?.enabled ?? false;
    },
    [displayPreferences],
  );

  const itemWidth = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    const gap = theme.spacing.xs;
    return Math.floor((screenWidth - gap * (itemsPerRow + 1)) / itemsPerRow);
  }, [itemsPerRow, theme.spacing.xs]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    onPress(item.id);
  }, [onPress, item.id]);

  const wrapperStyle = useMemo(
    () => ({
      transform: [{scale: scaleAnim}],
      margin: theme.spacing.xs / 2,
    }),
    [scaleAnim, theme.spacing.xs],
  );

  const containerStyle = useMemo(
    () => [
      styles.gridItemContainer,
      {
        backgroundColor: theme.colors.card.background,
        width: itemWidth,
        height: itemWidth,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.card.border,
      },
      theme.shadows.md,
    ],
    [
      itemWidth,
      theme.borderRadius.lg,
      theme.colors.card.background,
      theme.colors.card.border,
      theme.shadows.md,
    ],
  );

  const imageContainerStyle = useMemo(
    () => [
      styles.gridItemImageContainer,
      {
        height: itemWidth,
        borderRadius: theme.borderRadius.md,
      },
    ],
    [itemWidth, theme.borderRadius.md],
  );

  const imageStyle = useMemo(
    () => [styles.gridItemImage, {borderRadius: theme.borderRadius.md}],
    [theme.borderRadius.md],
  );

  const placeholderStyle = useMemo(
    () => [
      styles.placeholderContainer,
      {backgroundColor: theme.colors.background.tertiary},
    ],
    [theme.colors.background.tertiary],
  );

  const infoStyle = useMemo(
    () => [styles.gridItemInfo, {padding: theme.spacing.sm}],
    [theme.spacing.sm],
  );

  const itemNameStyle = useMemo(
    () => [
      styles.gridItemName,
      {
        fontSize: theme.typography.sizes.md,
        fontWeight: theme.typography.weights.semibold,
      },
    ],
    [theme.typography.sizes.md, theme.typography.weights.semibold],
  );

  const itemLocationStyle = useMemo(
    () => [styles.gridItemLocation, {fontSize: theme.typography.sizes.xs}],
    [theme.typography.sizes.xs],
  );

  const quantityBadgeStyle = useMemo(
    () => [
      styles.gridQuantityBadge,
      {
        backgroundColor: theme.colors.accent.primary,
        borderRadius: theme.borderRadius.full,
      },
    ],
    [theme.borderRadius.full, theme.colors.accent.primary],
  );

  const quantityTextStyle = useMemo(
    () => [
      styles.gridQuantityText,
      {
        fontSize: theme.typography.sizes.xs,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.inverse,
      },
    ],
    [
      theme.typography.sizes.xs,
      theme.typography.weights.bold,
      theme.colors.text.inverse,
    ],
  );

  return (
    <Animated.View style={wrapperStyle}>
      <TouchableOpacity
        style={containerStyle}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}>
        <View style={imageContainerStyle}>
          {item.imageId ? (
            <Image
              source={getImageSource(item.id, item.imageId)}
              style={imageStyle}
              resizeMode="cover"
            />
          ) : (
            <View style={placeholderStyle}>
              <MaterialIcons
                name="image-not-supported"
                size={48}
                color={theme.colors.text.tertiary}
              />
            </View>
          )}
        </View>

        <View style={infoStyle}>
          <Text style={itemNameStyle} numberOfLines={1} ellipsizeMode="tail">
            {item.name}
          </Text>

          {item.location && (
            <Text
              style={itemLocationStyle}
              numberOfLines={1}
              ellipsizeMode="tail">
              {item.location.name}
            </Text>
          )}

          {getPreference('quantity') && (
            <View style={quantityBadgeStyle}>
              <Text style={quantityTextStyle}>{item.quantity}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const InventoryGridItem = React.memo(InventoryGridItemComponent);

const styles = StyleSheet.create({
  gridItemContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItemImageContainer: {
    overflow: 'hidden',
  },
  gridItemImage: {
    width: '100%',
    height: '100%',
  },
  gridItemInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  gridItemName: {
    color: 'white',
  },
  gridItemLocation: {
    marginTop: 2,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  gridQuantityBadge: {
    position: 'absolute',
    top: -28,
    right: 8,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridQuantityText: {
    textAlign: 'center',
  },
});
