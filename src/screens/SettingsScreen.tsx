import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ServerConfig {
  id: string;
  host: string;
  port: string;
  username: string;
  password: string; // TODO: Hide password or hash it for security
}

const SettingsScreen: React.FC = () => {
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

  const handleInputChange = (field: keyof ServerConfig, value: string): void => {
    setNewServer((prev: ServerConfig) => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Server Configuration</Text>
      
      <View style={styles.form}>
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
            <TouchableOpacity
              key={server.id}
              style={[
                styles.serverItem,
                selectedServer === server.id && styles.selectedServer,
              ]}
              onPress={() => setSelectedServer(server.id)}
            >
              <Text style={styles.serverText}>{server.host}:{server.port}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  form: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  serversList: {
    marginTop: 20,
  },
  serverItem: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 10,
  },
  selectedServer: {
    backgroundColor: '#e6f2ff',
    borderColor: '#007AFF',
  },
  serverText: {
    fontSize: 16,
  },
});

export default SettingsScreen; 