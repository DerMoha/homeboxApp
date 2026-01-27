import React, {useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import {useTheme} from '../theme/ThemeContext';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ServerService, {InventoryItem} from '../services/serverService';
import {logger} from '../utils/logger';
import {getImageSource} from '../utils/imageUtils';
import {useAsyncState} from '../hooks/useAsyncState';
import {LoadingState} from '../components/common/LoadingState';
import {ErrorState} from '../components/common/ErrorState';
import {EmptyState} from '../components/common/EmptyState';
import {LocationsStackParamList} from '../types/navigation';

type LocationItemsRouteProp = RouteProp<
  LocationsStackParamList,
  'LocationItems'
>;

type LocationItem = Pick<
  InventoryItem,
  'id' | 'name' | 'quantity' | 'insured' | 'purchasePrice' | 'archived'
> & {
  description?: string | null;
  imageId?: string | null;
};

type ThemeType = ReturnType<typeof useTheme>['theme'];

interface InfoChipProps {
  icon: string;
  label: string;
  tint?: string;
  background?: string;
  theme: ThemeType;
}

const InfoChip: React.FC<InfoChipProps> = ({
  icon,
  label,
  tint,
  background,
  theme,
}) => {
  const chipStyle = useMemo(
    () => [
      styles.infoChip,
      {
        backgroundColor: background ?? theme.colors.background.tertiary,
        borderColor: theme.colors.borderSubtle,
        borderRadius: theme.borderRadius.full,
      },
    ],
    [
      background,
      theme.borderRadius.full,
      theme.colors.background.tertiary,
      theme.colors.borderSubtle,
    ],
  );

  const textStyle = useMemo(
    () => [styles.infoChipText, {color: tint ?? theme.colors.text.secondary}],
    [tint, theme.colors.text.secondary],
  );

  return (
    <View style={chipStyle}>
      <MaterialIcons
        name={icon}
        size={14}
        color={tint ?? theme.colors.text.secondary}
      />
      <Text style={textStyle}>{label}</Text>
    </View>
  );
};

const LocationItemsScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<LocationsStackParamList>>();
  const route = useRoute<LocationItemsRouteProp>();
  const {locationId, locationName} = route.params;

  const {
    data: items,
    isLoading,
    refreshing,
    error,
    execute,
  } = useAsyncState<LocationItem[]>([]);

  const listContentStyle = useMemo(
    () => [
      styles.listContent,
      {paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.lg},
    ],
    [theme.spacing.lg, theme.spacing.md],
  );

  const itemContainerStyle = useMemo(
    () => [
      styles.itemContainer,
      {
        backgroundColor: theme.colors.card.background,
        borderColor: theme.colors.card.border,
        borderRadius: theme.borderRadius.lg,
      },
      theme.shadows.sm,
    ],
    [
      theme.borderRadius.lg,
      theme.colors.card.background,
      theme.colors.card.border,
      theme.shadows.sm,
    ],
  );

  const accentStripeStyle = useMemo(
    () => [styles.accentStripe, {backgroundColor: theme.colors.accent.primary}],
    [theme.colors.accent.primary],
  );

  const itemContentStyle = useMemo(
    () => [styles.itemContent, {padding: theme.spacing.md}],
    [theme.spacing.md],
  );

  const itemHeaderStyle = useMemo(
    () => [styles.itemHeader, {gap: theme.spacing.sm}],
    [theme.spacing.sm],
  );

  const itemNameStyle = useMemo(
    () => [
      styles.itemName,
      {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.lg,
      },
    ],
    [theme.colors.text.primary, theme.typography.sizes.lg],
  );

  const quantityBadgeStyle = useMemo(
    () => [
      styles.quantityBadge,
      {backgroundColor: theme.colors.accent.primary},
    ],
    [theme.colors.accent.primary],
  );

  const quantityTextStyle = useMemo(
    () => [
      styles.quantityText,
      {
        color: theme.colors.text.inverse,
        fontSize: theme.typography.sizes.sm,
      },
    ],
    [theme.colors.text.inverse, theme.typography.sizes.sm],
  );

  const itemDescriptionStyle = useMemo(
    () => [
      styles.itemDescription,
      {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.sm,
      },
    ],
    [theme.colors.text.secondary, theme.typography.sizes.sm],
  );

  const imageContainerStyle = useMemo(
    () => [
      styles.imageContainer,
      {
        backgroundColor: theme.colors.background.tertiary,
        borderRadius: theme.borderRadius.md,
        borderColor: theme.colors.borderSubtle,
      },
    ],
    [
      theme.borderRadius.md,
      theme.colors.background.tertiary,
      theme.colors.borderSubtle,
    ],
  );

  const imageStyle = useMemo(
    () => [styles.itemImage, {borderRadius: theme.borderRadius.md}],
    [theme.borderRadius.md],
  );

  const itemFooterStyle = useMemo(
    () => [styles.itemFooter, {gap: theme.spacing.xs}],
    [theme.spacing.xs],
  );

  const loadItems = useCallback(async () => {
    try {
      const serverService = ServerService.getInstance();
      const response = await serverService.getLocationItems(locationId);
      if (response.success && response.data) {
        return response.data.items;
      } else {
        throw new Error(response.error || 'Failed to load items');
      }
    } catch (err) {
      logger.error('Error loading location items:', err);
      throw err;
    }
  }, [locationId]);

  const onRefresh = useCallback(() => {
    execute(loadItems, {isRefresh: true});
  }, [execute, loadItems]);

  const renderItem = ({item}: {item: LocationItem}): React.ReactElement => {
    return (
      <TouchableOpacity style={itemContainerStyle} activeOpacity={0.75}>
        <View style={accentStripeStyle} />
        <View style={itemContentStyle}>
          <View style={itemHeaderStyle}>
            <Text style={itemNameStyle}>{item.name}</Text>
            <View style={quantityBadgeStyle}>
              <Text style={quantityTextStyle}>{item.quantity}</Text>
            </View>
          </View>

          {!!item.description && (
            <Text style={itemDescriptionStyle}>{item.description}</Text>
          )}

          {item.imageId && (
            <View style={imageContainerStyle}>
              <Image
                source={getImageSource(item.id, item.imageId)}
                style={imageStyle}
                resizeMode="cover"
              />
            </View>
          )}

          <View style={itemFooterStyle}>
            {item.purchasePrice > 0 && (
              <InfoChip
                icon="attach-money"
                label={`$${item.purchasePrice.toFixed(2)}`}
                theme={theme}
              />
            )}
            <InfoChip
              icon={item.insured ? 'verified' : 'error-outline'}
              label={item.insured ? 'Insured' : 'Uninsured'}
              tint={
                item.insured
                  ? theme.colors.success
                  : theme.colors.text.secondary
              }
              background={
                item.insured
                  ? theme.colors.accent.muted
                  : theme.colors.background.tertiary
              }
              theme={theme}
            />
            {item.archived && (
              <InfoChip
                icon="archive"
                label="Archived"
                tint={theme.colors.text.tertiary}
                theme={theme}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    execute(loadItems);
  }, [execute, loadItems]);

  useEffect(() => {
    navigation.setOptions({title: locationName});
  }, [locationName, navigation]);

  if (isLoading) {
    return <LoadingState message="Loading items..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => execute(loadItems)} />;
  }

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      contentContainerStyle={listContentStyle}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.button.primary]}
        />
      }
      ListEmptyComponent={
        <EmptyState
          message="No items in this location"
          subtitle="Items you add here will show up in this list."
          icon="inventory"
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingTop: 12,
  },
  itemContainer: {
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
  },
  accentStripe: {
    width: 4,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemName: {
    fontWeight: '600',
    flex: 1,
  },
  quantityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  quantityText: {
    fontWeight: '600',
  },
  itemDescription: {
    marginBottom: 12,
  },
  imageContainer: {
    marginVertical: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  itemImage: {
    width: '100%',
    height: 200,
  },
  itemFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  infoChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default LocationItemsScreen;
