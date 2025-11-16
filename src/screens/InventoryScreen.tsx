import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInventoryData } from '../hooks/useInventoryData';
import { useInventoryDisplay } from '../hooks/useInventoryDisplay';
import { useDisplayPreferences } from '../hooks/useDisplayPreferences';
import {
  InventoryHeader,
  SortModal,
  InventoryListItem,
  InventoryGridItem,
} from '../components/Inventory';

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
  ItemDetail: { itemId: string };
};

const InventoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Custom hooks
  const {
    inventory,
    sortOption,
    isLoading,
    refreshing,
    loadInventory,
    onRefresh,
    updateSortOption,
  } = useInventoryData();

  const {
    viewMode,
    itemsPerRow,
    listZoom,
    sortModalVisible,
    setSortModalVisible,
    toggleViewMode,
    increaseItemsPerRow,
    decreaseItemsPerRow,
    increaseListZoom,
    decreaseListZoom,
  } = useInventoryDisplay();

  const {
    displayPreferences,
    loadDisplayPreferences,
  } = useDisplayPreferences();

  // Initialize screen
  const initializeScreen = useCallback(async () => {
    await loadDisplayPreferences();
    await loadInventory();
  }, [loadDisplayPreferences, loadInventory]);

  useEffect(() => {
    initializeScreen();
  }, [initializeScreen]);

  // Set header with controls
  const renderHeaderRight = useCallback(() => (
    <InventoryHeader
      viewMode={viewMode}
      itemsPerRow={itemsPerRow}
      listZoom={listZoom}
      onToggleView={toggleViewMode}
      onIncreaseItemsPerRow={increaseItemsPerRow}
      onDecreaseItemsPerRow={decreaseItemsPerRow}
      onIncreaseZoom={increaseListZoom}
      onDecreaseZoom={decreaseListZoom}
      onOpenSort={() => setSortModalVisible(true)}
    />
  ), [
    viewMode,
    itemsPerRow,
    listZoom,
    toggleViewMode,
    increaseItemsPerRow,
    decreaseItemsPerRow,
    increaseListZoom,
    decreaseListZoom,
    setSortModalVisible,
  ]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: renderHeaderRight,
    });
  }, [navigation, renderHeaderRight]);

  // Handle item press
  const handleItemPress = useCallback((itemId: string) => {
    navigation.navigate('ItemDetail', { itemId });
  }, [navigation]);

  // Render item based on view mode
  const renderItem = useCallback(({ item }: { item: any }) => {
    if (viewMode === 'list') {
      return (
        <InventoryListItem
          item={item}
          displayPreferences={displayPreferences}
          listZoom={listZoom}
          onPress={() => handleItemPress(item.id)}
        />
      );
    }

    return (
      <InventoryGridItem
        item={item}
        displayPreferences={displayPreferences}
        itemsPerRow={itemsPerRow}
        onPress={() => handleItemPress(item.id)}
      />
    );
  }, [viewMode, displayPreferences, listZoom, itemsPerRow, handleItemPress]);

  // Loading state
  if (isLoading && inventory.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
          Loading inventory...
        </Text>
      </View>
    );
  }

  // Empty state
  if (!isLoading && inventory.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.colors.background.primary }]}>
        <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
          No items in inventory
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <FlatList
        data={inventory}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        key={viewMode === 'grid' ? `grid-${itemsPerRow}` : 'list'}
        numColumns={viewMode === 'grid' ? itemsPerRow : 1}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      />

      {/* Sort Modal */}
      <SortModal
        visible={sortModalVisible}
        sortOption={sortOption}
        onClose={() => setSortModalVisible(false)}
        onSelectSort={(option) => {
          updateSortOption(option);
          setSortModalVisible(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  listContent: {
    padding: 8,
  },
});

export default InventoryScreen;
