import React, { ReactNode, useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, Animated, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface CardProps {
  title?: string;
  children: ReactNode;
  style?: ViewStyle;
  accentStripe?: boolean;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  style,
  accentStripe = false,
  onPress,
}) => {
  const { theme } = useTheme();
  const pressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.timing(pressAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.timing(pressAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const overlayOpacity = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.04],
  });

  const cardContent = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card.background,
          borderColor: theme.colors.card.border,
          borderRadius: theme.borderRadius.lg,
          ...theme.shadows.md,
        },
        style,
      ]}
    >
      {accentStripe && (
        <View
          style={[
            styles.accentStripe,
            {
              backgroundColor: theme.colors.accent.primary,
              borderTopLeftRadius: theme.borderRadius.lg,
              borderBottomLeftRadius: theme.borderRadius.lg,
            },
          ]}
        />
      )}
      <View style={[styles.content, accentStripe && styles.contentWithStripe]}>
        {title && (
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.text.primary,
                fontSize: theme.typography.sizes.lg,
                fontWeight: theme.typography.weights.bold as any,
                letterSpacing: theme.typography.letterSpacing.tight,
              },
            ]}
          >
            {title}
          </Text>
        )}
        {children}
      </View>
      {onPress && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.overlay,
            {
              backgroundColor: theme.colors.text.primary,
              opacity: overlayOpacity,
              borderRadius: theme.borderRadius.lg,
            },
          ]}
          pointerEvents="none"
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    padding: 16,
  },
  contentWithStripe: {
    paddingLeft: 20,
  },
  accentStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  title: {
    marginBottom: 12,
  },
  overlay: {
    position: 'absolute',
  },
});
