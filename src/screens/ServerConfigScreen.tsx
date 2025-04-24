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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ServerService, { ServerConfig } from '../services/serverService';

type RootStackParamList = {
  Settings: undefined;
  ServerConfig: { server?: ServerConfig };
};

type ServerConfigRouteProp = RouteProp<RootStackParamList, 'ServerConfig'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ServerConfig'>;

const ServerConfigScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ServerConfigRouteProp>();
  const [servers, setServers] = useState<ServerConfig[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [newServer, setNewServer] = useState<ServerConfig>({
    id: Date.now().toString(),
    host: '',
    username: '',
    password: '',
    name: '',
  });

  useEffect(() => {
    loadServers();
    if (route.params?.server) {
      setNewServer(route.params.server);
      // Set as active server
      const serverService = ServerService.getInstance();
      serverService.initialize(route.params.server);
    }
  }, [route.params]);

  const loadServers = async (): Promise<void> => {
    try {
      const serverService = ServerService.getInstance();
      const savedServers = await serverService.getServers();
      setServers(savedServers);
      if (savedServers.length > 0) {
        setSelectedServer(savedServers[0].id);
      }
    } catch (error) {
      console.error('Error loading servers:', error);
      Alert.alert('Error', 'Failed to load server configurations');
    }
  };

  const testConnection = async (): Promise<void> => {
    if (!newServer.host || !newServer.username || !newServer.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const serverService = ServerService.getInstance();
      const result = await serverService.testConnection(newServer);
      
      if (result.success) {
        Alert.alert('Success', 'Connection successful!');
      } else {
        Alert.alert('Error', result.error || 'Failed to connect to server');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      Alert.alert('Error', 'Failed to test connection');
    } finally {
      setIsLoading(false);
    }
  };

  const saveServer = async (): Promise<void> => {
    if (!newServer.host || !newServer.username || !newServer.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const serverService = ServerService.getInstance();
      const result = await serverService.testConnection(newServer);
      
      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to connect to server');
        return;
      }

      const saved = await serverService.saveServer(newServer);
      if (saved) {
        await loadServers();
        setNewServer({
          id: Date.now().toString(),
          host: '',
          username: '',
          password: '',
          name: '',
        });
        Alert.alert('Success', 'Server configuration saved');
      } else {
        Alert.alert('Error', 'Failed to save server configuration');
      }
    } catch (error) {
      console.error('Error saving server:', error);
      Alert.alert('Error', 'Failed to save server configuration');
    } finally {
      setIsLoading(false);
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

  const handleServerSelect = async (server: ServerConfig): Promise<void> => {
    setSelectedServer(server.id);
    setNewServer(server);
    const serverService = ServerService.getInstance();
    await serverService.initialize(server);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.formTitle}>Server Configuration</Text>
        <TextInput
          style={styles.input}
          placeholder="Server Name (optional)"
          value={newServer.name}
          onChangeText={(text: string) => handleInputChange('name', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Host (e.g., localhost:8080 or 192.168.1.100:8080)"
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
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.testButton]} 
            onPress={testConnection}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Test Connection</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.saveButton]} 
            onPress={saveServer}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Server</Text>
            )}
          </TouchableOpacity>
        </View>
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
                onPress={() => handleServerSelect(server)}
              >
                <View style={styles.serverInfo}>
                  <Text style={styles.serverText}>
                    {server.name || server.host}
                  </Text>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  testButton: {
    backgroundColor: '#34C759',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  serversList: {
    marginTop: 20,
    padding: 15,
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
  serverText: {
    fontSize: 16,
    fontWeight: '500',
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

export default ServerConfigScreen; 