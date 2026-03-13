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
import {InventoryItem} from '../../types';
import {
  DisplayPreference,
  isPreferenceEnabled,
} from '../../hooks/useDisplayPreferences';
import {getImageSource} from '../../utils/imageUtils';
import {QuantityBadge, InfoChip} from './shared';
import {hapticImpact} from '../../utils/haptics';

interface InventoryGridItemProps {
  item: InventoryItem;
  displayPreferences: DisplayPreference[];
  onPress: (itemId: string) => void;
  itemsPerRow: number;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (itemId: string) => void;
  onLongPress?: (itemId: string) => void;
}

const InventoryGridItemComponent: React.FC<InventoryGridItemProps> = ({
  item,
  displayPreferences,
  onPress,
  itemsPerRow,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelection,
  onLongPress,
}) => {
  const {theme} = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const showQuantity = isPreferenceEnabled(displayPreferences, 'quantity');
  const showPrice =
    isPreferenceEnabled(displayPreferences, 'purchasePrice') &&
    item.purchasePrice;
  const showInsured =
    isPreferenceEnabled(displayPreferences, 'insured') && item.insured;
  const showLabel =
    isPreferenceEnabled(displayPreferences, 'labels') &&
    item.labels &&
    item.labels.length > 0;
  const showLabelRow = showLabel || showQuantity;

  const itemWidth = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    const gap = theme.spacing.xs;
    return Math.floor((screenWidth - gap * (itemsPerRow + 1)) / itemsPerRow);
  }, [itemsPerRow, theme.spacing.xs]);

  const imageHeight = useMemo(() => Math.round(itemWidth * 0.62), [itemWidth]);

  const handlePressIn = useCallback(() => {
    hapticImpact('light');
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
    if (isSelectionMode && onToggleSelection) {
      onToggleSelection(item.id);
      return;
    }

    onPress(item.id);
  }, [isSelectionMode, item.id, onPress, onToggleSelection]);

  const handleLongPress = useCallback(() => {
    onLongPress?.(item.id);
  }, [item.id, onLongPress]);

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
        backgroundColor: theme.colors.background.secondary,
        width: itemWidth,
        borderRadius: theme.borderRadius.lg,
        borderWidth: isSelected ? 1.5 : StyleSheet.hairlineWidth,
        borderColor: isSelected
          ? theme.colors.accent.primary
          : theme.colors.borderSubtle,
      },
      theme.shadows.sm,
    ],
    [
      isSelected,
      itemWidth,
      theme.borderRadius.lg,
      theme.colors.accent.primary,
      theme.colors.background.secondary,
      theme.colors.borderSubtle,
      theme.shadows.sm,
    ],
  );

  const imageContainerStyle = useMemo(
    () => [
      styles.gridItemImageContainer,
      {
        height: imageHeight,
        borderRadius: theme.borderRadius.md,
      },
    ],
    [imageHeight, theme.borderRadius.md],
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
    () => [
      styles.gridItemInfo,
      {
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.background.secondary,
        borderTopColor: theme.colors.borderSubtle,
      },
    ],
    [
      theme.colors.background.secondary,
      theme.colors.borderSubtle,
      theme.spacing.sm,
    ],
  );

  const itemNameStyle = useMemo(
    () => [
      styles.gridItemName,
      {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.md,
        fontWeight: theme.typography.weights.semibold,
        fontFamily: theme.typography.fonts.semibold,
      },
    ],
    [
      theme.colors.text.primary,
      theme.typography.fonts.semibold,
      theme.typography.sizes.md,
      theme.typography.weights.semibold,
    ],
  );

  const itemLocationStyle = useMemo(
    () => [
      styles.gridItemLocation,
      {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.text.tertiary,
        fontFamily: theme.typography.fonts.regular,
      },
    ],
    [
      theme.colors.text.tertiary,
      theme.typography.fonts.regular,
      theme.typography.sizes.xs,
    ],
  );

  const priceOverlayStyle = useMemo(
    () => [
      styles.priceOverlay,
      {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: theme.borderRadius.sm,
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 2,
      },
    ],
    [theme.borderRadius.sm, theme.spacing.xs],
  );

  const priceTextStyle = useMemo(
    () => [
      styles.priceText,
      {
        fontSize: theme.typography.sizes.xs,
        fontWeight: theme.typography.weights.semibold,
        fontFamily: theme.typography.fonts.semibold,
      },
    ],
    [
      theme.typography.fonts.semibold,
      theme.typography.sizes.xs,
      theme.typography.weights.semibold,
    ],
  );

  const insuredOverlayStyle = useMemo(
    () => [
      styles.insuredOverlay,
      {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: theme.borderRadius.sm,
        padding: theme.spacing.xs,
      },
    ],
    [theme.borderRadius.sm, theme.spacing.xs],
  );

  const formatPrice = useCallback((price: number) => {
    return `$${price.toFixed(2)}`;
  }, []);

  return (
    <Animated.View style={wrapperStyle}>
      <TouchableOpacity
        style={containerStyle}
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}>
        {isSelectionMode && (
          <View
            style={[
              styles.selectionBadge,
              {
                borderColor: isSelected
                  ? theme.colors.accent.primary
                  : theme.colors.borderSubtle,
                backgroundColor: isSelected
                  ? theme.colors.accent.primary
                  : theme.colors.background.secondary,
              },
            ]}>
            {isSelected && (
              <MaterialIcons
                name="check"
                size={12}
                color={theme.colors.text.inverse}
              />
            )}
          </View>
        )}
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

          {(showPrice || showInsured) && (
            <View style={styles.overlaysContainer}>
              {showPrice && (
                <View style={priceOverlayStyle}>
                  <Text style={priceTextStyle}>
                    {formatPrice(item.purchasePrice!)}
                  </Text>
                </View>
              )}
              {showInsured && (
                <View style={insuredOverlayStyle}>
                  <MaterialIcons
                    name="shield"
                    size={14}
                    color={theme.colors.success}
                  />
                </View>
              )}
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
              numberOfLines={2}
              ellipsizeMode="tail">
              {item.location.itemCount
                ? `${item.location.name} (${item.location.itemCount})`
                : item.location.name}
            </Text>
          )}

          {showLabelRow && (
            <View style={styles.labelRow}>
              {showLabel && (
                <InfoChip
                  icon="label"
                  label={item.labels![0].name}
                  theme={theme}
                />
              )}
              {showQuantity && (
                <View style={styles.quantityWrapper}>
                  <QuantityBadge quantity={item.quantity} theme={theme} />
                </View>
              )}
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
  selectionBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    zIndex: 2,
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
  overlaysContainer: {
    position: 'absolute',
    top: 6,
    right: 6,
    alignItems: 'flex-end',
    gap: 4,
  },
  priceOverlay: {},
  priceText: {
    color: '#FFFFFF',
  },
  insuredOverlay: {},
  gridItemInfo: {
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: 60,
  },
  gridItemName: {
    marginBottom: 2,
  },
  gridItemLocation: {
    marginBottom: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  quantityWrapper: {
    marginLeft: 'auto',
  },
});
