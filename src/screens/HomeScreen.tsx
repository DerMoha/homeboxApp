import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import ServerService from '../services/serverService';

type InventoryItem = {
  id: string;
  name: string;
  description?: string;
  location?: {
    id: string;
    name: string;
  };
  quantity: number;
  imageId?: string | null;
  insured: boolean;
  purchasePrice: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  labels?: Array<{ name: string }>;
};

type TabParamList = {
  Home: undefined;
  InventoryTab: {
    screen: 'Inventory';
    params?: {
      searchQuery?: string;
      selectedTags?: string[];
      selectedLocation?: string | null;
    };
  };
  AddItemTab: { scanBarcode?: boolean };
  Locations: undefined;
  SettingsTab: undefined;
};

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [allItems, setAllItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<Array<{ id: string; name: string }>>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  const loadRecentItems = async () => {
    try {
      const serverService = ServerService.getInstance();
      const autoConnectResult = await serverService.autoConnect();
      
      if (!autoConnectResult.success) {
        console.warn('Failed to connect to server:', autoConnectResult.error);
        setAllItems([]);
        return;
      }

      const response = await serverService.get<{ items: InventoryItem[] }>('/api/v1/items');
      if (response.success && response.data?.items && Array.isArray(response.data.items)) {
        const items = response.data.items;
        setAllItems(items);
      } else {
        console.warn('Invalid response format for inventory items:', response);
        setAllItems([]);
      }
    } catch (error) {
      console.error('Error loading inventory items:', error);
      setAllItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter items based on search query, selected tags, and location
  const getFilteredItems = () => {
    return allItems.filter(item => {
      // Filter by search query
      const matchesSearch = searchQuery === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter by selected tags
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.every(tag => item.labels?.some(label => label.name === tag));

      // Filter by selected location
      const matchesLocation = !selectedLocation || 
        item.location?.id === selectedLocation;

      return matchesSearch && matchesTags && matchesLocation;
    });
  };

  // Get the items to display (either filtered or recent)
  const getDisplayItems = () => {
    const items = getFilteredItems();
    if (searchQuery || selectedTags.length > 0 || selectedLocation) {
      // If any filter is active, show filtered items
      return items.slice(0, 5);
    } else {
      // If no filters, show most recent items
      return items
        .sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        })
        .slice(0, 5);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecentItems();
    setRefreshing(false);
  };

  const loadTagsAndLocations = async () => {
    try {
      console.log('Loading tags and locations...');
      const serverService = ServerService.getInstance();
      const autoConnectResult = await serverService.autoConnect();
      
      if (!autoConnectResult.success) {
        console.warn('Failed to connect to server:', autoConnectResult.error);
        return;
      }

      const [tagsResponse, locationsResponse] = await Promise.all([
        serverService.getLabels(),
        serverService.getLocations()
      ]);

      console.log('Tags response:', tagsResponse);
      console.log('Locations response:', locationsResponse);

      if (tagsResponse.success && tagsResponse.data) {
        const tags = tagsResponse.data.map(tag => tag.name);
        console.log('Setting available tags:', tags);
        setAvailableTags(tags);
      } else {
        console.warn('Failed to load tags:', tagsResponse.error);
      }

      if (locationsResponse.success && locationsResponse.data?.locations) {
        const locations = locationsResponse.data.locations;
        console.log('Setting available locations:', locations);
        setAvailableLocations(locations);
      } else {
        console.warn('Failed to load locations:', locationsResponse.error);
      }
    } catch (error) {
      console.error('Error loading tags and locations:', error);
    }
  };

  useEffect(() => {
    console.log('Initial useEffect running...');
    const initializeData = async () => {
      await Promise.all([
        loadRecentItems(),
        loadTagsAndLocations()
      ]);
    };
    initializeData();
  }, []);

  // Add a debug effect to monitor state changes
  useEffect(() => {
    console.log('State updated:', {
      availableTags,
      availableLocations,
      selectedTags,
      selectedLocation,
      showTagSuggestions,
      showLocationSuggestions
    });
  }, [availableTags, availableLocations, selectedTags, selectedLocation, showTagSuggestions, showLocationSuggestions]);

  const toggleTag = (tag: string) => {
    console.log('Toggle tag clicked:', tag);
    console.log('Current selected tags:', selectedTags);
    setSelectedTags(prev => {
      const newTags = prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag];
      console.log('New selected tags:', newTags);
      return newTags;
    });
  };

  const handleSearch = () => {
    console.log('Search triggered with:', {
      searchQuery,
      selectedTags,
      selectedLocation
    });
    navigation.navigate('InventoryTab', {
      screen: 'Inventory',
      params: {
        searchQuery,
        selectedTags,
        selectedLocation
      }
    });
  };

  const renderSearchBar = () => {
    console.log('Rendering search bar with state:', {
      showTagSuggestions,
      showLocationSuggestions,
      selectedTags,
      selectedLocation,
      availableTags,
      availableLocations
    });

    return (
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.background.secondary }]}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={24} color={theme.colors.text.secondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text.primary }]}
            placeholder="Search inventory..."
            placeholderTextColor={theme.colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          {searchQuery && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <MaterialIcons name="close" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterChipsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedTags.length > 0 
                  ? { backgroundColor: theme.colors.button.primary }
                  : { 
                      backgroundColor: 'transparent',
                      borderWidth: 1,
                      borderColor: theme.colors.button.primary
                    }
              ]}
              onPress={() => {
                console.log('Tag filter clicked');
                console.log('Current showTagSuggestions:', showTagSuggestions);
                setShowTagSuggestions(!showTagSuggestions);
                console.log('New showTagSuggestions:', !showTagSuggestions);
              }}
            >
              <MaterialIcons 
                name="label" 
                size={16} 
                color={selectedTags.length > 0 ? theme.colors.button.text : theme.colors.button.primary} 
              />
              <Text style={[
                styles.filterChipText,
                { color: selectedTags.length > 0 ? theme.colors.button.text : theme.colors.button.primary }
              ]}>
                {selectedTags.length > 0 
                  ? selectedTags.join(', ')
                  : 'Tags'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedLocation 
                  ? { backgroundColor: theme.colors.button.primary }
                  : { 
                      backgroundColor: 'transparent',
                      borderWidth: 1,
                      borderColor: theme.colors.button.primary
                    }
              ]}
              onPress={() => {
                console.log('Location filter clicked');
                console.log('Current showLocationSuggestions:', showLocationSuggestions);
                setShowLocationSuggestions(!showLocationSuggestions);
                console.log('New showLocationSuggestions:', !showLocationSuggestions);
              }}
            >
              <MaterialIcons 
                name="location-on" 
                size={16} 
                color={selectedLocation ? theme.colors.button.text : theme.colors.button.primary} 
              />
              <Text style={[
                styles.filterChipText,
                { color: selectedLocation ? theme.colors.button.text : theme.colors.button.primary }
              ]}>
                {selectedLocation 
                  ? availableLocations.find(loc => loc.id === selectedLocation)?.name || 'Location'
                  : 'Location'}
              </Text>
            </TouchableOpacity>

            {(selectedTags.length > 0 || selectedLocation) && (
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: theme.colors.error }]}
                onPress={() => {
                  console.log('Clear filters clicked');
                  setSelectedTags([]);
                  setSelectedLocation(null);
                }}
              >
                <MaterialIcons name="clear" size={16} color={theme.colors.button.text} />
                <Text style={[styles.filterChipText, { color: theme.colors.button.text }]}>
                  Clear Filters
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {showTagSuggestions && (
          <View style={[styles.suggestionsContainer, { backgroundColor: theme.colors.background.secondary }]}>
            <ScrollView style={styles.suggestionsList}>
              {availableTags.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.suggestionItem,
                    selectedTags.includes(tag) && { backgroundColor: theme.colors.button.primary }
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[
                    styles.suggestionText,
                    { color: selectedTags.includes(tag) ? theme.colors.button.text : theme.colors.text.primary }
                  ]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {showLocationSuggestions && (
          <View style={[styles.suggestionsContainer, { backgroundColor: theme.colors.background.secondary }]}>
            <ScrollView style={styles.suggestionsList}>
              {availableLocations.map(location => (
                <TouchableOpacity
                  key={location.id}
                  style={[
                    styles.suggestionItem,
                    selectedLocation === location.id && { backgroundColor: theme.colors.button.primary }
                  ]}
                  onPress={() => {
                    console.log('Location selected:', location);
                    setSelectedLocation(
                      selectedLocation === location.id ? null : location.id
                    );
                  }}
                >
                  <Text style={[
                    styles.suggestionText,
                    { color: selectedLocation === location.id ? theme.colors.button.text : theme.colors.text.primary }
                  ]}>
                    {location.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const quickActions = [
    {
      title: 'Add Item',
      icon: 'add-box',
      onPress: () => navigation.navigate('AddItemTab', { scanBarcode: false }),
    },
    {
      title: 'Scan Barcode',
      icon: 'qr-code-scanner',
      onPress: () => navigation.navigate('AddItemTab', { scanBarcode: true }),
    },
    {
      title: 'Locations',
      icon: 'location-on',
      onPress: () => navigation.navigate('Locations'),
    },
    {
      title: 'Settings',
      icon: 'settings',
      onPress: () => navigation.navigate('SettingsTab'),
    },
  ];

  const renderQuickAction = ({ item }: { item: typeof quickActions[0] }) => (
    <TouchableOpacity
      style={[styles.quickActionButton, { backgroundColor: theme.colors.background.secondary }]}
      onPress={item.onPress}
    >
      <MaterialIcons name={item.icon} size={24} color={theme.colors.button.primary} />
      <Text style={[styles.quickActionText, { color: theme.colors.text.primary }]}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  const renderRecentItem = ({ item }: { item: InventoryItem }) => (
    <TouchableOpacity
      style={[styles.recentItem, { backgroundColor: theme.colors.background.secondary }]}
      onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
    >
      <View style={styles.recentItemContent}>
        <Text style={[styles.recentItemName, { color: theme.colors.text.primary }]}>
          {item.name}
        </Text>
        {item.location && (
          <Text style={[styles.recentItemLocation, { color: theme.colors.text.secondary }]}>
            {item.location.name}
          </Text>
        )}
      </View>
      <MaterialIcons name="chevron-right" size={24} color={theme.colors.text.secondary} />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.button.primary]}
        />
      }
    >
      {renderSearchBar()}

      <View style={styles.quickActionsContainer}>
        {quickActions.map((action, index) => (
          <View key={index} style={styles.quickActionWrapper}>
            {renderQuickAction({ item: action })}
          </View>
        ))}
      </View>

      <View style={styles.recentItemsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Recent Items
        </Text>
        {getDisplayItems().length > 0 ? (
          getDisplayItems().map((item) => (
            <View key={item.id} style={styles.recentItemWrapper}>
              {renderRecentItem({ item })}
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
            No recent items
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    gap: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  filterChipsContainer: {
    marginTop: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    gap: 4,
    minWidth: 80,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 200,
    zIndex: 1000,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  suggestionText: {
    fontSize: 14,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 2,
    gap: 8,
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  quickActionWrapper: {
    width: '49%',
    marginBottom: 3,
  },
  quickActionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  recentItemsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  recentItemWrapper: {
    marginBottom: 8,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  recentItemContent: {
    flex: 1,
  },
  recentItemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  recentItemLocation: {
    fontSize: 14,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 16,
  },
});

export default HomeScreen;