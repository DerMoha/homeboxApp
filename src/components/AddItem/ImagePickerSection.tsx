import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Modal, Dimensions } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/ThemeContext';

interface ImagePickerSectionProps {
  selectedImage: string | null;
  imageRotation: number;
  imageFlip: boolean;
  originalSize: number | null;
  compressedSize: number | null;
  isPreviewVisible: boolean;
  onPickImage: (type: 'camera' | 'library') => void;
  onRotateImage: () => void;
  onFlipImage: () => void;
  onClearImage: () => void;
  onTogglePreview: () => void;
  formatFileSize: (bytes: number) => string;
}

export const ImagePickerSection: React.FC<ImagePickerSectionProps> = ({
  selectedImage,
  imageRotation,
  imageFlip,
  originalSize,
  compressedSize,
  isPreviewVisible,
  onPickImage,
  onRotateImage,
  onFlipImage,
  onClearImage,
  onTogglePreview,
  formatFileSize,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
        Item Image (Optional)
      </Text>

      {selectedImage ? (
        <View>
          <TouchableOpacity onPress={onTogglePreview} style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: selectedImage }}
              style={[
                styles.imagePreview,
                {
                  transform: [
                    { rotate: `${imageRotation}deg` },
                    { scaleX: imageFlip ? -1 : 1 },
                  ],
                },
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {originalSize && compressedSize && (
            <View style={[styles.imageSizeInfo, { backgroundColor: theme.colors.background.secondary }]}>
              <Text style={[styles.imageSizeText, { color: theme.colors.text.secondary }]}>
                Original: {formatFileSize(originalSize)} → Compressed: {formatFileSize(compressedSize)}
              </Text>
              <Text style={[styles.imageSizeText, { color: theme.colors.success }]}>
                Saved: {formatFileSize(originalSize - compressedSize)} (
                {Math.round(((originalSize - compressedSize) / originalSize) * 100)}%)
              </Text>
            </View>
          )}

          <View style={styles.imageControls}>
            <TouchableOpacity
              style={[styles.imageButton, { backgroundColor: theme.colors.button.primary }]}
              onPress={onRotateImage}
            >
              <MaterialIcons name="rotate-right" size={20} color={theme.colors.button.text} />
              <Text style={[styles.imageButtonText, { color: theme.colors.button.text }]}>Rotate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.imageButton, { backgroundColor: theme.colors.button.primary }]}
              onPress={onFlipImage}
            >
              <MaterialIcons name="flip" size={20} color={theme.colors.button.text} />
              <Text style={[styles.imageButtonText, { color: theme.colors.button.text }]}>Flip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.imageButton, { backgroundColor: theme.colors.error }]}
              onPress={onClearImage}
            >
              <MaterialIcons name="delete" size={20} color="#FFFFFF" />
              <Text style={[styles.imageButtonText, { color: '#FFFFFF' }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.imagePickerButtons}>
          <TouchableOpacity
            style={[styles.pickImageButton, { backgroundColor: theme.colors.button.primary }]}
            onPress={() => onPickImage('camera')}
          >
            <MaterialIcons name="camera-alt" size={24} color={theme.colors.button.text} />
            <Text style={[styles.pickImageText, { color: theme.colors.button.text }]}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pickImageButton, { backgroundColor: theme.colors.button.primary }]}
            onPress={() => onPickImage('library')}
          >
            <MaterialIcons name="photo-library" size={24} color={theme.colors.button.text} />
            <Text style={[styles.pickImageText, { color: theme.colors.button.text }]}>Choose from Library</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Image Preview Modal */}
      <Modal visible={isPreviewVisible} transparent animationType="fade" onRequestClose={onTogglePreview}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={onTogglePreview} activeOpacity={1}>
            <View style={styles.modalContent}>
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage }}
                  style={[
                    styles.fullImage,
                    {
                      transform: [
                        { rotate: `${imageRotation}deg` },
                        { scaleX: imageFlip ? -1 : 1 },
                      ],
                    },
                  ]}
                  resizeMode="contain"
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  imagePickerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  pickImageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  pickImageText: {
    fontSize: 14,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imageSizeInfo: {
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  imageSizeText: {
    fontSize: 12,
  },
  imageControls: {
    flexDirection: 'row',
    gap: 8,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 6,
    gap: 4,
  },
  imageButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});
