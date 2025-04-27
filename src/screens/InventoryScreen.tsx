import React, { useState, useEffect } from 'react';
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
import ServerService from '../services/serverService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Inventory: undefined;
  InventorySettings: undefined;
  SettingsTab: {
    screen: string;
    params?: {
      screen: string;
    };
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Inventory'>;

interface Label {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface Location {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  location: Location | null;
  labels: Label[];
  archived: boolean;
  assetId: string;
  createdAt: string;
  updatedAt: string;
  imageId: string | null;
  insured: boolean;
  purchasePrice: number;
}

interface InventoryResponse {
  items: InventoryItem[];
  page: number;
  pageSize: number;
  total: number;
}

interface DisplayPreference {
  id: string;
  label: string;
  enabled: boolean;
}

const InventoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayPreferences, setDisplayPreferences] = useState<DisplayPreference[]>([]);

  const loadDisplayPreferences = async () => {
    try {
      const savedPreferences = await AsyncStorage.getItem(STORAGE_KEYS.INVENTORY_DISPLAY_PREFERENCES);
      if (savedPreferences) {
        const parsedPreferences = JSON.parse(savedPreferences);
        console.log('Loaded display preferences:', parsedPreferences.map((p: DisplayPreference) => ({
          id: p.id,
          enabled: p.enabled
        })));
        setDisplayPreferences(parsedPreferences);
      } else {
        // Use default preferences if none saved
        const defaultPreferences = [
          { id: 'quantity', label: 'Quantity', enabled: true },
          { id: 'location', label: 'Location', enabled: true },
          { id: 'labels', label: 'Labels', enabled: true },
          { id: 'description', label: 'Description', enabled: true },
          { id: 'purchasePrice', label: 'Purchase Price', enabled: false },
          { id: 'insured', label: 'Insurance Status', enabled: false },
          { id: 'archived', label: 'Archive Status', enabled: false },
          { id: 'createdAt', label: 'Created Date', enabled: false },
          { id: 'updatedAt', label: 'Last Updated', enabled: false },
          { id: 'image', label: 'Image', enabled: true },
        ];
        console.log('Using default preferences:', defaultPreferences.map(p => ({
          id: p.id,
          enabled: p.enabled
        })));
        setDisplayPreferences(defaultPreferences);
        // Save default preferences
        await AsyncStorage.setItem(STORAGE_KEYS.INVENTORY_DISPLAY_PREFERENCES, JSON.stringify(defaultPreferences));
      }
    } catch (error) {
      console.error('Error loading display preferences:', error);
    }
  };

  const initializeScreen = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to auto-connect to last used server
      const serverService = ServerService.getInstance();
      const autoConnectResult = await serverService.autoConnect();

      if (!autoConnectResult.success) {
        // If auto-connect fails, navigate to settings and then to server config
        navigation.navigate('SettingsTab', {
          screen: 'Settings',
          params: {
            screen: 'ServerConfig'
          }
        });
        return;
      }

      // Load preferences and inventory
      await loadDisplayPreferences();
      await loadInventory();
    } catch (error) {
      console.error('Error initializing screen:', error);
      setError('Failed to initialize screen');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    initializeScreen();
  }, []);

  // Listen for preference changes from InventorySettingsScreen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Only reload preferences if we're coming from InventorySettings
      if (navigation.getState().routes[navigation.getState().index - 1]?.name === 'InventorySettings') {
        loadDisplayPreferences();
      }
    });

    return unsubscribe;
  }, [navigation]);

  const getPreference = (id: string): boolean => {
    const preference = displayPreferences.find(p => p.id === id);
    return preference?.enabled ?? false;
  };

  const loadInventory = async (): Promise<void> => {
    try {
      const serverService = ServerService.getInstance();
      const result = await serverService.getInventory();
      
      console.log('Inventory API Response:', result);
      
      if (result.success && result.data) {
        const response = result.data as InventoryResponse;
        console.log('Items:', response.items);
        
        setInventory(response.items);
        setError(null);
      } else {
        setError(result.error || 'Failed to load inventory');
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = (): void => {
    setRefreshing(true);
    loadInventory();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getImageUrl = (itemId: string, imageId: string): string => {
    const serverService = ServerService.getInstance();
    const axiosInstance = serverService.getAxiosInstance();
    if (!axiosInstance) {
      throw new Error('No active server connection');
    }
    return `${serverService.getBaseUrl()}/api/v1/items/${itemId}/attachments/${imageId}`;
  };

  const renderItem = ({ item, index }: { item: InventoryItem; index: number }): React.ReactElement => {
    const hasDescription = getPreference('description') && item.description;
    const hasFooterContent = 
      (getPreference('location') && item.location) ||
      (getPreference('labels') && item.labels.length > 0) ||
      (getPreference('purchasePrice') && item.purchasePrice > 0) ||
      (getPreference('insured')) ||
      (getPreference('archived') && item.archived) ||
      (getPreference('createdAt')) ||
      (getPreference('updatedAt'));
    const hasImage = getPreference('image') && item.imageId;

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.itemContainer,
          { backgroundColor: theme.colors.background.secondary }
        ]}
      >
        <View style={[
          styles.itemContent,
          !hasDescription && !hasFooterContent && !hasImage && { paddingBottom: 8 }
        ]}>
          <View style={styles.itemHeader}>
            <Text style={[styles.itemName, { color: theme.colors.text.primary }]}>
              {item.name}
            </Text>
            {getPreference('quantity') && (
              <View 
                key={`quantity-${item.id}`}
                style={[
                  styles.quantityBadge,
                  { backgroundColor: item.quantity > 0 ? theme.colors.success : theme.colors.error }
                ]}
              >
                <Text style={[styles.quantityText, { color: theme.colors.button.text }]}>
                  {item.quantity}
                </Text>
              </View>
            )}
          </View>

          {hasImage && (
            <View style={styles.imageContainer}>
              <Image
                source={{ 
                  uri: getImageUrl(item.id, item.imageId!),
                  headers: {
                    'Authorization': `Bearer ${ServerService.getInstance().getAxiosInstance()?.defaults.headers.common['Authorization']}`
                  }
                }}
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
                <View key={`location-${item.id}`} style={styles.footerItem}>
                  <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                    📍 {item.location.name}
                  </Text>
                </View>
              )}
              {getPreference('labels') && item.labels.length > 0 && (
                <View key={`labels-${item.id}`} style={styles.footerItem}>
                  <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                    🏷️ {item.labels.map(label => label.name).join(', ')}
                  </Text>
                </View>
              )}
              {getPreference('purchasePrice') && item.purchasePrice > 0 && (
                <View key={`price-${item.id}`} style={styles.footerItem}>
                  <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                    💰 ${item.purchasePrice.toFixed(2)}
                  </Text>
                </View>
              )}
              {getPreference('insured') && (
                <View key={`insured-${item.id}`} style={styles.footerItem}>
                  <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                    {item.insured ? '🛡️ Insured' : '❌ Uninsured'}
                  </Text>
                </View>
              )}
              {getPreference('archived') && item.archived && (
                <View key={`archived-${item.id}`} style={styles.footerItem}>
                  <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                    📦 Archived
                  </Text>
                </View>
              )}
              {getPreference('createdAt') && (
                <View key={`created-${item.id}`} style={styles.footerItem}>
                  <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                    📅 Created: {formatDate(item.createdAt)}
                  </Text>
                </View>
              )}
              {getPreference('updatedAt') && (
                <View key={`updated-${item.id}`} style={styles.footerItem}>
                  <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                    🔄 Updated: {formatDate(item.updatedAt)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

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
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.button.primary }]}
          onPress={initializeScreen}
        >
          <Text style={[styles.retryButtonText, { color: theme.colors.button.text }]}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <FlatList
        data={inventory}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.button.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
              No inventory items found
            </Text>
          </View>
        }
      />
    </View>
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
});

export default InventoryScreen; 