import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  Alert,
} from 'react-native';
import {useTheme} from '../theme/ThemeContext';
import {
  NavigationProp,
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useAddItemMetadata} from '../hooks/useAddItemMetadata';
import {useBarcodeAutofill} from '../hooks/useBarcodeAutofill';
import {useEditableItemLoader} from '../hooks/useEditableItemLoader';
import {duplicateItemTemplate} from '../utils/duplicateItem';
import {useItemDraft} from '../hooks/useItemDraft';
import {useImageHandler} from '../hooks/useImageHandler';
import {useAddItemForm} from '../hooks/useAddItemForm';
import {usePostSaveNavigation} from '../hooks/usePostSaveNavigation';
import {
  ImagePickerSection,
  LocationSelector,
  LabelSelector,
  ItemFormFields,
} from '../components/AddItem';
import {AttachmentQueue} from '../components/AddItem/AttachmentQueue';
import {LocalAttachment} from '../services/attachmentService';
import {CreateMetadataButton} from '../components/AddItem/CreateMetadataButton';
import {SectionHeader} from '../components/SectionHeader';
import {BarcodeScannerModal} from '../components/BarcodeScanner';
import {AddItemStackParamList, RootTabParamList} from '../navigation/types';
import {KeyboardFormScrollView} from '../components/common/KeyboardFormScrollView';

const AddItemScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation =
    useNavigation<
      NativeStackNavigationProp<AddItemStackParamList, 'AddItem'>
    >();
  const route = useRoute<RouteProp<AddItemStackParamList, 'AddItem'>>();

  const screenStyle = [
    styles.container,
    {backgroundColor: theme.colors.background.primary},
  ];

  const formCardStyle = [
    styles.formCard,
    {
      backgroundColor: theme.colors.background.secondary,
      borderColor: theme.colors.borderSubtle,
      borderRadius: theme.borderRadius.lg,
    },
    theme.shadows.sm,
  ];

  const contentStyle = useMemo(
    () => [styles.content, {paddingHorizontal: theme.spacing.md}],
    [theme.spacing.md],
  );

  const {
    selectedImage,
    setSelectedImage,
    imageRotation,
    imageFlip,
    originalSize,
    compressedSize,
    isPreviewVisible,
    setIsPreviewVisible,
    loadImageQuality,
    handleImagePicker,
    handleRotateImage,
    handleFlipImage,
    clearImage,
    formatFileSize,
  } = useImageHandler();

  const {
    locations,
    labels,
    enabledFields: configuredFields,
    loadMetadata,
  } = useAddItemMetadata(loadImageQuality);

  const {
    formData,
    setFormData,
    setSelectedLabels,
    selectedLocation,
    selectedLabels,
    isLoading,
    isQuantityFocused,
    setIsQuantityFocused,
    setSelectedLocation,
    updateFormField,
    handleLabelToggle,
    resetForm,
    populateForm,
    submitItem,
  } = useAddItemForm();

  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const itemId = route.params?.itemId;
  const duplicateItemId = route.params?.duplicateItemId;
  const sourceItemId = itemId || duplicateItemId;
  const enabledFields = duplicateItemId
    ? {description: true, purchasePrice: true, insured: true, labels: true}
    : configuredFields;
  const draftIdentity =
    itemId || (duplicateItemId ? `duplicate:${duplicateItemId}` : undefined);
  const populateLoadedItem = useCallback(
    (item: Parameters<typeof populateForm>[0]) => {
      setSelectedImage(null);
      setAttachments([]);
      populateForm(
        duplicateItemId && !itemId ? duplicateItemTemplate(item) : item,
      );
    },
    [duplicateItemId, itemId, populateForm, setSelectedImage],
  );
  const isEditing = Boolean(itemId);
  const [quickEntry, setQuickEntry] = useState(true);
  const [lastSaved, setLastSaved] = useState('');
  const [savedCount, setSavedCount] = useState(0);
  const submitting = useRef(false);
  const isQuickEntry = quickEntry && !isEditing && !duplicateItemId;
  const handleSaveSuccess = usePostSaveNavigation(
    navigation,
    resetForm,
    clearImage,
  );

  const {scannerVisible, setScannerVisible, handleBarcodeDetected} =
    useBarcodeAutofill({
      routeBarcode: route.params?.barcode,
      currentBarcode:
        typeof formData.barcode === 'string' ? formData.barcode : undefined,
      setField: (field, value) => updateFormField(field, value),
      clearRouteBarcode: () => navigation.setParams({barcode: undefined}),
    });

  const handleMissingItem = useCallback(() => {
    navigation
      .getParent<NavigationProp<RootTabParamList>>()
      ?.navigate('InventoryTab', {
        screen: 'Inventory',
      });
  }, [navigation]);

  const {isPreparingItem, preparedItemId} = useEditableItemLoader(
    sourceItemId,
    populateLoadedItem,
    handleMissingItem,
  );

  const draftSnapshot = useMemo(
    () => ({
      formData,
      selectedLocation,
      selectedLabels,
      imageUri: selectedImage,
      attachments,
    }),
    [formData, selectedLocation, selectedLabels, selectedImage, attachments],
  );
  const {draftStatus, discardDraft, draftReady} = useItemDraft(
    draftIdentity,
    !sourceItemId || preparedItemId === sourceItemId,
    draftSnapshot,
    draft => {
      setFormData(draft.formData);
      setSelectedLocation(draft.selectedLocation);
      setSelectedLabels(draft.selectedLabels);
      setSelectedImage(draft.imageUri);
      setAttachments(draft.attachments || []);
    },
    () => {
      resetForm();
      clearImage();
      setAttachments([]);
    },
  );

  const submitButtonStyle = useMemo(
    () => [
      styles.submitButton,
      {
        backgroundColor: theme.colors.accent.primary,
        borderRadius: theme.borderRadius.lg,
        opacity: isLoading ? 0.6 : 1,
      },
      theme.shadows.sm,
    ],
    [
      isLoading,
      theme.borderRadius.lg,
      theme.colors.accent.primary,
      theme.shadows.sm,
    ],
  );

  const submitIconStyle = useMemo(
    () => [
      styles.submitIconContainer,
      {backgroundColor: theme.colors.accent.muted},
    ],
    [theme.colors.accent.muted],
  );

  const submitButtonTextStyle = useMemo(
    () => [
      styles.submitButtonText,
      {
        color: theme.colors.text.inverse,
        fontSize: theme.typography.sizes.md,
        fontWeight: theme.typography.weights.semibold,
        fontFamily: theme.typography.fonts.semibold,
      },
    ],
    [
      theme.colors.text.inverse,
      theme.typography.fonts.semibold,
      theme.typography.sizes.md,
      theme.typography.weights.semibold,
    ],
  );

  useFocusEffect(
    useCallback(() => {
      loadMetadata();
    }, [loadMetadata]),
  );

  useEffect(() => {
    navigation.setOptions({
      title: isEditing
        ? 'Edit Item'
        : duplicateItemId
          ? 'Duplicate Item'
          : 'Add Item',
      headerStyle: {
        backgroundColor: theme.colors.background.primary,
      },
      headerTintColor: theme.colors.text.primary,
    });
  }, [duplicateItemId, isEditing, navigation, theme]);

  const handleSubmit = async () => {
    if (submitting.current) {
      return;
    }
    submitting.current = true;
    Keyboard.dismiss();
    try {
      await submitItem(
        itemId,
        selectedImage,
        enabledFields,
        item => {
          discardDraft();
          if (isQuickEntry) {
            resetForm();
            setSelectedLocation(selectedLocation);
            clearImage();
            navigation.setParams({
              barcode: undefined,
              duplicateItemId: undefined,
            });
            setLastSaved(item.name);
            setSavedCount(count => count + 1);
          } else {
            handleSaveSuccess(item);
          }
        },
        !isQuickEntry,
        attachments,
      );
    } finally {
      submitting.current = false;
    }
  };

  const handleQuantityFocus = () => {
    setIsQuantityFocused(true);
    if (formData.quantity === '1') {
      updateFormField('quantity', '');
    }
  };

  const handleQuantityBlur = () => {
    setIsQuantityFocused(false);
    if (!formData.quantity) {
      updateFormField('quantity', '1');
    }
  };

  const handleScanBarcode = useCallback(() => {
    setScannerVisible(true);
  }, [setScannerVisible]);

  if (isPreparingItem) {
    return (
      <View style={styles.loadingContainer}>
        <View
          style={[
            styles.loadingIconContainer,
            {
              backgroundColor: theme.colors.background.secondary,
              borderColor: theme.colors.borderSubtle,
            },
          ]}>
          <ActivityIndicator size="large" color={theme.colors.accent.primary} />
        </View>
        <Text
          style={[
            styles.loadingText,
            {
              color: theme.colors.text.secondary,
              fontFamily: theme.typography.fonts.regular,
              fontSize: theme.typography.sizes.md,
            },
          ]}>
          Loading item details...
        </Text>
      </View>
    );
  }

  return (
    <View style={screenStyle}>
      <KeyboardFormScrollView
        resetScrollKey={savedCount}
        style={styles.scrollView}
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={false}>
        {duplicateItemId && (
          <Text style={{color: theme.colors.text.secondary}}>
            Review this copy before saving. It will receive a fresh asset ID;
            photos and attachments stay with the original item.
          </Text>
        )}
        {draftStatus ? (
          <View>
            <Text
              accessibilityLiveRegion="polite"
              style={{color: theme.colors.text.secondary}}>
              {draftStatus}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() =>
                Alert.alert(
                  'Discard draft?',
                  'Remove the saved draft and photo from this device?',
                  [
                    {text: 'Cancel', style: 'cancel'},
                    {
                      text: 'Discard',
                      style: 'destructive',
                      onPress: () => {
                        discardDraft();
                      },
                    },
                  ],
                )
              }>
              <Text
                style={[
                  styles.modeButton,
                  {color: theme.colors.accent.primary},
                ]}>
                Discard draft
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {!isEditing && (
          <TouchableOpacity
            disabled={isLoading}
            onPress={() => setQuickEntry(value => !value)}
            accessibilityRole="button"
            style={styles.modeButton}>
            <Text style={{color: theme.colors.accent.primary}}>
              {quickEntry
                ? 'Quick entry · Show all fields'
                : 'All fields · Switch to quick entry'}
            </Text>
          </TouchableOpacity>
        )}
        {isQuickEntry && (
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.entryHint, {color: theme.colors.text.secondary}]}>
            {lastSaved
              ? `Saved “${lastSaved}” · ${savedCount} this session. Ready for the next item.`
              : 'Name, photo, location, save. The location stays selected for your next item.'}
          </Text>
        )}
        <SectionHeader title="Item Details" icon="info" variant="withIcon" />

        <View style={formCardStyle}>
          <ItemFormFields
            quickEntry={isQuickEntry}
            formData={formData}
            enabledFields={enabledFields}
            isQuantityFocused={isQuantityFocused}
            onUpdateField={updateFormField}
            onQuantityFocus={handleQuantityFocus}
            onQuantityBlur={handleQuantityBlur}
            onScanBarcode={handleScanBarcode}
          />
        </View>

        <CreateMetadataButton
          kind="location"
          onCreated={location => {
            setSelectedLocation(location);
            loadMetadata();
          }}
        />
        <SectionHeader title="Location" icon="place" variant="withIcon" />

        <View style={formCardStyle}>
          <LocationSelector
            compact={isQuickEntry}
            locations={locations}
            selectedLocation={selectedLocation}
            onSelectLocation={setSelectedLocation}
          />
        </View>

        <SectionHeader title="Image" icon="photo-camera" variant="withIcon" />

        <View style={formCardStyle}>
          <ImagePickerSection
            compact={isQuickEntry}
            selectedImage={selectedImage}
            imageRotation={imageRotation}
            imageFlip={imageFlip}
            originalSize={originalSize}
            compressedSize={compressedSize}
            isPreviewVisible={isPreviewVisible}
            onPickImage={handleImagePicker}
            onRotateImage={handleRotateImage}
            onFlipImage={handleFlipImage}
            onClearImage={clearImage}
            onTogglePreview={() => setIsPreviewVisible(!isPreviewVisible)}
            formatFileSize={formatFileSize}
          />
        </View>

        <AttachmentQueue
          attachments={attachments}
          onChange={setAttachments}
          imageUri={selectedImage}
          clearImage={clearImage}
          disabled={isLoading}
        />

        {!isQuickEntry && enabledFields.labels && (
          <>
            <CreateMetadataButton
              kind="label"
              onCreated={label => {
                handleLabelToggle(label);
                loadMetadata();
              }}
            />
            <SectionHeader title="Labels" icon="label" variant="withIcon" />

            <View style={formCardStyle}>
              <LabelSelector
                labels={labels}
                selectedLabels={selectedLabels}
                onToggleLabel={handleLabelToggle}
                enabled={enabledFields.labels}
              />
            </View>
          </>
        )}

        <TouchableOpacity
          style={submitButtonStyle}
          onPress={handleSubmit}
          disabled={isLoading || isPreparingItem || !draftReady}
          accessibilityRole="button"
          accessibilityLabel={
            isEditing
              ? 'Save Changes'
              : isQuickEntry
                ? 'Save & next'
                : 'Add Item'
          }
          accessibilityState={{disabled: isLoading, busy: isLoading}}
          activeOpacity={0.8}>
          {isLoading ? (
            <ActivityIndicator color={theme.colors.text.inverse} />
          ) : (
            <>
              <View style={submitIconStyle}>
                <MaterialIcons
                  name={isEditing ? 'edit' : 'add'}
                  size={20}
                  color={theme.colors.text.inverse}
                />
              </View>
              <Text style={submitButtonTextStyle}>
                {isEditing
                  ? 'Save Changes'
                  : isQuickEntry
                    ? 'Save & next'
                    : 'Add Item'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </KeyboardFormScrollView>

      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onBarcodeDetected={handleBarcodeDetected}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  modeButton: {paddingVertical: 12},
  entryHint: {marginBottom: 8},
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  formCard: {
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginTop: 32,
    gap: 10,
  },
  submitIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    textTransform: 'none',
    letterSpacing: 0,
  },
  bottomSpacer: {
    height: 24,
  },
});

export default AddItemScreen;
