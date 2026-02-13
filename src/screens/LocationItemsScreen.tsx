import React, {useEffect, useCallback} from 'react';
import {FlatList, StyleSheet} from 'react-native';
import {RefreshControl} from 'react-native';
import {useTheme} from '../theme/ThemeContext';
import {
  useNavigation,
  useRoute,
  RouteProp,
  NavigationProp,
} from '@react-navigation/native';
import ServerService from '../services/serverService';
import {logger} from '../utils/logger';
import {useAsyncState} from '../hooks/useAsyncState';
import {LoadingState} from '../components/common/LoadingState';
import {ErrorState} from '../components/common/ErrorState';
import {EmptyState} from '../components/common/EmptyState';
import {InventoryListItem} from '../components/Inventory';
import {InventoryItem} from '../types';
import {DisplayPreference} from '../hooks/useDisplayPreferences';
import {LocationsStackParamList} from '../types/navigation';
import {NavigatorScreenParams} from '@react-navigation/native';

type LocationItemsRouteProp = RouteProp<
  LocationsStackParamList,
  'LocationItems'
>;

type RootTabParamList = {
  Home: undefined;
  InventoryTab:
    | {screen?: 'Inventory' | 'ItemDetail'; params?: {itemId?: string}}
    | undefined;
  AddItemTab: undefined;
  Locations: NavigatorScreenParams<LocationsStackParamList> | undefined;
  SettingsTab: undefined;
};

const LocationItemsScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const route = useRoute<LocationItemsRouteProp>();
  const {locationId, locationName} = route.params;

  const {
    data: items,
    isLoading,
    refreshing,
    error,
    execute,
  } = useAsyncState<InventoryItem[]>([]);

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
      logger.error('Error loading location items:', {error: err});
      throw err;
    }
  }, [locationId]);

  const onRefresh = useCallback(() => {
    execute(loadItems, {isRefresh: true});
  }, [execute, loadItems]);

  const handleItemPress = useCallback(
    (itemId: string) => {
      navigation.navigate('InventoryTab', {
        screen: 'ItemDetail',
        params: {itemId},
      });
    },
    [navigation],
  );

  const renderItem = ({item}: {item: InventoryItem}): React.ReactElement => {
    const displayPreferences: DisplayPreference[] = [
      {id: 'quantity', label: 'Quantity', enabled: true},
      {id: 'purchasePrice', label: 'Purchase Price', enabled: true},
      {id: 'insured', label: 'Insured', enabled: true},
    ];
    return (
      <InventoryListItem
        item={item}
        displayPreferences={displayPreferences}
        listZoom={1}
        onPress={handleItemPress}
      />
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
      contentContainerStyle={styles.listContent}
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
});

export default LocationItemsScreen;
