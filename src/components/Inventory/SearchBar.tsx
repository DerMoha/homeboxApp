import React, {useMemo} from 'react';
import {View, TextInput, TouchableOpacity, Text, StyleSheet} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../theme/ThemeContext';

interface SearchBarProps {
  query: string;
  onChangeQuery: (text: string) => void;
  onClear: () => void;
  resultCount: number;
  totalCount: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onChangeQuery,
  onClear,
  resultCount,
  totalCount,
}) => {
  const {theme} = useTheme();

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        backgroundColor: theme.colors.background.primary,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
      },
    ],
    [theme.colors.background.primary, theme.spacing.md, theme.spacing.sm],
  );

  const searchInputContainerStyle = useMemo(
    () => [
      styles.searchInputContainer,
      {
        backgroundColor: theme.colors.background.elevated,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: theme.spacing.md,
      },
    ],
    [
      theme.borderRadius.md,
      theme.colors.background.elevated,
      theme.colors.border,
      theme.spacing.md,
    ],
  );

  const inputStyle = useMemo(
    () => [
      styles.input,
      {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.md,
        paddingVertical: theme.spacing.sm,
      },
    ],
    [
      theme.colors.text.primary,
      theme.spacing.sm,
      theme.typography.sizes.md,
    ],
  );

  const resultsTextStyle = useMemo(
    () => [
      styles.resultsText,
      {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.sm,
        marginTop: theme.spacing.xs,
      },
    ],
    [
      theme.colors.text.secondary,
      theme.spacing.xs,
      theme.typography.sizes.sm,
    ],
  );

  const showResults = query.trim() !== '' || resultCount !== totalCount;

  return (
    <View style={containerStyle}>
      <View style={searchInputContainerStyle}>
        <MaterialIcons
          name="search"
          size={20}
          color={theme.colors.text.secondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={inputStyle}
          placeholder="Search items..."
          placeholderTextColor={theme.colors.text.secondary}
          value={query}
          onChangeText={onChangeQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={onClear} style={styles.clearButton}>
            <MaterialIcons
              name="clear"
              size={20}
              color={theme.colors.text.secondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {showResults && (
        <Text style={resultsTextStyle}>
          Showing {resultCount} of {totalCount} items
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
  },
  clearButton: {
    padding: 4,
  },
  resultsText: {
    textAlign: 'center',
  },
});
