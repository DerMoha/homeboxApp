import React, {useRef, useState} from 'react';
import {Platform, Pressable, StyleSheet} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../theme/ThemeContext';
import {Button} from './Button';
import {Sheet} from './Sheet';
export interface MenuAction {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
}
export function ActionMenu({
  title = 'More actions',
  actions,
}: {
  title?: string;
  actions: MenuAction[];
}) {
  const {theme} = useTheme();
  const [visible, setVisible] = useState(false);
  const pending = useRef<(() => void) | null>(null);
  const complete = () => {
    const action = pending.current;
    pending.current = null;
    action?.();
  };
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={() => setVisible(true)}
        style={styles.trigger}>
        <MaterialIcons
          name="more-vert"
          size={24}
          color={theme.colors.text.primary}
        />
      </Pressable>
      <Sheet
        title={title}
        visible={visible}
        onClose={() => setVisible(false)}
        onDismiss={complete}>
        {actions.map(action => (
          <Button
            key={action.title}
            title={action.title}
            variant={action.destructive ? 'danger' : 'ghost'}
            disabled={action.disabled}
            onPress={() => {
              pending.current = action.onPress;
              setVisible(false);
              if (Platform.OS !== 'ios') {
                setTimeout(complete, 300);
              }
            }}
          />
        ))}
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
