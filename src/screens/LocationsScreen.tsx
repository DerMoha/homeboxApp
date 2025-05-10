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
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ServerService from '../services/serverService';
import { LocationsStackParamList } from '../types/navigation';
import axios from 'axios';

type RootStackParamList = LocationsStackParamList;

interface Location {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  imageId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LocationResponse {
  locations: Location[];
  page: number;
  pageSize: number;
  total: number;
}

const LocationsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLocations = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const service = ServerService.getInstance();
      
      // Verify server connection
      const axiosInstance = service.getAxiosInstance();
      if (!axiosInstance) {
        setError('No active server connection. Please check your server settings.');
        return;
      }

      const result = await service.getLocations();
      
      console.log('Locations API Response:', result);
      
      if (result.success && result.data) {
        setLocations(result.data.locations);
        setError(null);
      } else {
        const errorMessage = result.error || 'Failed to load locations';
        console.error('Error loading locations:', errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 500) {
          setError('Server error occurred. Please check if the server is running and try again.');
        } else {
          setError(`Error: ${error.message}. Please try again later.`);
        }
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = (): void => {
    setRefreshing(true);
    loadLocations();
  };

  const getImageUrl = (locationId: string, imageId: string): string => {
    const service = ServerService.getInstance();
    const axiosInstance = service.getAxiosInstance();
    if (!axiosInstance) {
      throw new Error('No active server connection');
    }
    return `${service.getBaseUrl()}/api/v1/locations/${locationId}/attachments/${imageId}`;
  };

  const renderItem = ({ item }: { item: Location }): React.ReactElement => {
    return (
      <TouchableOpacity
        style={[styles.locationContainer, { backgroundColor: theme.colors.background.secondary }]}
        onPress={() => navigation.navigate('LocationItems', { 
          locationId: item.id,
          locationName: item.name
        })}
      >
        <View style={styles.locationContent}>
          <View style={styles.locationHeader}>
            <Text style={[styles.locationName, { color: theme.colors.text.primary }]}>
              {item.name}
            </Text>
            <View style={[styles.itemCountBadge, { backgroundColor: theme.colors.button.primary }]}>
              <Text style={[styles.itemCountText, { color: theme.colors.button.text }]}>
                {item.itemCount}
              </Text>
            </View>
          </View>

          {item.description && (
            <Text style={[styles.locationDescription, { color: theme.colors.text.secondary }]}>
              {item.description}
            </Text>
          )}

          {item.imageId && (
            <View style={styles.imageContainer}>
              <Image
                source={{ 
                  uri: getImageUrl(item.id, item.imageId),
                  headers: {
                    'Authorization': `Bearer ${ServerService.getInstance().getAxiosInstance()?.defaults.headers.common['Authorization']}`
                  }
                }}
                style={styles.locationImage}
                resizeMode="cover"
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    loadLocations();
  }, []);

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
        <MaterialIcons 
          name="error-outline" 
          size={48} 
          color={theme.colors.error} 
          style={styles.errorIcon}
        />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.button.primary }]}
          onPress={loadLocations}
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
        data={locations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
              No locations found
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
  locationContainer: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  locationContent: {
    padding: 16,
    flex: 1,
    justifyContent: 'center',
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 40,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  itemCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  itemCountText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  locationDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  imageContainer: {
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  locationImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  errorIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
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
});

export default LocationsScreen; 