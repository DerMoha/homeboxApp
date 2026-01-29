import React, {useEffect, useCallback, useMemo} from 'react';
import {View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Text} from 'react-native';
import {useTheme} from '../theme/ThemeContext';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useInventoryData} from '../hooks/useInventoryData';
import {useInventoryDisplay} from '../hooks/useInventoryDisplay';
import {useDisplayPreferences} from '../hooks/useDisplayPreferences';
import {useInventoryFilters} from '../hooks/useInventoryFilters';
import {useItemData} from '../hooks/useItemData';
import {
  InventoryHeader,
  SortModal,
  InventoryListItem,
  InventoryGridItem,
  SearchBar,
  FilterModal,
} from '../components/Inventory';
import {LoadingState} from '../components/common/LoadingState';
import {EmptyState} from '../components/common/EmptyState';
import {InventoryItem} from '../types';
import {matchesSearch, applyFilters} from '../utils/inventoryFilters';

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
  ItemDetail: {itemId: string};
};

const InventoryScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
    filterModalVisible,
    setSortModalVisible,
    setFilterModalVisible,
    toggleViewMode,
    increaseItemsPerRow,
    decreaseItemsPerRow,
    increaseListZoom,
    decreaseListZoom,
  } = useInventoryDisplay();

  const {displayPreferences, loadDisplayPreferences} = useDisplayPreferences();

  const {
    searchQuery,
    debouncedQuery,
    setSearchQuery,
    clearSearch,
    filters,
    tempFilters,
    updateTempFilters,
    applyFilters: applyFilterChanges,
    clearAllFilters,
    resetTempFilters,
    activeFilterCount,
  } = useInventoryFilters();

  const {locations, labels} = useItemData();

  const initializeScreen = useCallback(async () => {
    await loadDisplayPreferences();
    await loadInventory();
  }, [loadDisplayPreferences, loadInventory]);

  useEffect(() => {
    initializeScreen();
  }, [initializeScreen]);

  // Apply search and filters to inventory
  const filteredInventory = useMemo(() => {
    let result = [...inventory];

    // Apply search
    if (debouncedQuery.trim()) {
      result = result.filter(item => matchesSearch(item, debouncedQuery));
    }

    // Apply filters
    result = applyFilters(result, filters);

    return result;
  }, [inventory, debouncedQuery, filters]);

  const renderHeaderRight = useCallback(
    () => (
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
        onOpenFilter={() => setFilterModalVisible(true)}
        activeFilterCount={activeFilterCount}
      />
    ),
    [
      viewMode,
      itemsPerRow,
      listZoom,
      toggleViewMode,
      increaseItemsPerRow,
      decreaseItemsPerRow,
      increaseListZoom,
      decreaseListZoom,
      setSortModalVisible,
      setFilterModalVisible,
      activeFilterCount,
    ],
  );

  useEffect(() => {
    navigation.setOptions({
      headerRight: renderHeaderRight,
    });
  }, [navigation, renderHeaderRight]);

  const handleItemPress = useCallback(
    (itemId: string) => {
      navigation.navigate('ItemDetail', {itemId});
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({item}: {item: InventoryItem}) => {
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
    },
    [viewMode, displayPreferences, listZoom, itemsPerRow, handleItemPress],
  );

  // Memoized styles (must be before early returns)
  const emptyStateStyle = useMemo(
    () => [
      styles.emptyStateContainer,
      {backgroundColor: theme.colors.background.primary},
    ],
    [theme.colors.background.primary],
  );

  const emptyStateTextStyle = useMemo(
    () => [
      styles.emptyStateText,
      {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.lg,
        marginBottom: theme.spacing.md,
      },
    ],
    [
      theme.colors.text.secondary,
      theme.spacing.md,
      theme.typography.sizes.lg,
    ],
  );

  const clearButtonStyle = useMemo(
    () => [
      styles.clearButton,
      {
        backgroundColor: theme.colors.accent.primary,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
      },
    ],
    [
      theme.borderRadius.md,
      theme.colors.accent.primary,
      theme.spacing.lg,
      theme.spacing.md,
    ],
  );

  const clearButtonTextStyle = useMemo(
    () => [
      styles.clearButtonText,
      {
        color: theme.colors.text.inverse,
        fontSize: theme.typography.sizes.md,
        fontWeight: theme.typography.weights.semibold,
      },
    ],
    [
      theme.colors.text.inverse,
      theme.typography.sizes.md,
      theme.typography.weights.semibold,
    ],
  );

  // Early returns after all hooks
  if (isLoading && inventory.length === 0) {
    return <LoadingState message="Loading inventory..." />;
  }

  const hasSearchOrFilters =
    debouncedQuery.trim() !== '' || activeFilterCount > 0;

  if (!isLoading && inventory.length === 0) {
    return <EmptyState message="No items in inventory" icon="inventory" />;
  }

  if (!isLoading && filteredInventory.length === 0 && hasSearchOrFilters) {
    return (
      <View style={emptyStateStyle}>
        <SearchBar
          query={searchQuery}
          onChangeQuery={setSearchQuery}
          onClear={clearSearch}
          resultCount={filteredInventory.length}
          totalCount={inventory.length}
        />
        <View style={styles.emptyContent}>
          <Text style={emptyStateTextStyle}>No matching items</Text>
          <TouchableOpacity
            style={clearButtonStyle}
            onPress={() => {
              clearSearch();
              clearAllFilters();
            }}>
            <Text style={clearButtonTextStyle}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: theme.colors.background.primary},
      ]}>
      <SearchBar
        query={searchQuery}
        onChangeQuery={setSearchQuery}
        onClear={clearSearch}
        resultCount={filteredInventory.length}
        totalCount={inventory.length}
      />
      <FlatList
        data={filteredInventory}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        key={viewMode === 'grid' ? `grid-${itemsPerRow}` : 'list'}
        numColumns={viewMode === 'grid' ? itemsPerRow : 1}
        contentContainerStyle={[
          styles.listContent,
          {paddingHorizontal: theme.spacing.md},
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent.primary}
            colors={[theme.colors.accent.primary]}
            progressBackgroundColor={theme.colors.background.elevated}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <SortModal
        visible={sortModalVisible}
        sortOption={sortOption}
        onClose={() => setSortModalVisible(false)}
        onSelectSort={option => {
          updateSortOption(option);
          setSortModalVisible(false);
        }}
      />

      <FilterModal
        visible={filterModalVisible}
        filters={tempFilters}
        locations={locations}
        labels={labels}
        onUpdateFilters={updateTempFilters}
        onApply={applyFilterChanges}
        onClear={clearAllFilters}
        onClose={() => {
          resetTempFilters();
          setFilterModalVisible(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  emptyStateContainer: {
    flex: 1,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
  },
  clearButton: {
    alignItems: 'center',
  },
  clearButtonText: {},
});

export default InventoryScreen;
