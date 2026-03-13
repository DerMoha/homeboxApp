import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Animated,
} from 'react-native';
import {useTheme} from '../theme/ThemeContext';
import type {Theme} from '../theme/theme';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ServerService from '../services/serverService';
import {LocationsStackParamList} from '../navigation/types';
import axios from 'axios';
import {logger} from '../utils/logger';
import {useAsyncState} from '../hooks/useAsyncState';
import {LoadingState, ErrorState} from '../components/common';

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
  isSelected?: boolean;
}

const LocationTreeItemComponent: React.FC<LocationTreeItemProps> = ({
  node,
  level,
  onPress,
  theme,
  isSelected = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const hasChildren = useMemo(
    () => node.children && node.children.length > 0,
    [node.children],
  );

  const handleToggleExpand = useCallback(() => {
    const toValue = isExpanded ? 0 : 1;
    Animated.spring(rotateAnim, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    setIsExpanded(prev => !prev);
  }, [isExpanded, rotateAnim]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const handlePress = useCallback(() => {
    onPress(node.id, node.name);
  }, [onPress, node.id, node.name]);

  const levelIndent = level * theme.spacing.lg;
  const isNested = level > 0;

  const locationCardStyle = useMemo(
    () => [
      styles.locationCard,
      {
        backgroundColor: isSelected
          ? theme.colors.accent.muted
          : theme.colors.background.secondary,
        borderColor: isSelected
          ? theme.colors.accent.primary
          : theme.colors.borderSubtle,
        marginLeft: levelIndent,
        borderRadius: theme.borderRadius.lg,
        borderLeftWidth: isNested ? 2 : StyleSheet.hairlineWidth,
        borderLeftColor: isNested
          ? theme.colors.accent.secondary
          : theme.colors.borderSubtle,
      },
      theme.shadows.sm,
    ],
    [
      isNested,
      isSelected,
      levelIndent,
      theme.borderRadius.lg,
      theme.colors.accent.muted,
      theme.colors.accent.primary,
      theme.colors.accent.secondary,
      theme.colors.borderSubtle,
      theme.colors.background.secondary,
      theme.shadows.sm,
    ],
  );

  const expandButtonStyle = useMemo(
    () => [
      styles.expandButton,
      {
        backgroundColor: theme.colors.background.tertiary,
        borderColor: theme.colors.borderSubtle,
      },
    ],
    [theme.colors.background.tertiary, theme.colors.borderSubtle],
  );

  const rotateStyle = useMemo(
    () => ({transform: [{rotate: rotateInterpolate}]}),
    [rotateInterpolate],
  );

  const locationIconStyle = useMemo(
    () => [
      styles.locationIconContainer,
      {
        backgroundColor: theme.colors.background.secondary,
        borderColor: theme.colors.borderSubtle,
      },
    ],
    [theme.colors.background.secondary, theme.colors.borderSubtle],
  );

  const locationNameStyle = useMemo(
    () => [
      styles.locationName,
      {
        color: theme.colors.text.primary,
        fontSize:
          level === 0 ? theme.typography.sizes.lg : theme.typography.sizes.md,
        fontWeight:
          level === 0
            ? theme.typography.weights.semibold
            : theme.typography.weights.medium,
        fontFamily:
          level === 0
            ? theme.typography.fonts.semibold
            : theme.typography.fonts.medium,
      },
    ],
    [
      level,
      theme.colors.text.primary,
      theme.typography.fonts.medium,
      theme.typography.fonts.semibold,
      theme.typography.sizes.lg,
      theme.typography.sizes.md,
      theme.typography.weights.medium,
      theme.typography.weights.semibold,
    ],
  );

  const childCountStyle = useMemo(
    () => [
      styles.childCount,
      {
        color: theme.colors.text.tertiary,
        fontSize: theme.typography.sizes.xs,
        fontFamily: theme.typography.fonts.regular,
      },
    ],
    [
      theme.colors.text.tertiary,
      theme.typography.fonts.regular,
      theme.typography.sizes.xs,
    ],
  );

  return (
    <View>
      <TouchableOpacity
        style={locationCardStyle}
        onPress={handlePress}
        activeOpacity={0.7}>
        <View style={styles.locationContent}>
          {hasChildren && (
            <TouchableOpacity
              onPress={handleToggleExpand}
              style={expandButtonStyle}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Animated.View style={rotateStyle}>
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color={theme.colors.accent.primary}
                />
              </Animated.View>
            </TouchableOpacity>
          )}

          <View style={locationIconStyle}>
            <MaterialIcons
              name={level === 0 ? 'home' : 'folder'}
              size={18}
              color={theme.colors.accent.primary}
            />
          </View>

          <View style={styles.locationTextContainer}>
            <Text style={locationNameStyle} numberOfLines={1}>
              {node.name}
            </Text>
            {hasChildren && (
              <Text style={childCountStyle}>
                {node.children.length}{' '}
                {node.children.length === 1 ? 'sublocation' : 'sublocations'}
              </Text>
            )}
          </View>

          <MaterialIcons
            name="chevron-right"
            size={20}
            color={theme.colors.text.tertiary}
          />
        </View>
      </TouchableOpacity>

      {isExpanded && hasChildren && (
        <Animated.View>
          {node.children.map(child => (
            <LocationTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              onPress={onPress}
              theme={theme}
            />
          ))}
        </Animated.View>
      )}
    </View>
  );
};

const LocationTreeItem = React.memo(LocationTreeItemComponent);

const LocationsScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<LocationsStackParamList>>();
  const {
    data: locationTree,
    isLoading,
    refreshing,
    error,
    execute,
  } = useAsyncState<LocationNode[]>([]);

  const loadLocations = useCallback(async (): Promise<void> => {
    await execute(
      async () => {
        const service = ServerService.getInstance();

        const axiosInstance = service.getAxiosInstance();
        if (!axiosInstance) {
          throw new Error(
            'No active server connection. Please check your server settings.',
          );
        }

        const response = await axiosInstance.get('/api/v1/locations/tree');
        return response.data;
      },
      {
        onError: err => {
          logger.error('Error loading locations', {error: err});
          if (axios.isAxiosError(err)) {
            if (err.response?.status === 500) {
              throw new Error(
                'Server error occurred. Please check if the server is running and try again.',
              );
            }
          }
        },
      },
    );
  }, [execute]);

  const onRefresh = (): void => {
    execute(
      async () => {
        const service = ServerService.getInstance();
        const axiosInstance = service.getAxiosInstance();
        if (!axiosInstance) {
          throw new Error(
            'No active server connection. Please check your server settings.',
          );
        }
        const response = await axiosInstance.get('/api/v1/locations/tree');
        return response.data;
      },
      {isRefresh: true},
    );
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

  const containerStyle = useMemo(
    () => [
      styles.container,
      {backgroundColor: theme.colors.background.primary},
    ],
    [theme.colors.background.primary],
  );

  const listContentStyle = useMemo(
    () => [styles.listContent, {paddingHorizontal: theme.spacing.md}],
    [theme.spacing.md],
  );

  const emptyIconStyle = useMemo(
    () => [
      styles.emptyIconContainer,
      {
        backgroundColor: theme.colors.background.secondary,
        borderColor: theme.colors.borderSubtle,
      },
    ],
    [theme.colors.background.secondary, theme.colors.borderSubtle],
  );

  const emptyTitleStyle = useMemo(
    () => [
      styles.emptyTitle,
      {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.lg,
        fontWeight: theme.typography.weights.semibold,
        fontFamily: theme.typography.fonts.semibold,
      },
    ],
    [
      theme.colors.text.primary,
      theme.typography.fonts.semibold,
      theme.typography.sizes.lg,
      theme.typography.weights.semibold,
    ],
  );

  const emptySubtitleStyle = useMemo(
    () => [
      styles.emptySubtitle,
      {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.sm,
        fontFamily: theme.typography.fonts.regular,
      },
    ],
    [
      theme.colors.text.secondary,
      theme.typography.fonts.regular,
      theme.typography.sizes.sm,
    ],
  );

  if (isLoading) {
    return <LoadingState message="Loading locations..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={loadLocations} />;
  }

  return (
    <View style={containerStyle}>
      <ScrollView
        contentContainerStyle={listContentStyle}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent.primary}
            colors={[theme.colors.accent.primary]}
            progressBackgroundColor={theme.colors.background.elevated}
          />
        }
        showsVerticalScrollIndicator={false}>
        {locationTree &&
          locationTree.map(node => (
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
            <View style={emptyIconStyle}>
              <MaterialIcons
                name="location-off"
                size={48}
                color={theme.colors.accent.primary}
              />
            </View>
            <Text style={emptyTitleStyle}>No locations found</Text>
            <Text style={emptySubtitleStyle}>
              Add locations from your Homebox server
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
    paddingTop: 16,
    paddingBottom: 32,
  },
  locationCard: {
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    minHeight: 56,
  },
  expandButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  locationIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationName: {
    marginBottom: 2,
  },
  childCount: {
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
  },
});

export default LocationsScreen;
