import React, {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../theme/ThemeContext';

interface SectionHeaderProps {
  title: string;
  icon?: string;
  variant?: 'default' | 'withLine' | 'withIcon';
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  variant = 'default',
}) => {
  const {theme} = useTheme();

  const headerTextStyle = useMemo(
    () => [
      styles.headerText,
      {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.sm,
        fontWeight: theme.typography.weights.semibold,
        fontFamily: theme.typography.fonts.semibold,
        letterSpacing: theme.typography.letterSpacing.normal,
      },
    ],
    [
      theme.colors.text.secondary,
      theme.typography.letterSpacing.normal,
      theme.typography.fonts.semibold,
      theme.typography.sizes.sm,
      theme.typography.weights.semibold,
    ],
  );

  const headerLineStyle = useMemo(
    () => [styles.headerLine, {backgroundColor: theme.colors.borderSubtle}],
    [theme.colors.borderSubtle],
  );

  const iconContainerStyle = useMemo(
    () => [styles.iconContainer, {backgroundColor: theme.colors.accent.muted}],
    [theme.colors.accent.muted],
  );

  if (variant === 'withLine') {
    return (
      <View style={styles.headerWithLine}>
        <Text style={headerTextStyle}>{title}</Text>
        <View style={headerLineStyle} />
      </View>
    );
  }

  if (variant === 'withIcon' && icon) {
    return (
      <View style={styles.headerWithIcon}>
        <View style={iconContainerStyle}>
          <MaterialIcons
            name={icon}
            size={16}
            color={theme.colors.accent.primary}
          />
        </View>
        <Text style={headerTextStyle}>{title}</Text>
        <View style={[headerLineStyle, styles.flexLine]} />
      </View>
    );
  }

  return (
    <View style={styles.headerDefault}>
      <Text style={headerTextStyle}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerDefault: {
    marginTop: 20,
    marginBottom: 10,
  },
  headerWithLine: {
    marginTop: 20,
    marginBottom: 10,
  },
  headerWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  headerText: {
    marginBottom: 6,
  },
  headerLine: {
    height: 1,
    width: 48,
    borderRadius: 1,
  },
  flexLine: {
    flex: 1,
    height: 1,
    opacity: 0.6,
    marginBottom: 0,
  },
  iconContainer: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
});
