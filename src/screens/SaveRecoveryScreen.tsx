import React, {useCallback, useState} from 'react';
import {Alert, ScrollView, Text, View, StyleSheet} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {
  PendingSave,
  saveRecoveryService,
} from '../services/saveRecoveryService';
import ServerService from '../services/serverService';
import {Item} from '../types';
import {useTheme} from '../theme/ThemeContext';
import {Button} from '../components/common/Button';

export default function SaveRecoveryScreen() {
  const {theme} = useTheme();
  const [jobs, setJobs] = useState<PendingSave[]>([]);
  const [candidates, setCandidates] = useState<Record<string, Item[]>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const service = ServerService.getInstance();
  const load = useCallback(async () => {
    const id = service.getCurrentConfig()?.id;
    setJobs(id ? await saveRecoveryService.list(id) : []);
  }, [service]);
  useFocusEffect(
    useCallback(() => {
      load().catch(() => setError('Pending saves could not be loaded.'));
    }, [load]),
  );
  const perform = async (operation: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await operation();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Recovery failed.');
    } finally {
      setBusy(false);
    }
  };
  const resume = async (
    job: PendingSave,
    itemId?: string,
    confirmedAbsent = false,
  ) => {
    const result = job.uncertain
      ? await saveRecoveryService.reconcile(
          service,
          job,
          itemId,
          confirmedAbsent,
        )
      : await saveRecoveryService.resume(service, job);
    if (result.error || result.warning) {
      setError(result.error || result.warning || '');
    }
  };
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      style={{backgroundColor: theme.colors.background.primary}}>
      <Text style={{color: theme.colors.text.primary}}>
        Only saves for the connected server appear here. Recovery stays on the
        original item. Photos are kept on this device until uploaded or
        discarded.
      </Text>
      {error ? (
        <Text
          accessibilityRole="alert"
          style={{color: theme.colors.text.primary}}>
          {error}
        </Text>
      ) : null}
      {!jobs.length && (
        <Text style={{color: theme.colors.text.secondary}}>
          No pending saves for this server.
        </Text>
      )}
      {jobs.map(job => (
        <View
          key={job.id}
          style={[
            styles.card,
            {backgroundColor: theme.colors.background.secondary},
          ]}>
          <Text
            accessibilityRole="header"
            style={{color: theme.colors.text.primary}}>
            {job.data.name}
          </Text>
          <Text style={{color: theme.colors.text.secondary}}>
            {job.uncertain
              ? 'The server may already have created this item. Check before retrying.'
              : job.error || 'Save interrupted. Ready to resume.'}
          </Text>
          {job.uncertain ? (
            <>
              <Button
                title="Check server for this item"
                disabled={busy}
                onPress={() =>
                  perform(async () => {
                    const matches = await saveRecoveryService.candidates(
                      service,
                      job,
                    );
                    setCandidates(previous => ({
                      ...previous,
                      [job.id]: matches,
                    }));
                    setChecked(previous => ({...previous, [job.id]: true}));
                  })
                }
              />
              {(candidates[job.id] || []).map(item => (
                <Button
                  key={item.id}
                  title={`Use existing: ${item.name} (${item.assetId || item.id})`}
                  disabled={busy}
                  onPress={() =>
                    Alert.alert(
                      'Recover this item?',
                      'Apply the pending fields and photo to this existing item?',
                      [
                        {text: 'Cancel', style: 'cancel'},
                        {
                          text: 'Recover',
                          onPress: () => perform(() => resume(job, item.id)),
                        },
                      ],
                    )
                  }
                />
              ))}
              {checked[job.id] && (
                <Button
                  title="I checked: create a new item"
                  disabled={busy}
                  onPress={() =>
                    Alert.alert(
                      'Confirm item is absent',
                      'Check the Homebox inventory first. Creating again can duplicate an item if the original save succeeded.',
                      [
                        {text: 'Cancel', style: 'cancel'},
                        {
                          text: 'Create new item',
                          onPress: () =>
                            perform(() => resume(job, undefined, true)),
                        },
                      ],
                    )
                  }
                />
              )}
            </>
          ) : (
            <Button
              title="Retry remaining fields and photo"
              disabled={busy}
              onPress={() => perform(() => resume(job))}
            />
          )}
          <Button
            title="Discard pending save"
            disabled={busy}
            onPress={() =>
              Alert.alert(
                'Discard recovery data?',
                'This removes the local pending photo and recovery record. Any item already on the server will remain.',
                [
                  {text: 'Cancel', style: 'cancel'},
                  {
                    text: 'Discard',
                    style: 'destructive',
                    onPress: () =>
                      perform(() => saveRecoveryService.remove(job)),
                  },
                ],
              )
            }
          />
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  content: {padding: 16, gap: 16},
  card: {padding: 16, gap: 12, borderRadius: 12},
});
