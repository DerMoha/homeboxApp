import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ServerService, { ServerConfig } from '../services/serverService';

type RootStackParamList = {
  Settings: undefined;
  ServerConfig: { server?: ServerWithStatus };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

interface ServerWithStatus extends ServerConfig {
  status: 'checking' | 'online' | 'offline';
}

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [servers, setServers] = useState<ServerWithStatus[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [isServerSettingsOpen, setIsServerSettingsOpen] = useState(false);
  const [newServer, setNewServer] = useState<ServerConfig>({
    id: Date.now().toString(),
    host: '',
    username: '',
    password: '',
  });
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadServers();
      // Get the current active server from ServerService
      const serverService = ServerService.getInstance();
      const currentConfig = serverService.getCurrentConfig();
      if (currentConfig) {
        setSelectedServer(currentConfig.id);
      }
    }, [])
  );

  useEffect(() => {
    loadServers();
  }, []);

  const checkServerStatus = async (server: ServerConfig): Promise<'online' | 'offline'> => {
    try {
      const serverService = ServerService.getInstance();
      const result = await serverService.testConnection(server);
      return result.success ? 'online' : 'offline';
    } catch (error) {
      return 'offline';
    }
  };

  const loadServers = async (): Promise<void> => {
    try {
      const serverService = ServerService.getInstance();
      const savedServers = await serverService.getServers();
      
      // Initialize servers with checking status
      const serversWithStatus: ServerWithStatus[] = savedServers.map(server => ({
        ...server,
        status: 'checking'
      }));
      setServers(serversWithStatus);

      // Check status for each server
      setIsCheckingStatus(true);
      const updatedServers = await Promise.all(
        serversWithStatus.map(async (server) => {
          const status = await checkServerStatus(server);
          return { ...server, status };
        })
      );
      setServers(updatedServers);
      setIsCheckingStatus(false);

      if (updatedServers.length > 0) {
        setSelectedServer(updatedServers[0].id);
      }
    } catch (error) {
      console.error('Error loading servers:', error);
    }
  };

  const saveServer = async (): Promise<void> => {
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

  const deleteServer = async (serverId: string): Promise<void> => {
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

  const handleInputChange = (field: keyof ServerConfig, value: string): void => {
    setNewServer((prev: ServerConfig) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleServerChange = async (value: string): Promise<void> => {
    if (value === 'add_new') {
      navigation.navigate('ServerConfig', { server: undefined });
    } else {
      setSelectedServer(value);
      const server = servers.find(s => s.id === value);
      if (server) {
        const serverService = ServerService.getInstance();
        await serverService.initialize(server);
      }
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

  const handleServerItemPress = async (server: ServerWithStatus): Promise<void> => {
    // Set as active server
    setSelectedServer(server.id);
    const serverService = ServerService.getInstance();
    await serverService.initialize(server);
    
    // Navigate to ServerConfig with the server data
    navigation.navigate('ServerConfig', { server });
  };

  const StatusIndicator: React.FC<{ status: ServerWithStatus['status'] }> = ({ status }) => {
    if (status === 'checking') {
      return <ActivityIndicator size="small" color="#666" style={styles.statusIndicator} />;
    }
    return (
      <View
        style={[
          styles.statusDot,
          { backgroundColor: status === 'online' ? '#34C759' : '#FF3B30' }
        ]}
      />
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.serverSwitcher}>
        <Text style={styles.serverSwitcherLabel}>Current Server:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedServer}
            onValueChange={handleServerChange}
            style={styles.picker}
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
        style={styles.sectionHeader}
        onPress={() => navigation.navigate('ServerConfig', { server: undefined })}
      >
        <View style={styles.sectionHeaderContent}>
          <Text style={styles.chevron}>▶</Text>
          <Text style={styles.sectionTitle}>Server Settings</Text>
        </View>
      </TouchableOpacity>

      {isServerSettingsOpen && (
        <View style={styles.serverSettingsContent}>
          <View style={styles.form}>
            <Text style={styles.formTitle}>Add New Server</Text>
            <TextInput
              style={styles.input}
              placeholder="Host"
              value={newServer.host}
              onChangeText={(text: string) => handleInputChange('host', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={newServer.username}
              onChangeText={(text: string) => handleInputChange('username', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={newServer.password}
              onChangeText={(text: string) => handleInputChange('password', text)}
              secureTextEntry
            />
            
            <TouchableOpacity style={styles.button} onPress={saveServer}>
              <Text style={styles.buttonText}>Add Server</Text>
            </TouchableOpacity>
          </View>

          {servers.length > 0 && (
            <View style={styles.serversList}>
              <Text style={styles.subtitle}>Saved Servers</Text>
              {servers.map((server) => (
                <View key={server.id} style={styles.serverItemContainer}>
                  <TouchableOpacity
                    style={[
                      styles.serverItem,
                      selectedServer === server.id && styles.selectedServer,
                    ]}
                    onPress={() => handleServerItemPress(server)}
                  >
                    <View style={styles.serverInfo}>
                      <View style={styles.serverInfoLeft}>
                        <StatusIndicator status={server.status} />
                        <Text style={styles.serverText}>{server.name || server.host}</Text>
                      </View>
                      <Text style={styles.serverUsername}>{server.username}</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => deleteServer(server.id)}
                  >
                    <Text style={styles.deleteButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  serverSwitcher: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f8f8',
  },
  serverSwitcherLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
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
    borderBottomColor: '#eee',
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    fontSize: 16,
    marginRight: 10,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
});

export default SettingsScreen; 