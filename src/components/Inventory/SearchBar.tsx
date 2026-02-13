import React, {useMemo} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
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
        paddingTop: theme.spacing.sm,
        paddingBottom: theme.spacing.xs,
      },
    ],
    [
      theme.colors.background.primary,
      theme.spacing.md,
      theme.spacing.sm,
      theme.spacing.xs,
    ],
  );

  const searchInputContainerStyle = useMemo(
    () => [
      styles.searchInputContainer,
      {
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.borderSubtle,
        paddingHorizontal: theme.spacing.md,
        minHeight: 46,
      },
    ],
    [
      theme.borderRadius.lg,
      theme.colors.background.secondary,
      theme.colors.borderSubtle,
      theme.spacing.md,
    ],
  );

  const inputStyle = useMemo(
    () => [
      styles.input,
      {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.md,
        fontFamily: theme.typography.fonts.regular,
        paddingVertical: theme.spacing.sm,
      },
    ],
    [
      theme.colors.text.primary,
      theme.spacing.sm,
      theme.typography.sizes.md,
      theme.typography.fonts.regular,
    ],
  );

  const resultsTextStyle = useMemo(
    () => [
      styles.resultsText,
      {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.sm,
        marginTop: theme.spacing.xs,
        fontFamily: theme.typography.fonts.regular,
      },
    ],
    [
      theme.colors.text.secondary,
      theme.spacing.xs,
      theme.typography.sizes.sm,
      theme.typography.fonts.regular,
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
    textAlign: 'left',
    marginLeft: 4,
  },
});
