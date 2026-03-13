import React, {useMemo, useCallback} from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../theme/ThemeContext';
import type {Theme} from '../../theme/theme';
import {InventoryItem} from '../../types';
import {
  DisplayPreference,
  isPreferenceEnabled,
} from '../../hooks/useDisplayPreferences';
import {getImageSource, formatDate} from '../../utils/imageUtils';
import {QuantityBadge, MetaItem, ItemCardBase} from './shared';
import {hapticImpact} from '../../utils/haptics';

interface InventoryListItemProps {
  item: InventoryItem;
  displayPreferences: DisplayPreference[];
  listZoom: number;
  onPress: (itemId: string) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (itemId: string) => void;
  onLongPress?: (itemId: string) => void;
}

const ItemNameText: React.FC<{
  name: string;
  size?: 'md' | 'lg' | 'xl';
  theme: Theme;
}> = ({name, size = 'lg', theme}) => (
  <Text
    style={[
      styles.itemName,
      {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes[size],
        fontWeight: theme.typography.weights.semibold,
        fontFamily: theme.typography.fonts.semibold,
      },
    ]}
    numberOfLines={1}>
    {name}
  </Text>
);

const InventoryListItemComponent: React.FC<InventoryListItemProps> = ({
  item,
  displayPreferences,
  listZoom,
  onPress,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelection,
  onLongPress,
}) => {
  const {theme} = useTheme();

  const hasDescription = useMemo(
    () =>
      isPreferenceEnabled(displayPreferences, 'description') &&
      item.description,
    [displayPreferences, item.description],
  );

  const hasImage = useMemo(
    () => isPreferenceEnabled(displayPreferences, 'image') && item.imageId,
    [displayPreferences, item.imageId],
  );

  const hasFooterContent = useMemo(
    () =>
      (isPreferenceEnabled(displayPreferences, 'location') && item.location) ||
      (isPreferenceEnabled(displayPreferences, 'labels') &&
        item.labels.length > 0) ||
      (isPreferenceEnabled(displayPreferences, 'purchasePrice') &&
        item.purchasePrice &&
        item.purchasePrice > 0) ||
      isPreferenceEnabled(displayPreferences, 'insured') ||
      isPreferenceEnabled(displayPreferences, 'createdAt') ||
      isPreferenceEnabled(displayPreferences, 'updatedAt'),
    [displayPreferences, item.location, item.labels.length, item.purchasePrice],
  );

  const handlePress = useCallback(() => {
    if (isSelectionMode && onToggleSelection) {
      hapticImpact('light');
      onToggleSelection(item.id);
    } else {
      onPress(item.id);
    }
  }, [isSelectionMode, onToggleSelection, onPress, item.id]);

  const handleLongPress = useCallback(() => {
    onLongPress?.(item.id);
  }, [item.id, onLongPress]);

  const cardStyle = useMemo(
    () => ({
      marginHorizontal: theme.spacing.sm,
      marginVertical: theme.spacing.xs,
    }),
    [theme.spacing.sm, theme.spacing.xs],
  );

  const showQuantity = isPreferenceEnabled(displayPreferences, 'quantity');

  if (listZoom === 0) {
    return (
      <ItemCardBase
        theme={theme}
        style={cardStyle}
        onPress={handlePress}
        onLongPress={handleLongPress}
        isSelected={isSelected}
        isSelectionMode={isSelectionMode}>
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <ItemNameText name={item.name} theme={theme} />
          </View>
          {showQuantity && (
            <QuantityBadge quantity={item.quantity} theme={theme} />
          )}
        </View>
        <View style={[styles.metaRow, {marginTop: theme.spacing.xs}]}>
          {isPreferenceEnabled(displayPreferences, 'location') &&
            item.location && (
              <MetaItem
                icon="location-on"
                text={item.location.name}
                theme={theme}
              />
            )}
          {isPreferenceEnabled(displayPreferences, 'labels') &&
            item.labels.length > 0 && (
              <MetaItem
                icon="label"
                text={item.labels.map(l => l.name).join(', ')}
                theme={theme}
              />
            )}
          {hasImage && (
            <MaterialIcons
              name="image"
              size={14}
              color={theme.colors.text.tertiary}
            />
          )}
        </View>
      </ItemCardBase>
    );
  }

  if (listZoom === 1) {
    return (
      <ItemCardBase
        theme={theme}
        style={cardStyle}
        onPress={handlePress}
        onLongPress={handleLongPress}
        isSelected={isSelected}
        isSelectionMode={isSelectionMode}>
        <View style={[styles.standardRow, {gap: theme.spacing.md}]}>
          <View style={styles.textSection}>
            <ItemNameText name={item.name} theme={theme} />
            <View style={[styles.metaRow, {marginTop: theme.spacing.xs}]}>
              {isPreferenceEnabled(displayPreferences, 'location') &&
                item.location && (
                  <MetaItem
                    icon="location-on"
                    text={
                      item.location.itemCount
                        ? `${item.location.name} (${item.location.itemCount})`
                        : item.location.name
                    }
                    theme={theme}
                  />
                )}
              {isPreferenceEnabled(displayPreferences, 'labels') &&
                item.labels.length > 0 && (
                  <MetaItem
                    icon="label"
                    text={item.labels.map(l => l.name).join(', ')}
                    theme={theme}
                  />
                )}
            </View>
          </View>
          {hasImage && (
            <View
              style={[
                styles.thumbnail,
                {
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: theme.colors.background.tertiary,
                },
              ]}>
              <Image
                source={getImageSource(item.id, item.imageId!)}
                style={[
                  styles.thumbnailImage,
                  {borderRadius: theme.borderRadius.md},
                ]}
                resizeMode="cover"
              />
            </View>
          )}
          {showQuantity && (
            <QuantityBadge quantity={item.quantity} theme={theme} />
          )}
        </View>
      </ItemCardBase>
    );
  }

  return (
    <ItemCardBase
      theme={theme}
      style={cardStyle}
      onPress={handlePress}
      onLongPress={handleLongPress}
      isSelected={isSelected}
      isSelectionMode={isSelectionMode}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <ItemNameText name={item.name} size="xl" theme={theme} />
        </View>
        {showQuantity && (
          <QuantityBadge quantity={item.quantity} theme={theme} />
        )}
      </View>

      {hasImage && (
        <View
          style={[
            styles.imageContainer,
            {
              marginVertical: theme.spacing.sm,
              borderRadius: theme.borderRadius.md,
            },
          ]}>
          <Image
            source={getImageSource(item.id, item.imageId!)}
            style={[styles.fullImage, {borderRadius: theme.borderRadius.md}]}
            resizeMode="cover"
          />
        </View>
      )}

      {hasDescription && (
        <Text
          style={[
            styles.description,
            {
              color: theme.colors.text.secondary,
              fontSize: theme.typography.sizes.md,
              marginBottom: theme.spacing.sm,
              fontFamily: theme.typography.fonts.regular,
            },
          ]}>
          {item.description}
        </Text>
      )}

      {hasFooterContent && (
        <View
          style={[
            styles.metaRow,
            styles.metaRowWrap,
            {gap: theme.spacing.xs, marginTop: theme.spacing.xs},
          ]}>
          {isPreferenceEnabled(displayPreferences, 'location') &&
            item.location && (
              <MetaItem
                icon="location-on"
                text={
                  item.location.itemCount
                    ? `${item.location.name} (${item.location.itemCount})`
                    : item.location.name
                }
                theme={theme}
              />
            )}
          {isPreferenceEnabled(displayPreferences, 'labels') &&
            item.labels.length > 0 && (
              <MetaItem
                icon="label"
                text={item.labels.map(l => l.name).join(', ')}
                theme={theme}
              />
            )}
          {isPreferenceEnabled(displayPreferences, 'purchasePrice') &&
            item.purchasePrice &&
            item.purchasePrice > 0 && (
              <MetaItem
                icon="attach-money"
                text={`$${item.purchasePrice.toFixed(2)}`}
                theme={theme}
              />
            )}
          {isPreferenceEnabled(displayPreferences, 'insured') && (
            <MetaItem
              icon={item.insured ? 'verified' : 'error-outline'}
              text={item.insured ? 'Insured' : 'Uninsured'}
              theme={theme}
            />
          )}
          {isPreferenceEnabled(displayPreferences, 'createdAt') && (
            <MetaItem
              icon="schedule"
              text={`Created: ${formatDate(item.createdAt)}`}
              theme={theme}
            />
          )}
          {isPreferenceEnabled(displayPreferences, 'updatedAt') && (
            <MetaItem
              icon="update"
              text={`Updated: ${formatDate(item.updatedAt)}`}
              theme={theme}
            />
          )}
        </View>
      )}
    </ItemCardBase>
  );
};

export const InventoryListItem = React.memo(InventoryListItemComponent);

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaRowWrap: {
    flexWrap: 'wrap',
  },
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
  description: {},
});
