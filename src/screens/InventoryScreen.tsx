import React, {useEffect, useCallback, useMemo} from 'react';
import {View, StyleSheet, FlatList, RefreshControl, Alert} from 'react-native';
import {useTheme} from '../theme/ThemeContext';
import {CompositeNavigationProp, useNavigation} from '@react-navigation/native';
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
  SortModal,
  InventoryListItem,
  InventoryGridItem,
  LocationPickerModal,
  SearchBar,
  FilterModal,
  SwipeableItem,
} from '../components/Inventory';
import {EmptyState} from '../components/common/EmptyState';
import {InventorySkeletonList} from '../components/common/Skeleton';
import {InventoryItem} from '../types';
import {InventoryStackParamList, RootTabParamList} from '../navigation/types';
import {matchesSearch, applyFilters} from '../utils/inventoryFilters';
import {hapticImpact} from '../utils/haptics';
import ServerService from '../services/serverService';

type InventoryScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<InventoryStackParamList, 'Inventory'>,
  NativeStackNavigationProp<RootTabParamList>
>;

const ITEM_HEIGHTS = {
  0: 60,
  1: 90,
} as const;

const InventoryScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<InventoryScreenNavigationProp>();

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

  const handleEditItem = useCallback(
    (itemId: string) => {
      navigation.navigate('AddItemTab', {
        screen: 'AddItem',
        params: {itemId},
      });
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
              } catch (error) {
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

  const handleAddItem = useCallback(() => {
    hapticImpact('medium');
    navigation.navigate('AddItemTab', {
      screen: 'AddItem',
    });
  }, [navigation]);

  const handleClearFilters = useCallback(() => {
    hapticImpact('medium');
    clearSearch();
    clearAllFilters();
  }, [clearSearch, clearAllFilters]);

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

  const hasSearchOrFilters =
    debouncedQuery.trim() !== '' || activeFilterCount > 0;

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
  loadingContainer: {
    flex: 1,
  },
});

export default InventoryScreen;
