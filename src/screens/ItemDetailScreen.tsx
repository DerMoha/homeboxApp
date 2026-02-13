import React, {useCallback, useEffect, useMemo} from 'react';
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

type ThemeType = ReturnType<typeof useTheme>['theme'];

function formatCurrency(value?: number): string {
  if (!value || value <= 0) {
    return '—';
  }
  return `$${value.toFixed(2)}`;
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning';
  theme: ThemeType;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  tone = 'default',
  theme,
}) => {
  const toneColor = useMemo(() => {
    if (tone === 'success') {
      return theme.colors.success;
    }
    if (tone === 'warning') {
      return theme.colors.warning;
    }
    return theme.colors.accent.primary;
  }, [
    theme.colors.accent.primary,
    theme.colors.success,
    theme.colors.warning,
    tone,
  ]);

  const cardStyle = useMemo(
    () => [
      styles.statCard,
      {
        backgroundColor: theme.colors.background.secondary,
        borderColor: theme.colors.borderSubtle,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: theme.borderRadius.md,
      },
    ],
    [
      theme.borderRadius.md,
      theme.colors.background.secondary,
      theme.colors.borderSubtle,
    ],
  );

  const iconStyle = useMemo(
    () => [
      styles.statIcon,
      {
        backgroundColor: theme.colors.accent.muted,
        borderRadius: theme.borderRadius.sm,
      },
    ],
    [theme.borderRadius.sm, theme.colors.accent.muted],
  );

  const labelStyle = useMemo(
    () => [
      styles.statLabel,
      {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.xs,
        fontFamily: theme.typography.fonts.medium,
      },
    ],
    [
      theme.colors.text.secondary,
      theme.typography.fonts.medium,
      theme.typography.sizes.xs,
    ],
  );

  const valueStyle = useMemo(
    () => [
      styles.statValue,
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

  return (
    <View style={cardStyle}>
      <View style={iconStyle}>
        <MaterialIcons name={icon} size={16} color={toneColor} />
      </View>
      <Text style={labelStyle}>{label}</Text>
      <Text style={valueStyle}>{value}</Text>
    </View>
  );
};

interface MetaRowProps {
  icon: string;
  label: string;
  value: string;
  theme: ThemeType;
}

const MetaRow: React.FC<MetaRowProps> = ({icon, label, value, theme}) => {
  const metaIconStyle = useMemo(
    () => [
      styles.metaIcon,
      {
        backgroundColor: theme.colors.background.tertiary,
        borderRadius: theme.borderRadius.sm,
      },
    ],
    [theme.borderRadius.sm, theme.colors.background.tertiary],
  );

  const metaLabelStyle = useMemo(
    () => [
      styles.metaLabel,
      {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.xs,
        fontFamily: theme.typography.fonts.medium,
      },
    ],
    [
      theme.colors.text.secondary,
      theme.typography.fonts.medium,
      theme.typography.sizes.xs,
    ],
  );

  const metaValueStyle = useMemo(
    () => [
      styles.metaValue,
      {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.md,
        fontFamily: theme.typography.fonts.regular,
      },
    ],
    [
      theme.colors.text.primary,
      theme.typography.fonts.regular,
      theme.typography.sizes.md,
    ],
  );

  return (
    <View style={styles.metaRow}>
      <View style={metaIconStyle}>
        <MaterialIcons
          name={icon}
          size={14}
          color={theme.colors.text.tertiary}
        />
      </View>
      <View style={styles.metaTextGroup}>
        <Text style={metaLabelStyle}>{label}</Text>
        <Text style={metaValueStyle}>{value}</Text>
      </View>
    </View>
  );
};

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
      return result.data as InventoryItem;
    }
    throw new Error(result.error || 'Failed to load item');
  }, [itemId]);

  useEffect(() => {
    execute(fetchItem);
  }, [execute, fetchItem]);

  const description = item?.description?.trim();
  const labels = item?.labels ?? [];

  const containerStyle = useMemo(
    () => [
      styles.container,
      {backgroundColor: theme.colors.background.primary},
    ],
    [theme.colors.background.primary],
  );

  const scrollContentStyle = useMemo(
    () => [
      styles.scrollContent,
      {
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.xl,
      },
    ],
    [theme.spacing.md, theme.spacing.xl],
  );

  const heroCardStyle = useMemo(
    () => [
      styles.heroCard,
      {
        backgroundColor: theme.colors.background.secondary,
        borderColor: theme.colors.borderSubtle,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: theme.borderRadius.lg,
      },
      theme.shadows.sm,
    ],
    [
      theme.borderRadius.lg,
      theme.colors.background.secondary,
      theme.colors.borderSubtle,
      theme.shadows.sm,
    ],
  );

  const accentStripeStyle = useMemo(
    () => [
      styles.accentStripe,
      {
        backgroundColor: theme.colors.accent.muted,
        borderTopLeftRadius: theme.borderRadius.lg,
        borderBottomLeftRadius: theme.borderRadius.lg,
      },
    ],
    [theme.borderRadius.lg, theme.colors.accent.muted],
  );

  const heroContentStyle = useMemo(
    () => [styles.heroContent, {padding: theme.spacing.md}],
    [theme.spacing.md],
  );

  const heroRowStyle = useMemo(
    () => [styles.heroRow, {gap: theme.spacing.md}],
    [theme.spacing.md],
  );

  const heroImageStyle = useMemo(
    () => [
      styles.heroImage,
      {
        backgroundColor: theme.colors.background.tertiary,
        borderRadius: theme.borderRadius.md,
        borderColor: theme.colors.borderSubtle,
      },
    ],
    [
      theme.borderRadius.md,
      theme.colors.background.tertiary,
      theme.colors.borderSubtle,
    ],
  );

  const heroImageFillStyle = useMemo(
    () => [styles.heroImageFill, {borderRadius: theme.borderRadius.md}],
    [theme.borderRadius.md],
  );

  const titleStyle = useMemo(
    () => [
      styles.title,
      {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.xxl,
        fontWeight: theme.typography.weights.semibold,
        fontFamily: theme.typography.fonts.semibold,
      },
    ],
    [
      theme.colors.text.primary,
      theme.typography.fonts.semibold,
      theme.typography.sizes.xxl,
      theme.typography.weights.semibold,
    ],
  );

  const descStyle = useMemo(
    () => [
      styles.desc,
      {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.md,
        fontFamily: theme.typography.fonts.regular,
      },
    ],
    [
      theme.colors.text.secondary,
      theme.typography.fonts.regular,
      theme.typography.sizes.md,
    ],
  );

  const locationTextStyle = useMemo(
    () => [
      styles.locationText,
      {
        color: theme.colors.text.tertiary,
        fontSize: theme.typography.sizes.sm,
        fontFamily: theme.typography.fonts.regular,
      },
    ],
    [
      theme.colors.text.tertiary,
      theme.typography.fonts.regular,
      theme.typography.sizes.sm,
    ],
  );

  const labelRowStyle = useMemo(
    () => [
      styles.labelRow,
      {marginTop: theme.spacing.sm, gap: theme.spacing.xs},
    ],
    [theme.spacing.sm, theme.spacing.xs],
  );

  const labelChipStyle = useMemo(
    () => [
      styles.labelChip,
      {
        backgroundColor: theme.colors.accent.muted,
        borderRadius: theme.borderRadius.full,
        borderColor: theme.colors.borderSubtle,
        borderWidth: StyleSheet.hairlineWidth,
      },
    ],
    [
      theme.borderRadius.full,
      theme.colors.accent.muted,
      theme.colors.borderSubtle,
    ],
  );

  const labelChipTextStyle = useMemo(
    () => [
      styles.labelChipText,
      {
        color: theme.colors.accent.primary,
        fontSize: theme.typography.sizes.xs,
        fontFamily: theme.typography.fonts.medium,
      },
    ],
    [
      theme.colors.accent.primary,
      theme.typography.fonts.medium,
      theme.typography.sizes.xs,
    ],
  );

  const statsGridStyle = useMemo(
    () => [
      styles.statsGrid,
      {marginTop: theme.spacing.lg, gap: theme.spacing.sm},
    ],
    [theme.spacing.lg, theme.spacing.sm],
  );

  const detailCardStyle = useMemo(
    () => [
      styles.detailCard,
      {
        backgroundColor: theme.colors.background.secondary,
        borderColor: theme.colors.borderSubtle,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: theme.borderRadius.lg,
        marginTop: theme.spacing.lg,
      },
      theme.shadows.sm,
    ],
    [
      theme.borderRadius.lg,
      theme.colors.background.secondary,
      theme.colors.borderSubtle,
      theme.shadows.sm,
      theme.spacing.lg,
    ],
  );

  const detailTitleStyle = useMemo(
    () => [
      styles.detailTitle,
      {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.sm,
        fontWeight: theme.typography.weights.semibold,
        fontFamily: theme.typography.fonts.semibold,
        letterSpacing: theme.typography.letterSpacing.normal,
      },
    ],
    [
      theme.colors.text.primary,
      theme.typography.fonts.semibold,
      theme.typography.letterSpacing.normal,
      theme.typography.sizes.sm,
      theme.typography.weights.semibold,
    ],
  );

  if (isLoading) {
    return <LoadingState message="Loading item details..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => execute(fetchItem)} />;
  }

  if (!item) {
    return null;
  }

  return (
    <View style={containerStyle}>
      <ScrollView
        contentContainerStyle={scrollContentStyle}
        showsVerticalScrollIndicator={false}>
        <View style={heroCardStyle}>
          <View style={accentStripeStyle} />
          <View style={heroContentStyle}>
            <View style={heroRowStyle}>
              <View style={heroImageStyle}>
                {item.imageId ? (
                  <Image
                    source={getImageSource(item.id, item.imageId)}
                    style={heroImageFillStyle}
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
                <Text style={titleStyle}>{item.name}</Text>
                <Text style={descStyle}>
                  {description || 'No description added yet.'}
                </Text>
                <View style={styles.locationRow}>
                  <MaterialIcons
                    name="location-on"
                    size={14}
                    color={theme.colors.text.tertiary}
                  />
                  <Text style={locationTextStyle}>
                    {item.location?.name || 'No location assigned'}
                  </Text>
                </View>
              </View>
            </View>

            {labels.length > 0 && (
              <View style={labelRowStyle}>
                {labels.map(label => (
                  <View key={label.id} style={labelChipStyle}>
                    <Text style={labelChipTextStyle}>{label.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={statsGridStyle}>
          <StatCard
            icon="inventory-2"
            label="Quantity"
            value={`${item.quantity}`}
            theme={theme}
          />
          <StatCard
            icon={item.insured ? 'verified' : 'error-outline'}
            label="Insured"
            value={item.insured ? 'Yes' : 'No'}
            tone={item.insured ? 'success' : 'warning'}
            theme={theme}
          />
          <StatCard
            icon="attach-money"
            label="Purchase Price"
            value={formatCurrency(item.purchasePrice)}
            theme={theme}
          />
          <StatCard
            icon="category"
            label="Status"
            value={item.archived ? 'Archived' : 'Active'}
            theme={theme}
          />
        </View>

        <View style={detailCardStyle}>
          <View style={styles.detailHeader}>
            <MaterialIcons
              name="article"
              size={16}
              color={theme.colors.accent.primary}
            />
            <Text style={detailTitleStyle}>DETAILS</Text>
          </View>
          <View style={styles.detailContent}>
            <MetaRow
              icon="schedule"
              label="Created"
              value={formatDateTime(item.createdAt)}
              theme={theme}
            />
            <MetaRow
              icon="update"
              label="Updated"
              value={formatDateTime(item.updatedAt)}
              theme={theme}
            />
            <MetaRow
              icon="fingerprint"
              label="Asset ID"
              value={item.assetId}
              theme={theme}
            />
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
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accentStripe: {
    width: 2,
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
    borderWidth: StyleSheet.hairlineWidth,
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
  labelChipText: {},
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCard: {
    flexBasis: '48%',
    flexGrow: 1,
    borderWidth: StyleSheet.hairlineWidth,
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
    marginBottom: 4,
  },
  statValue: {
    fontWeight: '600',
  },
  detailCard: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  detailTitle: {},
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
  metaLabel: {},
  metaValue: {
    marginTop: 2,
  },
});

export default ItemDetailScreen;
