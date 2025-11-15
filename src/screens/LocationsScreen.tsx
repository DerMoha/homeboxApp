import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ServerService from '../services/serverService';
import { LocationsStackParamList } from '../types/navigation';
import axios from 'axios';
import { logger } from '../utils/logger';

type RootStackParamList = LocationsStackParamList;

interface LocationNode {
  id: string;
  name: string;
  type: string;
  children: LocationNode[];
}

const LocationTreeItem: React.FC<{
  node: LocationNode;
  level: number;
  onPress: (locationId: string, locationName: string) => void;
  theme: any;
}> = ({ node, level, onPress, theme }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.locationContainer,
          { backgroundColor: theme.colors.background.secondary },
          { marginLeft: level * 16 },
        ]}
        onPress={() => onPress(node.id, node.name)}
      >
        <View style={styles.locationContent}>
          <View style={styles.locationHeader}>
            {hasChildren && (
              <TouchableOpacity
                onPress={() => setIsExpanded(!isExpanded)}
                style={styles.expandButton}
              >
                <MaterialIcons
                  name={isExpanded ? 'expand-more' : 'chevron-right'}
                  size={24}
                  color={theme.colors.text.primary}
                />
              </TouchableOpacity>
            )}
            <Text style={[styles.locationName, { color: theme.colors.text.primary }]}>
              {node.name}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      {isExpanded && hasChildren && (
        <View>
          {node.children.map((child) => (
            <LocationTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              onPress={onPress}
              theme={theme}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const LocationsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [locationTree, setLocationTree] = useState<LocationNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLocations = useCallback(async (): Promise<void> => {
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

      const response = await axiosInstance.get('/api/v1/locations/tree');
      setLocationTree(response.data);
      setError(null);
    } catch (err) {
      logger.error('Error loading locations:', err);
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 500) {
          setError('Server error occurred. Please check if the server is running and try again.');
        } else {
          setError(`Error: ${err.message}. Please try again later.`);
        }
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = (): void => {
    setRefreshing(true);
    loadLocations();
  };

  const handleLocationPress = (locationId: string, locationName: string) => {
    navigation.navigate('LocationItems', {
      locationId,
      locationName,
    });
  };

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

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
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.button.primary]}
          />
        }
      >
        {locationTree.map((node) => (
          <LocationTreeItem
            key={node.id}
            node={node}
            level={0}
            onPress={handleLocationPress}
            theme={theme}
          />
        ))}
        {locationTree.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
              No locations found
            </Text>
          </View>
        )}
      </ScrollView>
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
    marginBottom: 8,
    overflow: 'hidden',
  },
  locationContent: {
    padding: 12,
    flex: 1,
    justifyContent: 'center',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  expandButton: {
    padding: 4,
    marginRight: 4,
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
