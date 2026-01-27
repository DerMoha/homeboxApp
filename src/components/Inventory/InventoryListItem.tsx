import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/ThemeContext';
import type { Theme } from '../../theme/theme';
import { InventoryItem } from '../../hooks/useInventoryData';
import { DisplayPreference } from '../../hooks/useDisplayPreferences';
import { getImageSource, formatDate } from '../../utils/imageUtils';

interface InventoryListItemProps {
  item: InventoryItem;
  displayPreferences: DisplayPreference[];
  listZoom: number;
  onPress: (itemId: string) => void;
}

interface MetaItemProps {
  icon: string;
  text: string;
  theme: Theme;
}

const MetaItem: React.FC<MetaItemProps> = ({ icon, text, theme }) => (
  <View style={styles.metaItem}>
    <MaterialIcons
      name={icon}
      size={14}
      color={theme.colors.text.tertiary}
      style={styles.metaIcon}
    />
    <Text style={[styles.metaText, { color: theme.colors.text.tertiary, fontSize: theme.typography.sizes.sm }]}>
      {text}
    </Text>
  </View>
);

interface QuantityBadgeProps {
  quantity: number;
  theme: Theme;
  style?: object;
}

const QuantityBadge: React.FC<QuantityBadgeProps> = ({ quantity, theme, style }) => (
  <View
    style={[
      styles.quantityBadge,
      {
        backgroundColor: quantity > 0 ? theme.colors.accent.primary : theme.colors.error,
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
      },
      style,
    ]}
  >
    <Text
      style={{
        color: theme.colors.text.inverse,
        fontSize: theme.typography.sizes.sm,
        fontWeight: theme.typography.weights.bold,
      }}
    >
      {quantity}
    </Text>
  </View>
);

const InventoryListItemComponent: React.FC<InventoryListItemProps> = ({
  item,
  displayPreferences,
  listZoom,
  onPress,
}) => {
  const { theme } = useTheme();

  const getPreference = useCallback(
    (id: string): boolean => displayPreferences.find((p) => p.id === id)?.enabled ?? false,
    [displayPreferences]
  );

  const hasDescription = useMemo(
    () => getPreference('description') && item.description,
    [getPreference, item.description]
  );

  const hasImage = useMemo(
    () => getPreference('image') && item.imageId,
    [getPreference, item.imageId]
  );

  const hasFooterContent = useMemo(
    () =>
      (getPreference('location') && item.location) ||
      (getPreference('labels') && item.labels.length > 0) ||
      (getPreference('purchasePrice') && item.purchasePrice && item.purchasePrice > 0) ||
      getPreference('insured') ||
      getPreference('createdAt') ||
      getPreference('updatedAt'),
    [getPreference, item.location, item.labels.length, item.purchasePrice]
  );

  const handlePress = useCallback(() => onPress(item.id), [onPress, item.id]);

  const containerStyle = [
    styles.container,
    {
      backgroundColor: theme.colors.card.background,
      borderRadius: theme.borderRadius.lg,
      marginHorizontal: theme.spacing.sm,
      marginVertical: theme.spacing.xs,
      borderWidth: 1,
      borderColor: theme.colors.card.border,
    },
    theme.shadows.sm,
  ];

  const AccentStripe = (
    <View
      style={[
        styles.accentStripe,
        {
          backgroundColor: theme.colors.accent.primary,
          borderTopLeftRadius: theme.borderRadius.lg,
          borderBottomLeftRadius: theme.borderRadius.lg,
        },
      ]}
    />
  );

  const ItemName: React.FC<{ size?: 'md' | 'lg' | 'xl' }> = ({ size = 'lg' }) => (
    <Text
      style={[
        styles.itemName,
        {
          color: theme.colors.text.primary,
          fontSize: theme.typography.sizes[size],
          fontWeight: theme.typography.weights.semibold,
        },
      ]}
      numberOfLines={1}
    >
      {item.name}
    </Text>
  );

  // Compact View (listZoom === 0)
  if (listZoom === 0) {
    return (
      <TouchableOpacity style={containerStyle} onPress={handlePress} activeOpacity={0.7}>
        {AccentStripe}
        <View style={[styles.content, { paddingLeft: theme.spacing.md, paddingVertical: theme.spacing.sm, paddingRight: theme.spacing.sm }]}>
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <ItemName />
            </View>
            {getPreference('quantity') && <QuantityBadge quantity={item.quantity} theme={theme} />}
          </View>
          <View style={[styles.metaRow, { gap: theme.spacing.sm, marginTop: theme.spacing.xs }]}>
            {getPreference('location') && item.location && (
              <MetaItem icon="location-on" text={item.location.name} theme={theme} />
            )}
            {getPreference('labels') && item.labels.length > 0 && (
              <MetaItem icon="label" text={item.labels.map((l) => l.name).join(', ')} theme={theme} />
            )}
            {hasImage && <MaterialIcons name="image" size={14} color={theme.colors.text.tertiary} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Standard View (listZoom === 1)
  if (listZoom === 1) {
    return (
      <TouchableOpacity style={containerStyle} onPress={handlePress} activeOpacity={0.7}>
        {AccentStripe}
        <View style={[styles.content, { paddingLeft: theme.spacing.md, paddingVertical: theme.spacing.sm, paddingRight: theme.spacing.sm }]}>
          <View style={[styles.standardRow, { gap: theme.spacing.md }]}>
            <View style={styles.textSection}>
              <ItemName />
              <View style={[styles.metaRow, { marginTop: theme.spacing.xs }]}>
                {getPreference('location') && item.location && (
                  <MetaItem icon="location-on" text={item.location.name} theme={theme} />
                )}
                {getPreference('labels') && item.labels.length > 0 && (
                  <MetaItem icon="label" text={item.labels.map((l) => l.name).join(', ')} theme={theme} />
                )}
              </View>
            </View>
            {hasImage && (
              <View style={[styles.thumbnail, { borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.background.tertiary }]}>
                <Image
                  source={getImageSource(item.id, item.imageId!)}
                  style={[styles.thumbnailImage, { borderRadius: theme.borderRadius.md }]}
                  resizeMode="cover"
                />
              </View>
            )}
            {getPreference('quantity') && <QuantityBadge quantity={item.quantity} theme={theme} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Detailed View (listZoom === 2)
  return (
    <TouchableOpacity style={containerStyle} onPress={handlePress} activeOpacity={0.7}>
      {AccentStripe}
      <View style={[styles.content, { padding: theme.spacing.md, paddingLeft: theme.spacing.md + 4 }]}>
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <ItemName size="xl" />
          </View>
          {getPreference('quantity') && (
            <QuantityBadge quantity={item.quantity} theme={theme} style={{ position: 'absolute', top: 0, right: 0 }} />
          )}
        </View>

        {hasImage && (
          <View style={[styles.imageContainer, { marginVertical: theme.spacing.sm, borderRadius: theme.borderRadius.md }]}>
            <Image
              source={getImageSource(item.id, item.imageId!)}
              style={[styles.fullImage, { borderRadius: theme.borderRadius.md }]}
              resizeMode="cover"
            />
          </View>
        )}

        {hasDescription && (
          <Text style={{ color: theme.colors.text.secondary, fontSize: theme.typography.sizes.md, marginBottom: theme.spacing.sm }}>
            {item.description}
          </Text>
        )}

        {hasFooterContent && (
          <View style={[styles.metaRow, { flexWrap: 'wrap', gap: theme.spacing.xs, marginTop: theme.spacing.xs }]}>
            {getPreference('location') && item.location && <MetaItem icon="location-on" text={item.location.name} theme={theme} />}
            {getPreference('labels') && item.labels.length > 0 && <MetaItem icon="label" text={item.labels.map((l) => l.name).join(', ')} theme={theme} />}
            {getPreference('purchasePrice') && item.purchasePrice && item.purchasePrice > 0 && (
              <MetaItem icon="attach-money" text={`$${item.purchasePrice.toFixed(2)}`} theme={theme} />
            )}
            {getPreference('insured') && <MetaItem icon={item.insured ? 'verified' : 'error-outline'} text={item.insured ? 'Insured' : 'Uninsured'} theme={theme} />}
            {getPreference('createdAt') && <MetaItem icon="schedule" text={`Created: ${formatDate(item.createdAt)}`} theme={theme} />}
            {getPreference('updatedAt') && <MetaItem icon="update" text={`Updated: ${formatDate(item.updatedAt)}`} theme={theme} />}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const InventoryListItem = React.memo(InventoryListItemComponent);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flex: 1,
    flexDirection: 'row',
  },
  accentStripe: {
    width: 3,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginRight: 40,
  },
  itemName: {
    flex: 1,
  },
  quantityBadge: {
    minWidth: 32,
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginRight: 4,
  },
  metaText: {},
  standardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textSection: {
    flex: 1,
    marginRight: 8,
  },
  thumbnail: {
    width: 72,
    height: 72,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  imageContainer: {
    overflow: 'hidden',
  },
  fullImage: {
    width: '100%',
    aspectRatio: 1,
  },
});
