import React, {useCallback, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, Image} from 'react-native';
import {RouteProp, useRoute} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ServerService, {InventoryItem} from '../services/serverService';
import {useTheme} from '../theme/ThemeContext';
import {useAsyncState} from '../hooks/useAsyncState';
import {getImageSource, formatDateTime} from '../utils/imageUtils';
import {LoadingState} from '../components/common/LoadingState';
import {ErrorState} from '../components/common/ErrorState';

type ItemDetailRouteProp = RouteProp<
  {ItemDetail: {itemId: string}},
  'ItemDetail'
>;

function formatCurrency(value?: number): string {
  if (!value || value <= 0) {
    return '—';
  }
  return `$${value.toFixed(2)}`;
}

const ItemDetailScreen: React.FC = () => {
  const {theme} = useTheme();
  const route = useRoute<ItemDetailRouteProp>();
  const {itemId} = route.params;
  const {
    data: item,
    isLoading,
    error,
    execute,
  } = useAsyncState<InventoryItem>();

  const fetchItem = useCallback(async () => {
    const service = ServerService.getInstance();
    const result = await service.getItemById(itemId);
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.error || 'Failed to load item');
  }, [itemId]);

  useEffect(() => {
    execute(fetchItem);
  }, [execute, fetchItem]);

  if (isLoading) {
    return <LoadingState message="Loading item details..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => execute(fetchItem)} />;
  }

  if (!item) {
    return null;
  }

  const description = item.description?.trim();
  const labels = item.labels ?? [];

  const StatCard: React.FC<{
    icon: string;
    label: string;
    value: string;
    tone?: 'default' | 'success' | 'warning';
  }> = ({icon, label, value, tone = 'default'}) => {
    const toneColor =
      tone === 'success'
        ? theme.colors.success
        : tone === 'warning'
        ? theme.colors.warning
        : theme.colors.accent.primary;
    return (
      <View
        style={[
          styles.statCard,
          {
            backgroundColor: theme.colors.card.background,
            borderColor: theme.colors.card.border,
            borderRadius: theme.borderRadius.md,
          },
        ]}>
        <View
          style={[
            styles.statIcon,
            {
              backgroundColor: theme.colors.accent.muted,
              borderRadius: theme.borderRadius.sm,
            },
          ]}>
          <MaterialIcons name={icon} size={16} color={toneColor} />
        </View>
        <Text
          style={[
            styles.statLabel,
            {
              color: theme.colors.text.secondary,
              fontSize: theme.typography.sizes.xs,
            },
          ]}>
          {label}
        </Text>
        <Text
          style={[
            styles.statValue,
            {
              color: theme.colors.text.primary,
              fontSize: theme.typography.sizes.lg,
              fontWeight: theme.typography.weights.semibold,
            },
          ]}>
          {value}
        </Text>
      </View>
    );
  };

  const MetaRow: React.FC<{icon: string; label: string; value: string}> = ({
    icon,
    label,
    value,
  }) => (
    <View style={styles.metaRow}>
      <View
        style={[
          styles.metaIcon,
          {
            backgroundColor: theme.colors.background.tertiary,
            borderRadius: theme.borderRadius.sm,
          },
        ]}>
        <MaterialIcons
          name={icon}
          size={14}
          color={theme.colors.text.tertiary}
        />
      </View>
      <View style={styles.metaTextGroup}>
        <Text
          style={[
            styles.metaLabel,
            {
              color: theme.colors.text.secondary,
              fontSize: theme.typography.sizes.xs,
            },
          ]}>
          {label}
        </Text>
        <Text
          style={[
            styles.metaValue,
            {
              color: theme.colors.text.primary,
              fontSize: theme.typography.sizes.md,
            },
          ]}>
          {value}
        </Text>
      </View>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: theme.colors.background.primary},
      ]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: theme.spacing.md,
            paddingBottom: theme.spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: theme.colors.card.background,
              borderColor: theme.colors.card.border,
              borderRadius: theme.borderRadius.lg,
            },
            theme.shadows.sm,
          ]}>
          <View
            style={[
              styles.accentStripe,
              {
                backgroundColor: theme.colors.accent.primary,
                borderTopLeftRadius: theme.borderRadius.lg,
                borderBottomLeftRadius: theme.borderRadius.lg,
              },
            ]}
          />
          <View style={[styles.heroContent, {padding: theme.spacing.md}]}>
            <View style={[styles.heroRow, {gap: theme.spacing.md}]}>
              <View
                style={[
                  styles.heroImage,
                  {
                    backgroundColor: theme.colors.background.tertiary,
                    borderRadius: theme.borderRadius.md,
                    borderColor: theme.colors.borderSubtle,
                  },
                ]}>
                {item.imageId ? (
                  <Image
                    source={getImageSource(item.id, item.imageId)}
                    style={[
                      styles.heroImageFill,
                      {borderRadius: theme.borderRadius.md},
                    ]}
                    resizeMode="cover"
                  />
                ) : (
                  <MaterialIcons
                    name="inventory-2"
                    size={32}
                    color={theme.colors.text.tertiary}
                  />
                )}
              </View>
              <View style={styles.heroText}>
                <Text
                  style={[
                    styles.title,
                    {
                      color: theme.colors.text.primary,
                      fontSize: theme.typography.sizes.xxl,
                      fontWeight: theme.typography.weights.semibold,
                    },
                  ]}>
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.desc,
                    {
                      color: theme.colors.text.secondary,
                      fontSize: theme.typography.sizes.md,
                    },
                  ]}>
                  {description || 'No description added yet.'}
                </Text>
                <View style={styles.locationRow}>
                  <MaterialIcons
                    name="location-on"
                    size={14}
                    color={theme.colors.text.tertiary}
                  />
                  <Text
                    style={[
                      styles.locationText,
                      {
                        color: theme.colors.text.tertiary,
                        fontSize: theme.typography.sizes.sm,
                      },
                    ]}>
                    {item.location?.name || 'No location assigned'}
                  </Text>
                </View>
              </View>
            </View>

            {labels.length > 0 && (
              <View
                style={[
                  styles.labelRow,
                  {marginTop: theme.spacing.sm, gap: theme.spacing.xs},
                ]}>
                {labels.map(label => (
                  <View
                    key={label.id}
                    style={[
                      styles.labelChip,
                      {
                        backgroundColor: theme.colors.accent.muted,
                        borderRadius: theme.borderRadius.full,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.labelChipText,
                        {
                          color: theme.colors.accent.primary,
                          fontSize: theme.typography.sizes.xs,
                        },
                      ]}>
                      {label.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View
          style={[
            styles.statsGrid,
            {marginTop: theme.spacing.lg, gap: theme.spacing.sm},
          ]}>
          <StatCard
            icon="inventory-2"
            label="Quantity"
            value={`${item.quantity}`}
          />
          <StatCard
            icon={item.insured ? 'verified' : 'error-outline'}
            label="Insured"
            value={item.insured ? 'Yes' : 'No'}
            tone={item.insured ? 'success' : 'warning'}
          />
          <StatCard
            icon="attach-money"
            label="Purchase Price"
            value={formatCurrency(item.purchasePrice)}
          />
          <StatCard
            icon="category"
            label="Status"
            value={item.archived ? 'Archived' : 'Active'}
          />
        </View>

        <View
          style={[
            styles.detailCard,
            {
              backgroundColor: theme.colors.card.background,
              borderColor: theme.colors.card.border,
              borderRadius: theme.borderRadius.lg,
              marginTop: theme.spacing.lg,
            },
            theme.shadows.sm,
          ]}>
          <View style={styles.detailHeader}>
            <MaterialIcons
              name="article"
              size={16}
              color={theme.colors.accent.primary}
            />
            <Text
              style={[
                styles.detailTitle,
                {
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.sizes.sm,
                  fontWeight: theme.typography.weights.semibold,
                  letterSpacing: theme.typography.letterSpacing.wide,
                },
              ]}>
              DETAILS
            </Text>
          </View>
          <View style={styles.detailContent}>
            <MetaRow
              icon="schedule"
              label="Created"
              value={formatDateTime(item.createdAt)}
            />
            <MetaRow
              icon="update"
              label="Updated"
              value={formatDateTime(item.updatedAt)}
            />
            <MetaRow icon="fingerprint" label="Asset ID" value={item.assetId} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
  },
  heroCard: {
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accentStripe: {
    width: 4,
  },
  heroContent: {
    flex: 1,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heroImage: {
    width: 96,
    height: 96,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroImageFill: {
    width: '100%',
    height: '100%',
  },
  heroText: {
    flex: 1,
  },
  title: {
    marginBottom: 6,
  },
  desc: {
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    flexShrink: 1,
  },
  labelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  labelChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  labelChipText: {
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCard: {
    flexBasis: '48%',
    flexGrow: 1,
    borderWidth: 1,
    padding: 12,
    minHeight: 88,
  },
  statIcon: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontWeight: '600',
  },
  detailCard: {
    borderWidth: 1,
    padding: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  detailTitle: {
    textTransform: 'uppercase',
  },
  detailContent: {
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaIcon: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaTextGroup: {
    flex: 1,
  },
  metaLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metaValue: {
    marginTop: 2,
  },
});

export default ItemDetailScreen;
