import React, {useEffect, useCallback} from 'react';
import {View, StyleSheet, FlatList, RefreshControl} from 'react-native';
import {useTheme} from '../theme/ThemeContext';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useInventoryData} from '../hooks/useInventoryData';
import {useInventoryDisplay} from '../hooks/useInventoryDisplay';
import {useDisplayPreferences} from '../hooks/useDisplayPreferences';
import {
  InventoryHeader,
  SortModal,
  InventoryListItem,
  InventoryGridItem,
} from '../components/Inventory';
import {LoadingState} from '../components/common/LoadingState';
import {EmptyState} from '../components/common/EmptyState';
import {InventoryItem} from '../types';

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
    setSortModalVisible,
    toggleViewMode,
    increaseItemsPerRow,
    decreaseItemsPerRow,
    increaseListZoom,
    decreaseListZoom,
  } = useInventoryDisplay();

  const {displayPreferences, loadDisplayPreferences} = useDisplayPreferences();

  const initializeScreen = useCallback(async () => {
    await loadDisplayPreferences();
    await loadInventory();
  }, [loadDisplayPreferences, loadInventory]);

  useEffect(() => {
    initializeScreen();
  }, [initializeScreen]);

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

  if (isLoading && inventory.length === 0) {
    return <LoadingState message="Loading inventory..." />;
  }

  if (!isLoading && inventory.length === 0) {
    return <EmptyState message="No items in inventory" icon="inventory" />;
  }

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: theme.colors.background.primary},
      ]}>
      <FlatList
        data={inventory}
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
});

export default InventoryScreen;
