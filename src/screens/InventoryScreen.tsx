import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import ServerService from '../services/serverService';

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

const InventoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    loadInventory();
  }, []);

  const onRefresh = (): void => {
    setRefreshing(true);
    loadInventory();
  };

  const renderItem = ({ item, index }: { item: InventoryItem; index: number }): React.ReactElement => {
    console.log(`Rendering item ${index}:`, {
      id: item.id,
      name: item.name,
      quantity: item.quantity
    });

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.itemContainer,
          { backgroundColor: theme.colors.background.secondary }
        ]}
      >
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={[styles.itemName, { color: theme.colors.text.primary }]}>
              {item.name}
            </Text>
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
          </View>
          
          {item.description && (
            <Text style={[styles.itemDescription, { color: theme.colors.text.secondary }]}>
              {item.description}
            </Text>
          )}
          
          <View style={styles.itemFooter}>
            {item.location && (
              <View key={`location-${item.id}`} style={styles.footerItem}>
                <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                  📍 {item.location.name}
                </Text>
              </View>
            )}
            {item.labels.length > 0 && (
              <View key={`labels-${item.id}`} style={styles.footerItem}>
                <Text style={[styles.footerLabel, { color: theme.colors.text.secondary }]}>
                  🏷️ {item.labels.map(label => label.name).join(', ')}
                </Text>
              </View>
            )}
          </View>
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
          onPress={loadInventory}
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

export default InventoryScreen; 