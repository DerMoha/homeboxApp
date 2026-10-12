import React from 'react';
import {Text, StyleSheet} from 'react-native';
import {useTheme} from '../../theme/ThemeContext';
import {ApiResponse} from '../../types';

export type CacheInfo = Pick<
  ApiResponse,
  'fromCache' | 'cachedAt' | 'summaryOnly'
>;
export function CacheStatus({info}: {info?: CacheInfo}) {
  const {theme} = useTheme();
  if (!info?.fromCache) {
    return null;
  }
  return (
    <Text
      accessibilityLiveRegion="polite"
      style={[
        styles.banner,
        {
          backgroundColor: theme.colors.accent.muted,
          color: theme.colors.text.primary,
        },
      ]}>
      Offline copy · Last refreshed{' '}
      {info.cachedAt ? new Date(info.cachedAt).toLocaleString() : 'unknown'}.{' '}
      Reconnect to refresh or save changes.
      {info.summaryOnly
        ? ' Some item details are unavailable until you reconnect.'
        : ''}
    </Text>
  );
}
const styles = StyleSheet.create({banner: {padding: 12}});
