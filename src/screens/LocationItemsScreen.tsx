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

interface LocationNode {
  id: string;
  name: string;
  type: string;
  children: LocationNode[];
}

interface ApiInventoryItem {
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
  labels?: Array<{ id: string; name: string }>;
}

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  locationId: string;
  imageId: string | null;
  purchasePrice: number;
  insured: boolean;
  archived: boolean;
  labels: Array<{ id: string; name: string }>;
  createdAt?: string;
  updatedAt?: string;
}

const LocationItemsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<LocationItemsRouteProp>();
  const { locationId, locationName } = route.params;
  
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [childLocations, setChildLocations] = useState<LocationNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const service = ServerService.getInstance();
      
      // Load child locations
      const treeResponse = await service.getLocationTree();
      if (treeResponse.success && treeResponse.data) {
        const findChildLocations = (nodes: LocationNode[]): LocationNode[] => {
          for (const node of nodes) {
            if (node.id === locationId) {
              return node.children || [];
            }
            const children = findChildLocations(node.children || []);
            if (children.length > 0) {
              return children;
            }
          }
          return [];
        };
        setChildLocations(findChildLocations(treeResponse.data));
      }

      // Load items
      const result = await service.getLocationItems(locationId);
      if (result.success && result.data) {
        // Ensure each item has the required properties
        const itemsWithRequiredProps = (result.data.items as ApiInventoryItem[]).map(item => ({
          ...item,
          locationId: locationId,
          labels: item.labels || []
        }));
        setItems(itemsWithRequiredProps);
        setError(null);
      } else {
        setError(result.error || 'Failed to load items');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = (): void => {
    setRefreshing(true);
    loadData();
  };

  const getImageUrl = (itemId: string, imageId: string): string => {
    const service = ServerService.getInstance();
    const axiosInstance = service.getAxiosInstance();
    if (!axiosInstance) {
      return '';
    }
    return `${service.getBaseUrl()}/api/v1/items/${itemId}/attachments/${imageId}`;
  };

  const handleLocationPress = (locationId: string, locationName: string) => {
    navigation.push('LocationItems', { 
      locationId,
      locationName
    });
  };

  const renderLocation = ({ item }: { item: LocationNode }): React.ReactElement => {
    return (
      <TouchableOpacity
        style={[styles.locationContainer, { backgroundColor: theme.colors.background.secondary }]}
        onPress={() => handleLocationPress(item.id, item.name)}
      >
        <View style={styles.locationContent}>
          <View style={styles.locationHeader}>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={theme.colors.text.primary}
              style={styles.locationIcon}
            />
            <Text style={[styles.locationName, { color: theme.colors.text.primary }]}>
              {item.name}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
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
                    'Authorization': `Bearer ${ServerService.getInstance().getAxiosInstance()?.defaults.headers.common['Authorization']}`
                  }
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
                name={item.insured ? "verified" : "error-outline"} 
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
    loadData();
  }, [locationId]);

  useEffect(() => {
    navigation.setOptions({
      title: locationName,
    });
  }, [locationName]);

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
          onPress={loadData}
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
      data={[...childLocations, ...items]}
      renderItem={({ item }) => {
        if ('type' in item) {
          return renderLocation({ item: item as LocationNode });
        }
        return renderItem({ item: item as InventoryItem });
      }}
      keyExtractor={(item) => 'type' in item ? item.id : item.id}
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
            No items or sub-locations found
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
  locationContainer: {
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  locationContent: {
    padding: 12,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    marginRight: 8,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
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