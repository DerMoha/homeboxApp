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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'react-native-image-picker';
import ServerService from '../services/serverService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
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

const STEPS = ['Basic Info', 'Image'];

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
    labels: true,  // Default to true, but will be overridden by settings
    image: false  // Added image field
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageFlip, setImageFlip] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [isQuantityFocused, setIsQuantityFocused] = useState(false);
  const [imageQuality, setImageQuality] = useState(0.8); // Default quality
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isLocationPickerVisible, setIsLocationPickerVisible] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [isParentPickerVisible, setIsParentPickerVisible] = useState(false);
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [selectedParent, setSelectedParent] = useState<any | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const windowWidth = Dimensions.get('window').width;

  // Get the active steps based on enabled fields
  const getActiveSteps = () => {
    const steps = ['Basic Info'];
    return steps;
  };

  const activeSteps = getActiveSteps();

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
      // Preload items for parent selection
      try {
        const invResp = await service.getInventory(1, 1000);
        if ((invResp as any).success && (invResp as any).data) {
          setAllItems((invResp as any).data.items || []);
        }
      } catch (e) {
        console.warn('Failed to preload items');
      }
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

  const handleImagePicker = async (type: 'camera' | 'library') => {
    const options: ImagePicker.ImageLibraryOptions = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 1200,
      maxWidth: 1200,
      quality: 1, // Use maximum quality since we'll handle compression with ImageResizer
    };

    try {
      const result = type === 'camera' 
        ? await ImagePicker.launchCamera(options)
        : await ImagePicker.launchImageLibrary(options);

      if (result.assets && result.assets[0]?.uri) {
        // Get original file size from the asset
        const originalFileSize = result.assets[0].fileSize || 0;
        setOriginalSize(originalFileSize);

        // Compress the image using @bam.tech/react-native-image-resizer
        const compressedImage = await ImageResizer.createResizedImage(
          result.assets[0].uri,
          1200,
          1200,
          'JPEG',
          Math.round(imageQuality * 100),
          0,
          undefined, // Let the library handle the temporary directory
          false,
          { mode: 'contain', onlyScaleDown: true }
        );

        // Get the compressed file size from the result
        const compressedFileSize = compressedImage.size || 0;
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
        labels: selectedLabels.map(label => label.id),
        parentId: selectedParent?.id
      };

      // First create the item
      const itemResponse = await service.createItem(itemData);

      console.log('Item creation response:', itemResponse);

      if (!itemResponse.success || !itemResponse.data) {
        throw new Error('Failed to create item');
      }

      // If there's an image and image upload is enabled, upload it
      if (selectedImage && enabledFields.image) {
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
    setSelectedLabels([]);
    setSearchQuery('');
    setLabelSearchQuery('');
    setSelectedImage(null);
    setImageRotation(0);
    setImageFlip(false);
    setImageSize(null);
    setOriginalSize(null);
    setCompressedSize(null);
    setCurrentStep(0);
  };

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLabels = labels.filter(label =>
    label.name.toLowerCase().includes(labelSearchQuery.toLowerCase())
  );

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Basic Info
        if (!formData.name?.trim()) {
          newErrors.name = 'Name is required';
        }
        if (!selectedLocation) {
          newErrors.location = 'Location is required';
        }
        break;
      case 1: // Details
        if (enabledFields.purchasePrice && formData.purchasePrice) {
          const price = parseFloat(formData.purchasePrice);
          if (isNaN(price) || price < 0) {
            newErrors.purchasePrice = 'Invalid price';
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < activeSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {activeSteps.map((step, index) => (
        <React.Fragment key={step}>
          <TouchableOpacity
            style={[
              styles.stepDot,
              currentStep === index && styles.stepDotActive,
              { backgroundColor: currentStep === index ? theme.colors.button.primary : theme.colors.background.secondary }
            ]}
            onPress={() => {
              if (index < currentStep || validateStep(currentStep)) {
                setCurrentStep(index);
              }
            }}
          >
            <Text style={[
              styles.stepNumber,
              { color: currentStep === index ? theme.colors.button.text : theme.colors.text.secondary }
            ]}>
              {index + 1}
            </Text>
          </TouchableOpacity>
          {index < activeSteps.length - 1 && (
            <View style={[
              styles.stepLine,
              { backgroundColor: index < currentStep ? theme.colors.button.primary : theme.colors.border }
            ]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderBasicInfo = () => (
    <View style={styles.stepContent}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Item</Text>
        <View style={styles.nameQuantityRow}>
          <TextInput
            style={[
              styles.input,
              { flex: 1 },
              errors.name && styles.inputError,
              { 
                backgroundColor: theme.colors.background.secondary,
                color: theme.colors.text.primary,
                borderColor: errors.name ? theme.colors.error : theme.colors.border,
              }
            ]}
            placeholder="Enter item name"
            placeholderTextColor={theme.colors.text.secondary}
            value={formData.name || ''}
            onChangeText={(text) => {
              setFormData(prev => ({ ...prev, name: text }));
              if (errors.name) {
                setErrors(prev => ({ ...prev, name: '' }));
              }
            }}
          />
          <View style={styles.inlineQuantityContainer}>
            <TouchableOpacity
              style={[styles.inlineQtyButton, { backgroundColor: theme.colors.button.primary }]}
              onPress={() => {
                const currentQty = parseInt(formData.quantity || '1');
                if (currentQty > 1) {
                  setFormData(prev => ({ ...prev, quantity: (currentQty - 1).toString() }));
                }
              }}
            >
              <MaterialIcons name="remove" size={20} color={theme.colors.button.text} />
            </TouchableOpacity>
            <TextInput
              style={[
                styles.inlineQtyInput,
                { 
                  backgroundColor: theme.colors.background.secondary,
                  color: theme.colors.text.primary,
                  borderColor: theme.colors.border,
                }
              ]}
              value={formData.quantity || '1'}
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9]/g, '');
                setFormData(prev => ({ ...prev, quantity: numericValue || '1' }));
              }}
              keyboardType="number-pad"
            />
            <TouchableOpacity
              style={[styles.inlineQtyButton, { backgroundColor: theme.colors.button.primary }]}
              onPress={() => {
                const currentQty = parseInt(formData.quantity || '1');
                setFormData(prev => ({ ...prev, quantity: (currentQty + 1).toString() }));
              }}
            >
              <MaterialIcons name="add" size={20} color={theme.colors.button.text} />
            </TouchableOpacity>
          </View>
        </View>
        {errors.name && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.name}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Location</Text>
        <TouchableOpacity
          style={[styles.selectorButton, { backgroundColor: theme.colors.background.secondary, borderColor: errors.location ? theme.colors.error : theme.colors.border }]}
          onPress={() => setIsLocationPickerVisible(true)}
        >
          <Text style={{ color: selectedLocation ? theme.colors.text.primary : theme.colors.text.secondary }}>
            {selectedLocation ? selectedLocation.name : 'Select location'}
          </Text>
          <MaterialIcons name="expand-more" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        {errors.location && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.location}</Text>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.advancedHeader} onPress={() => setIsAdvancedOpen(!isAdvancedOpen)}>
          <View>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Advanced</Text>
            <Text style={[styles.advancedSummary, { color: theme.colors.text.secondary }]}> 
              {`${selectedLabels.length} label${selectedLabels.length === 1 ? '' : 's'}`}
              {enabledFields.purchasePrice && formData.purchasePrice ? ` • $${formData.purchasePrice}` : ''}
              {enabledFields.insured && (formData.insured === true || formData.insured === false) ? ` • Insured: ${formData.insured ? 'Yes' : 'No'}` : ''}
              {selectedParent ? ` • Parent: ${selectedParent.name}` : ''}
            </Text>
          </View>
          <MaterialIcons name={isAdvancedOpen ? 'expand-less' : 'expand-more'} size={22} color={theme.colors.text.primary} />
        </TouchableOpacity>
        {isAdvancedOpen && (
          <View style={styles.advancedContainer}>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            {enabledFields.labels && (
              <View style={[styles.card, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>Labels</Text>
                <View style={styles.chipsRow}>
                  {selectedLabels.length === 0 && (
                    <Text style={[styles.helperText, { color: theme.colors.text.secondary }]}>No labels selected</Text>
                  )}
                  {selectedLabels.map(l => (
                    <TouchableOpacity key={l.id} style={[styles.chip, { borderColor: theme.colors.border, backgroundColor: theme.colors.background.primary }]}
                      onPress={() => handleLabelToggle(l)}
                    >
                      <Text style={[styles.chipText, { color: theme.colors.text.primary }]}>{l.name}</Text>
                      <MaterialIcons name="close" size={14} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={[styles.searchInput, { backgroundColor: theme.colors.background.primary, color: theme.colors.text.primary, borderColor: theme.colors.border }]}
                  placeholder="Search labels..."
                  placeholderTextColor={theme.colors.text.secondary}
                  value={labelSearchQuery}
                  onChangeText={setLabelSearchQuery}
                />
                <ScrollView style={[styles.labelList, { backgroundColor: theme.colors.background.primary, borderColor: theme.colors.border }]} nestedScrollEnabled={true}>
                  {filteredLabels.map(label => (
                    <TouchableOpacity
                      key={label.id}
                      style={[styles.labelItem, selectedLabels.some(l => l.id === label.id) && { backgroundColor: theme.colors.button.primary }]}
                      onPress={() => handleLabelToggle(label)}
                    >
                      <Text style={[styles.labelName, { color: selectedLabels.some(l => l.id === label.id) ? theme.colors.button.text : theme.colors.text.primary }]}>
                        {label.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {enabledFields.description && (
              <View style={[styles.card, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: theme.colors.background.primary, color: theme.colors.text.primary, borderColor: theme.colors.border }]}
                  placeholder="What is it? Add details to help identify later"
                  placeholderTextColor={theme.colors.text.secondary}
                  multiline
                  numberOfLines={4}
                  value={formData.description || ''}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                />
              </View>
            )}

            {enabledFields.purchasePrice && (
              <View style={[styles.card, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>Purchase Price</Text>
                <TextInput
                  style={[styles.input, errors.purchasePrice && styles.inputError, { backgroundColor: theme.colors.background.primary, color: theme.colors.text.primary, borderColor: errors.purchasePrice ? theme.colors.error : theme.colors.border }]}
                  placeholder="e.g., 49.99"
                  placeholderTextColor={theme.colors.text.secondary}
                  keyboardType="numeric"
                  value={formData.purchasePrice || ''}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, purchasePrice: text }));
                    if (errors.purchasePrice) {
                      setErrors(prev => ({ ...prev, purchasePrice: '' }));
                    }
                  }}
                />
                <Text style={[styles.helperText, { color: theme.colors.text.secondary }]}>Optional. Used for insurance or valuation.</Text>
                {errors.purchasePrice && (
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.purchasePrice}</Text>
                )}
              </View>
            )}

            {enabledFields.insured && (
              <View style={[styles.card, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>Insured?</Text>
                <View style={styles.yesNoContainer}>
                  <TouchableOpacity
                    style={[styles.yesNoButton, { backgroundColor: formData.insured === true ? theme.colors.button.primary : theme.colors.background.primary, borderColor: theme.colors.border }]}
                    onPress={() => setFormData(prev => ({ ...prev, insured: true }))}
                  >
                    <Text style={[styles.yesNoButtonText, { color: formData.insured === true ? theme.colors.button.text : theme.colors.text.primary }]}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.yesNoButton, { backgroundColor: formData.insured === false ? theme.colors.button.primary : theme.colors.background.primary, borderColor: theme.colors.border }]}
                    onPress={() => setFormData(prev => ({ ...prev, insured: false }))}
                  >
                    <Text style={[styles.yesNoButtonText, { color: formData.insured === false ? theme.colors.button.text : theme.colors.text.primary }]}>No</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.helperText, { color: theme.colors.text.secondary }]}>Mark if the item is covered by insurance.</Text>
              </View>
            )}

            <View style={[styles.card, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>Parent Item</Text>
              <TouchableOpacity
                style={[styles.selectorButton, { backgroundColor: theme.colors.background.primary, borderColor: theme.colors.border }]}
                onPress={() => setIsParentPickerVisible(true)}
              >
                <Text style={{ color: selectedParent ? theme.colors.text.primary : theme.colors.text.secondary }}>
                  {selectedParent ? selectedParent.name : 'Select parent (optional)'}
                </Text>
                <MaterialIcons name="chevron-right" size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>
              <Text style={[styles.helperText, { color: theme.colors.text.secondary }]}>Use parent to group items as subitems.</Text>
            </View>
          </View>
        )}
      </View>

      {enabledFields.image && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Item Image</Text>
          {!selectedImage ? (
            <View style={styles.imageUploadContainer}>
              <TouchableOpacity
                style={[styles.imageUploadButton, { backgroundColor: theme.colors.button.primary }]}
                onPress={() => handleImagePicker('camera')}
              >
                <MaterialIcons name="camera-alt" size={24} color={theme.colors.button.text} />
                <Text style={[styles.imageUploadText, { color: theme.colors.button.text }]}>
                  Take Photo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.imageUploadButton, { backgroundColor: theme.colors.button.primary }]}
                onPress={() => handleImagePicker('library')}
              >
                <MaterialIcons name="photo-library" size={24} color={theme.colors.button.text} />
                <Text style={[styles.imageUploadText, { color: theme.colors.button.text }]}>
                  Choose from Library
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.selectedImageContainer}>
              <TouchableOpacity 
                style={styles.imagePreviewContainer}
                onPress={() => setIsPreviewVisible(true)}
              >
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
                <View style={styles.imageOverlay}>
                  <Text style={[styles.imageOverlayText, { color: '#fff' }]}>
                    Tap to preview
                  </Text>
                </View>
              </TouchableOpacity>
              <View style={styles.imageControls}>
                <TouchableOpacity
                  style={[styles.imageControlButton, { backgroundColor: theme.colors.button.primary }]}
                  onPress={handleRotateImage}
                >
                  <MaterialIcons name="rotate-right" size={20} color={theme.colors.button.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.imageControlButton, { backgroundColor: theme.colors.button.primary }]}
                  onPress={handleFlipImage}
                >
                  <MaterialIcons name="flip" size={20} color={theme.colors.button.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.imageControlButton, { backgroundColor: theme.colors.error }]}
                  onPress={() => {
                    Alert.alert(
                      'Remove Image',
                      'Are you sure you want to remove this image?',
                      [
                        { text: 'Cancel', style: 'cancel' },
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
                  <MaterialIcons name="delete" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );

  // Details folded into Advanced; renderer removed

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderBasicInfo(); // This step is now redundant for image upload
      default:
        return null;
    }
  };

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
        <>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
            >
              <MaterialIcons 
                name={currentStep === 0 ? "arrow-back" : "arrow-back-ios"} 
                size={24} 
                color={theme.colors.text.primary} 
              />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
              {activeSteps[currentStep]}
            </Text>
            <View style={styles.backButton} />
          </View>

          {activeSteps.length > 1 && renderStepIndicator()}

          <ScrollView style={styles.scrollView}>
            {renderStepContent()}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.footerButton, { backgroundColor: theme.colors.button.primary }]}
              onPress={handleNext}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.button.text} />
              ) : (
                <Text style={[styles.footerButtonText, { color: theme.colors.button.text }]}>
                  {currentStep === activeSteps.length - 1 ? 'Add Item' : 'Next'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Image Preview Modal */}
          <Modal
            visible={isPreviewVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setIsPreviewVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: theme.colors.background.primary }]}>
                <TouchableOpacity 
                  style={styles.modalCloseButton} 
                  onPress={() => setIsPreviewVisible(false)}
                >
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
                </View>
              </View>
            </View>
          </Modal>
          {/* Parent Picker Modal */}
          <Modal
            visible={isParentPickerVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setIsParentPickerVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: theme.colors.background.primary }]}>
                <TouchableOpacity 
                  style={styles.modalCloseButton} 
                  onPress={() => setIsParentPickerVisible(false)}
                >
                  <MaterialIcons name="close" size={32} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Select Parent Item</Text>
                <TextInput
                  style={[styles.searchInput, { 
                    backgroundColor: theme.colors.background.secondary,
                    color: theme.colors.text.primary,
                    borderColor: theme.colors.border,
                  }]}
                  placeholder="Search items..."
                  placeholderTextColor={theme.colors.text.secondary}
                  value={parentSearchQuery}
                  onChangeText={setParentSearchQuery}
                />
                <ScrollView 
                  style={[styles.labelList, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border }]}
                  nestedScrollEnabled={true}
                >
                  {allItems
                    .filter(i => (i.name || '').toLowerCase().includes(parentSearchQuery.toLowerCase()))
                    .map(item => (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.labelItem, selectedParent?.id === item.id && { backgroundColor: theme.colors.button.primary }]}
                        onPress={() => {
                          setSelectedParent(item);
                          setIsParentPickerVisible(false);
                        }}
                      >
                        <Text style={[styles.labelName, { color: selectedParent?.id === item.id ? theme.colors.button.text : theme.colors.text.primary }]}>
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
                {selectedParent && (
                  <TouchableOpacity
                    style={[styles.footerButton, { backgroundColor: theme.colors.error, marginTop: 12 }]}
                    onPress={() => setSelectedParent(null)}
                  >
                    <Text style={[styles.footerButtonText, { color: '#fff' }]}>Clear Parent</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Modal>
          {/* Location Picker Modal */}
          <Modal
            visible={isLocationPickerVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setIsLocationPickerVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: theme.colors.background.primary }]}>
                <TouchableOpacity 
                  style={styles.modalCloseButton} 
                  onPress={() => setIsLocationPickerVisible(false)}
                >
                  <MaterialIcons name="close" size={32} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Select Location</Text>
                <TextInput
                  style={[styles.searchInput, { 
                    backgroundColor: theme.colors.background.secondary,
                    color: theme.colors.text.primary,
                    borderColor: errors.location ? theme.colors.error : theme.colors.border,
                  }]}
                  placeholder="Search locations..."
                  placeholderTextColor={theme.colors.text.secondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <ScrollView 
                  style={[styles.locationList, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border }]}
                  nestedScrollEnabled={true}
                >
                  {filteredLocations.map(location => (
                    <TouchableOpacity
                      key={location.id}
                      style={[styles.locationItem, selectedLocation?.id === location.id && { backgroundColor: theme.colors.button.primary }]}
                      onPress={() => {
                        setSelectedLocation(location);
                        setIsLocationPickerVisible(false);
                        if (errors.location) {
                          setErrors(prev => ({ ...prev, location: '' }));
                        }
                      }}
                    >
                      <Text style={[styles.locationName, { color: selectedLocation?.id === location.id ? theme.colors.button.text : theme.colors.text.primary }]}>
                        {location.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  stepDotActive: {
    borderColor: 'transparent',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  nameQuantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inlineQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineQtyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineQtyInput: {
    width: 56,
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  inputError: {
    borderWidth: 2,
  },
  errorText: {
    marginTop: 4,
    fontSize: 14,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 4,
  },
  locationList: {
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: 12,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  locationItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  locationName: {
    fontSize: 16,
  },
  labelList: {
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: 12,
  },
  labelItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  labelName: {
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  advancedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  advancedContainer: {
    marginTop: 8,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 12,
    opacity: 0.6,
  },
  subSectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
  },
  advancedSummary: {
    marginTop: 2,
    fontSize: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chipText: {
    fontSize: 12,
  },
  yesNoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  yesNoButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yesNoButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  imageUploadContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  imageUploadButton: {
    flex: 1,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imageUploadText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedImageContainer: {
    marginTop: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    alignItems: 'center',
  },
  imageOverlayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  imageControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  imageControlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  footerButton: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButtonText: {
    fontSize: 18,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '98%',
    maxHeight: '85%',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    padding: 4,
  },
  modalImage: {
    width: '100%',
    height: 300,
    marginBottom: 16,
    borderRadius: 12,
  },
  imageInfoContainer: {
    width: '100%',
    marginBottom: 16,
  },
  imageInfoText: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
});

export default AddItemScreen;
                                                                                              