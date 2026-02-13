import React, {memo, useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {Theme} from '../../../theme/theme';

interface MetaItemProps {
  icon: string;
  text: string;
  theme: Theme;
}

const MetaItemComponent: React.FC<MetaItemProps> = ({icon, text, theme}) => {
  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        gap: theme.spacing.xs,
      },
    ],
    [theme.spacing.xs],
  );

  const textStyle = useMemo(
    () => [
      styles.text,
      {
        fontSize: theme.typography.sizes.xs,
        fontFamily: theme.typography.fonts.regular,
        color: theme.colors.text.tertiary,
      },
    ],
    [
      theme.colors.text.tertiary,
      theme.typography.fonts.regular,
      theme.typography.sizes.xs,
    ],
  );

  return (
    <View style={containerStyle}>
      <MaterialIcons name={icon} size={14} color={theme.colors.text.tertiary} />
      <Text style={textStyle} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    flex: 1,
  },
});

export const MetaItem = memo(MetaItemComponent);
