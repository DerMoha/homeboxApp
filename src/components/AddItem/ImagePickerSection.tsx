import React, {useMemo} from 'react';
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

interface ActionButtonProps {
  icon: string;
  label: string;
  tone?: 'default' | 'danger';
  onPress: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  tone = 'default',
  onPress,
}) => {
  const {theme} = useTheme();
  const isDanger = tone === 'danger';
  const dangerBackground = `${theme.colors.error}1A`;
  const backgroundColor = isDanger
    ? dangerBackground
    : theme.colors.background.secondary;
  const borderColor = isDanger ? theme.colors.error : theme.colors.borderSubtle;
  const foreground = isDanger ? theme.colors.error : theme.colors.text.primary;

  const buttonStyle = useMemo(
    () => [
      styles.actionButton,
      {
        backgroundColor,
        borderColor,
        borderRadius: theme.borderRadius.md,
      },
    ],
    [backgroundColor, borderColor, theme.borderRadius.md],
  );

  const buttonTextStyle = useMemo(
    () => [
      styles.actionButtonText,
      {
        color: foreground,
        fontFamily: theme.typography.fonts.medium,
      },
    ],
    [foreground, theme.typography.fonts.medium],
  );

  return (
    <TouchableOpacity style={buttonStyle} onPress={onPress} activeOpacity={0.8}>
      <MaterialIcons name={icon} size={18} color={foreground} />
      <Text style={buttonTextStyle}>{label}</Text>
    </TouchableOpacity>
  );
};

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

  const previewTransform = useMemo(
    () => [{rotate: `${imageRotation}deg`}, {scaleX: imageFlip ? -1 : 1}],
    [imageRotation, imageFlip],
  );

  const imagePreviewContainerStyle = useMemo(
    () => [
      styles.imagePreviewContainer,
      {
        borderRadius: theme.borderRadius.md,
        borderColor: theme.colors.borderSubtle,
        backgroundColor: theme.colors.background.tertiary,
      },
    ],
    [
      theme.borderRadius.md,
      theme.colors.background.tertiary,
      theme.colors.borderSubtle,
    ],
  );

  const previewImageStyle = useMemo(
    () => [
      styles.imagePreview,
      {
        transform: previewTransform,
        borderRadius: theme.borderRadius.md,
      },
    ],
    [previewTransform, theme.borderRadius.md],
  );

  const previewBadgeStyle = useMemo(
    () => [
      styles.previewBadge,
      {
        backgroundColor: theme.colors.accent.muted,
        borderColor: theme.colors.borderSubtle,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: theme.borderRadius.full,
      },
    ],
    [
      theme.borderRadius.full,
      theme.colors.accent.muted,
      theme.colors.borderSubtle,
    ],
  );

  const previewBadgeTextStyle = useMemo(
    () => [
      styles.previewBadgeText,
      {
        color: theme.colors.accent.primary,
        fontFamily: theme.typography.fonts.semibold,
      },
    ],
    [theme.colors.accent.primary, theme.typography.fonts.semibold],
  );

  const imageSizeInfoStyle = useMemo(
    () => [
      styles.imageSizeInfo,
      {
        backgroundColor: theme.colors.background.secondary,
        borderColor: theme.colors.borderSubtle,
        borderRadius: theme.borderRadius.md,
      },
    ],
    [
      theme.borderRadius.md,
      theme.colors.background.secondary,
      theme.colors.borderSubtle,
    ],
  );

  const imageSizeLabelStyle = useMemo(
    () => [
      styles.imageSizeLabel,
      {
        color: theme.colors.text.secondary,
        fontFamily: theme.typography.fonts.medium,
      },
    ],
    [theme.colors.text.secondary, theme.typography.fonts.medium],
  );

  const imageSizeValueStyle = useMemo(
    () => [
      styles.imageSizeValue,
      {
        color: theme.colors.text.primary,
        fontFamily: theme.typography.fonts.semibold,
      },
    ],
    [theme.colors.text.primary, theme.typography.fonts.semibold],
  );

  const imageSizeValueSuccessStyle = useMemo(
    () => [
      styles.imageSizeValue,
      {
        color: theme.colors.success,
        fontFamily: theme.typography.fonts.semibold,
      },
    ],
    [theme.colors.success, theme.typography.fonts.semibold],
  );

  const imageControlsStyle = useMemo(
    () => [styles.imageControls, {gap: theme.spacing.sm}],
    [theme.spacing.sm],
  );

  const emptyStateStyle = useMemo(
    () => [
      styles.emptyState,
      {
        backgroundColor: theme.colors.background.secondary,
        borderColor: theme.colors.borderSubtle,
        borderRadius: theme.borderRadius.md,
      },
    ],
    [
      theme.borderRadius.md,
      theme.colors.background.secondary,
      theme.colors.borderSubtle,
    ],
  );

  const emptyIconStyle = useMemo(
    () => [
      styles.emptyIcon,
      {
        backgroundColor: theme.colors.accent.muted,
        borderColor: theme.colors.borderSubtle,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: theme.borderRadius.full,
      },
    ],
    [
      theme.borderRadius.full,
      theme.colors.accent.muted,
      theme.colors.borderSubtle,
    ],
  );

  const emptyTitleStyle = useMemo(
    () => [
      styles.emptyTitle,
      {
        color: theme.colors.text.primary,
        fontFamily: theme.typography.fonts.semibold,
      },
    ],
    [theme.colors.text.primary, theme.typography.fonts.semibold],
  );

  const emptySubtitleStyle = useMemo(
    () => [
      styles.emptySubtitle,
      {
        color: theme.colors.text.secondary,
        fontFamily: theme.typography.fonts.regular,
      },
    ],
    [theme.colors.text.secondary, theme.typography.fonts.regular],
  );

  const imagePickerButtonsStyle = useMemo(
    () => [styles.imagePickerButtons, {gap: theme.spacing.sm}],
    [theme.spacing.sm],
  );

  const fullImageStyle = useMemo(
    () => [styles.fullImage, {transform: previewTransform}],
    [previewTransform],
  );

  return (
    <View style={styles.section}>
      {selectedImage ? (
        <View>
          <TouchableOpacity
            onPress={onTogglePreview}
            activeOpacity={0.9}
            style={imagePreviewContainerStyle}>
            <Image
              source={{uri: selectedImage}}
              style={previewImageStyle}
              resizeMode="contain"
            />
            <View style={previewBadgeStyle}>
              <MaterialIcons
                name="open-in-full"
                size={12}
                color={theme.colors.accent.primary}
              />
              <Text style={previewBadgeTextStyle}>Preview</Text>
            </View>
          </TouchableOpacity>

          {originalSize && compressedSize && (
            <View style={imageSizeInfoStyle}>
              <View style={styles.imageSizeRow}>
                <Text style={imageSizeLabelStyle}>Original</Text>
                <Text style={imageSizeValueStyle}>
                  {formatFileSize(originalSize)}
                </Text>
              </View>
              <View style={styles.imageSizeRow}>
                <Text style={imageSizeLabelStyle}>Compressed</Text>
                <Text style={imageSizeValueStyle}>
                  {formatFileSize(compressedSize)}
                </Text>
              </View>
              <View style={styles.imageSizeRow}>
                <Text style={imageSizeLabelStyle}>Saved</Text>
                <Text style={imageSizeValueSuccessStyle}>
                  -{formatFileSize(originalSize - compressedSize)}
                </Text>
              </View>
            </View>
          )}

          <View style={imageControlsStyle}>
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
        <View style={emptyStateStyle}>
          <View style={emptyIconStyle}>
            <MaterialIcons
              name="photo-camera"
              size={20}
              color={theme.colors.accent.primary}
            />
          </View>
          <Text style={emptyTitleStyle}>Add a photo</Text>
          <Text style={emptySubtitleStyle}>
            Capture a new photo or choose one from your library.
          </Text>
          <View style={imagePickerButtonsStyle}>
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
                  style={fullImageStyle}
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
    borderWidth: StyleSheet.hairlineWidth,
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
    borderWidth: StyleSheet.hairlineWidth,
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
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
    gap: 6,
  },
  imageSizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageSizeLabel: {
    fontSize: 12,
    textTransform: 'none',
    letterSpacing: 0,
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
    borderWidth: StyleSheet.hairlineWidth,
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
