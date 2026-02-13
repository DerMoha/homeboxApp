import React, {useCallback, useEffect, useRef, useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Camera, {CameraType, type CameraApi} from 'react-native-camera-kit';
import type {OnReadCodeData} from 'react-native-camera-kit/dist/CameraProps';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../theme/ThemeContext';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onBarcodeDetected: (barcode: string, format: string) => void;
}

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const SCANNER_SIZE = SCREEN_WIDTH * 0.75;
const CORNER_SIZE = 24;
const BORDER_WIDTH = 2;

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  visible,
  onClose,
  onBarcodeDetected,
}) => {
  const {theme} = useTheme();
  const cameraRef = useRef<CameraApi>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scanAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      requestCameraPermission();
    }
  }, [visible]);

  useEffect(() => {
    if (visible && hasPermission) {
      startScanAnimation();
      startPulseAnimation();
    }
    return () => {
      scanAnimation.stopAnimation();
      pulseAnim.stopAnimation();
    };
  }, [visible, hasPermission]);

  const requestCameraPermission = async () => {
    try {
      const result =
        await cameraRef.current?.requestDeviceCameraAuthorization();
      setHasPermission(result ?? false);
    } catch {
      setHasPermission(false);
    }
  };

  const startScanAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const handleBarcodeRead = useCallback(
    (event: OnReadCodeData) => {
      if (isProcessing) return;

      const {codeStringValue, codeFormat} = event.nativeEvent;
      setScannedBarcode(codeStringValue);
      setIsProcessing(true);

      setTimeout(() => {
        onBarcodeDetected(codeStringValue, codeFormat);
        setIsProcessing(false);
        setScannedBarcode(null);
      }, 500);
    },
    [isProcessing, onBarcodeDetected],
  );

  const scanLineTranslateY = scanAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCANNER_SIZE - 4],
  });

  const containerStyle = useMemo(
    () => [
      styles.container,
      {backgroundColor: theme.colors.background.primary},
    ],
    [theme.colors.background.primary],
  );

  const headerStyle = useMemo(
    () => [styles.header, {backgroundColor: theme.colors.background.primary}],
    [theme.colors.background.primary],
  );

  const titleStyle = useMemo(
    () => [
      styles.title,
      {
        color: theme.colors.text.primary,
        fontFamily: theme.typography.fonts.semibold,
      },
    ],
    [theme.colors.text.primary, theme.typography.fonts.semibold],
  );

  const subtitleStyle = useMemo(
    () => [
      styles.subtitle,
      {
        color: theme.colors.text.secondary,
        fontFamily: theme.typography.fonts.regular,
      },
    ],
    [theme.colors.text.secondary, theme.typography.fonts.regular],
  );

  const closeButtonStyle = useMemo(
    () => [
      styles.closeButton,
      {
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.full,
      },
    ],
    [theme.colors.background.secondary, theme.borderRadius.full],
  );

  const instructionsStyle = useMemo(
    () => [
      styles.instructions,
      {
        color: theme.colors.text.tertiary,
        fontFamily: theme.typography.fonts.regular,
      },
    ],
    [theme.colors.text.tertiary, theme.typography.fonts.regular],
  );

  const barcodeTextStyle = useMemo(
    () => [
      styles.barcodeText,
      {
        color: theme.colors.accent.primary,
        fontFamily: theme.typography.fonts.semibold,
      },
    ],
    [theme.colors.accent.primary, theme.typography.fonts.semibold],
  );

  const permissionContainerStyle = useMemo(
    () => [
      styles.permissionContainer,
      {backgroundColor: theme.colors.background.primary},
    ],
    [theme.colors.background.primary],
  );

  const permissionTitleStyle = useMemo(
    () => [
      styles.permissionTitle,
      {
        color: theme.colors.text.primary,
        fontFamily: theme.typography.fonts.semibold,
      },
    ],
    [theme.colors.text.primary, theme.typography.fonts.semibold],
  );

  const permissionMessageStyle = useMemo(
    () => [
      styles.permissionMessage,
      {
        color: theme.colors.text.secondary,
        fontFamily: theme.typography.fonts.regular,
      },
    ],
    [theme.colors.text.secondary, theme.typography.fonts.regular],
  );

  const permissionButtonStyle = useMemo(
    () => [
      styles.permissionButton,
      {
        backgroundColor: theme.colors.accent.primary,
        borderRadius: theme.borderRadius.lg,
      },
    ],
    [theme.colors.accent.primary, theme.borderRadius.lg],
  );

  const permissionButtonTextStyle = useMemo(
    () => [
      styles.permissionButtonText,
      {
        color: theme.colors.text.inverse,
        fontFamily: theme.typography.fonts.semibold,
      },
    ],
    [theme.colors.text.inverse, theme.typography.fonts.semibold],
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}>
      <View style={containerStyle}>
        <View style={headerStyle}>
          <TouchableOpacity style={closeButtonStyle} onPress={onClose}>
            <MaterialIcons
              name="close"
              size={24}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={titleStyle}>Scan Barcode</Text>
            <Text style={subtitleStyle}>Point camera at a barcode</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {hasPermission === null && (
          <View style={permissionContainerStyle}>
            <ActivityIndicator
              size="large"
              color={theme.colors.accent.primary}
            />
            <Text style={permissionMessageStyle}>
              Requesting camera permission...
            </Text>
          </View>
        )}

        {hasPermission === false && (
          <View style={permissionContainerStyle}>
            <MaterialIcons
              name="camera-alt"
              size={64}
              color={theme.colors.text.tertiary}
            />
            <Text style={permissionTitleStyle}>Camera Access Required</Text>
            <Text style={permissionMessageStyle}>
              Please grant camera permission to scan barcodes
            </Text>
            <TouchableOpacity
              style={permissionButtonStyle}
              onPress={requestCameraPermission}>
              <Text style={permissionButtonTextStyle}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        )}

        {hasPermission && (
          <>
            <View style={styles.cameraContainer}>
              <Camera
                ref={cameraRef}
                style={styles.camera}
                cameraType={CameraType.Back}
                scanBarcode
                onReadCode={handleBarcodeRead}
                showFrame={false}
              />

              <View style={styles.overlay}>
                <View style={styles.scannerFrame}>
                  <Animated.View
                    style={[
                      styles.scanLine,
                      {
                        transform: [{translateY: scanLineTranslateY}],
                        backgroundColor: theme.colors.accent.primary,
                      },
                    ]}
                  />

                  <View style={styles.corners}>
                    <View
                      style={[
                        styles.corner,
                        styles.cornerTopLeft,
                        {borderColor: theme.colors.accent.primary},
                      ]}
                    />
                    <View
                      style={[
                        styles.corner,
                        styles.cornerTopRight,
                        {borderColor: theme.colors.accent.primary},
                      ]}
                    />
                    <View
                      style={[
                        styles.corner,
                        styles.cornerBottomLeft,
                        {borderColor: theme.colors.accent.primary},
                      ]}
                    />
                    <View
                      style={[
                        styles.corner,
                        styles.cornerBottomRight,
                        {borderColor: theme.colors.accent.primary},
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.footer}>
              {scannedBarcode ? (
                <Animated.View
                  style={[
                    styles.scannedContainer,
                    {
                      backgroundColor: theme.colors.accent.muted,
                      borderRadius: theme.borderRadius.lg,
                      transform: [{scale: pulseAnim}],
                    },
                  ]}>
                  <MaterialIcons
                    name="check-circle"
                    size={20}
                    color={theme.colors.accent.primary}
                  />
                  <Text style={barcodeTextStyle}>{scannedBarcode}</Text>
                </Animated.View>
              ) : (
                <Text style={instructionsStyle}>
                  Align barcode within the frame
                </Text>
              )}
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scannerFrame: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  corners: {
    ...StyleSheet.absoluteFillObject,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderWidth: BORDER_WIDTH,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  instructions: {
    fontSize: 14,
  },
  scannedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  barcodeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BarcodeScannerModal;
