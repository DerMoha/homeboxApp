import React, {useMemo} from 'react';
import {StyleSheet, Text, TouchableOpacity} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../../theme/ThemeContext';

interface BatchActionButtonProps {
  label: string;
  icon: string;
  onPress: () => void;
  destructive?: boolean;
}

export const BatchActionButton: React.FC<BatchActionButtonProps> = ({
  label,
  icon,
  onPress,
  destructive = false,
}) => {
  const {theme} = useTheme();

  const iconColor = destructive
    ? theme.colors.error
    : theme.colors.text.primary;

  const buttonStyle = useMemo(
    () => [
      styles.actionButton,
      {
        borderRadius: theme.borderRadius.md,
        backgroundColor: destructive
          ? `${theme.colors.error}15`
          : theme.colors.background.tertiary,
      },
    ],
    [destructive, theme],
  );

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      activeOpacity={0.85}>
      <MaterialIcons name={icon} size={18} color={iconColor} />
      <Text
        style={[
          styles.actionText,
          {
            color: iconColor,
            fontSize: theme.typography.sizes.xs,
            fontFamily: theme.typography.fonts.medium,
          },
        ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
    minWidth: 56,
  },
  actionText: {
    marginTop: 2,
  },
});
