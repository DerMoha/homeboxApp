import React, {useCallback, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  NavigationProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../theme/ThemeContext';
import ServerService from '../services/serverService';
import {InventoryItem} from '../hooks/useInventoryData';

type FontWeight = TextStyle['fontWeight'];

interface StatCardProps {
  icon: string;
  value: string;
  label: string;
  variant?: 'card' | 'panel';
}

type RootTabParamList = {
  Home: undefined;
  InventoryTab:
    | {screen?: 'Inventory' | 'ItemDetail'; params?: {itemId?: string}}
    | undefined;
  AddItemTab: undefined;
  Locations: undefined;
  SettingsTab: undefined;
};

interface RecentItemRowProps {
  item: InventoryItem;
  onPress: (itemId: string) => void;
}

const RECENT_ITEMS_LIMIT = 6;
const STATS_EXPANDED_HEIGHT = 150;
const STATS_COLLAPSED_HEIGHT = 84;
const STATS_COLLAPSE_DISTANCE = 120;

const formatCount = (count: number | null) =>
  count === null ? '—' : count.toLocaleString();

const formatShortDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
};

const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  variant = 'card',
}) => {
  const {theme} = useTheme();
  const isPanel = variant === 'panel';

  return (
    <View
      style={[
        styles.statCard,
        isPanel && styles.statPanel,
        {
          backgroundColor: theme.colors.background.elevated,
          borderRadius: theme.borderRadius.lg,
        },
        theme.shadows.sm,
      ]}>
      <MaterialIcons
        name={icon}
        size={isPanel ? 20 : 24}
        color={theme.colors.accent.primary}
        style={[styles.statIcon, isPanel && styles.statIconPanel]}
      />
      <View style={isPanel ? styles.statPanelText : undefined}>
        <Text
          style={[
            styles.statNumber,
            isPanel && styles.statPanelNumber,
            {
              color: theme.colors.text.primary,
              fontSize: isPanel
                ? theme.typography.sizes.lg
                : theme.typography.sizes.xxl,
              fontWeight: theme.typography.weights.bold as FontWeight,
            },
          ]}>
          {value}
        </Text>
        <Text
          style={[
            styles.statLabel,
            isPanel && styles.statPanelLabel,
            {
              color: theme.colors.text.tertiary,
              fontSize: theme.typography.sizes.xs,
            },
          ]}>
          {label}
        </Text>
      </View>
    </View>
  );
};

const RecentItemRow: React.FC<RecentItemRowProps> = ({item, onPress}) => {
  const {theme} = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.recentItem,
        {
          backgroundColor: theme.colors.background.elevated,
          borderRadius: theme.borderRadius.lg,
        },
        theme.shadows.sm,
      ]}
      onPress={() => onPress(item.id)}
      activeOpacity={0.8}>
      <View
        style={[
          styles.recentIconWrap,
          {
            backgroundColor: theme.colors.accent.muted,
            borderRadius: theme.borderRadius.md,
          },
        ]}>
        <MaterialIcons
          name="inventory-2"
          size={20}
          color={theme.colors.accent.primary}
        />
      </View>
      <View style={styles.recentMeta}>
        <Text
          numberOfLines={1}
          style={[
            styles.recentName,
            {
              color: theme.colors.text.primary,
              fontSize: theme.typography.sizes.md,
              fontWeight: theme.typography.weights.semibold as FontWeight,
            },
          ]}>
          {item.name}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            styles.recentSubtitle,
            {
              color: theme.colors.text.secondary,
              fontSize: theme.typography.sizes.xs,
            },
          ]}>
          {item.location?.name ?? 'Unassigned'} - Qty {item.quantity}
        </Text>
      </View>
      <Text
        style={[
          styles.recentDate,
          {
            color: theme.colors.text.tertiary,
            fontSize: theme.typography.sizes.xs,
          },
        ]}>
        {formatShortDate(item.createdAt)}
      </Text>
    </TouchableOpacity>
  );
};

const HomeScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [itemCount, setItemCount] = useState<number | null>(null);
  const [locationCount, setLocationCount] = useState<number | null>(null);
  const [recentItems, setRecentItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const statsHeight = scrollY.interpolate({
    inputRange: [0, STATS_COLLAPSE_DISTANCE],
    outputRange: [STATS_EXPANDED_HEIGHT, STATS_COLLAPSED_HEIGHT],
    extrapolate: 'clamp',
  });

  const cardOpacity = scrollY.interpolate({
    inputRange: [0, STATS_COLLAPSE_DISTANCE * 0.6, STATS_COLLAPSE_DISTANCE],
    outputRange: [1, 0.4, 0],
    extrapolate: 'clamp',
  });

  const panelOpacity = scrollY.interpolate({
    inputRange: [0, STATS_COLLAPSE_DISTANCE * 0.7, STATS_COLLAPSE_DISTANCE],
    outputRange: [0, 0.3, 1],
    extrapolate: 'clamp',
  });

  const cardScale = scrollY.interpolate({
    inputRange: [0, STATS_COLLAPSE_DISTANCE],
    outputRange: [1, 0.92],
    extrapolate: 'clamp',
  });

  const panelTranslate = scrollY.interpolate({
    inputRange: [0, STATS_COLLAPSE_DISTANCE],
    outputRange: [12, 0],
    extrapolate: 'clamp',
  });

  const loadHomeData = useCallback(async () => {
    setIsLoading(true);
    try {
      const service = ServerService.getInstance();
      if (!service.getAxiosInstance()) {
        await service.autoConnect();
      }

      const [itemsResponse, locationsResponse] = await Promise.all([
        service.getInventory(1, RECENT_ITEMS_LIMIT),
        service.getLocations(),
      ]);

      if (itemsResponse.success && itemsResponse.data?.items) {
        const items = itemsResponse.data.items as InventoryItem[];
        const sorted = [...items].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setRecentItems(sorted.slice(0, RECENT_ITEMS_LIMIT));
        const total =
          typeof itemsResponse.data.total === 'number'
            ? itemsResponse.data.total
            : items.length;
        setItemCount(total);
      } else {
        setRecentItems([]);
        setItemCount(null);
      }

      if (locationsResponse.success && locationsResponse.data?.locations) {
        const total =
          typeof locationsResponse.data.total === 'number'
            ? locationsResponse.data.total
            : locationsResponse.data.locations.length;
        setLocationCount(total);
      } else {
        setLocationCount(null);
      }
    } catch (error) {
      setItemCount(null);
      setLocationCount(null);
      setRecentItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData]),
  );

  const handleItemPress = useCallback(
    (itemId: string) => {
      navigation.navigate('InventoryTab', {
        screen: 'ItemDetail',
        params: {itemId},
      });
    },
    [navigation],
  );

  return (
    <Animated.ScrollView
      style={[
        styles.container,
        {backgroundColor: theme.colors.background.primary},
      ]}
      contentContainerStyle={styles.contentContainer}
      onScroll={Animated.event([{nativeEvent: {contentOffset: {y: scrollY}}}], {
        useNativeDriver: false,
      })}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}>
      <View style={styles.brandingArea}>
        <View
          style={[
            styles.logoContainer,
            {
              backgroundColor: theme.colors.accent.muted,
              borderRadius: theme.borderRadius.lg,
            },
          ]}>
          <MaterialIcons
            name="inventory-2"
            size={48}
            color={theme.colors.accent.primary}
          />
        </View>
        <Text
          style={[
            styles.appTitle,
            {
              color: theme.colors.text.primary,
              fontSize: theme.typography.sizes.xxl,
              fontWeight: theme.typography.weights.bold as FontWeight,
            },
          ]}>
          Homebox
        </Text>
        <Text
          style={[
            styles.tagline,
            {
              color: theme.colors.text.secondary,
              fontSize: theme.typography.sizes.md,
            },
          ]}>
          Your home inventory
        </Text>
      </View>

      <Animated.View style={[styles.statsContainer, {height: statsHeight}]}>
        <View style={styles.statSlot}>
          <Animated.View
            style={[
              styles.statLayer,
              {opacity: cardOpacity, transform: [{scale: cardScale}]},
            ]}>
            <StatCard
              icon="inventory"
              value={formatCount(itemCount)}
              label="ITEMS"
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.statLayer,
              styles.statPanelLayer,
              {
                opacity: panelOpacity,
                transform: [{translateY: panelTranslate}],
              },
            ]}>
            <StatCard
              icon="inventory"
              value={formatCount(itemCount)}
              label="ITEMS"
              variant="panel"
            />
          </Animated.View>
        </View>
        <View style={styles.statSlot}>
          <Animated.View
            style={[
              styles.statLayer,
              {opacity: cardOpacity, transform: [{scale: cardScale}]},
            ]}>
            <StatCard
              icon="folder"
              value={formatCount(locationCount)}
              label="LOCATIONS"
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.statLayer,
              styles.statPanelLayer,
              {
                opacity: panelOpacity,
                transform: [{translateY: panelTranslate}],
              },
            ]}>
            <StatCard
              icon="folder"
              value={formatCount(locationCount)}
              label="LOCATIONS"
              variant="panel"
            />
          </Animated.View>
        </View>
      </Animated.View>

      <View style={styles.sectionHeader}>
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.colors.text.primary,
              fontSize: theme.typography.sizes.lg,
              fontWeight: theme.typography.weights.bold as FontWeight,
            },
          ]}>
          Recently added
        </Text>
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.accent.primary} />
        ) : null}
      </View>

      {recentItems.length > 0 ? (
        <View style={styles.recentList}>
          {recentItems.map(item => (
            <RecentItemRow
              key={item.id}
              item={item}
              onPress={handleItemPress}
            />
          ))}
        </View>
      ) : (
        !isLoading && (
          <Text
            style={[
              styles.emptyState,
              {
                color: theme.colors.text.tertiary,
                fontSize: theme.typography.sizes.sm,
              },
            ]}>
            Add your first item to see it here.
          </Text>
        )
      )}
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 40,
  },
  brandingArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appTitle: {
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    letterSpacing: 0.2,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  statSlot: {
    flex: 1,
    position: 'relative',
  },
  statLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  statPanelLayer: {
    justifyContent: 'center',
  },
  statCard: {
    width: '100%',
    height: '100%',
    paddingVertical: 20,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 14,
  },
  statIcon: {
    marginBottom: 8,
  },
  statIconPanel: {
    marginBottom: 0,
  },
  statNumber: {
    marginBottom: 4,
  },
  statPanelNumber: {
    marginBottom: 2,
  },
  statLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statPanelLabel: {
    letterSpacing: 0.6,
  },
  statPanelText: {
    marginLeft: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    letterSpacing: -0.2,
  },
  recentList: {
    gap: 12,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  recentIconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentMeta: {
    flex: 1,
  },
  recentName: {
    marginBottom: 2,
  },
  recentSubtitle: {
    letterSpacing: 0.2,
  },
  recentDate: {
    marginLeft: 12,
  },
  emptyState: {
    textAlign: 'center',
    paddingVertical: 12,
  },
});

export default HomeScreen;
