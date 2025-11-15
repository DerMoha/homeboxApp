import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ServerService from '../services/serverService';

type RootStackParamList = {
  LocationItems: { locationId: string; locationName: string };
};

type LocationItemsRouteProp = RouteProp<RootStackParamList, 'LocationItems'>;

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  imageId: string | null;
  insured: boolean;
  purchasePrice: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

const LocationItemsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<LocationItemsRouteProp>();
  const { locationId, locationName } = route.params;

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async (): Promise<void> => {
    try {
      const service = ServerService.getInstance();
      const result = await service.getLocationItems(locationId);
      if (result.success && result.data) {
        // result.data is InventoryResponse, already filtered by locationId
        setItems(result.data.items);
        setError(null);
      } else {
        setError(result.error || 'Failed to load items');
      }
    } catch (err) {
      console.error('Error loading items:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [locationId]);

  const onRefresh = (): void => {
    setRefreshing(true);
    loadItems();
  };

  const getImageUrl = (itemId: string, imageId: string): string => {
    const service = ServerService.getInstance();
    const axiosInstance = service.getAxiosInstance();
    if (!axiosInstance) {
      return '';
    }
    return `${service.getBaseUrl()}/api/v1/items/${itemId}/attachments/${imageId}`;
  };

  const renderItem = ({ item }: { item: InventoryItem }): React.ReactElement => {
    return (
      <TouchableOpacity
        style={[styles.itemContainer, { backgroundColor: theme.colors.background.secondary }]}
      >
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={[styles.itemName, { color: theme.colors.text.primary }]}>
              {item.name}
            </Text>
            <View style={[styles.quantityBadge, { backgroundColor: theme.colors.button.primary }]}>
              <Text style={[styles.quantityText, { color: theme.colors.button.text }]}>
                {item.quantity}
              </Text>
            </View>
          </View>

          {item.description && (
            <Text style={[styles.itemDescription, { color: theme.colors.text.secondary }]}>
              {item.description}
            </Text>
          )}

          {item.imageId && (
            <View style={styles.imageContainer}>
              <Image
                source={{
                  uri: getImageUrl(item.id, item.imageId),
                  headers: {
                    'Authorization': `Bearer ${ServerService.getInstance().getAxiosInstance()?.defaults.headers.common.Authorization}`,
                  },
                }}
                style={styles.itemImage}
                resizeMode="cover"
              />
            </View>
          )}

          <View style={styles.itemFooter}>
            {item.purchasePrice > 0 && (
              <View style={styles.footerItem}>
                <MaterialIcons name="attach-money" size={16} color={theme.colors.text.secondary} style={styles.footerIcon} />
                <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                  ${item.purchasePrice.toFixed(2)}
                </Text>
              </View>
            )}
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
            {item.archived && (
              <View style={styles.footerItem}>
                <MaterialIcons name="archive" size={16} color={theme.colors.text.secondary} style={styles.footerIcon} />
                <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                  Archived
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    navigation.setOptions({
      title: locationName,
    });
  }, [locationName, navigation]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.button.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>Error: {error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.button.primary }]}
          onPress={loadItems}
        >
          <Text style={[styles.retryButtonText, { color: theme.colors.button.text }]}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.button.primary]}
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
            No items found in this location
          </Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  itemContainer: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  itemContent: {
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 18,
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
    color: '#FFFFFF',
    fontWeight: '600',
  },
  itemDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  imageContainer: {
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  itemImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerIcon: {
    marginRight: 8,
  },
  footerLabel: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: 120,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default LocationItemsScreen;
