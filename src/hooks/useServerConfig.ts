import {useState, useCallback} from 'react';
import {Alert} from 'react-native';
import ServerService from '../services/serverService';
import {ServerConfig} from '../types';
import {logger} from '../utils/logger';
import {hapticNotification} from '../utils/haptics';

interface ServerWithStatus extends ServerConfig {
  status: 'checking' | 'online' | 'offline';
}

export const useServerConfig = () => {
  const [formData, setFormData] = useState<ServerConfig>({
    id: Date.now().toString(),
    host: '',
    username: '',
    password: '',
    name: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [servers, setServers] = useState<ServerWithStatus[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');

  const updateField = useCallback(
    (field: keyof ServerConfig, value: string): void => {
      setFormData((prev: ServerConfig) => ({
        ...prev,
        [field]: field === 'username' ? value.toLowerCase() : value,
      }));
    },
    [],
  );

  const resetForm = useCallback((): void => {
    setFormData({
      id: Date.now().toString(),
      host: '',
      username: '',
      password: '',
      name: '',
    });
  }, []);

  const loadServers = useCallback(async (): Promise<void> => {
    try {
      const serverService = ServerService.getInstance();
      const savedServers = await serverService.getServers();
      const serversWithStatus: ServerWithStatus[] = savedServers.map(
        (server: ServerConfig) => ({
          ...server,
          status: 'checking' as const,
        }),
      );
      setServers(serversWithStatus);

      const updatedServers = await Promise.all(
        serversWithStatus.map(async (server: ServerWithStatus) => {
          try {
            const result = await serverService.testConnection(server);
            return {
              ...server,
              status: result.success
                ? ('online' as const)
                : ('offline' as const),
            };
          } catch (error) {
            return {
              ...server,
              status: 'offline' as const,
            };
          }
        }),
      );

      setServers(updatedServers);

      const currentConfig = serverService.getCurrentConfig();
      if (currentConfig) {
        setSelectedServer(currentConfig.id);
      } else if (updatedServers.length > 0) {
        setSelectedServer(updatedServers[0].id);
      }
    } catch (error) {
      logger.error('Error loading servers:', {error});
      Alert.alert('Error', 'Failed to load saved servers');
    }
  }, []);

  const testConnection = useCallback(async (): Promise<void> => {
    if (!formData.host || !formData.username || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const serverService = ServerService.getInstance();
      const result = await serverService.testConnection(formData);

      if (result.success) {
        hapticNotification('success');
        Alert.alert('Success', 'Connection successful! Server is reachable.');
        await serverService.setLastUsedServer(formData.id);
      } else {
        hapticNotification('error');
        Alert.alert(
          'Connection Failed',
          result.error ||
            'Could not connect to the server. Please check your settings.',
        );
      }
    } catch (error) {
      logger.error('Error testing connection:', {error});
      Alert.alert('Error', 'Failed to test connection');
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  const saveServerConfig = useCallback(async (): Promise<void> => {
    try {
      const serverService = ServerService.getInstance();
      const saved = await serverService.saveServer(formData);
      if (saved) {
        hapticNotification('success');
        await loadServers();
        resetForm();
        Alert.alert('Success', 'Server configuration saved successfully');
        await serverService.setLastUsedServer(formData.id);
      } else {
        hapticNotification('error');
        Alert.alert('Error', 'Failed to save server configuration');
      }
    } catch (error) {
      logger.error('Error in saveServerConfig:', {error});
      hapticNotification('error');
      Alert.alert('Error', 'Failed to save server configuration');
    } finally {
      setIsSaving(false);
    }
  }, [formData, loadServers, resetForm]);

  const saveServer = useCallback(async (): Promise<void> => {
    if (!formData.host || !formData.username || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const serverService = ServerService.getInstance();
      const result = await serverService.testConnection(formData);

      if (!result.success) {
        Alert.alert(
          'Connection Failed',
          result.error || 'Could not connect to the server. Save anyway?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setIsSaving(false),
            },
            {
              text: 'Save Anyway',
              onPress: async () => {
                await saveServerConfig();
              },
            },
          ],
        );
        return;
      }

      await saveServerConfig();
    } catch (error) {
      logger.error('Error saving server:', {error});
      Alert.alert('Error', 'Failed to save server configuration');
      setIsSaving(false);
    }
  }, [formData, saveServerConfig]);

  const deleteServer = useCallback(
    async (serverId: string): Promise<void> => {
      const serverToDelete = servers.find(server => server.id === serverId);
      const serverName =
        serverToDelete?.name || serverToDelete?.host || 'this server';

      Alert.alert(
        'Delete Server',
        `Are you sure you want to delete ${serverName}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const serverService = ServerService.getInstance();
                const deleted = await serverService.deleteServer(serverId);
                if (deleted) {
                  hapticNotification('success');
                  await loadServers();
                  Alert.alert('Success', 'Server deleted successfully');
                } else {
                  hapticNotification('error');
                  Alert.alert('Error', 'Failed to delete server');
                }
              } catch (error) {
                logger.error('Error deleting server:', {error});
                hapticNotification('error');
                Alert.alert('Error', 'Failed to delete server');
              }
            },
          },
        ],
        {cancelable: true},
      );
    },
    [servers, loadServers],
  );

  const selectServer = useCallback(
    async (server: ServerWithStatus): Promise<void> => {
      setSelectedServer(server.id);
      const serverService = ServerService.getInstance();
      await serverService.initialize(server);
    },
    [],
  );

  const editServer = useCallback((server: ServerWithStatus): void => {
    setSelectedServer(server.id);
    setFormData(server);
  }, []);

  const clearSelection = useCallback((): void => {
    setSelectedServer('');
    resetForm();
  }, [resetForm]);

  return {
    formData,
    isLoading,
    isSaving,
    servers,
    selectedServer,
    updateField,
    resetForm,
    loadServers,
    testConnection,
    saveServer,
    deleteServer,
    selectServer,
    editServer,
    clearSelection,
    setSelectedServer,
  };
};
