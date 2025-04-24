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
      setServers(savedServers.map(server => ({ ...server, status: 'checking' })));
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
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const serverService = ServerService.getInstance();
      const result = await serverService.testConnection(newServer);
      
      if (result.success) {
        Alert.alert('Success', 'Connection successful! Server is reachable.');
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
            onPress: () => setIsLoading(false)
          },
          {
            text: 'Save Anyway',
            onPress: () => saveServerConfig()
          }
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
      [field]: field === 'username' ? value.toLowerCase() : value
    }));
  };

  const handleServerSelect = async (server: ServerWithStatus): Promise<void> => {
    setSelectedServer(server.id);
    setNewServer(server);
    const serverService = ServerService.getInstance();
    await serverService.initialize(server);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
        contentContainerStyle={{ paddingTop: 30 }}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Server Configuration</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.text.primary }]}>Configure and manage your server connections</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
          <Text style={[styles.formTitle, { color: theme.colors.text.primary }]}>Add New Server</Text>
          
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
                    { backgroundColor: theme.colors.background.primary }
                  ]}
                  onPress={() => handleServerSelect(server)}
                >
                  <View style={styles.serverContent}>
                    <View style={styles.serverInfo}>
                      <Text style={[styles.serverName, { color: theme.colors.text.primary }]}>
                        {server.name || "Unnamed Server"}
                      </Text>
                      <Text style={[styles.serverDetails, { color: theme.colors.text.primary }]}>
                        {server.host} • {server.username}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.deleteButton, { backgroundColor: theme.colors.button.primary }]}
                  onPress={() => deleteServer(server.id)}
                >
                  <Text style={[styles.deleteButtonText, { color: theme.colors.button.text }]}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    marginLeft: 10,
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
    width: 44,
  },
  deleteButtonText: {
    fontSize: 24,
    color: '#FF3B30',
    fontWeight: 'bold',
  },
});

export default ServerConfigScreen;