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
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import ServerService from '../services/serverService';
import { useFocusEffect } from '@react-navigation/native';

type RootStackParamList = {
  InventoryTab: undefined;
  Inventory: undefined;
  InventorySettings: undefined;
  AddItem: undefined;
  ServerConfig: undefined;
  SettingsTab: {
    screen: 'Settings';
    params?: {
      screen: 'ServerConfig';
    };
  };
  // Added for navigation to item detail
  ItemDetail: { itemId: string };
};
// Note: If you implement ItemDetailScreen, it should accept route.params.itemId

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

type SortOption = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc' | 'quantity-asc' | 'quantity-desc';
type ViewMode = 'list' | 'grid';

const InventoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayPreferences, setDisplayPreferences] = useState<DisplayPreference[]>([]);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [itemsPerRow, setItemsPerRow] = useState(2);
  const [gridConfigVisible, setGridConfigVisible] = useState(false);
  const [listZoom, setListZoom] = useState(2); // 0: compact, 1: standard, 2: detailed

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
      const service = ServerService.getInstance();
      const autoConnectResult = await service.autoConnect();

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
      // Reload preferences whenever the screen comes into focus
      loadDisplayPreferences();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerControls}>
          {viewMode === 'grid' ? (
            <>
              <TouchableOpacity
                style={[
                  styles.headerButton, 
                  { 
                    backgroundColor: theme.colors.button.primary,
                    opacity: itemsPerRow <= 1 ? 0.5 : 1
                  }
                ]}
                onPress={() => setItemsPerRow(Math.max(1, itemsPerRow - 1))}
                disabled={itemsPerRow <= 1}
              >
                <MaterialIcons name="remove" size={20} color={theme.colors.button.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.headerButton, 
                  { 
                    backgroundColor: theme.colors.button.primary,
                    opacity: itemsPerRow >= 5 ? 0.5 : 1
                  }
                ]}
                onPress={() => setItemsPerRow(Math.min(5, itemsPerRow + 1))}
                disabled={itemsPerRow >= 5}
              >
                <MaterialIcons name="add" size={20} color={theme.colors.button.text} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.headerButton, 
                  { 
                    backgroundColor: theme.colors.button.primary,
                    opacity: listZoom <= 0 ? 0.5 : 1
                  }
                ]}
                onPress={() => setListZoom(Math.max(0, listZoom - 1))}
                disabled={listZoom <= 0}
              >
                <MaterialIcons name="zoom-out" size={20} color={theme.colors.button.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.headerButton, 
                  { 
                    backgroundColor: theme.colors.button.primary,
                    opacity: listZoom >= 2 ? 0.5 : 1
                  }
                ]}
                onPress={() => setListZoom(Math.min(2, listZoom + 1))}
                disabled={listZoom >= 2}
              >
                <MaterialIcons name="zoom-in" size={20} color={theme.colors.button.text} />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.colors.button.primary }]}
            onPress={toggleViewMode}
          >
            <MaterialIcons 
              name={viewMode === 'list' ? 'grid-view' : 'view-list'} 
              size={20} 
              color={theme.colors.button.text} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.colors.button.primary }]}
            onPress={() => setSortModalVisible(true)}
          >
            <MaterialIcons name="sort" size={20} color={theme.colors.button.text} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, theme, viewMode, itemsPerRow, listZoom]);

  const getPreference = (id: string): boolean => {
    const preference = displayPreferences.find(p => p.id === id);
    return preference?.enabled ?? false;
  };

  const sortInventory = useCallback((items: InventoryItem[]) => {
    return [...items].sort((a, b) => {
      switch (sortOption) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'quantity-asc':
          return a.quantity - b.quantity;
        case 'quantity-desc':
          return b.quantity - a.quantity;
        default:
          return 0;
      }
    });
  }, [sortOption]);

  const loadInventory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await ServerService.getInstance().getInventory(1, 50);
      console.log('API Response:', response);
      if (response.success && response.data) {
        const sortedItems = sortInventory(response.data.items);
        setInventory(sortedItems);
      } else {
        setError(response.error || 'Failed to load inventory');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading inventory:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [sortInventory]);

  const onRefresh = (): void => {
    setRefreshing(true);
    loadInventory();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getImageUrl = (itemId: string, imageId: string): string => {
    const service = ServerService.getInstance();
    const axiosInstance = service.getAxiosInstance();
    if (!axiosInstance) {
      throw new Error('No active server connection');
    }
    return `${service.getBaseUrl()}/api/v1/items/${itemId}/attachments/${imageId}`;
  };

  const renderListItem = ({ item, index }: { item: InventoryItem; index: number }): React.ReactElement => {
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

    if (listZoom === 0) {
      // Compact view
      return (
        <TouchableOpacity
          key={item.id}
          style={[styles.itemContainer, { backgroundColor: theme.colors.background.secondary }]}
          onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
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
                  { backgroundColor: item.quantity > 0 ? theme.colors.success : theme.colors.error }
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
                      <MaterialIcons name="location-on" size={14} color={theme.colors.text.secondary} style={styles.footerIcon} />
                      <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                        {item.location.name}
                      </Text>
                    </View>
                  )}
                  {getPreference('labels') && item.labels.length > 0 && (
                    <View style={styles.compactLabels}>
                      <MaterialIcons name="label" size={14} color={theme.colors.text.secondary} style={styles.footerIcon} />
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
    } else if (listZoom === 1) {
      // Standard view
      return (
        <TouchableOpacity
          key={item.id}
          style={[styles.itemContainer, { backgroundColor: theme.colors.background.secondary }]}
          onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
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
                    source={{ 
                      uri: getImageUrl(item.id, item.imageId!),
                      headers: {
                        'Authorization': `Bearer ${ServerService.getInstance().getAxiosInstance()?.defaults.headers.common['Authorization']}`
                      }
                    }}
                    style={styles.standardImage}
                    resizeMode="cover"
                  />
                </View>
              )}

              {/* Quantity Section */}
              {getPreference('quantity') && (
                <View style={[
                  styles.standardQuantityBadge,
                  { backgroundColor: item.quantity > 0 ? theme.colors.success : theme.colors.error }
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
    } else {
      // Detailed view (original layout)
      return (
        <TouchableOpacity
          key={item.id}
          style={[styles.itemContainer, { backgroundColor: theme.colors.background.secondary }]}
          onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
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
                  { backgroundColor: item.quantity > 0 ? theme.colors.success : theme.colors.error }
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
                    <MaterialIcons name="location-on" size={16} color={theme.colors.text.secondary} style={styles.footerIcon} />
                    <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                      {item.location.name}
                    </Text>
                  </View>
                )}
                {getPreference('labels') && item.labels.length > 0 && (
                  <View key={`labels-${item.id}`} style={styles.footerItem}>
                    <MaterialIcons name="label" size={16} color={theme.colors.text.secondary} style={styles.footerIcon} />
                    <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                      {item.labels.map(label => label.name).join(', ')}
                    </Text>
                  </View>
                )}
                {getPreference('purchasePrice') && item.purchasePrice > 0 && (
                  <View key={`price-${item.id}`} style={styles.footerItem}>
                    <MaterialIcons name="attach-money" size={16} color={theme.colors.text.secondary} style={styles.footerIcon} />
                    <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                      ${item.purchasePrice.toFixed(2)}
                    </Text>
                  </View>
                )}
                {getPreference('insured') && (
                  <View key={`insured-${item.id}`} style={styles.footerItem}>
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
                )}
                {getPreference('archived') && item.archived && (
                  <View key={`archived-${item.id}`} style={styles.footerItem}>
                    <MaterialIcons name="archive" size={16} color={theme.colors.text.secondary} style={styles.footerIcon} />
                    <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                      Archived
                    </Text>
                  </View>
                )}
                {getPreference('createdAt') && (
                  <View key={`created-${item.id}`} style={styles.footerItem}>
                    <MaterialIcons name="schedule" size={16} color={theme.colors.text.secondary} style={styles.footerIcon} />
                    <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                      Created: {formatDate(item.createdAt)}
                    </Text>
                  </View>
                )}
                {getPreference('updatedAt') && (
                  <View key={`updated-${item.id}`} style={styles.footerItem}>
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
    }
  };

  const renderGridItem = ({ item }: { item: InventoryItem }): React.ReactElement => {
    const screenWidth = Dimensions.get('window').width;
    const itemWidth = Math.floor(screenWidth / itemsPerRow); // Full width division
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.gridItemContainer, 
          { 
            backgroundColor: theme.colors.background.secondary,
            width: itemWidth,
            height: itemWidth, // Square aspect ratio
            margin: 0, // No margins
          }
        ]}
        onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
      >
        <View style={[styles.gridItemImageContainer, { height: itemWidth }]}>
          {item.imageId ? (
            <Image
              source={{ 
                uri: getImageUrl(item.id, item.imageId),
                headers: {
                  'Authorization': `Bearer ${ServerService.getInstance().getAxiosInstance()?.defaults.headers.common['Authorization']}`
                }
              }}
              style={styles.gridItemImage}
              resizeMode="cover"
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <MaterialIcons name="image-not-supported" size={48} color={theme.colors.text.secondary} />
            </View>
          )}
        </View>

        <View style={[styles.gridItemInfo, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
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
              { backgroundColor: item.quantity > 0 ? theme.colors.success : theme.colors.error }
            ]}>
              <Text style={styles.gridQuantityText}>{item.quantity}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'list' ? 'grid' : 'list');
  };

  const renderItem = ({ item, index }: { item: InventoryItem; index: number }): React.ReactElement => {
    return viewMode === 'list' ? renderListItem({ item, index }) : renderGridItem({ item });
  };

  const SortModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={sortModalVisible}
      onRequestClose={() => setSortModalVisible(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background.primary }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>Sort By</Text>
          
          <TouchableOpacity
            style={[styles.sortOption, { borderColor: theme.colors.border }]}
            onPress={() => {
              setSortOption('name-asc');
              setSortModalVisible(false);
            }}
          >
            <Text style={[styles.sortOptionText, { color: theme.colors.text.primary }]}>Name (A-Z)</Text>
            {sortOption === 'name-asc' && (
              <MaterialIcons name="check" size={24} color={theme.colors.button.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortOption, { borderColor: theme.colors.border }]}
            onPress={() => {
              setSortOption('name-desc');
              setSortModalVisible(false);
            }}
          >
            <Text style={[styles.sortOptionText, { color: theme.colors.text.primary }]}>Name (Z-A)</Text>
            {sortOption === 'name-desc' && (
              <MaterialIcons name="check" size={24} color={theme.colors.button.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortOption, { borderColor: theme.colors.border }]}
            onPress={() => {
              setSortOption('date-asc');
              setSortModalVisible(false);
            }}
          >
            <Text style={[styles.sortOptionText, { color: theme.colors.text.primary }]}>Date (Oldest First)</Text>
            {sortOption === 'date-asc' && (
              <MaterialIcons name="check" size={24} color={theme.colors.button.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortOption, { borderColor: theme.colors.border }]}
            onPress={() => {
              setSortOption('date-desc');
              setSortModalVisible(false);
            }}
          >
            <Text style={[styles.sortOptionText, { color: theme.colors.text.primary }]}>Date (Newest First)</Text>
            {sortOption === 'date-desc' && (
              <MaterialIcons name="check" size={24} color={theme.colors.button.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortOption, { borderColor: theme.colors.border }]}
            onPress={() => {
              setSortOption('quantity-asc');
              setSortModalVisible(false);
            }}
          >
            <Text style={[styles.sortOptionText, { color: theme.colors.text.primary }]}>Quantity (Low to High)</Text>
            {sortOption === 'quantity-asc' && (
              <MaterialIcons name="check" size={24} color={theme.colors.button.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortOption, { borderColor: theme.colors.border }]}
            onPress={() => {
              setSortOption('quantity-desc');
              setSortModalVisible(false);
            }}
          >
            <Text style={[styles.sortOptionText, { color: theme.colors.text.primary }]}>Quantity (High to Low)</Text>
            {sortOption === 'quantity-desc' && (
              <MaterialIcons name="check" size={24} color={theme.colors.button.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalCloseButton, { backgroundColor: theme.colors.button.primary }]}
            onPress={() => setSortModalVisible(false)}
          >
            <Text style={[styles.modalCloseButtonText, { color: theme.colors.button.text }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  const GridConfigModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={gridConfigVisible}
      onRequestClose={() => setGridConfigVisible(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background.primary }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>Grid Configuration</Text>
          
          <View style={styles.gridConfigControls}>
            <Text style={[styles.gridConfigLabel, { color: theme.colors.text.primary }]}>Items per row</Text>
            
            <View style={styles.gridConfigButtons}>
              <TouchableOpacity
                style={[
                  styles.gridConfigButton,
                  { backgroundColor: theme.colors.button.secondary }
                ]}
                onPress={() => setItemsPerRow(Math.max(1, itemsPerRow - 1))}
                disabled={itemsPerRow <= 1}
              >
                <MaterialIcons name="remove" size={24} color={theme.colors.button.text} />
              </TouchableOpacity>
              
              <Text style={[styles.gridConfigValue, { color: theme.colors.text.primary }]}>
                {itemsPerRow}
              </Text>
              
              <TouchableOpacity
                style={[
                  styles.gridConfigButton,
                  { backgroundColor: theme.colors.button.secondary }
                ]}
                onPress={() => setItemsPerRow(Math.min(5, itemsPerRow + 1))}
                disabled={itemsPerRow >= 5}
              >
                <MaterialIcons name="add" size={24} color={theme.colors.button.text} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.modalCloseButton, { backgroundColor: theme.colors.button.primary }]}
            onPress={() => setGridConfigVisible(false)}
          >
            <Text style={[styles.modalCloseButtonText, { color: theme.colors.button.text }]}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
        key={`${viewMode}-${itemsPerRow}`}
        data={inventory}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        numColumns={viewMode === 'grid' ? itemsPerRow : 1}
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
              No items found
            </Text>
          </View>
        }
      />
      <SortModal />
      <GridConfigModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 5,
  },
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
  sortButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  sortOptionText: {
    fontSize: 16,
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  gridItemContainer: {
    borderRadius: 3,
    overflow: 'hidden',
    margin: 0,
    position: 'relative',
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
  noImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItemInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
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
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
  },
  configButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginRight: 12,
  },
  gridConfigControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  gridConfigLabel: {
    fontSize: 16,
  },
  gridConfigButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridConfigButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridConfigValue: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  compactContent: {
    padding: 12,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  compactDetails: {
    marginTop: 4,
  },
  compactDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  compactTextContent: {
    flex: 1,
    marginRight: 40,
  },
  detailedTextContent: {
    flex: 1,
    marginRight: 40,
  },
});

export default InventoryScreen;