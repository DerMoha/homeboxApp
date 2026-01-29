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
        letterSpacing: theme.typography.letterSpacing.wide,
      },
    ],
    [
      theme.colors.text.secondary,
      theme.typography.letterSpacing.wide,
      theme.typography.sizes.sm,
      theme.typography.weights.semibold,
    ],
  );

  const headerLineStyle = useMemo(
    () => [styles.headerLine, {backgroundColor: theme.colors.accent.primary}],
    [theme.colors.accent.primary],
  );

  const iconContainerStyle = useMemo(
    () => [styles.iconContainer, {backgroundColor: theme.colors.accent.muted}],
    [theme.colors.accent.muted],
  );

  if (variant === 'withLine') {
    return (
      <View style={styles.headerWithLine}>
        <Text style={headerTextStyle}>{title.toUpperCase()}</Text>
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
        <Text style={headerTextStyle}>{title.toUpperCase()}</Text>
        <View style={[headerLineStyle, styles.flexLine]} />
      </View>
    );
  }

  return (
    <View style={styles.headerDefault}>
      <Text style={headerTextStyle}>{title.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerDefault: {
    marginTop: 24,
    marginBottom: 12,
  },
  headerWithLine: {
    marginTop: 24,
    marginBottom: 12,
  },
  headerWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  headerText: {
    marginBottom: 8,
  },
  headerLine: {
    height: 2,
    width: 32,
    borderRadius: 1,
  },
  flexLine: {
    flex: 1,
    height: 1,
    opacity: 0.3,
    marginBottom: 0,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
});
