import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ServerService, { ServerConfig } from '../services/serverService';
import { useTheme } from '../theme/ThemeContext';
import { SettingsStackParamList } from '../types/navigation';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type SettingsScreenNavigationProp = NativeStackNavigationProp<SettingsStackParamList, 'Settings'>;

interface ServerWithStatus extends ServerConfig {
  status: 'checking' | 'online' | 'offline';
}

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { theme } = useTheme();
  const [servers, setServers] = useState<ServerWithStatus[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [_isServerSettingsOpen, _setIsServerSettingsOpen] = useState(false);
  const [newServer, setNewServer] = useState<ServerConfig>({
    id: Date.now().toString(),
    host: '',
    username: '',
    password: '',
  });
  const [_isCheckingStatus, _setIsCheckingStatus] = useState(false);
  const [_themeMode, _setThemeMode] = useState<'light' | 'dark' | 'auto' | 'oled'>('auto');

  useEffect(() => {
    navigation.setOptions({
      title: 'Settings',
      headerLargeTitle: true,
      headerStyle: {
        backgroundColor: theme.colors.background.primary,
      },
      headerTintColor: theme.colors.text.primary,
    });
  }, [navigation, theme]);

  const checkServerStatus = useCallback(async (server: ServerConfig): Promise<'online' | 'offline'> => {
    try {
      const serverService = ServerService.getInstance();
      const result = await serverService.testConnection(server);
      return result.success ? 'online' : 'offline';
    } catch (error) {
      return 'offline';
    }
  }, []);

  const loadServers = useCallback(async (): Promise<void> => {
    try {
      const serverService = ServerService.getInstance();
      const savedServers = await serverService.getServers();

      // Initialize servers with checking status
      const serversWithStatus: ServerWithStatus[] = savedServers.map(server => ({
        ...server,
        status: 'checking',
      }));
      setServers(serversWithStatus);

      // Check status for each server
      _setIsCheckingStatus(true);
      const updatedServers = await Promise.all(
        serversWithStatus.map(async (server) => {
          const status = await checkServerStatus(server);
          return { ...server, status };
        })
      );
      setServers(updatedServers);
      _setIsCheckingStatus(false);

      // Set the selected server based on current configuration
      const currentConfig = serverService.getCurrentConfig();
      if (currentConfig) {
        setSelectedServer(currentConfig.id);
      } else if (updatedServers.length > 0) {
        // If no current config, set the first server as selected
        setSelectedServer(updatedServers[0].id);
        // Also initialize the first server as active
        await serverService.initialize(updatedServers[0]);
      } else {
        setSelectedServer('');
      }
    } catch (error) {
      console.error('Error loading servers:', error);
    }
  }, [checkServerStatus]);

  useFocusEffect(
    React.useCallback(() => {
      loadServers();
      // Get the current active server from ServerService
      const serverService = ServerService.getInstance();
      const currentConfig = serverService.getCurrentConfig();
      if (currentConfig) {
        setSelectedServer(currentConfig.id);
      }
    }, [loadServers])
  );

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _saveServer = async (): Promise<void> => {
    if (!newServer.host || !newServer.username || !newServer.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const serverService = ServerService.getInstance();
      const saved = await serverService.saveServer(newServer);
      if (saved) {
        await loadServers();
        setSelectedServer(newServer.id);
        resetNewServer();
        Alert.alert('Success', 'Server configuration saved');
      } else {
        Alert.alert('Error', 'Failed to save server configuration');
      }
    } catch (error) {
      console.error('Error saving server:', error);
      Alert.alert('Error', 'Failed to save server configuration');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _deleteServer = async (serverId: string): Promise<void> => {
    const serverToDelete = servers.find(server => server.id === serverId);
    const serverName = serverToDelete?.name || serverToDelete?.host || 'this server';

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
                await loadServers();
                if (selectedServer === serverId) {
                  setSelectedServer('');
                }
                Alert.alert('Success', 'Server deleted');
              } else {
                Alert.alert('Error', 'Failed to delete server');
              }
            } catch (error) {
              console.error('Error deleting server:', error);
              Alert.alert('Error', 'Failed to delete server');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleInputChange = (field: keyof ServerConfig, value: string): void => {
    setNewServer((prev: ServerConfig) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleServerChange = async (serverId: string): Promise<void> => {
    if (serverId === 'add_new') {
      navigation.navigate('ServerConfig', { server: undefined });
      return;
    }

    try {
      const serverService = ServerService.getInstance();
      const server = servers.find(s => s.id === serverId);

      if (server) {
        await serverService.initialize(server);
        setSelectedServer(serverId);
      }
    } catch (error) {
      console.error('Error changing server:', error);
      Alert.alert('Error', 'Failed to change server. Please try again.');
    }
  };

  const resetNewServer = (): void => {
    setNewServer({
      id: Date.now().toString(),
      host: '',
      username: '',
      password: '',
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleServerItemPress = async (server: ServerWithStatus): Promise<void> => {
    // Set as active server
    setSelectedServer(server.id);
    const serverService = ServerService.getInstance();
    await serverService.initialize(server);

    // Navigate to ServerConfig with the server data
    navigation.navigate('ServerConfig', { server });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, react/no-unstable-nested-components
  const _StatusIndicator: React.FC<{ status: ServerWithStatus['status'] }> = ({ status }) => {
    if (status === 'checking') {
      return <ActivityIndicator size="small" color={theme.colors.text.primary} style={styles.statusIndicator} />;
    }
    return (
      <View
        style={[
          styles.statusDot,
          { backgroundColor: status === 'online' ? theme.colors.success : theme.colors.error },
        ]}
      />
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <View style={[styles.serverSwitcher, { backgroundColor: theme.colors.background.secondary }]}>
        <Text style={[styles.serverSwitcherLabel, { color: theme.colors.text.primary }]}>Current Server:</Text>
        <View style={[styles.pickerContainer, { borderColor: theme.colors.border }]}>
          <Picker
            selectedValue={selectedServer}
            onValueChange={handleServerChange}
            style={[styles.picker, { color: theme.colors.text.primary }]}
          >
            {servers.length > 0 ? (
              servers.map((server) => (
                <Picker.Item
                  key={server.id}
                  label={server.name || server.host}
                  value={server.id}
                />
              ))
            ) : (
              <Picker.Item label="No servers configured" value="" />
            )}
            <Picker.Item label="Add New Server..." value="add_new" />
          </Picker>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.sectionHeader, { backgroundColor: theme.colors.background.secondary }]}
        onPress={() => navigation.navigate('ServerConfig', { server: undefined })}
      >
        <View style={styles.sectionHeaderContent}>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.text.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Server Configuration</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.sectionHeader, { backgroundColor: theme.colors.background.secondary }]}
        onPress={() => navigation.navigate('Appearance')}
      >
        <View style={styles.sectionHeaderContent}>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.text.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Appearance</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.sectionHeader, { backgroundColor: theme.colors.background.secondary }]}
        onPress={() => navigation.navigate('InventorySettings')}
      >
        <View style={styles.sectionHeaderContent}>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.text.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Inventory Display</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.sectionHeader, { backgroundColor: theme.colors.background.secondary }]}
        onPress={() => navigation.navigate('AddItemSettings')}
      >
        <View style={styles.sectionHeaderContent}>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.text.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Add Fields</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  serverSwitcher: {
    padding: 15,
    marginTop: 16,
    borderBottomWidth: 1,
  },
  serverSwitcherLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  picker: {
    height: 50,
    marginLeft: 10,
  },
  sectionHeader: {
    padding: 15,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  serverSettingsContent: {
    padding: 15,
  },
  form: {
    marginBottom: 20,
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 10,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  serversList: {
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  serverItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  serverItem: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  selectedServer: {
    backgroundColor: '#e6f2ff',
    borderColor: '#007AFF',
  },
  serverInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serverInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusIndicator: {
    marginRight: 12,
  },
  serverText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  serverUsername: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 10,
    marginLeft: 10,
  },
  deleteButtonText: {
    fontSize: 24,
    color: '#ff3b30',
    fontWeight: 'bold',
  },
  section: {
    padding: 15,
    borderBottomWidth: 1,
  },
  sectionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  serverLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  serverStatus: {
    fontSize: 14,
    color: '#666',
  },
  addServerText: {
    fontSize: 14,
    color: '#007AFF',
  },
  themeModeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  themeModeButton: {
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  selectedThemeMode: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  themeModeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 14,
    marginTop: 5,
  },
});

export default SettingsScreen;
