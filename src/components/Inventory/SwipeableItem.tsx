import React, {useRef, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../theme/ThemeContext';
import {hapticImpact} from '../../utils/haptics';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const ACTION_BUTTON_WIDTH = 80;

interface SwipeableItemProps {
  children: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  itemName?: string;
}

const SwipeableItem: React.FC<SwipeableItemProps> = ({
  children,
  onEdit,
  onDelete,
  itemName: _itemName,
}) => {
  const {theme} = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const prevTranslateX = useRef(0);
  const hasTriggeredHaptic = useRef({left: false, right: false});
  const isOpen = useRef(false);

  const resetPosition = useCallback(
    (animated = true) => {
      if (animated) {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }).start();
      } else {
        translateX.setValue(0);
      }
      isOpen.current = false;
      hasTriggeredHaptic.current = {left: false, right: false};
    },
    [translateX],
  );

  const openLeft = useCallback(() => {
    Animated.spring(translateX, {
      toValue: ACTION_BUTTON_WIDTH,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
    isOpen.current = true;
  }, [translateX]);

  const openRight = useCallback(() => {
    Animated.spring(translateX, {
      toValue: -ACTION_BUTTON_WIDTH,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
    isOpen.current = true;
  }, [translateX]);

  const handleEdit = useCallback(() => {
    hapticImpact('medium');
    resetPosition();
    onEdit();
  }, [onEdit, resetPosition]);

  const handleDelete = useCallback(() => {
    hapticImpact('heavy');
    resetPosition();
    onDelete();
  }, [onDelete, resetPosition]);

  useEffect(() => {
    return () => {
      resetPosition(false);
    };
  }, [resetPosition]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const {dx, dy} = gestureState;
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5;
      },
      onPanResponderGrant: () => {
        prevTranslateX.current = isOpen.current
          ? (translateX as any)._value
          : 0;
        hasTriggeredHaptic.current = {left: false, right: false};
        translateX.setOffset(prevTranslateX.current);
        translateX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const {dx} = gestureState;
        const newValue = dx;

        if (newValue > SWIPE_THRESHOLD && !hasTriggeredHaptic.current.right) {
          hapticImpact('light');
          hasTriggeredHaptic.current.right = true;
        }
        if (newValue < -SWIPE_THRESHOLD && !hasTriggeredHaptic.current.left) {
          hapticImpact('light');
          hasTriggeredHaptic.current.left = true;
        }

        translateX.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        const {dx, vx} = gestureState;
        translateX.flattenOffset();

        const shouldOpenRight = dx > SWIPE_THRESHOLD || vx > 0.5;
        const shouldOpenLeft = dx < -SWIPE_THRESHOLD || vx < -0.5;

        if (isOpen.current) {
          if (Math.abs(dx) < 10) {
            resetPosition();
          } else if (shouldOpenRight && dx > 0) {
            openLeft();
          } else if (shouldOpenLeft && dx < 0) {
            openRight();
          } else {
            resetPosition();
          }
        } else {
          if (shouldOpenRight && dx > 0) {
            openLeft();
          } else if (shouldOpenLeft && dx < 0) {
            openRight();
          } else {
            resetPosition();
          }
        }
      },
      onPanResponderTerminate: () => {
        translateX.flattenOffset();
        resetPosition();
      },
    }),
  ).current;

  const leftActionStyle = [
    styles.leftAction,
    {
      backgroundColor: '#3B82F6',
    },
  ];

  const rightActionStyle = [
    styles.rightAction,
    {
      backgroundColor: theme.colors.error,
    },
  ];

  const actionTextStyle = [
    styles.actionText,
    {
      color: theme.colors.text.inverse,
      fontSize: theme.typography.sizes.xs,
      fontWeight: theme.typography.weights.semibold,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.actionsContainer}>
        <Animated.View
          style={[
            leftActionStyle,
            {
              transform: [
                {
                  translateX: translateX.interpolate({
                    inputRange: [0, ACTION_BUTTON_WIDTH],
                    outputRange: [-ACTION_BUTTON_WIDTH, 0],
                    extrapolate: 'clamp',
                  }),
                },
              ],
              opacity: translateX.interpolate({
                inputRange: [0, ACTION_BUTTON_WIDTH],
                outputRange: [0, 1],
                extrapolate: 'clamp',
              }),
            },
          ]}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleEdit}
            activeOpacity={0.7}>
            <MaterialIcons
              name="edit"
              size={24}
              color={theme.colors.text.inverse}
            />
            <Text style={actionTextStyle}>Edit</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            rightActionStyle,
            {
              transform: [
                {
                  translateX: translateX.interpolate({
                    inputRange: [-ACTION_BUTTON_WIDTH, 0],
                    outputRange: [0, ACTION_BUTTON_WIDTH],
                    extrapolate: 'clamp',
                  }),
                },
              ],
              opacity: translateX.interpolate({
                inputRange: [-ACTION_BUTTON_WIDTH, 0],
                outputRange: [1, 0],
                extrapolate: 'clamp',
              }),
            },
          ]}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDelete}
            activeOpacity={0.7}>
            <MaterialIcons
              name="delete"
              size={24}
              color={theme.colors.text.inverse}
            />
            <Text style={actionTextStyle}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            transform: [{translateX}],
          },
        ]}
        {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  actionsContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftAction: {
    width: ACTION_BUTTON_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightAction: {
    width: ACTION_BUTTON_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: ACTION_BUTTON_WIDTH,
  },
  actionText: {
    marginTop: 4,
  },
  content: {
    backgroundColor: 'transparent',
  },
});

export default SwipeableItem;
