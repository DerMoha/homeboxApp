import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../theme/ThemeContext';

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
  const {theme} = useTheme();

  const ActionButton: React.FC<{
    icon: string;
    label: string;
    tone?: 'default' | 'danger';
    onPress: () => void;
  }> = ({icon, label, tone = 'default', onPress}) => {
    const isDanger = tone === 'danger';
    const backgroundColor = isDanger
      ? 'rgba(239, 68, 68, 0.12)'
      : theme.colors.background.tertiary;
    const borderColor = isDanger
      ? theme.colors.error
      : theme.colors.borderSubtle;
    const foreground = isDanger
      ? theme.colors.error
      : theme.colors.text.primary;

    return (
      <TouchableOpacity
        style={[
          styles.actionButton,
          {
            backgroundColor,
            borderColor,
            borderRadius: theme.borderRadius.md,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.8}>
        <MaterialIcons name={icon} size={18} color={foreground} />
        <Text style={[styles.actionButtonText, {color: foreground}]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.section}>
      {selectedImage ? (
        <View>
          <TouchableOpacity
            onPress={onTogglePreview}
            activeOpacity={0.9}
            style={[
              styles.imagePreviewContainer,
              {
                borderRadius: theme.borderRadius.md,
                borderColor: theme.colors.borderSubtle,
                backgroundColor: theme.colors.background.tertiary,
              },
            ]}>
            <Image
              source={{uri: selectedImage}}
              style={[
                styles.imagePreview,
                {
                  transform: [
                    {rotate: `${imageRotation}deg`},
                    {scaleX: imageFlip ? -1 : 1},
                  ],
                },
                {borderRadius: theme.borderRadius.md},
              ]}
              resizeMode="contain"
            />
            <View
              style={[
                styles.previewBadge,
                {
                  backgroundColor: theme.colors.accent.muted,
                  borderRadius: theme.borderRadius.full,
                },
              ]}>
              <MaterialIcons
                name="open-in-full"
                size={12}
                color={theme.colors.accent.primary}
              />
              <Text
                style={[
                  styles.previewBadgeText,
                  {color: theme.colors.accent.primary},
                ]}>
                Preview
              </Text>
            </View>
          </TouchableOpacity>

          {originalSize && compressedSize && (
            <View
              style={[
                styles.imageSizeInfo,
                {
                  backgroundColor: theme.colors.background.secondary,
                  borderColor: theme.colors.borderSubtle,
                  borderRadius: theme.borderRadius.md,
                },
              ]}>
              <View style={styles.imageSizeRow}>
                <Text
                  style={[
                    styles.imageSizeLabel,
                    {color: theme.colors.text.secondary},
                  ]}>
                  Original
                </Text>
                <Text
                  style={[
                    styles.imageSizeValue,
                    {color: theme.colors.text.primary},
                  ]}>
                  {formatFileSize(originalSize)}
                </Text>
              </View>
              <View style={styles.imageSizeRow}>
                <Text
                  style={[
                    styles.imageSizeLabel,
                    {color: theme.colors.text.secondary},
                  ]}>
                  Compressed
                </Text>
                <Text
                  style={[
                    styles.imageSizeValue,
                    {color: theme.colors.text.primary},
                  ]}>
                  {formatFileSize(compressedSize)}
                </Text>
              </View>
              <View style={styles.imageSizeRow}>
                <Text
                  style={[
                    styles.imageSizeLabel,
                    {color: theme.colors.text.secondary},
                  ]}>
                  Saved
                </Text>
                <Text
                  style={[
                    styles.imageSizeValue,
                    {color: theme.colors.success},
                  ]}>
                  -{formatFileSize(originalSize - compressedSize)}
                </Text>
              </View>
            </View>
          )}

          <View style={[styles.imageControls, {gap: theme.spacing.sm}]}>
            <ActionButton
              icon="rotate-right"
              label="Rotate"
              onPress={onRotateImage}
            />
            <ActionButton icon="flip" label="Flip" onPress={onFlipImage} />
            <ActionButton
              icon="delete-outline"
              label="Remove"
              tone="danger"
              onPress={onClearImage}
            />
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.emptyState,
            {
              borderColor: theme.colors.borderSubtle,
              borderRadius: theme.borderRadius.md,
            },
          ]}>
          <View
            style={[
              styles.emptyIcon,
              {
                backgroundColor: theme.colors.accent.muted,
                borderRadius: theme.borderRadius.full,
              },
            ]}>
            <MaterialIcons
              name="photo-camera"
              size={20}
              color={theme.colors.accent.primary}
            />
          </View>
          <Text style={[styles.emptyTitle, {color: theme.colors.text.primary}]}>
            Add a photo
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              {color: theme.colors.text.secondary},
            ]}>
            Capture a new photo or choose one from your library.
          </Text>
          <View style={[styles.imagePickerButtons, {gap: theme.spacing.sm}]}>
            <ActionButton
              icon="camera-alt"
              label="Camera"
              onPress={() => onPickImage('camera')}
            />
            <ActionButton
              icon="photo-library"
              label="Library"
              onPress={() => onPickImage('library')}
            />
          </View>
        </View>
      )}

      <Modal
        visible={isPreviewVisible}
        transparent
        animationType="fade"
        onRequestClose={onTogglePreview}>
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={onTogglePreview}
            activeOpacity={1}>
            <View style={styles.modalContent}>
              {selectedImage && (
                <Image
                  source={{uri: selectedImage}}
                  style={[
                    styles.fullImage,
                    {
                      transform: [
                        {rotate: `${imageRotation}deg`},
                        {scaleX: imageFlip ? -1 : 1},
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
    marginBottom: 8,
  },
  imagePickerButtons: {
    flexDirection: 'row',
    marginTop: 12,
  },
  emptyState: {
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  imagePreviewContainer: {
    width: '100%',
    height: 200,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  previewBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  imageSizeInfo: {
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 6,
  },
  imageSizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageSizeLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  imageSizeValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  imageControls: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
  },
  actionButtonText: {
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
