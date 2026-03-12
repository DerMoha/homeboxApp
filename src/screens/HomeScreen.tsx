import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
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
import {InventoryItem} from '../types';
import {RootTabParamList} from '../types/navigation';
import {BarcodeScannerModal} from '../components/BarcodeScanner';
import {formatRelativeTime} from '../utils/dateUtils';

type FontWeight = TextStyle['fontWeight'];

interface StatCardProps {
  icon: string;
  value: string;
  label: string;
  variant?: 'card' | 'panel';
}

interface RecentItemRowProps {
  item: InventoryItem;
  onPress: (itemId: string) => void;
}

interface QuickActionProps {
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
}

interface LocationSummary {
  id: string;
  name: string;
  itemCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

const RECENT_ITEMS_LIMIT = 6;
const formatCount = (count: number | null) =>
  count === null ? '—' : count.toLocaleString();

const formatShortDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
};

const getTimestamp = (value?: string) => {
  if (!value) {
    return 0;
  }
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const selectMostAccessedLocation = (locations: LocationSummary[]) => {
  if (!locations.length) {
    return null;
  }

  const mostRecent = locations.reduce((best, location) => {
    const bestTime = getTimestamp(best.updatedAt ?? best.createdAt);
    const currentTime = getTimestamp(location.updatedAt ?? location.createdAt);
    return currentTime > bestTime ? location : best;
  }, locations[0]);

  const hasRecent =
    getTimestamp(mostRecent.updatedAt ?? mostRecent.createdAt) > 0;

  if (hasRecent) {
    return mostRecent;
  }

  return locations.reduce((best, location) => {
    const bestCount = typeof best.itemCount === 'number' ? best.itemCount : -1;
    const currentCount =
      typeof location.itemCount === 'number' ? location.itemCount : -1;
    return currentCount > bestCount ? location : best;
  }, locations[0]);
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
          backgroundColor: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.lg,
          borderColor: theme.colors.borderSubtle,
          borderWidth: StyleSheet.hairlineWidth,
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
              fontWeight: theme.typography.weights.semibold as FontWeight,
              fontFamily: theme.typography.fonts.semibold,
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
              fontFamily: theme.typography.fonts.medium,
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
          backgroundColor: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.lg,
          borderColor: theme.colors.borderSubtle,
          borderWidth: StyleSheet.hairlineWidth,
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
              fontFamily: theme.typography.fonts.semibold,
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
              fontFamily: theme.typography.fonts.regular,
            },
          ]}>
          {item.location?.name ?? 'Unassigned'} - Qty {item.quantity}
        </Text>
        <Text
          style={[
            styles.recentTime,
            {
              color: theme.colors.text.tertiary,
              fontSize: theme.typography.sizes.xs,
              fontFamily: theme.typography.fonts.regular,
            },
          ]}>
          Added {formatRelativeTime(item.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const QuickAction: React.FC<QuickActionProps> = ({
  icon,
  label,
  subtitle,
  onPress,
}) => {
  const {theme} = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.quickAction,
        {
          backgroundColor: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.lg,
          borderColor: theme.colors.borderSubtle,
          borderWidth: StyleSheet.hairlineWidth,
        },
        theme.shadows.sm,
      ]}
      onPress={onPress}
      activeOpacity={0.85}>
      <View
        style={[
          styles.quickActionIcon,
          {
            backgroundColor: theme.colors.accent.muted,
            borderRadius: theme.borderRadius.md,
          },
        ]}>
        <MaterialIcons
          name={icon}
          size={18}
          color={theme.colors.accent.primary}
        />
      </View>
      <Text
        numberOfLines={1}
        style={[
          styles.quickActionLabel,
          {
            color: theme.colors.text.primary,
            fontSize: theme.typography.sizes.sm,
            fontWeight: theme.typography.weights.semibold as FontWeight,
            fontFamily: theme.typography.fonts.semibold,
          },
        ]}>
        {label}
      </Text>
      {subtitle ? (
        <Text
          numberOfLines={1}
          style={[
            styles.quickActionSubtitle,
            {
              color: theme.colors.text.tertiary,
              fontSize: theme.typography.sizes.xs,
              fontFamily: theme.typography.fonts.regular,
            },
          ]}>
          {subtitle}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

const HomeScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const [itemCount, setItemCount] = useState<number | null>(null);
  const [locationCount, setLocationCount] = useState<number | null>(null);
  const [topLocation, setTopLocation] = useState<LocationSummary | null>(null);
  const [recentItems, setRecentItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);

  const loadHomeData = useCallback(async () => {
    setIsLoading(true);
    try {
      const service = ServerService.getInstance();

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
        const locations = locationsResponse.data.locations as LocationSummary[];
        const total =
          typeof locationsResponse.data.total === 'number'
            ? locationsResponse.data.total
            : locations.length;
        setLocationCount(total);
        setTopLocation(selectMostAccessedLocation(locations));
      } else {
        setLocationCount(null);
        setTopLocation(null);
      }
    } catch (error) {
      setItemCount(null);
      setLocationCount(null);
      setTopLocation(null);
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

  const handleTopLocationPress = useCallback(() => {
    if (topLocation) {
      navigation.navigate('Locations', {
        screen: 'LocationItems',
        params: {
          locationId: topLocation.id,
          locationName: topLocation.name,
        },
      });
      return;
    }

    navigation.navigate('Locations');
  }, [navigation, topLocation]);

  const handleScanPress = useCallback(() => {
    setScannerVisible(true);
  }, []);

  const handleBarcodeDetected = useCallback(
    (barcode: string) => {
      setScannerVisible(false);

      if (!barcode.trim()) {
        return;
      }

      navigation.navigate('AddItemTab', {
        screen: 'AddItem',
        params: {barcode: barcode.trim()},
      });
    },
    [navigation],
  );

  const latestItem = recentItems[0];
  const lastItemName = latestItem?.name ?? 'No items yet';
  const lastItemDate = latestItem ? formatShortDate(latestItem.createdAt) : '—';
  const topLocationName = topLocation?.name ?? 'No locations yet';
  const topLocationItems =
    typeof topLocation?.itemCount === 'number'
      ? `${formatCount(topLocation.itemCount)} items`
      : '—';

  return (
    <ScrollView
      style={[
        styles.container,
        {backgroundColor: theme.colors.background.primary},
      ]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      <View style={styles.brandingArea}>
        <View
          style={[
            styles.logoContainer,
            {
              backgroundColor: theme.colors.accent.muted,
              borderRadius: theme.borderRadius.lg,
              borderColor: theme.colors.borderSubtle,
              borderWidth: StyleSheet.hairlineWidth,
            },
          ]}>
          <MaterialIcons
            name="inventory-2"
            size={36}
            color={theme.colors.accent.primary}
          />
        </View>
        <Text
          style={[
            styles.appTitle,
            {
              color: theme.colors.text.primary,
              fontSize: theme.typography.sizes.xl,
              fontWeight: theme.typography.weights.semibold as FontWeight,
              fontFamily: theme.typography.fonts.semibold,
            },
          ]}>
          Homebox
        </Text>
        <Text
          style={[
            styles.tagline,
            {
              color: theme.colors.text.secondary,
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.regular,
            },
          ]}>
          Your home inventory
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statSlot}>
          <StatCard
            icon="inventory"
            value={formatCount(itemCount)}
            label="ITEMS"
            variant="panel"
          />
        </View>
        <View style={styles.statSlot}>
          <StatCard
            icon="folder"
            value={formatCount(locationCount)}
            label="LOCATIONS"
            variant="panel"
          />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.colors.text.primary,
              fontSize: theme.typography.sizes.lg,
              fontWeight: theme.typography.weights.semibold as FontWeight,
              fontFamily: theme.typography.fonts.semibold,
            },
          ]}>
          Quick actions
        </Text>
      </View>

      <View style={styles.quickActions}>
        <QuickAction
          icon="place"
          label="Most accessed"
          subtitle={topLocationName}
          onPress={handleTopLocationPress}
        />
        <QuickAction
          icon="qr-code-scanner"
          label="Scan barcode"
          onPress={handleScanPress}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.colors.text.primary,
              fontSize: theme.typography.sizes.lg,
              fontWeight: theme.typography.weights.semibold as FontWeight,
              fontFamily: theme.typography.fonts.semibold,
            },
          ]}>
          Snapshot
        </Text>
      </View>

      <View
        style={[
          styles.insightCard,
          {
            backgroundColor: theme.colors.background.elevated,
            borderRadius: theme.borderRadius.lg,
            borderColor: theme.colors.borderSubtle,
          },
          theme.shadows.sm,
        ]}>
        <View style={styles.insightRow}>
          <Text
            style={[
              styles.insightLabel,
              {
                color: theme.colors.text.tertiary,
                fontSize: theme.typography.sizes.xs,
                fontFamily: theme.typography.fonts.medium,
              },
            ]}>
            Last added
          </Text>
          <View style={styles.insightValueBlock}>
            <Text
              numberOfLines={1}
              style={[
                styles.insightValue,
                {
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.sizes.sm,
                  fontWeight: theme.typography.weights.semibold as FontWeight,
                  fontFamily: theme.typography.fonts.semibold,
                },
              ]}>
              {lastItemName}
            </Text>
            <Text
              style={[
                styles.insightMeta,
                {
                  color: theme.colors.text.tertiary,
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.regular,
                },
              ]}>
              {lastItemDate}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.insightDivider,
            {backgroundColor: theme.colors.borderSubtle},
          ]}
        />
        <View style={styles.insightRow}>
          <Text
            style={[
              styles.insightLabel,
              {
                color: theme.colors.text.tertiary,
                fontSize: theme.typography.sizes.xs,
                fontFamily: theme.typography.fonts.medium,
              },
            ]}>
            Most accessed
          </Text>
          <View style={styles.insightValueBlock}>
            <Text
              numberOfLines={1}
              style={[
                styles.insightValue,
                {
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.sizes.sm,
                  fontWeight: theme.typography.weights.semibold as FontWeight,
                  fontFamily: theme.typography.fonts.semibold,
                },
              ]}>
              {topLocationName}
            </Text>
            <Text
              style={[
                styles.insightMeta,
                {
                  color: theme.colors.text.tertiary,
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.regular,
                },
              ]}>
              {topLocationItems}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.colors.text.primary,
              fontSize: theme.typography.sizes.lg,
              fontWeight: theme.typography.weights.semibold as FontWeight,
              fontFamily: theme.typography.fonts.semibold,
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
                fontFamily: theme.typography.fonts.regular,
              },
            ]}>
            Add your first item to see it here.
          </Text>
        )
      )}

      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onBarcodeDetected={handleBarcodeDetected}
      />
    </ScrollView>
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
    marginBottom: 24,
  },
  logoContainer: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  appTitle: {
    marginBottom: 6,
  },
  tagline: {},
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 28,
  },
  statSlot: {
    flex: 1,
  },
  statCard: {
    width: '100%',
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
  statLabel: {},
  statPanelLabel: {},
  statPanelText: {
    marginLeft: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {},
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 10,
    minHeight: 78,
  },
  quickActionIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    textAlign: 'center',
  },
  quickActionSubtitle: {
    textAlign: 'center',
    marginTop: 2,
  },
  insightCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 28,
    borderWidth: StyleSheet.hairlineWidth,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  insightLabel: {
    flex: 1,
  },
  insightValueBlock: {
    flex: 1,
    alignItems: 'flex-end',
  },
  insightValue: {
    textAlign: 'right',
  },
  insightMeta: {
    marginTop: 2,
  },
  insightDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
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
  recentSubtitle: {},
  recentTime: {
    marginTop: 2,
  },
  emptyState: {
    textAlign: 'center',
    paddingVertical: 12,
  },
});

export default HomeScreen;
