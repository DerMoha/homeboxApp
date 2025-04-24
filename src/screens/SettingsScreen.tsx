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
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ServerService, { ServerConfig } from '../services/serverService';

type RootStackParamList = {
  Settings: undefined;
  ServerConfig: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [servers, setServers] = useState<ServerConfig[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [isServerSettingsOpen, setIsServerSettingsOpen] = useState(false);
  const [newServer, setNewServer] = useState<ServerConfig>({
    id: Date.now().toString(),
    host: '',
    username: '',
    password: '',
  });

  useEffect(() => {
    loadServers();
  }, []);

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
  };

  const handleInputChange = (field: keyof ServerConfig, value: string): void => {
    setNewServer((prev: ServerConfig) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleServerChange = async (value: string): Promise<void> => {
    if (value === 'add_new') {
      navigation.navigate('ServerConfig');
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
        onPress={() => navigation.navigate('ServerConfig')}
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
                      <Text style={styles.serverText}>{server.host}</Text>
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
  },
  picker: {
    height: 50,
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

export default SettingsScreen; 