import React from 'react';
import { View, Text, StyleSheet, TextStyle } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme/ThemeContext';

type FontWeight = TextStyle['fontWeight'];

interface StatCardProps {
  icon: string;
  value: string;
  label: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: theme.colors.background.elevated,
          borderRadius: theme.borderRadius.lg,
        },
        theme.shadows.sm,
      ]}
    >
      <MaterialIcons
        name={icon}
        size={24}
        color={theme.colors.accent.primary}
        style={styles.statIcon}
      />
      <Text
        style={[
          styles.statNumber,
          {
            color: theme.colors.text.primary,
            fontSize: theme.typography.sizes.xxl,
            fontWeight: theme.typography.weights.bold as FontWeight,
          },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.statLabel,
          {
            color: theme.colors.text.tertiary,
            fontSize: theme.typography.sizes.xs,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const HomeScreen: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Branding */}
      <View style={styles.brandingArea}>
        <View
          style={[
            styles.logoContainer,
            {
              backgroundColor: theme.colors.accent.muted,
              borderRadius: theme.borderRadius.lg,
            },
          ]}
        >
          <MaterialIcons name="inventory-2" size={48} color={theme.colors.accent.primary} />
        </View>
        <Text
          style={[
            styles.appTitle,
            {
              color: theme.colors.text.primary,
              fontSize: theme.typography.sizes.xxl,
              fontWeight: theme.typography.weights.bold as FontWeight,
            },
          ]}
        >
          Homebox
        </Text>
        <Text
          style={[
            styles.tagline,
            {
              color: theme.colors.text.secondary,
              fontSize: theme.typography.sizes.md,
            },
          ]}
        >
          Your home inventory
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <StatCard icon="inventory" value="—" label="ITEMS" />
        <StatCard icon="folder" value="—" label="LOCATIONS" />
      </View>

      {/* Hint */}
      <Text
        style={[
          styles.welcomeHint,
          {
            color: theme.colors.text.tertiary,
            fontSize: theme.typography.sizes.sm,
          },
        ]}
      >
        Tap the + button to add your first item
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  brandingArea: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appTitle: {
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    letterSpacing: 0.2,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 8,
  },
  statNumber: {
    marginBottom: 4,
  },
  statLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  welcomeHint: {
    textAlign: 'center',
  },
});

export default HomeScreen;
