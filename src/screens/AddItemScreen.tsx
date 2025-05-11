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
  Switch,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'react-native-image-picker';
import ServerService from '../services/serverService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import * as FileSystem from 'react-native-fs';
import ImageResizer from '@bam.tech/react-native-image-resizer';

interface Location {
  id: string;
  name: string;
  description: string;
}

interface Label {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

const AddItemScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [locations, setLocations] = useState<Location[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<Label[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [labelSearchQuery, setLabelSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [formData, setFormData] = useState<Record<string, any>>({
    quantity: '1' // Set default quantity to 1
  });
  const [enabledFields, setEnabledFields] = useState<Record<string, boolean>>({
    description: true,
    purchasePrice: false,
    insured: false,
    labels: true  // Default to true, but will be overridden by settings
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageFlip, setImageFlip] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [isQuantityFocused, setIsQuantityFocused] = useState(false);
  const [imageQuality, setImageQuality] = useState(0.8); // Default quality
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);

  // Load enabled fields and image quality whenever the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadEnabledFields();
      loadImageQuality();
    }, [])
  );

  useEffect(() => {
    autoConnect();
  }, []);

  const loadEnabledFields = async () => {
    try {
      const savedFields = await AsyncStorage.getItem('@add_item_fields');
      if (savedFields) {
        const fields = JSON.parse(savedFields);
        const enabledMap = fields.reduce((acc: Record<string, boolean>, field: any) => {
          acc[field.id] = field.enabled;
          return acc;
        }, {});
        setEnabledFields(enabledMap);
      }
    } catch (error) {
      console.error('Error loading enabled fields:', error);
    }
  };

  const loadImageQuality = async () => {
    try {
      const savedQuality = await AsyncStorage.getItem('@image_quality');
      if (savedQuality) {
        setImageQuality(parseFloat(savedQuality));
      }
    } catch (error) {
      console.error('Error loading image quality setting:', error);
    }
  };

  const loadLabels = async () => {
    try {
      const service = ServerService.getInstance();
      const response = await service.getLabels();
      if (response.success && response.data) {
        setLabels(response.data);
      }
    } catch (error) {
      console.error('Error loading labels:', error);
      Alert.alert('Error', 'Failed to load labels');
    }
  };

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
      await loadLabels();
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

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileSize = async (uri: string): Promise<number> => {
    try {
      const fileInfo = await FileSystem.stat(uri);
      return fileInfo.size;
    } catch (error) {
      console.error('Error getting file size:', error);
      return 0;
    }
  };

  const handleImagePicker = async (type: 'camera' | 'library') => {
    const options: ImagePicker.ImageLibraryOptions = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 1200,
      maxWidth: 1200,
      quality: 1, // Set to maximum quality since we'll handle compression ourselves
    };

    try {
      const result = type === 'camera' 
        ? await ImagePicker.launchCamera(options)
        : await ImagePicker.launchImageLibrary(options);

      if (result.assets && result.assets[0]?.uri) {
        // Get original file size before compression
        const originalFileSize = await getFileSize(result.assets[0].uri);
        setOriginalSize(originalFileSize);

        // Create a temporary file for the compressed image
        const timestamp = new Date().getTime();
        // const tempFilePath = `${FileSystem.CachesDirectoryPath}/compressed_${timestamp}.jpg`;
        
        // Compress the image using @bam.tech/react-native-image-resizer
        const compressedImage = await ImageResizer.createResizedImage(
          result.assets[0].uri,
          1200,
          1200,
          'JPEG',
          Math.round(imageQuality * 100),
          0,
          FileSystem.CachesDirectoryPath, // pass directory only, not full path
          false,
          { mode: 'contain', onlyScaleDown: true }
        );
        

        // Get the compressed file size
        const compressedFileSize = await getFileSize(compressedImage.uri);
        setCompressedSize(compressedFileSize);

        // Use the compressed image
        setSelectedImage(compressedImage.uri);
        setImageRotation(0);
        setImageFlip(false);

        // Get image dimensions
        Image.getSize(compressedImage.uri, (width, height) => {
          setImageSize({ width, height });
        }, (error) => {
          console.error('Error getting image size:', error);
          setImageSize(null);
        });

        // Clean up the original file if it's in the cache
        if (result.assets[0].uri.startsWith(FileSystem.CachesDirectoryPath)) {
          try {
            await FileSystem.unlink(result.assets[0].uri);
          } catch (error) {
            console.error('Error cleaning up original file:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleRotateImage = () => {
    setImageRotation((prev) => (prev + 90) % 360);
  };

  const handleFlipImage = () => {
    setImageFlip((prev) => !prev);
  };

  const handleLabelToggle = (label: Label) => {
    setSelectedLabels(prev => {
      const isSelected = prev.some(l => l.id === label.id);
      if (isSelected) {
        return prev.filter(l => l.id !== label.id);
      } else {
        return [...prev, label];
      }
    });
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const service = ServerService.getInstance();

      // Create the item data object with only enabled fields
      const itemData = {
        name: formData.name,
        quantity: parseInt(formData.quantity || '1'), // Use 1 as fallback if empty
        locationId: selectedLocation?.id,
        description: enabledFields.description ? formData.description || '' : '',
        purchasePrice: enabledFields.purchasePrice ? parseFloat(formData.purchasePrice) || 0 : 0,
        insured: enabledFields.insured ? formData.insured || false : false,
        labels: selectedLabels.map(label => label.id)
      };

      // First create the item
      const itemResponse = await service.createItem(itemData);

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
        formData.append('type', 'photo');
        formData.append('primary', 'true');
        formData.append('name', 'Item Image');

        console.log('FormData for image upload:', formData);

        const imageResponse = await service.uploadItemImage(itemResponse.data.id, formData);
        console.log('Image upload response:', imageResponse);
        
        if (!imageResponse.success) {
          console.warn('Failed to upload image:', imageResponse.error);
          Alert.alert('Warning', 'Item was created but image upload failed');
        } else if (imageResponse.data) {
          console.log('Image uploaded successfully, updated item:', imageResponse.data);
          // The item data in imageResponse.data should now include the imageId
        } else {
          console.log('Image uploaded successfully but no updated item data received');
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

  const resetForm = () => {
    setFormData({});
    setSelectedLocation(null);
    setSearchQuery('');
    setLabelSearchQuery('');
    setSelectedImage(null);
    setImageRotation(0);
    setImageFlip(false);
    setImageSize(null);
    setOriginalSize(null);
    setCompressedSize(null);
  };

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLabels = labels.filter(label =>
    label.name.toLowerCase().includes(labelSearchQuery.toLowerCase())
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
          {/* Item Name Field - Always visible */}
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

          {/* Quantity Field - Always visible */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Quantity
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.background.secondary,
                color: theme.colors.text.primary,
                borderColor: theme.colors.border,
              }]}
              placeholder="Enter quantity"
              placeholderTextColor={theme.colors.text.secondary}
              keyboardType="number-pad"
              value={isQuantityFocused ? formData.quantity : (formData.quantity || '1')}
              onChangeText={(text) => {
                // Only allow numbers
                const numericValue = text.replace(/[^0-9]/g, '');
                setFormData(prev => ({ ...prev, quantity: numericValue }));
              }}
              onFocus={() => {
                setIsQuantityFocused(true);
                if (formData.quantity === '1') {
                  setFormData(prev => ({ ...prev, quantity: '' }));
                }
              }}
              onBlur={() => {
                setIsQuantityFocused(false);
                if (!formData.quantity) {
                  setFormData(prev => ({ ...prev, quantity: '1' }));
                }
              }}
            />
          </View>

          {/* Location Dropdown - Always visible */}
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

          {/* Labels Section - Conditional based on settings */}
          {enabledFields.labels && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Labels
              </Text>
              <TextInput
                style={[styles.searchInput, { 
                  backgroundColor: theme.colors.background.secondary,
                  color: theme.colors.text.primary,
                  borderColor: theme.colors.border,
                }]}
                placeholder="Search labels..."
                placeholderTextColor={theme.colors.text.secondary}
                value={labelSearchQuery}
                onChangeText={setLabelSearchQuery}
              />
              <ScrollView 
                style={[styles.locationList, { 
                  backgroundColor: theme.colors.background.secondary,
                  borderColor: theme.colors.border,
                  maxHeight: 160, // Show 4 labels at a time
                }]}
                nestedScrollEnabled={true}
              >
                {filteredLabels.map(label => (
                  <TouchableOpacity
                    key={label.id}
                    style={[
                      styles.locationItem,
                      selectedLabels.some(l => l.id === label.id) && { 
                        backgroundColor: theme.colors.button.primary 
                      }
                    ]}
                    onPress={() => handleLabelToggle(label)}
                  >
                    <Text style={[
                      styles.locationName,
                      { color: selectedLabels.some(l => l.id === label.id)
                        ? theme.colors.button.text 
                        : theme.colors.text.primary 
                      }
                    ]}>
                      {label.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Optional Fields */}
          {enabledFields.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Description
              </Text>
              <TextInput
                style={[styles.input, styles.textArea, { 
                  backgroundColor: theme.colors.background.secondary,
                  color: theme.colors.text.primary,
                  borderColor: theme.colors.border,
                }]}
                placeholder="Enter description"
                placeholderTextColor={theme.colors.text.secondary}
                multiline
                numberOfLines={4}
                value={formData.description || ''}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              />
            </View>
          )}

          {enabledFields.purchasePrice && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Purchase Price
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.background.secondary,
                  color: theme.colors.text.primary,
                  borderColor: theme.colors.border,
                }]}
                placeholder="Enter purchase price"
                placeholderTextColor={theme.colors.text.secondary}
                keyboardType="numeric"
                value={formData.purchasePrice || ''}
                onChangeText={(text) => setFormData(prev => ({ ...prev, purchasePrice: text }))}
              />
            </View>
          )}

          {enabledFields.insured && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Insured?
              </Text>
              <View style={styles.yesNoContainer}>
                <TouchableOpacity
                  style={[
                    styles.yesNoButton,
                    { 
                      backgroundColor: formData.insured === true 
                        ? theme.colors.button.primary 
                        : theme.colors.background.secondary,
                      borderColor: theme.colors.border
                    }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, insured: true }))}
                >
                  <Text style={[
                    styles.yesNoButtonText,
                    { color: formData.insured === true 
                      ? theme.colors.button.text 
                      : theme.colors.text.primary 
                    }
                  ]}>
                    Yes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.yesNoButton,
                    { 
                      backgroundColor: formData.insured === false 
                        ? theme.colors.button.primary 
                        : theme.colors.background.secondary,
                      borderColor: theme.colors.border
                    }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, insured: false }))}
                >
                  <Text style={[
                    styles.yesNoButtonText,
                    { color: formData.insured === false 
                      ? theme.colors.button.text 
                      : theme.colors.text.primary 
                    }
                  ]}>
                    No
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

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
                <View style={styles.imagePreviewContainer}>
                  <TouchableOpacity onPress={() => setIsPreviewVisible(true)} activeOpacity={0.8}>
                    <Image
                      source={{ uri: selectedImage }}
                      style={[
                        styles.selectedImage,
                        {
                          transform: [
                            { rotate: `${imageRotation}deg` },
                            { scaleX: imageFlip ? -1 : 1 }
                          ]
                        }
                      ]}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteImageButton, { backgroundColor: theme.colors.error }]}
                    onPress={() => {
                      Alert.alert(
                        'Remove Image',
                        'Are you sure you want to remove this image?',
                        [
                          {
                            text: 'Cancel',
                            style: 'cancel'
                          },
                          {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: () => {
                              setSelectedImage(null);
                              setImageRotation(0);
                              setImageFlip(false);
                              setImageSize(null);
                              setOriginalSize(null);
                              setCompressedSize(null);
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <MaterialIcons name="delete" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Image Preview Modal */}
          <Modal
            visible={isPreviewVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setIsPreviewVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <TouchableOpacity style={styles.modalCloseButton} onPress={() => setIsPreviewVisible(false)}>
                  <MaterialIcons name="close" size={32} color={theme.colors.text.primary} />
                </TouchableOpacity>
                {selectedImage && (
                  <Image
                    source={{ uri: selectedImage }}
                    style={[
                      styles.modalImage,
                      {
                        transform: [
                          { rotate: `${imageRotation}deg` },
                          { scaleX: imageFlip ? -1 : 1 }
                        ]
                      }
                    ]}
                    resizeMode="contain"
                  />
                )}
                <View style={styles.imageInfoContainer}>
                  {imageSize && (
                    <Text style={[styles.imageInfoText, { color: theme.colors.text.secondary }]}>
                      Dimensions: {imageSize.width} x {imageSize.height} px
                    </Text>
                  )}
                  {originalSize !== null && (
                    <Text style={[styles.imageInfoText, { color: theme.colors.text.secondary }]}>
                      Original size: {formatFileSize(originalSize)}
                    </Text>
                  )}
                  {compressedSize !== null && (
                    <Text style={[styles.imageInfoText, { color: theme.colors.text.secondary }]}>
                      Compressed size: {formatFileSize(compressedSize)}
                      {originalSize !== null && (
                        <Text> ({Math.round((1 - compressedSize / originalSize) * 100)}% smaller)</Text>
                      )}
                    </Text>
                  )}
                </View>
                <View style={styles.imageControls}>
                  <TouchableOpacity
                    style={[styles.imageControlButton, { backgroundColor: theme.colors.button.primary }]}
                    onPress={handleRotateImage}
                  >
                    <MaterialIcons name="rotate-right" size={28} color={theme.colors.button.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.imageControlButton, { backgroundColor: theme.colors.button.primary }]}
                    onPress={handleFlipImage}
                  >
                    <MaterialIcons name="flip" size={28} color={theme.colors.button.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.imageControlButton, { backgroundColor: theme.colors.error }]}
                    onPress={() => {
                      Alert.alert(
                        'Remove Image',
                        'Are you sure you want to remove this image?',
                        [
                          {
                            text: 'Cancel',
                            style: 'cancel'
                          },
                          {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: () => {
                              setSelectedImage(null);
                              setImageRotation(0);
                              setImageFlip(false);
                              setImageSize(null);
                              setOriginalSize(null);
                              setCompressedSize(null);
                              setIsPreviewVisible(false);
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <MaterialIcons name="delete" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

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
  yesNoContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  yesNoButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yesNoButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  imageControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  imageControlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageInfoContainer: {
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  imageInfoText: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    maxWidth: '90%',
    maxHeight: '80%',
  },
  modalImage: {
    width: 300,
    height: 300,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    padding: 4,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  deleteImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default AddItemScreen;
