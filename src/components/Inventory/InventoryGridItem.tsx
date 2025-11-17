import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/ThemeContext';
import { InventoryItem } from '../../hooks/useInventoryData';
import { DisplayPreference } from '../../hooks/useDisplayPreferences';
import { getImageSource } from '../../utils/imageUtils';

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
  const { theme } = useTheme();

  // Memoize preference lookup
  const getPreference = useCallback((id: string): boolean => {
    const preference = displayPreferences.find(p => p.id === id);
    return preference?.enabled ?? false;
  }, [displayPreferences]);

  // Memoize screen calculations
  const itemWidth = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    return Math.floor(screenWidth / itemsPerRow);
  }, [itemsPerRow]);

  // Memoize onPress handler
  const handlePress = useCallback(() => {
    onPress(item.id);
  }, [onPress, item.id]);

  return (
    <TouchableOpacity
      style={[
        styles.gridItemContainer,
        {
          backgroundColor: theme.colors.background.secondary,
          width: itemWidth,
          height: itemWidth,
        },
      ]}
      onPress={handlePress}
    >
      <View style={[styles.gridItemImageContainer, { height: itemWidth }]}>
        {item.imageId ? (
          <Image
            source={getImageSource(item.id, item.imageId)}
            style={styles.gridItemImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <MaterialIcons name="image-not-supported" size={48} color={theme.colors.text.secondary} />
          </View>
        )}
      </View>

      <View style={styles.gridItemInfo}>
        <Text style={styles.gridItemName} numberOfLines={1} ellipsizeMode="tail">
          {item.name}
        </Text>

        {item.location && (
          <Text style={styles.gridItemLocation} numberOfLines={1} ellipsizeMode="tail">
            {item.location.name}
          </Text>
        )}

        {getPreference('quantity') && (
          <View style={[
            styles.gridQuantityBadge,
            { backgroundColor: item.quantity > 0 ? theme.colors.success : theme.colors.error },
          ]}>
            <Text style={styles.gridQuantityText}>{item.quantity}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Memoized export to prevent unnecessary re-renders
export const InventoryGridItem = React.memo(InventoryGridItemComponent);

const styles = StyleSheet.create({
  gridItemContainer: {
    borderRadius: 3,
    overflow: 'hidden',
    margin: 0,
    position: 'relative',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItemImageContainer: {
    borderRadius: 3,
    overflow: 'hidden',
  },
  gridItemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 3,
  },
  gridItemInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  gridItemName: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  gridItemLocation: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  gridQuantityBadge: {
    position: 'absolute',
    top: -24,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridQuantityText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
});
