import React, {useCallback, useRef, useState} from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import ServerService from '../../services/serverService';
import {
  SavedSearch,
  ReviewList,
  savedSearchService,
} from '../../services/savedSearchService';
import {Button} from '../common/Button';
import {useTheme} from '../../theme/ThemeContext';
const reviews: [ReviewList, string][] = [
  ['all', 'All items'],
  ['no-photo', 'Missing photos'],
  ['uninsured-value', 'Uninsured value ≥ 500'],
  ['no-location', 'Missing locations'],
  ['recent', 'Added this week'],
];
export const SavedSearches = ({
  current,
  onApply,
}: {
  current: Omit<SavedSearch, 'id' | 'name'>;
  onApply: (search: Omit<SavedSearch, 'id' | 'name'>) => void;
}) => {
  const {theme} = useTheme();
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState('');
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [busy, setBusy] = useState(false);
  const serverRef = useRef<string | undefined>(undefined);
  const readyRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      const server = ServerService.getInstance().getBrowsingConfig()?.id;
      serverRef.current = server;
      readyRef.current = false;
      setSearches([]);
      if (server) {
        savedSearchService
          .load(server)
          .then(data => {
            if (serverRef.current === server) {
              setSearches(data);
              readyRef.current = true;
            }
          })
          .catch(() =>
            Alert.alert(
              'Saved searches',
              'Could not load saved searches. Try reopening inventory.',
            ),
          );
      }
      return () => {
        readyRef.current = false;
      };
    }, []),
  );
  const persist = async (next: SavedSearch[]) => {
    const server = serverRef.current;
    if (!server || !readyRef.current || busy) {
      return;
    }
    setBusy(true);
    try {
      await savedSearchService.save(server, next);
      if (serverRef.current === server) {
        setSearches(next);
        setName('');
      }
    } catch {
      Alert.alert(
        'Saved searches',
        'Could not save changes. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button
        title="Saved searches and review lists"
        onPress={() => setVisible(true)}
        variant="secondary"
        size="small"
      />
      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={() => setVisible(false)}>
        <ScrollView
          contentContainerStyle={{
            ...styles.content,
            backgroundColor: theme.colors.background.primary,
          }}
          keyboardShouldPersistTaps="handled">
          <Text
            accessibilityRole="header"
            style={{color: theme.colors.text.primary, ...styles.heading}}>
            Saved searches
          </Text>
          <TextInput
            accessibilityLabel="Saved search name"
            placeholder="Name this search"
            placeholderTextColor={theme.colors.text.secondary}
            value={name}
            onChangeText={setName}
            maxLength={80}
            style={{color: theme.colors.text.primary, ...styles.input}}
          />
          <Button
            title="Save current search and filters"
            disabled={!name.trim() || busy || !readyRef.current}
            onPress={() =>
              persist([
                ...searches,
                {
                  ...current,
                  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  name: name.trim(),
                },
              ])
            }
          />
          {searches.map(search => (
            <View key={search.id}>
              <Button
                title={search.name}
                variant="secondary"
                onPress={() => {
                  onApply(search);
                  setVisible(false);
                }}
              />
              <Button
                title={`Delete ${search.name}`}
                variant="ghost"
                disabled={busy}
                onPress={() =>
                  Alert.alert('Delete saved search', search.name, [
                    {text: 'Cancel', style: 'cancel'},
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () =>
                        persist(
                          searches.filter(entry => entry.id !== search.id),
                        ),
                    },
                  ])
                }
              />
            </View>
          ))}
          <Text
            accessibilityRole="header"
            style={{
              color: theme.colors.text.primary,
              ...styles.heading,
              marginTop: 24,
            }}>
            Review lists
          </Text>
          <Text style={{color: theme.colors.text.secondary}}>
            Apply to loaded inventory. Load all results for a complete review.
            Value uses your server currency.
          </Text>
          {reviews.map(([review, title]) => (
            <Button
              key={review}
              title={title}
              variant={current.review === review ? 'primary' : 'secondary'}
              onPress={() => {
                onApply({...current, review});
                setVisible(false);
              }}
            />
          ))}
          <Button
            title="Close saved searches"
            onPress={() => setVisible(false)}
          />
        </ScrollView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  content: {padding: 24, paddingTop: 60, flexGrow: 1},
  heading: {fontSize: 24},
  reviewHeading: {fontSize: 24, marginTop: 24},
  input: {minHeight: 48},
});
