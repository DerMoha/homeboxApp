import React, {useEffect, useRef, useMemo} from 'react';
import {View, StyleSheet, Animated, Dimensions, ViewStyle} from 'react-native';
import type {Theme} from '../../theme/theme';

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
  theme: Theme;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius,
  style,
  theme,
}) => {
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacityAnim]);

  const skeletonStyle = useMemo(
    () => [
      styles.skeleton,
      {
        width,
        height,
        borderRadius: borderRadius ?? theme.borderRadius.sm,
        backgroundColor: theme.colors.background.tertiary,
        opacity: opacityAnim,
      },
      style,
    ],
    [width, height, borderRadius, theme, opacityAnim, style],
  );

  return <Animated.View style={skeletonStyle} />;
};

interface InventoryItemSkeletonProps {
  viewMode: 'grid' | 'list';
  itemsPerRow?: number;
  listZoom?: number;
  theme: Theme;
}

const InventoryItemSkeleton: React.FC<InventoryItemSkeletonProps> = ({
  viewMode,
  itemsPerRow = 2,
  listZoom = 1,
  theme,
}) => {
  const itemWidth = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    const gap = theme.spacing.xs;
    return Math.floor((screenWidth - gap * (itemsPerRow + 1)) / itemsPerRow);
  }, [itemsPerRow, theme.spacing.xs]);

  const imageHeight = useMemo(() => Math.round(itemWidth * 0.62), [itemWidth]);

  if (viewMode === 'grid') {
    return (
      <View
        style={[
          styles.gridContainer,
          {
            backgroundColor: theme.colors.background.secondary,
            width: itemWidth,
            borderRadius: theme.borderRadius.lg,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.borderSubtle,
            margin: theme.spacing.xs / 2,
          },
          theme.shadows.sm,
        ]}>
        <Skeleton
          width={itemWidth}
          height={imageHeight}
          borderRadius={theme.borderRadius.md}
          theme={theme}
        />
        <View
          style={[
            styles.gridInfo,
            {
              padding: theme.spacing.sm,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: theme.colors.borderSubtle,
            },
          ]}>
          <Skeleton
            width="70%"
            height={theme.typography.sizes.md}
            borderRadius={theme.borderRadius.sm}
            theme={theme}
          />
          <View style={{height: theme.spacing.xs}} />
          <Skeleton
            width="50%"
            height={theme.typography.sizes.xs}
            borderRadius={theme.borderRadius.sm}
            theme={theme}
          />
        </View>
      </View>
    );
  }

  const contentHeight = listZoom === 0 ? 44 : listZoom === 1 ? 72 : 120;

  return (
    <View
      style={[
        styles.listContainer,
        {
          backgroundColor: theme.colors.card.background,
          borderColor: theme.colors.card.border,
          borderRadius: theme.borderRadius.lg,
          marginHorizontal: theme.spacing.sm,
          marginVertical: theme.spacing.xs,
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
      <View
        style={[
          styles.listContent,
          {
            padding: theme.spacing.md,
            paddingLeft: theme.spacing.lg + theme.spacing.xs,
          },
        ]}>
        <View style={styles.listHeader}>
          <Skeleton
            width="60%"
            height={theme.typography.sizes.lg}
            borderRadius={theme.borderRadius.sm}
            theme={theme}
          />
        </View>
        {listZoom >= 1 && (
          <>
            <View style={{height: theme.spacing.xs}} />
            <View style={styles.listMetaRow}>
              <Skeleton
                width={80}
                height={theme.typography.sizes.xs}
                borderRadius={theme.borderRadius.sm}
                theme={theme}
              />
              <View style={{width: theme.spacing.sm}} />
              <Skeleton
                width={60}
                height={theme.typography.sizes.xs}
                borderRadius={theme.borderRadius.sm}
                theme={theme}
              />
            </View>
          </>
        )}
        {listZoom === 2 && (
          <>
            <View style={{height: theme.spacing.sm}} />
            <Skeleton
              width="100%"
              height={contentHeight}
              borderRadius={theme.borderRadius.md}
              theme={theme}
            />
          </>
        )}
      </View>
    </View>
  );
};

interface InventorySkeletonListProps {
  viewMode: 'grid' | 'list';
  itemsPerRow?: number;
  listZoom?: number;
  count?: number;
  theme: Theme;
}

const InventorySkeletonList: React.FC<InventorySkeletonListProps> = ({
  viewMode,
  itemsPerRow = 2,
  listZoom = 1,
  count = 10,
  theme,
}) => {
  const skeletons = useMemo(
    () =>
      Array.from({length: count}, (_, index) => (
        <InventoryItemSkeleton
          key={index}
          viewMode={viewMode}
          itemsPerRow={itemsPerRow}
          listZoom={listZoom}
          theme={theme}
        />
      )),
    [count, viewMode, itemsPerRow, listZoom, theme],
  );

  if (viewMode === 'grid') {
    return (
      <View style={styles.gridWrapper}>
        <View style={[styles.gridList, {gap: theme.spacing.xs}]}>
          {skeletons}
        </View>
      </View>
    );
  }

  return <View style={styles.listWrapper}>{skeletons}</View>;
};

const styles = StyleSheet.create({
  skeleton: {},
  gridContainer: {
    overflow: 'hidden',
  },
  gridInfo: {
    minHeight: 60,
  },
  gridWrapper: {
    flex: 1,
  },
  gridList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  listContainer: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    position: 'relative',
  },
  accentStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
  },
  listContent: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listWrapper: {
    flex: 1,
  },
});

export {Skeleton, InventoryItemSkeleton, InventorySkeletonList};
