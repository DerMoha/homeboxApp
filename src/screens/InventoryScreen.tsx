import React, {useEffect, useCallback, useMemo} from 'react';
import {View, StyleSheet, FlatList, RefreshControl} from 'react-native';
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
import {InventorySkeletonList} from '../components/common/Skeleton';
import {InventoryItem} from '../types';
import {matchesSearch, applyFilters} from '../utils/inventoryFilters';
import {hapticImpact} from '../utils/haptics';

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

const ITEM_HEIGHTS = {
  0: 60,
  1: 90,
} as const;

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

  const filteredInventory = useMemo(() => {
    let result = [...inventory];

    if (debouncedQuery.trim()) {
      result = result.filter(item => matchesSearch(item, debouncedQuery));
    }

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

  const getItemLayout = useCallback(
    (_data: any, index: number) => {
      const height = ITEM_HEIGHTS[listZoom as keyof typeof ITEM_HEIGHTS] ?? 90;
      return {
        length: height,
        offset: height * index,
        index,
      };
    },
    [listZoom],
  );

  const emptyStateStyle = useMemo(
    () => [
      styles.emptyStateContainer,
      {backgroundColor: theme.colors.background.primary},
    ],
    [theme.colors.background.primary],
  );

  if (isLoading && inventory.length === 0) {
    return (
      <View style={{flex: 1, backgroundColor: theme.colors.background.primary}}>
        <InventorySkeletonList
          viewMode={viewMode}
          itemsPerRow={itemsPerRow}
          listZoom={listZoom}
          theme={theme}
        />
      </View>
    );
  }

  const hasSearchOrFilters =
    debouncedQuery.trim() !== '' || activeFilterCount > 0;

  const handleAddItem = useCallback(() => {
    hapticImpact('medium');
    navigation.navigate('AddItem');
  }, [navigation]);

  const handleClearFilters = useCallback(() => {
    hapticImpact('medium');
    clearSearch();
    clearAllFilters();
  }, [clearSearch, clearAllFilters]);

  if (!isLoading && inventory.length === 0) {
    return <EmptyState variant="empty-inventory" onAction={handleAddItem} />;
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
        <EmptyState
          variant="no-results"
          actionLabel={activeFilterCount > 0 ? 'Clear Filters' : undefined}
          onAction={activeFilterCount > 0 ? handleClearFilters : undefined}
        />
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
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
        {...(viewMode === 'list' &&
          listZoom in ITEM_HEIGHTS && {getItemLayout})}
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
});

export default InventoryScreen;
