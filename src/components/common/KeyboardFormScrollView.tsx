import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
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

const FormInputFocusContext = createContext<() => void>(() => {});
export const useFormInputFocus = () => useContext(FormInputFocusContext);

/** Keep form fields and actions reachable above the software keyboard. */
export const KeyboardFormScrollView: React.FC<ScrollViewProps> = props => {
  const scrollRef = useRef<ScrollView>(null);
  const headerHeight = useHeaderHeight();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const revealFocusedInput = useCallback(() => {
    const input = TextInput.State.currentlyFocusedInput();
    if (input) {
      scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(
        input,
        24,
        true,
      );
    }
  }, []);
  const onInputFocus = useCallback(() => {
    if (Keyboard.isVisible()) {
      requestAnimationFrame(revealFocusedInput);
    }
  }, [revealFocusedInput]);

  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', event => {
      setKeyboardHeight(event.endCoordinates.height);
      requestAnimationFrame(revealFocusedInput);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardHeight(0),
    );
    return () => {
      subscription.remove();
      hideSubscription.remove();
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
          contentContainerStyle={[
            props.contentContainerStyle,
            Platform.OS === 'android' && keyboardHeight > 0
              ? {paddingBottom: keyboardHeight + 24}
              : undefined,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
          onLayout={revealFocusedInput}
        />
      </FormInputFocusContext.Provider>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({container: {flex: 1}});
