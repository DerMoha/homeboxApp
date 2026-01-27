import React, {useEffect, useCallback} from 'react';
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

  const InfoChip: React.FC<{
    icon: string;
    label: string;
    tint?: string;
    background?: string;
  }> = ({icon, label, tint, background}) => (
    <View
      style={[
        styles.infoChip,
        {
          backgroundColor: background ?? theme.colors.background.tertiary,
          borderColor: theme.colors.borderSubtle,
          borderRadius: theme.borderRadius.full,
        },
      ]}>
      <MaterialIcons
        name={icon}
        size={14}
        color={tint ?? theme.colors.text.secondary}
      />
      <Text
        style={[
          styles.infoChipText,
          {color: tint ?? theme.colors.text.secondary},
        ]}>
        {label}
      </Text>
    </View>
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
      <TouchableOpacity
        style={[
          styles.itemContainer,
          {
            backgroundColor: theme.colors.card.background,
            borderColor: theme.colors.card.border,
            borderRadius: theme.borderRadius.lg,
          },
          theme.shadows.sm,
        ]}
        activeOpacity={0.75}>
        <View
          style={[
            styles.accentStripe,
            {backgroundColor: theme.colors.accent.primary},
          ]}
        />
        <View style={[styles.itemContent, {padding: theme.spacing.md}]}>
          <View style={[styles.itemHeader, {gap: theme.spacing.sm}]}>
            <Text
              style={[
                styles.itemName,
                {
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.sizes.lg,
                },
              ]}>
              {item.name}
            </Text>
            <View
              style={[
                styles.quantityBadge,
                {backgroundColor: theme.colors.accent.primary},
              ]}>
              <Text
                style={[
                  styles.quantityText,
                  {
                    color: theme.colors.text.inverse,
                    fontSize: theme.typography.sizes.sm,
                  },
                ]}>
                {item.quantity}
              </Text>
            </View>
          </View>

          {!!item.description && (
            <Text
              style={[
                styles.itemDescription,
                {
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.sizes.sm,
                },
              ]}>
              {item.description}
            </Text>
          )}

          {item.imageId && (
            <View
              style={[
                styles.imageContainer,
                {
                  backgroundColor: theme.colors.background.tertiary,
                  borderRadius: theme.borderRadius.md,
                  borderColor: theme.colors.borderSubtle,
                },
              ]}>
              <Image
                source={getImageSource(item.id, item.imageId)}
                style={[
                  styles.itemImage,
                  {borderRadius: theme.borderRadius.md},
                ]}
                resizeMode="cover"
              />
            </View>
          )}

          <View style={[styles.itemFooter, {gap: theme.spacing.xs}]}>
            {item.purchasePrice > 0 && (
              <InfoChip
                icon="attach-money"
                label={`$${item.purchasePrice.toFixed(2)}`}
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
            />
            {item.archived && (
              <InfoChip
                icon="archive"
                label="Archived"
                tint={theme.colors.text.tertiary}
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
      contentContainerStyle={[
        styles.listContent,
        {paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.lg},
      ]}
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
