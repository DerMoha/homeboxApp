import React, {useCallback, useMemo, useState} from 'react';
import {View, StyleSheet, FlatList, RefreshControl, Alert} from 'react-native';
import {Text} from 'react-native';
import {Button} from '../components/common/Button';
import {ActiveFilterChips} from '../components/Inventory/ActiveFilterChips';
import {SavedSearches} from '../components/Inventory/SavedSearches';
import {matchesReview, ReviewList} from '../services/savedSearchService';
import {CacheStatus} from '../components/common/CacheStatus';
import {useTheme} from '../theme/ThemeContext';
import {
  CompositeNavigationProp,
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useInventoryData} from '../hooks/useInventoryData';
import {useInventoryDisplay} from '../hooks/useInventoryDisplay';
import {useDisplayPreferences} from '../hooks/useDisplayPreferences';
import {useInventoryFilters} from '../hooks/useInventoryFilters';
import {useItemData} from '../hooks/useItemData';
import {useBatchSelection} from '../hooks/useBatchSelection';
import {
  BatchActionBar,
  LabelPickerModal,
  InventoryHeader,
  InventoryListItem,
  InventoryGridItem,
  LocationPickerModal,
  SearchBar,
  FilterModal,
  SwipeableItem,
} from '../components/Inventory';
import {ErrorState} from '../components/common/ErrorState';
import {EmptyState} from '../components/common/EmptyState';
import {InventorySkeletonList} from '../components/common/Skeleton';
import {InventoryItem} from '../types';
import {InventoryStackParamList, RootTabParamList} from '../navigation/types';
import {applyFilters} from '../utils/inventoryFilters';
import {hapticImpact} from '../utils/haptics';
import ServerService from '../services/serverService';

type InventoryScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<InventoryStackParamList, 'Inventory'>,
  NativeStackNavigationProp<RootTabParamList>
>;

const InventoryScreen: React.FC = () => {
  const {theme} = useTheme();
  const [review, setReview] = useState<ReviewList>('all');
  const navigation = useNavigation<InventoryScreenNavigationProp>();

  const {
    searchQuery,
    debouncedQuery,
    setSearchQuery,
    clearSearch,
    filters,
    setFilters,
    setTempFilters,
    tempFilters,
    updateTempFilters,
    applyFilters: applyFilterChanges,
    clearAllFilters,
    resetTempFilters,
    activeFilterCount,
  } = useInventoryFilters();

  const {
    inventory,
    total,
    loadAll,
    cancelLoading,
    hasMore,
    loadMore,
    cacheInfo,
    error,
    sortOption,
    isLoading,
    refreshing,
    loadInventory,
    onRefresh,
    updateSortOption,
  } = useInventoryData(debouncedQuery);

  const {
    viewMode,
    itemsPerRow,
    listZoom,
    filterModalVisible,
    setFilterModalVisible,
    toggleViewMode,
    increaseItemsPerRow,
    decreaseItemsPerRow,
    increaseListZoom,
    decreaseListZoom,
  } = useInventoryDisplay();

  const {displayPreferences, loadDisplayPreferences} = useDisplayPreferences();

  const {locations, labels, loadLocations, loadLabels} = useItemData();
  const batchSelection = useBatchSelection();

  const initializeScreen = useCallback(async () => {
    await Promise.all([
      loadDisplayPreferences(),
      loadInventory(),
      loadLocations(),
      loadLabels(),
    ]);
  }, [loadDisplayPreferences, loadInventory, loadLabels, loadLocations]);

  useFocusEffect(
    useCallback(() => {
      initializeScreen();
    }, [initializeScreen]),
  );

  const filteredInventory = useMemo(() => {
    let result = [...inventory];

    result = applyFilters(result, filters).filter(item =>
      matchesReview(item, review),
    );

    return result;
  }, [inventory, filters, review]);

  const selectedItems = useMemo(
    () => inventory.filter(item => batchSelection.selectedIds.has(item.id)),
    [batchSelection.selectedIds, inventory],
  );

  const filteredIds = useMemo(
    () => filteredInventory.map(item => item.id),
    [filteredInventory],
  );

  const isAllSelected = useMemo(
    () =>
      filteredIds.length > 0 &&
      filteredIds.every(itemId => batchSelection.selectedIds.has(itemId)),
    [batchSelection.selectedIds, filteredIds],
  );

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
        sortOption={sortOption}
        onSelectSort={updateSortOption}
        onOpenFilter={() => setFilterModalVisible(true)}
        activeFilterCount={activeFilterCount}
        savedSearches={
          <SavedSearches
            current={{query: searchQuery, filters, sort: sortOption, review}}
            onApply={search => {
              setSearchQuery(search.query);
              setFilters(search.filters);
              setTempFilters(search.filters);
              updateSortOption(search.sort);
              setReview(search.review);
            }}
          />
        }
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
      setFilterModalVisible,
      activeFilterCount,
      searchQuery,
      filters,
      review,
      setSearchQuery,
      setFilters,
      setTempFilters,
      sortOption,
      updateSortOption,
    ],
  );

  const handleItemPress = useCallback(
    (itemId: string) => {
      navigation.navigate('ItemDetail', {itemId});
    },
    [navigation],
  );

  const handleEditItem = useCallback(
    (itemId: string) => {
      navigation.navigate('AddItem', {itemId});
    },
    [navigation],
  );

  const handleDeleteItem = useCallback(
    (item: InventoryItem) => {
      Alert.alert(
        'Delete Item',
        `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const service = ServerService.getInstance();
                const result = await service.deleteItem(item.id);
                if (result.success) {
                  hapticImpact('medium');
                  loadInventory();
                } else {
                  Alert.alert('Error', result.error || 'Failed to delete item');
                }
              } catch {
                Alert.alert('Error', 'Failed to delete item');
              }
            },
          },
        ],
      );
    },
    [loadInventory],
  );

  const buildUpdatePayload = useCallback(
    (
      item: InventoryItem,
      overrides?: {locationId?: string; labels?: string[]},
    ) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      locationId:
        overrides && 'locationId' in overrides
          ? overrides.locationId
          : item.location?.id,
      labels: overrides?.labels ?? item.labels.map(label => label.id),
      purchasePrice: item.purchasePrice,
      insured: item.insured,
      barcode: item.barcode || undefined,
    }),
    [],
  );

  const finishBatchAction = useCallback(async () => {
    await loadInventory();
    batchSelection.exitSelectionMode();
    batchSelection.clearSelectedLabels();
  }, [batchSelection, loadInventory]);

  const handleBatchDelete = useCallback(() => {
    if (!selectedItems.length) {
      return;
    }

    Alert.alert(
      'Delete Items',
      `Delete ${selectedItems.length} selected items? This action cannot be undone.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              batchSelection.setIsApplying(true);
              const service = ServerService.getInstance();
              const results = await Promise.all(
                selectedItems.map(item => service.deleteItem(item.id)),
              );
              const failed = results.find(result => !result.success);

              if (failed) {
                Alert.alert('Error', failed.error || 'Failed to delete items');
                return;
              }

              await finishBatchAction();
            } finally {
              batchSelection.setIsApplying(false);
            }
          },
        },
      ],
    );
  }, [batchSelection, finishBatchAction, selectedItems]);

  const handleBatchMove = useCallback(
    async (locationId: string | null) => {
      try {
        batchSelection.setIsApplying(true);
        const service = ServerService.getInstance();
        const results = await Promise.all(
          selectedItems.map(item =>
            service.updateItem(
              buildUpdatePayload(item, {locationId: locationId || undefined}),
            ),
          ),
        );
        const failed = results.find(result => !result.success);

        if (failed) {
          Alert.alert('Error', failed.error || 'Failed to move items');
          return;
        }

        await finishBatchAction();
      } finally {
        batchSelection.setIsApplying(false);
      }
    },
    [batchSelection, buildUpdatePayload, finishBatchAction, selectedItems],
  );

  const handleBatchLabel = useCallback(async () => {
    if (!batchSelection.selectedLabelIds.length) {
      Alert.alert('Select Labels', 'Choose at least one label to apply.');
      return;
    }

    try {
      batchSelection.setIsApplying(true);
      const service = ServerService.getInstance();
      const results = await Promise.all(
        selectedItems.map(item => {
          const mergedLabels = Array.from(
            new Set([
              ...item.labels.map(label => label.id),
              ...batchSelection.selectedLabelIds,
            ]),
          );

          return service.updateItem(
            buildUpdatePayload(item, {labels: mergedLabels}),
          );
        }),
      );
      const failed = results.find(result => !result.success);

      if (failed) {
        Alert.alert('Error', failed.error || 'Failed to apply labels');
        return;
      }

      await finishBatchAction();
    } finally {
      batchSelection.setIsApplying(false);
    }
  }, [batchSelection, buildUpdatePayload, finishBatchAction, selectedItems]);

  const handleSelectionLongPress = useCallback(
    (itemId: string) => {
      batchSelection.enterSelectionMode(itemId);
    },
    [batchSelection],
  );

  const renderItem = useCallback(
    ({item}: {item: InventoryItem}) => {
      if (viewMode === 'list') {
        const listItem = (
          <InventoryListItem
            item={item}
            displayPreferences={displayPreferences}
            listZoom={listZoom}
            onPress={() => handleItemPress(item.id)}
            isSelectionMode={batchSelection.isSelectionMode}
            isSelected={batchSelection.selectedIds.has(item.id)}
            onToggleSelection={batchSelection.toggleSelection}
            onLongPress={handleSelectionLongPress}
          />
        );

        if (batchSelection.isSelectionMode) {
          return listItem;
        }

        return (
          <SwipeableItem
            onEdit={() => handleEditItem(item.id)}
            onDelete={() => handleDeleteItem(item)}
            itemName={item.name}>
            {listItem}
          </SwipeableItem>
        );
      }

      return (
        <InventoryGridItem
          item={item}
          displayPreferences={displayPreferences}
          itemsPerRow={itemsPerRow}
          onPress={() => handleItemPress(item.id)}
          isSelectionMode={batchSelection.isSelectionMode}
          isSelected={batchSelection.selectedIds.has(item.id)}
          onToggleSelection={batchSelection.toggleSelection}
          onLongPress={handleSelectionLongPress}
        />
      );
    },
    [
      viewMode,
      displayPreferences,
      listZoom,
      itemsPerRow,
      batchSelection.isSelectionMode,
      batchSelection.selectedIds,
      batchSelection.toggleSelection,
      handleItemPress,
      handleEditItem,
      handleDeleteItem,
      handleSelectionLongPress,
    ],
  );

  const handleAddItem = useCallback(() => {
    hapticImpact('medium');
    navigation.navigate('AddItem');
  }, [navigation]);

  if (isLoading && inventory.length === 0) {
    return (
      <View
        style={[
          styles.loadingContainer,
          {backgroundColor: theme.colors.background.primary},
        ]}>
        <InventorySkeletonList
          viewMode={viewMode}
          itemsPerRow={itemsPerRow}
          listZoom={listZoom}
          theme={theme}
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
      <CacheStatus info={cacheInfo} />
      {error ? <ErrorState error={error} onRetry={loadInventory} /> : null}
      <SearchBar
        query={searchQuery}
        onChangeQuery={setSearchQuery}
        onClear={clearSearch}
        resultCount={filteredInventory.length}
        totalCount={total}
      />
      {renderHeaderRight()}
      <ActiveFilterChips
        filters={filters}
        locations={locations}
        labels={labels}
        review={review}
        onReviewChange={setReview}
        onChange={next => {
          setFilters(next);
          setTempFilters(next);
        }}
      />
      <FlatList
        ListHeaderComponent={
          <Text style={{color: theme.colors.text.secondary}}>
            {filteredInventory.length} shown · {inventory.length} of {total}{' '}
            loaded
            {hasMore ? ' · Load all for complete filtering and sorting' : ''}
          </Text>
        }
        ListFooterComponent={
          hasMore ? (
            <View>
              <Button
                title="Load more items"
                onPress={loadMore}
                disabled={isLoading}
              />
              <Button
                title="Load all results and cache inventory"
                onPress={loadAll}
                disabled={isLoading}
              />
              {isLoading ? (
                <Button title="Stop loading" onPress={cancelLoading} />
              ) : null}
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          <EmptyState
            variant={
              debouncedQuery || activeFilterCount
                ? 'no-results'
                : 'empty-inventory'
            }
            onAction={handleAddItem}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
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
      />

      {!batchSelection.isSelectionMode && (
        <View style={styles.addAction}>
          <Button title="Add item" icon="add" onPress={handleAddItem} />
        </View>
      )}
      <BatchActionBar
        visible={
          batchSelection.isSelectionMode && batchSelection.selectedCount > 0
        }
        selectedCount={batchSelection.selectedCount}
        onDelete={handleBatchDelete}
        onMove={batchSelection.openMoveModal}
        onLabel={batchSelection.openLabelModal}
        onSelectAll={() => batchSelection.selectAll(filteredIds)}
        onClearSelection={batchSelection.exitSelectionMode}
        isAllSelected={isAllSelected}
      />

      <FilterModal
        visible={filterModalVisible}
        filters={tempFilters}
        locations={locations}
        labels={labels}
        onUpdateFilters={updateTempFilters}
        onApply={() => {
          applyFilterChanges();
          setFilterModalVisible(false);
        }}
        onClear={clearAllFilters}
        onClose={() => {
          resetTempFilters();
          setFilterModalVisible(false);
        }}
      />

      <LocationPickerModal
        visible={batchSelection.isMoveModalVisible}
        locations={locations}
        onClose={batchSelection.closeMoveModal}
        onSelect={locationId => {
          batchSelection.closeMoveModal();
          handleBatchMove(locationId);
        }}
      />

      <LabelPickerModal
        visible={batchSelection.isLabelModalVisible}
        labels={labels}
        selectedLabelIds={batchSelection.selectedLabelIds}
        onToggleLabel={batchSelection.toggleLabelSelection}
        onApply={() => {
          batchSelection.closeLabelModal();
          handleBatchLabel();
        }}
        onClose={batchSelection.closeLabelModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  addAction: {position: 'absolute', bottom: 24, right: 16},
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 112,
    paddingTop: 8,
  },
  emptyStateContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
  },
});

export default InventoryScreen;
