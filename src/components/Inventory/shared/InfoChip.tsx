import React, {memo, useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {Theme} from '../../../theme/theme';

interface InfoChipProps {
  icon: string;
  label: string;
  theme: Theme;
  tintColor?: string;
  backgroundColor?: string;
}

const InfoChipComponent: React.FC<InfoChipProps> = ({
  icon,
  label,
  theme,
  tintColor,
  backgroundColor,
}) => {
  const iconColor = tintColor || theme.colors.accent.primary;
  const chipBackgroundColor = backgroundColor || theme.colors.accent.muted;

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        backgroundColor: chipBackgroundColor,
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        gap: theme.spacing.xs,
      },
    ],
    [
      chipBackgroundColor,
      theme.borderRadius.full,
      theme.spacing.sm,
      theme.spacing.xs,
    ],
  );

  const textStyle = useMemo(
    () => [
      styles.text,
      {
        fontSize: theme.typography.sizes.xs,
        fontFamily: theme.typography.fonts.medium,
        fontWeight: theme.typography.weights.medium,
        color: iconColor,
      },
    ],
    [
      iconColor,
      theme.typography.fonts.medium,
      theme.typography.sizes.xs,
      theme.typography.weights.medium,
    ],
  );

  return (
    <View style={containerStyle}>
      <MaterialIcons name={icon} size={12} color={iconColor} />
      <Text style={textStyle} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  text: {},
});

export const InfoChip = memo(InfoChipComponent);
