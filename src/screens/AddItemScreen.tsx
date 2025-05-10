import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'react-native-image-picker';
import ServerService from '../services/serverService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';

interface Location {
  id: string;
  name: string;
  description: string;
}

interface DisplayPreference {
  id: string;
  label: string;
  enabled: boolean;
}

const AddItemScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [displayPreferences, setDisplayPreferences] = useState<DisplayPreference[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({});
    setSelectedLocation(null);
    setSearchQuery('');
    setSelectedImage(null);
  };

  useEffect(() => {
    autoConnect();
  }, []);

  const autoConnect = async () => {
    try {
      setIsConnecting(true);
      const service = ServerService.getInstance();
      const response = await service.autoConnect();
      
      if (!response.success) {
        Alert.alert('Error', 'Failed to connect to server. Please check your connection settings.');
        navigation.goBack();
        return;
      }

      await loadLocations();
      await loadDisplayPreferences();
    } catch (error) {
      console.error('Error auto-connecting:', error);
      Alert.alert('Error', 'Failed to connect to server');
      navigation.goBack();
    } finally {
      setIsConnecting(false);
    }
  };

  const loadLocations = async () => {
    try {
      const service = ServerService.getInstance();
      const response = await service.getLocations();
      if (response.success && response.data) {
        setLocations(response.data.locations);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
      Alert.alert('Error', 'Failed to load locations');
    }
  };

  const loadDisplayPreferences = async () => {
    try {
      const savedPreferences = await AsyncStorage.getItem(STORAGE_KEYS.INVENTORY_DISPLAY_PREFERENCES);
      if (savedPreferences) {
        setDisplayPreferences(JSON.parse(savedPreferences));
      }
    } catch (error) {
      console.error('Error loading display preferences:', error);
    }
  };

  const handleImagePicker = async (type: 'camera' | 'library') => {
    const options: ImagePicker.ImageLibraryOptions = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 1200,
      maxWidth: 1200,
      quality: 0.8,
    };

    try {
      const result = type === 'camera' 
        ? await ImagePicker.launchCamera(options)
        : await ImagePicker.launchImageLibrary(options);

      if (result.assets && result.assets[0]?.uri) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const service = ServerService.getInstance();

      // First create the item
      const itemResponse = await service.createItem({
        name: formData.name,
        description: formData.description || '',
        quantity: parseInt(formData.quantity) || 0,
        locationId: selectedLocation?.id,
        labels: formData.labels || [],
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
        insured: formData.insured || false,
      });

      console.log('Item creation response:', itemResponse);

      if (!itemResponse.success || !itemResponse.data) {
        throw new Error('Failed to create item');
      }

      // If there's an image, upload it
      if (selectedImage) {
        console.log('Starting image upload for item:', itemResponse.data.id);
        const formData = new FormData();
        
        // Get the file extension from the URI
        const fileExtension = selectedImage.split('.').pop() || 'jpg';
        const fileName = `image.${fileExtension}`;
        
        // Create the file object with proper type
        const file = {
          uri: selectedImage,
          type: `image/${fileExtension}`,
          name: fileName,
        };
        
        console.log('File object:', file);
        
        formData.append('file', file as any);
        formData.append('type', 'image');
        formData.append('primary', 'true');
        formData.append('name', 'Item Image');

        console.log('FormData for image upload:', formData);

        const imageResponse = await service.uploadItemImage(itemResponse.data.id, formData);
        console.log('Image upload response:', imageResponse);
        
        if (!imageResponse.success) {
          console.warn('Failed to upload image:', imageResponse.error);
          Alert.alert('Warning', 'Item was created but image upload failed');
        } else {
          console.log('Image uploaded successfully');
        }
      }

      Alert.alert('Success', 'Item added successfully');
      resetForm();
      navigation.goBack();
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      edges={['right', 'left', 'bottom']}
    >
      {isConnecting ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.button.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text.primary }]}>
            Connecting to server...
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {/* Item Name Field */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Item Name
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.background.secondary,
                color: theme.colors.text.primary,
                borderColor: theme.colors.border,
              }]}
              placeholder="Enter item name"
              placeholderTextColor={theme.colors.text.secondary}
              value={formData.name || ''}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            />
          </View>

          {/* Location Dropdown */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Location
            </Text>
            <TextInput
              style={[styles.searchInput, { 
                backgroundColor: theme.colors.background.secondary,
                color: theme.colors.text.primary,
                borderColor: theme.colors.border,
              }]}
              placeholder="Search locations..."
              placeholderTextColor={theme.colors.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <ScrollView 
              style={[styles.locationList, { 
                backgroundColor: theme.colors.background.secondary,
                borderColor: theme.colors.border,
              }]}
              nestedScrollEnabled={true}
            >
              {filteredLocations.map(location => (
                <TouchableOpacity
                  key={location.id}
                  style={[
                    styles.locationItem,
                    selectedLocation?.id === location.id && { 
                      backgroundColor: theme.colors.button.primary 
                    }
                  ]}
                  onPress={() => setSelectedLocation(location)}
                >
                  <Text style={[
                    styles.locationName,
                    { color: selectedLocation?.id === location.id 
                      ? theme.colors.button.text 
                      : theme.colors.text.primary 
                    }
                  ]}>
                    {location.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Form Fields */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Item Details
            </Text>
            {displayPreferences.map(preference => {
              if (!preference.enabled || preference.id === 'name') return null;

              switch (preference.id) {
                case 'description':
                  return (
                    <TextInput
                      key={preference.id}
                      style={[styles.input, styles.textArea, { 
                        backgroundColor: theme.colors.background.secondary,
                        color: theme.colors.text.primary,
                        borderColor: theme.colors.border,
                      }]}
                      placeholder="Description"
                      placeholderTextColor={theme.colors.text.secondary}
                      multiline
                      numberOfLines={4}
                      value={formData[preference.id] || ''}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, [preference.id]: text }))}
                    />
                  );
                default:
                  return null;
              }
            })}
          </View>

          {/* Image Upload Section */}
          <View style={[styles.section, styles.lastSection]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Image
            </Text>
            <View style={styles.imageButtons}>
              <TouchableOpacity
                style={[styles.imageButton, { backgroundColor: theme.colors.button.primary }]}
                onPress={() => handleImagePicker('camera')}
              >
                <MaterialIcons name="camera-alt" size={24} color={theme.colors.button.text} />
                <Text style={[styles.imageButtonText, { color: theme.colors.button.text }]}>
                  Take Photo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.imageButton, { backgroundColor: theme.colors.button.primary }]}
                onPress={() => handleImagePicker('library')}
              >
                <MaterialIcons name="photo-library" size={24} color={theme.colors.button.text} />
                <Text style={[styles.imageButtonText, { color: theme.colors.button.text }]}>
                  Upload Image
                </Text>
              </TouchableOpacity>
            </View>
            {selectedImage && (
              <View style={styles.selectedImageContainer}>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.selectedImage}
                  resizeMode="cover"
                />
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.colors.button.primary }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.button.text} />
            ) : (
              <Text style={[styles.submitButtonText, { color: theme.colors.button.text }]}>
                Add Item
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 10,
    paddingBottom: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  locationList: {
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: 8,
  },
  locationItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  locationName: {
    fontSize: 16,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imageButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedImageContainer: {
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: 200,
  },
  submitButton: {
    margin: 16,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  lastSection: {
    paddingBottom: 16,
  },
});

export default AddItemScreen;
