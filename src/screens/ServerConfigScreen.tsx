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
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ServerService, { ServerConfig } from '../services/serverService';
import { useTheme } from '../theme/ThemeContext';

type RootStackParamList = {
  Settings: undefined;
  ServerConfig: { server?: ServerConfig };
};

type ServerConfigRouteProp = RouteProp<RootStackParamList, 'ServerConfig'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ServerConfig'>;

interface ServerWithStatus extends ServerConfig {
  status: 'checking' | 'online' | 'offline';
}

const ServerConfigScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ServerConfigRouteProp>();
  const { theme } = useTheme();
  const [servers, setServers] = useState<ServerWithStatus[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAddServerVisible, setIsAddServerVisible] = useState(false);
  const [newServer, setNewServer] = useState<ServerConfig>({
    id: Date.now().toString(),
    host: '',
    username: '',
    password: '',
    name: '',
  });
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const serversWithStatus: ServerWithStatus[] = savedServers.map((server: ServerConfig) => ({
        ...server,
        status: 'checking' as const,
      }));
      setServers(serversWithStatus);

      // Check status for each server
      const updatedServers = await Promise.all(
        serversWithStatus.map(async (server: ServerWithStatus) => {
          try {
            const result = await serverService.testConnection(server);
            return {
              ...server,
              status: result.success ? 'online' as const : 'offline' as const,
            };
          } catch (error) {
            return {
              ...server,
              status: 'offline' as const,
            };
          }
        })
      );

      setServers(updatedServers);

      // Set selected server based on current config or first server
      const currentConfig = serverService.getCurrentConfig();
      if (currentConfig) {
        setSelectedServer(currentConfig.id);
      } else if (updatedServers.length > 0) {
        setSelectedServer(updatedServers[0].id);
      }
    } catch (error) {
      console.error('Error loading servers:', error);
      setError('Failed to load saved servers');
    }
  };

  const testConnection = async (): Promise<void> => {
    if (!newServer.host || !newServer.username || !newServer.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const serverService = ServerService.getInstance();
      const result = await serverService.testConnection(newServer);

      if (result.success) {
        Alert.alert('Success', 'Connection successful! Server is reachable.');
        await serverService.setLastUsedServer(newServer.id);
      } else {
        Alert.alert('Connection Failed', result.error || 'Could not connect to the server. Please check your settings.');
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
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const serverService = ServerService.getInstance();
      const result = await serverService.testConnection(newServer);

      if (!result.success) {
        Alert.alert('Connection Failed', result.error || 'Could not connect to the server. Save anyway?', [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setIsLoading(false),
          },
          {
            text: 'Save Anyway',
            onPress: () => saveServerConfig(),
          },
        ]);
        return;
      }

      await saveServerConfig();
    } catch (error) {
      console.error('Error saving server:', error);
      Alert.alert('Error', 'Failed to save server configuration');
      setIsLoading(false);
    }
  };

  const saveServerConfig = async (): Promise<void> => {
    try {
      const serverService = ServerService.getInstance();
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
        Alert.alert('Success', 'Server configuration saved successfully');
        await serverService.setLastUsedServer(newServer.id);
      } else {
        Alert.alert('Error', 'Failed to save server configuration');
      }
    } catch (error) {
      console.error('Error in saveServerConfig:', error);
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
                Alert.alert('Success', 'Server deleted successfully');
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
      [field]: field === 'username' ? value.toLowerCase() : value,
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
        setSelectedServer(server.id);
        await serverService.initialize(server);
      }
    } catch (error) {
      console.error('Error changing server:', error);
      Alert.alert('Error', 'Failed to change server. Please try again.');
    }
  };

  const handleServerSelect = async (server: ServerWithStatus): Promise<void> => {
    setSelectedServer(server.id);
    const serverService = ServerService.getInstance();
    await serverService.initialize(server);
  };

  const handleEditServer = (server: ServerWithStatus): void => {
    setSelectedServer(server.id);
    setNewServer(server);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      contentContainerStyle={{ flexGrow: 1 }}
      bounces={false}
      overScrollMode="never"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Server Configuration</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.text.primary }]}>Configure and manage your server connections</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
        <TouchableOpacity
          style={[styles.addServerButton, { backgroundColor: theme.colors.button.primary }]}
          onPress={() => {
            setSelectedServer('');
            setNewServer({
              id: Date.now().toString(),
              host: '',
              username: '',
              password: '',
              name: '',
            });
            setIsAddServerVisible(true);
          }}
        >
          <Text style={[styles.addServerButtonText, { color: theme.colors.button.text }]}>+ Add Server</Text>
        </TouchableOpacity>
      </View>

      {isAddServerVisible && (
        <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
          <View style={styles.editHeader}>
            <Text style={[styles.formTitle, { color: theme.colors.text.primary }]}>Add New Server</Text>
            <TouchableOpacity
              style={styles.cancelEditButton}
              onPress={() => {
                setIsAddServerVisible(false);
                setNewServer({
                  id: Date.now().toString(),
                  host: '',
                  username: '',
                  password: '',
                  name: '',
                });
              }}
            >
              <Text style={[styles.cancelEditButtonText, { color: theme.colors.text.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text.primary }]}>Server Name</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.background.primary,
                color: theme.colors.text.primary,
                borderColor: theme.colors.border,
              }]}
              placeholder="My Server"
              placeholderTextColor={theme.colors.text.secondary}
              value={newServer.name}
              onChangeText={(text: string) => handleInputChange('name', text)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text.primary }]}>Host <Text style={styles.requiredStar}>*</Text></Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.background.primary,
                color: theme.colors.text.primary,
                borderColor: theme.colors.border,
              }]}
              placeholder="localhost:8080 or 192.168.1.100:8080"
              placeholderTextColor={theme.colors.text.secondary}
              value={newServer.host}
              onChangeText={(text: string) => handleInputChange('host', text)}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text.primary }]}>Username <Text style={styles.requiredStar}>*</Text></Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.background.primary,
                color: theme.colors.text.primary,
                borderColor: theme.colors.border,
              }]}
              placeholder="admin"
              placeholderTextColor={theme.colors.text.secondary}
              value={newServer.username}
              onChangeText={(text: string) => handleInputChange('username', text)}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text.primary }]}>Password <Text style={styles.requiredStar}>*</Text></Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.background.primary,
                color: theme.colors.text.primary,
                borderColor: theme.colors.border,
              }]}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.text.secondary}
              value={newServer.password}
              onChangeText={(text: string) => handleInputChange('password', text)}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.button.primary }]}
              onPress={testConnection}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.button.text} size="small" />
              ) : (
                <Text style={[styles.buttonText, { color: theme.colors.button.text }]}>Test Connection</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.button.primary }]}
              onPress={saveServer}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.button.text} size="small" />
              ) : (
                <Text style={[styles.buttonText, { color: theme.colors.button.text }]}>Save Server</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {servers.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
          <Text style={[styles.formTitle, { color: theme.colors.text.primary }]}>Saved Servers</Text>
          {servers.map((server) => (
            <View key={server.id} style={[styles.serverItemContainer, { backgroundColor: theme.colors.background.secondary }]}>
              <TouchableOpacity
                style={[
                  styles.serverItem,
                  selectedServer === server.id && {
                    borderColor: theme.colors.button.primary,
                    borderWidth: 2,
                    backgroundColor: theme.colors.button.primary + '10',
                  },
                  { backgroundColor: theme.colors.background.primary },
                ]}
                onPress={() => handleServerSelect(server)}
              >
                <View style={styles.serverContent}>
                  <View style={styles.serverInfo}>
                    <Text style={[styles.serverName, { color: theme.colors.text.primary }]}>
                      {server.name || 'Unnamed Server'}
                    </Text>
                    <Text style={[styles.serverDetails, { color: theme.colors.text.primary }]}>
                      {server.host} • {server.username}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
              <View style={styles.serverActions}>
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: theme.colors.button.primary }]}
                  onPress={() => handleEditServer(server)}
                >
                  <Text style={[styles.editButtonText, { color: theme.colors.button.text }]}>✎</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteServer(server.id)}
                >
                  <Text style={styles.deleteButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {selectedServer && newServer.id === selectedServer && (
        <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
          <View style={styles.editHeader}>
            <Text style={[styles.formTitle, { color: theme.colors.text.primary }]}>Edit Server</Text>
            <TouchableOpacity
              style={styles.cancelEditButton}
              onPress={() => {
                setSelectedServer('');
                setNewServer({
                  id: Date.now().toString(),
                  host: '',
                  username: '',
                  password: '',
                  name: '',
                });
              }}
            >
              <Text style={[styles.cancelEditButtonText, { color: theme.colors.text.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text.primary }]}>Server Name</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.background.primary,
                color: theme.colors.text.primary,
                borderColor: theme.colors.border,
              }]}
              placeholder="My Server"
              placeholderTextColor={theme.colors.text.secondary}
              value={newServer.name}
              onChangeText={(text: string) => handleInputChange('name', text)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text.primary }]}>Host <Text style={styles.requiredStar}>*</Text></Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.background.primary,
                color: theme.colors.text.primary,
                borderColor: theme.colors.border,
              }]}
              placeholder="localhost:8080 or 192.168.1.100:8080"
              placeholderTextColor={theme.colors.text.secondary}
              value={newServer.host}
              onChangeText={(text: string) => handleInputChange('host', text)}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text.primary }]}>Username <Text style={styles.requiredStar}>*</Text></Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.background.primary,
                color: theme.colors.text.primary,
                borderColor: theme.colors.border,
              }]}
              placeholder="admin"
              placeholderTextColor={theme.colors.text.secondary}
              value={newServer.username}
              onChangeText={(text: string) => handleInputChange('username', text)}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text.primary }]}>Password <Text style={styles.requiredStar}>*</Text></Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.background.primary,
                color: theme.colors.text.primary,
                borderColor: theme.colors.border,
              }]}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.text.secondary}
              value={newServer.password}
              onChangeText={(text: string) => handleInputChange('password', text)}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.button.primary }]}
              onPress={testConnection}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.button.text} size="small" />
              ) : (
                <Text style={[styles.buttonText, { color: theme.colors.button.text }]}>Test Connection</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.button.primary }]}
              onPress={saveServer}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.button.text} size="small" />
              ) : (
                <Text style={[styles.buttonText, { color: theme.colors.button.text }]}>Update Server</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#FF3B30',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E1E1E1',
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  serverItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  serverItem: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
  },
  serverContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serverInfo: {
    flex: 1,
  },
  serverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  serverDetails: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 12,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
    width: 44,
  },
  deleteButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 20,
    color: '#FFFFFF',
  },
  serverActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  editButton: {
    padding: 12,
    marginRight: 10,
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
    width: 44,
  },
  editButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 20,
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cancelEditButton: {
    padding: 8,
  },
  cancelEditButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  addServerButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 8,
  },
  addServerButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ServerConfigScreen;
