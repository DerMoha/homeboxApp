import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

interface ServerConfig {
  id: string;
  host: string;
  port: string;
  username: string;
  password: string;
}

const ServerConfigScreen: React.FC = () => {
  const navigation = useNavigation();
  const [servers, setServers] = useState<ServerConfig[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [newServer, setNewServer] = useState<ServerConfig>({
    id: Date.now().toString(),
    host: '',
    port: '',
    username: '',
    password: '',
  });

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async (): Promise<void> => {
    try {
      const savedServers = await AsyncStorage.getItem('servers');
      if (savedServers) {
        const parsedServers = JSON.parse(savedServers) as ServerConfig[];
        setServers(parsedServers);
        if (parsedServers.length > 0) {
          setSelectedServer(parsedServers[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading servers:', error);
    }
  };

  const saveServer = async (): Promise<void> => {
    if (!newServer.host || !newServer.port || !newServer.username || !newServer.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const updatedServers = [...servers, newServer];
      await AsyncStorage.setItem('servers', JSON.stringify(updatedServers));
      setServers(updatedServers);
      setSelectedServer(newServer.id);
      setNewServer({
        id: Date.now().toString(),
        host: '',
        port: '',
        username: '',
        password: '',
      });
      Alert.alert('Success', 'Server configuration saved');
    } catch (error) {
      console.error('Error saving server:', error);
      Alert.alert('Error', 'Failed to save server configuration');
    }
  };

  const deleteServer = async (serverId: string): Promise<void> => {
    try {
      const updatedServers = servers.filter(server => server.id !== serverId);
      await AsyncStorage.setItem('servers', JSON.stringify(updatedServers));
      setServers(updatedServers);
      if (selectedServer === serverId) {
        setSelectedServer(updatedServers.length > 0 ? updatedServers[0].id : '');
      }
    } catch (error) {
      console.error('Error deleting server:', error);
      Alert.alert('Error', 'Failed to delete server');
    }
  };

  const handleInputChange = (field: keyof ServerConfig, value: string): void => {
    setNewServer((prev: ServerConfig) => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <ScrollView style={styles.container}>
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
          placeholder="Port"
          value={newServer.port}
          onChangeText={(text: string) => handleInputChange('port', text)}
          keyboardType="numeric"
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
          {servers.map((server: ServerConfig) => (
            <View key={server.id} style={styles.serverItemContainer}>
              <TouchableOpacity
                style={[
                  styles.serverItem,
                  selectedServer === server.id && styles.selectedServer,
                ]}
                onPress={() => setSelectedServer(server.id)}
              >
                <View style={styles.serverInfo}>
                  <Text style={styles.serverText}>{server.host}:{server.port}</Text>
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