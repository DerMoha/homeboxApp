import { useState, useCallback } from 'react';
import * as ImagePicker from 'react-native-image-picker';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import * as FileSystem from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

export const useImageHandler = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageFlip, setImageFlip] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [imageQuality, setImageQuality] = useState(0.8);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  const loadImageQuality = useCallback(async () => {
    try {
      const savedQuality = await AsyncStorage.getItem('@image_quality');
      if (savedQuality) {
        setImageQuality(parseFloat(savedQuality));
      }
    } catch (error) {
      logger.error('Error loading image quality setting:', error);
    }
  }, []);

  const getFileSize = async (uri: string): Promise<number> => {
    try {
      const fileInfo = await FileSystem.stat(uri);
      return fileInfo.size;
    } catch (error) {
      logger.error('Error getting file size:', error);
      return 0;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleImagePicker = useCallback(async (type: 'camera' | 'library') => {
    const options: ImagePicker.ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 1,
      includeBase64: false,
    };

    try {
      const result = type === 'camera'
        ? await ImagePicker.launchCamera(options)
        : await ImagePicker.launchImageLibrary(options);

      if (result.assets && result.assets[0]?.uri) {
        const originalFileSize = await getFileSize(result.assets[0].uri);
        setOriginalSize(originalFileSize);

        const compressedImage = await ImageResizer.createResizedImage(
          result.assets[0].uri,
          1200,
          1200,
          'JPEG',
          Math.round(imageQuality * 100),
          0,
          FileSystem.CachesDirectoryPath,
          false,
          { mode: 'contain', onlyScaleDown: true }
        );

        setSelectedImage(compressedImage.uri);
        setCompressedSize(compressedImage.size || 0);

        try {
          const size = await new Promise<{ width: number; height: number }>((resolve, reject) => {
            const Image = require('react-native').Image;
            Image.getSize(
              compressedImage.uri,
              (width: number, height: number) => resolve({ width, height }),
              reject
            );
          });
          setImageSize(size);
        } catch (error) {
          logger.error('Error getting image size:', error);
        }

        try {
          await FileSystem.unlink(result.assets[0].uri);
        } catch (error) {
          logger.error('Error cleaning up original file:', error);
        }
      }
    } catch (error) {
      logger.error('Error picking image:', error);
    }
  }, [imageQuality]);

  const handleRotateImage = useCallback(() => {
    setImageRotation(prev => (prev + 90) % 360);
  }, []);

  const handleFlipImage = useCallback(() => {
    setImageFlip(prev => !prev);
  }, []);

  const clearImage = useCallback(() => {
    setSelectedImage(null);
    setImageRotation(0);
    setImageFlip(false);
    setImageSize(null);
    setOriginalSize(null);
    setCompressedSize(null);
  }, []);

  return {
    selectedImage,
    imageRotation,
    imageFlip,
    imageSize,
    imageQuality,
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
  };
};
