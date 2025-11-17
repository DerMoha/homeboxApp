import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { Theme } from '../theme/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ServerService from '../services/serverService';
import { LocationsStackParamList } from '../types/navigation';
import axios from 'axios';
import { logger } from '../utils/logger';
import { useAsyncState } from '../hooks/useAsyncState';
import { LoadingState, ErrorState } from '../components/common';

type RootStackParamList = LocationsStackParamList;

interface LocationNode {
  id: string;
  name: string;
  type: string;
  children: LocationNode[];
}

interface LocationTreeItemProps {
  node: LocationNode;
  level: number;
  onPress: (locationId: string, locationName: string) => void;
  theme: Theme;
}

const LocationTreeItemComponent: React.FC<LocationTreeItemProps> = ({
  node,
  level,
  onPress,
  theme,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Memoize hasChildren check
  const hasChildren = useMemo(() =>
    node.children && node.children.length > 0,
    [node.children]
  );

  // Memoize style calculations
  const containerStyle = useMemo(() => [
    styles.locationContainer,
    { backgroundColor: theme.colors.background.secondary },
    { marginLeft: level * 16 },
  ], [theme.colors.background.secondary, level]);

  // Memoize callbacks
  const handlePress = useCallback(() => {
    onPress(node.id, node.name);
  }, [onPress, node.id, node.name]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <View>
      <TouchableOpacity
        style={containerStyle}
        onPress={handlePress}
      >
        <View style={styles.locationContent}>
          <View style={styles.locationHeader}>
            {hasChildren && (
              <TouchableOpacity
                onPress={toggleExpanded}
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

// Memoized export to prevent unnecessary re-renders in recursive tree
const LocationTreeItem = React.memo(LocationTreeItemComponent);

const LocationsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    data: locationTree,
    isLoading,
    refreshing,
    error,
    execute,
  } = useAsyncState<LocationNode[]>([]);

  const loadLocations = useCallback(async (): Promise<void> => {
    await execute(async () => {
      const service = ServerService.getInstance();

      // Verify server connection
      const axiosInstance = service.getAxiosInstance();
      if (!axiosInstance) {
        throw new Error('No active server connection. Please check your server settings.');
      }

      const response = await axiosInstance.get('/api/v1/locations/tree');
      return response.data;
    }, {
      onError: (err) => {
        logger.error('Error loading locations:', err);
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 500) {
            throw new Error('Server error occurred. Please check if the server is running and try again.');
          }
        }
      },
    });
  }, [execute]);

  const onRefresh = (): void => {
    execute(async () => {
      const service = ServerService.getInstance();
      const axiosInstance = service.getAxiosInstance();
      if (!axiosInstance) {
        throw new Error('No active server connection. Please check your server settings.');
      }
      const response = await axiosInstance.get('/api/v1/locations/tree');
      return response.data;
    }, { isRefresh: true });
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
    return <LoadingState message="Loading locations..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={loadLocations} />;
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
        {locationTree && locationTree.map((node) => (
          <LocationTreeItem
            key={node.id}
            node={node}
            level={0}
            onPress={handleLocationPress}
            theme={theme}
          />
        ))}
        {locationTree && locationTree.length === 0 && (
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
