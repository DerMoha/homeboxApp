import {useCallback, useEffect, useRef, useState} from 'react';
import {AppState} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import ServerService from '../services/serverService';
import {
  draftKey,
  ItemDraft,
  itemDraftService,
} from '../services/itemDraftService';

export function useItemDraft(
  itemId: string | undefined,
  ready: boolean,
  snapshot: Omit<ItemDraft, 'updatedAt'>,
  restore: (draft: ItemDraft) => void,
  reset: () => void,
) {
  const [serverId, setServerId] = useState<string | null>(null);
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const latest = useRef(snapshot);
  const callbacks = useRef({restore, reset});
  latest.current = snapshot;
  callbacks.current = {restore, reset};
  const key = serverId ? draftKey(serverId, itemId) : null;
  const generation = useRef(0);
  const previousKey = useRef<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setServerId(ServerService.getInstance().getCurrentConfig()?.id || null);
    }, []),
  );

  useEffect(() => {
    if (!key || !ready) {
      return;
    }
    let active = true;
    setHydratedKey(null);
    setStatus('');
    itemDraftService
      .load(key)
      .then(draft => {
        if (!active) {
          return;
        }
        if (draft) {
          callbacks.current.restore(draft);
          setStatus('Draft restored');
        } else if (
          !itemId &&
          previousKey.current &&
          previousKey.current !== key
        ) {
          callbacks.current.reset();
        }
        previousKey.current = key;
        setHydratedKey(key);
      })
      .catch(() => {
        if (active) {
          setStatus(
            'Draft could not be restored. Your saved draft has been kept.',
          );
        }
      });
    return () => {
      active = false;
    };
  }, [key, ready, itemId]);

  useEffect(() => {
    if (!key || hydratedKey !== key) {
      return;
    }
    const save = () => {
      const currentGeneration = generation.current;
      itemDraftService
        .save(key, {...latest.current, updatedAt: new Date().toISOString()})
        .then(() => {
          if (generation.current === currentGeneration) {
            setStatus(
              latest.current.formData.name || latest.current.imageUri
                ? 'Draft saved on this device'
                : '',
            );
          }
        })
        .catch(() =>
          setStatus(
            'Draft could not be saved. Keep this form open and try again.',
          ),
        );
    };
    save();
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        save();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [key, hydratedKey, snapshot]);

  const discard = useCallback(async () => {
    if (!key) {
      return;
    }
    generation.current++;
    callbacks.current.reset();
    setStatus('');
    setHydratedKey(key);
    await itemDraftService.clear(key);
  }, [key]);

  return {
    draftStatus: status,
    discardDraft: discard,
    draftReady: Boolean(key && hydratedKey === key),
  };
}
