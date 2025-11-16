import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/ThemeContext';
import { InventoryItem } from '../../hooks/useInventoryData';
import { DisplayPreference } from '../../hooks/useDisplayPreferences';
import { getImageSource, formatDate } from '../../utils/imageUtils';

interface InventoryListItemProps {
  item: InventoryItem;
  displayPreferences: DisplayPreference[];
  listZoom: number;
  onPress: (itemId: string) => void;
}

const InventoryListItemComponent: React.FC<InventoryListItemProps> = ({
  item,
  displayPreferences,
  listZoom,
  onPress,
}) => {
  const { theme } = useTheme();

  const getPreference = (id: string): boolean => {
    const preference = displayPreferences.find(p => p.id === id);
    return preference?.enabled ?? false;
  };

  const hasDescription = getPreference('description') && item.description;
  const hasImage = getPreference('image') && item.imageId;
  const hasFooterContent =
    (getPreference('location') && item.location) ||
    (getPreference('labels') && item.labels.length > 0) ||
    (getPreference('purchasePrice') && item.purchasePrice && item.purchasePrice > 0) ||
    (getPreference('insured')) ||
    (getPreference('createdAt')) ||
    (getPreference('updatedAt'));

  // Compact view (listZoom === 0)
  if (listZoom === 0) {
    return (
      <TouchableOpacity
        style={[styles.itemContainer, { backgroundColor: theme.colors.background.secondary }]}
        onPress={() => onPress(item.id)}
      >
        <View style={styles.compactContent}>
          <View style={styles.compactHeader}>
            <View style={styles.compactTextContent}>
              <Text style={[styles.itemName, { color: theme.colors.text.primary }]}>
                {item.name}
              </Text>
            </View>
            {getPreference('quantity') && (
              <View style={[
                styles.quantityBadge,
                { backgroundColor: item.quantity > 0 ? theme.colors.success : theme.colors.error },
              ]}>
                <Text style={[styles.quantityText, { color: theme.colors.button.text }]}>
                  {item.quantity}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.compactDetails}>
            <View style={styles.compactDetailsRow}>
              <View style={styles.compactLeftContent}>
                {getPreference('location') && item.location && (
                  <View style={styles.compactLocation}>
                    <MaterialIcons name="location-on" size={16} color={theme.colors.text.secondary} style={styles.footerIcon} />
                    <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                      {item.location.name}
                    </Text>
                  </View>
                )}
                {getPreference('labels') && item.labels.length > 0 && (
                  <View style={styles.compactLabels}>
                    <MaterialIcons name="label" size={16} color={theme.colors.text.secondary} style={styles.footerIcon} />
                    <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                      {item.labels.map(label => label.name).join(', ')}
                    </Text>
                  </View>
                )}
                {hasImage && (
                  <MaterialIcons name="image" size={16} color={theme.colors.text.secondary} style={styles.compactImageIcon} />
                )}
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Standard view (listZoom === 1)
  if (listZoom === 1) {
    return (
      <TouchableOpacity
        style={[styles.itemContainer, { backgroundColor: theme.colors.background.secondary }]}
        onPress={() => onPress(item.id)}
      >
        <View style={styles.standardContent}>
          <View style={styles.standardRow}>
            {/* Text Section */}
            <View style={styles.standardTextSection}>
              <Text style={[styles.itemName, { color: theme.colors.text.primary }]}>
                {item.name}
              </Text>
              <View style={styles.standardDetails}>
                {getPreference('location') && item.location && (
                  <View style={styles.footerItem}>
                    <MaterialIcons name="location-on" size={16} color={theme.colors.text.secondary} style={styles.footerIcon} />
                    <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                      {item.location.name}
                    </Text>
                  </View>
                )}
                {getPreference('labels') && item.labels.length > 0 && (
                  <View style={styles.footerItem}>
                    <MaterialIcons name="label" size={16} color={theme.colors.text.secondary} style={styles.footerIcon} />
                    <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                      {item.labels.map(label => label.name).join(', ')}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Image Section */}
            {hasImage && (
              <View style={styles.standardImageSection}>
                <Image
                  source={getImageSource(item.id, item.imageId!)}
                  style={styles.standardImage}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Quantity Section */}
            {getPreference('quantity') && (
              <View style={[
                styles.standardQuantityBadge,
                { backgroundColor: item.quantity > 0 ? theme.colors.success : theme.colors.error },
              ]}>
                <Text style={[styles.quantityText, { color: theme.colors.button.text }]}>
                  {item.quantity}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Detailed view (listZoom === 2)
  return (
    <TouchableOpacity
      style={[styles.itemContainer, { backgroundColor: theme.colors.background.secondary }]}
      onPress={() => onPress(item.id)}
    >
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <View style={styles.detailedTextContent}>
            <Text style={[styles.itemName, { color: theme.colors.text.primary }]}>
              {item.name}
            </Text>
          </View>
          {getPreference('quantity') && (
            <View style={[
              styles.quantityBadge,
              { backgroundColor: item.quantity > 0 ? theme.colors.success : theme.colors.error },
            ]}>
              <Text style={[styles.quantityText, { color: theme.colors.button.text }]}>
                {item.quantity}
              </Text>
            </View>
          )}
        </View>

        {hasImage && (
          <View style={styles.imageContainer}>
            <Image
              source={getImageSource(item.id, item.imageId!)}
              style={styles.itemImage}
              resizeMode="cover"
            />
          </View>
        )}

        {hasDescription && (
          <Text style={[styles.itemDescription, { color: theme.colors.text.secondary }]}>
            {item.description}
          </Text>
        )}

        {hasFooterContent && (
          <View style={styles.itemFooter}>
            {getPreference('location') && item.location && (
              <View style={styles.footerItem}>
                <MaterialIcons name="location-on" size={16} color={theme.colors.text.secondary} style={styles.footerIcon} />
                <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                  {item.location.name}
                </Text>
              </View>
            )}
            {getPreference('labels') && item.labels.length > 0 && (
              <View style={styles.footerItem}>
                <MaterialIcons name="label" size={16} color={theme.colors.text.secondary} style={styles.footerIcon} />
                <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                  {item.labels.map(label => label.name).join(', ')}
                </Text>
              </View>
            )}
            {getPreference('purchasePrice') && item.purchasePrice && item.purchasePrice > 0 && (
              <View style={styles.footerItem}>
                <MaterialIcons name="attach-money" size={16} color={theme.colors.text.secondary} style={styles.footerIcon} />
                <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                  ${item.purchasePrice.toFixed(2)}
                </Text>
              </View>
            )}
            {getPreference('insured') && (
              <View style={styles.footerItem}>
                <MaterialIcons
                  name={item.insured ? 'verified' : 'error-outline'}
                  size={16}
                  color={theme.colors.text.secondary}
                  style={styles.footerIcon}
                />
                <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                  {item.insured ? 'Insured' : 'Uninsured'}
                </Text>
              </View>
            )}
            {getPreference('createdAt') && (
              <View style={styles.footerItem}>
                <MaterialIcons name="schedule" size={16} color={theme.colors.text.secondary} style={styles.footerIcon} />
                <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                  Created: {formatDate(item.createdAt)}
                </Text>
              </View>
            )}
            {getPreference('updatedAt') && (
              <View style={styles.footerItem}>
                <MaterialIcons name="update" size={16} color={theme.colors.text.secondary} style={styles.footerIcon} />
                <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                  Updated: {formatDate(item.updatedAt)}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Memoized export to prevent unnecessary re-renders
export const InventoryListItem = React.memo(InventoryListItemComponent);

const styles = StyleSheet.create({
  itemContainer: {
    borderRadius: 12,
    marginHorizontal: 5,
    marginVertical: 6,
    overflow: 'hidden',
    flex: 1,
  },
  itemContent: {
    padding: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  quantityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    right: 0,
  },
  quantityText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  itemDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  footerIcon: {
    marginRight: 4,
  },
  footerLabel: {
    fontSize: 12,
  },
  imageContainer: {
    marginVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  itemImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 4,
    marginBottom: 4,
  },
  compactContent: {
    padding: 8,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  compactTextContent: {
    flex: 1,
    marginRight: 32,
  },
  compactDetails: {
    marginTop: 2,
  },
  compactDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactLabels: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactImageIcon: {
    marginLeft: 1,
  },
  standardContent: {
    padding: 10,
  },
  standardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  standardTextSection: {
    flex: 1,
    marginRight: 8,
  },
  standardImageSection: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  standardImage: {
    width: '100%',
    height: '100%',
  },
  standardQuantityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  standardDetails: {
    flex: 1,
    marginRight: 8,
  },
  detailedTextContent: {
    flex: 1,
    marginRight: 40,
  },
});
