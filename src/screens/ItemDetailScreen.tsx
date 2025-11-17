import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import ServerService, { InventoryItem } from '../services/serverService';
import { useTheme } from '../theme/ThemeContext';
import { useAsyncState } from '../hooks/useAsyncState';
import { getImageSource } from '../utils/imageUtils';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

type ItemDetailRouteProp = RouteProp<{ ItemDetail: { itemId: string } }, 'ItemDetail'>;

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {return dateString;}
  // Format as YYYY-MM-DD HH:mm
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(',', '');
}

const ItemDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const route = useRoute<ItemDetailRouteProp>();
  const { itemId } = route.params;
  const { data: item, isLoading, error, execute } = useAsyncState<InventoryItem>();

  useEffect(() => {
    const fetchItem = async () => {
      const service = ServerService.getInstance();
      const result = await service.getItemById(itemId);
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to load item');
      }
    };

    execute(fetchItem);
  }, [itemId, execute]);

  if (isLoading) {
    return <LoadingState message="Loading item details..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => execute(async () => {
      const service = ServerService.getInstance();
      const result = await service.getItemById(itemId);
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error || 'Failed to load item');
    })} />;
  }

  if (!item) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {item.imageId ? (
          <Image source={getImageSource(item.id, item.imageId)} style={styles.image} resizeMode="cover" />
        ) : null}
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>{item.name}</Text>
        <Text style={[styles.desc, { color: theme.colors.text.secondary }]}>{item.description}</Text>
        <View style={styles.infoBlock}>
          <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Quantity:</Text>
          <Text style={[styles.value, { color: theme.colors.text.primary }]}>{item.quantity}</Text>
        </View>
        {item.location && (
          <View style={styles.infoBlock}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Location:</Text>
            <Text style={[styles.value, { color: theme.colors.text.primary }]}>{item.location.name}</Text>
          </View>
        )}
        <View style={styles.infoBlock}>
          <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Created:</Text>
          <Text style={[styles.value, { color: theme.colors.text.primary }]}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Updated:</Text>
          <Text style={[styles.value, { color: theme.colors.text.primary }]}>{formatDate(item.updatedAt)}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Insured:</Text>
          <Text style={[styles.value, { color: theme.colors.text.primary }]}>{item.insured ? 'Yes' : 'No'}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Purchase Price:</Text>
          <Text style={[styles.value, { color: theme.colors.text.primary }]}>{item.purchasePrice}</Text>
        </View>
        {/* Add more fields as needed */}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  desc: {
    fontSize: 16,
    marginBottom: 18,
    textAlign: 'center',
  },
  infoBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
  },
  value: {
    fontSize: 16,
    flex: 1,
    textAlign: 'right',
  },
});

export default ItemDetailScreen;
