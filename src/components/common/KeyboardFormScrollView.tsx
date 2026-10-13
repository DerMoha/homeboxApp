import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  TextInput,
  StyleSheet,
} from 'react-native';
import {useHeaderHeight} from '@react-navigation/elements';
import {focusedScrollOffset} from '../../utils/formScroll';

const FormInputFocusContext = createContext<(spaceBelow: number) => void>(
  () => {},
);
export const useFormInputFocus = (spaceBelow = 24) => {
  const focus = useContext(FormInputFocusContext);
  return useCallback(() => focus(spaceBelow), [focus, spaceBelow]);
};

/** Android resizes the viewport; iOS uses padding to avoid the keyboard. */
export const KeyboardFormScrollView: React.FC<
  ScrollViewProps & {resetScrollKey?: number}
> = ({resetScrollKey, ...props}) => {
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const offset = useRef(0);
  const reservedSpace = useRef(24);
  const frame = useRef<number | null>(null);
  const headerHeight = useHeaderHeight();
  useEffect(() => {
    if (resetScrollKey !== undefined) {
      offset.current = 0;
      scrollRef.current?.scrollTo({y: 0, animated: false});
    }
  }, [resetScrollKey]);

  const revealFocusedInput = useCallback(() => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
    }
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      if (!Keyboard.isVisible()) {
        return;
      }
      const input = TextInput.State.currentlyFocusedInput();
      const scroll = scrollRef.current;
      if (!input || !scroll) {
        return;
      }
      scroll.measureInWindow((_x, top, _width, height) => {
        input.measureInWindow((_inputX, inputTop, _inputWidth, inputHeight) => {
          if (
            TextInput.State.currentlyFocusedInput() !== input ||
            !Keyboard.isVisible()
          ) {
            return;
          }
          const next = focusedScrollOffset(
            offset.current,
            top,
            height,
            inputTop,
            inputHeight,
            reservedSpace.current,
          );
          if (Math.abs(next - offset.current) > 1) {
            offset.current = next;
            scroll.scrollTo({y: next, animated: false});
          }
        });
      });
    });
  }, []);
  const onInputFocus = useCallback(
    (spaceBelow: number) => {
      reservedSpace.current = spaceBelow;
      revealFocusedInput();
    },
    [revealFocusedInput],
  );
  useEffect(() => {
    const subscription = Keyboard.addListener(
      'keyboardDidShow',
      revealFocusedInput,
    );
    return () => {
      subscription.remove();
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
      }
    };
  }, [revealFocusedInput]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      enabled={Platform.OS === 'ios'}
      behavior="padding"
      keyboardVerticalOffset={headerHeight}>
      <FormInputFocusContext.Provider value={onInputFocus}>
        <ScrollView
          {...props}
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
          scrollEventThrottle={16}
          onScroll={event => {
            offset.current = event.nativeEvent.contentOffset.y;
            props.onScroll?.(event);
          }}
          onLayout={event => {
            props.onLayout?.(event);
            revealFocusedInput();
          }}
        />
      </FormInputFocusContext.Provider>
    </KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({container: {flex: 1}});
