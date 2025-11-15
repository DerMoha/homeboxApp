import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Image } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ServerService from '../services/serverService';
import { useTheme } from '../theme/ThemeContext';

// Utility to generate image URL for an item (copied from InventoryScreen)
const getImageUrl = (itemId: string, imageId: string): string => {
  const service = ServerService.getInstance();
  const axiosInstance = service.getAxiosInstance();
  if (!axiosInstance) {
    throw new Error('No active server connection');
  }
  return `${service.getBaseUrl()}/api/v1/items/${itemId}/attachments/${imageId}`;
};

// Type for navigation params


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
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      setError(null);
      const service = ServerService.getInstance();
      const result = await service.getItemById(itemId);
      if (result.success) {
        setItem(result.data);
      } else {
        setError(result.error || 'Failed to load item');
      }
      setLoading(false);
    };
    fetchItem();
  }, [itemId]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.button.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background.primary }]}>
        <Text style={{ color: theme.colors.error }}>{error}</Text>
      </View>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {item.imageId ? (
          <Image source={{ uri: getImageUrl(item.id, item.imageId) }} style={styles.image} resizeMode="cover" />
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
    </SafeAreaView>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
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
