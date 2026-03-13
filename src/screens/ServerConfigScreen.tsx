import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {useRoute, RouteProp} from '@react-navigation/native';
import {useTheme} from '../theme/ThemeContext';
import {useServerConfig} from '../hooks/useServerConfig';
import {ServerFormFields, ServerActions} from '../components/ServerConfig';
import {SettingsStackParamList} from '../navigation/types';

type ServerConfigRouteProp = RouteProp<SettingsStackParamList, 'ServerConfig'>;

const ServerConfigScreen: React.FC = () => {
  const route = useRoute<ServerConfigRouteProp>();
  const {theme} = useTheme();
  const {
    formData,
    isLoading,
    isSaving,
    servers,
    selectedServer,
    updateField,
    loadServers,
    testConnection,
    saveServer,
    deleteServer,
    selectServer,
    editServer,
    clearSelection,
  } = useServerConfig();

  useEffect(() => {
    loadServers();
    if (route.params?.server) {
      const serverService = require('../services/serverService').default;
      serverService.getInstance().initialize(route.params.server);
    }
  }, [loadServers, route.params]);

  const handleAddServer = (): void => {
    clearSelection();
  };

  const handleCancelEdit = (): void => {
    clearSelection();
  };

  const isEditingForm = selectedServer && formData.id === selectedServer;

  return (
    <ScrollView
      style={[
        styles.container,
        {backgroundColor: theme.colors.background.primary},
      ]}
      contentContainerStyle={styles.scrollViewContent}
      bounces={false}
      overScrollMode="never"
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, {color: theme.colors.text.primary}]}>
          Server Configuration
        </Text>
        <Text
          style={[styles.headerSubtitle, {color: theme.colors.text.primary}]}>
          Configure and manage your server connections
        </Text>
      </View>

      {/* Add Server Button */}
      <View
        style={[
          styles.card,
          {backgroundColor: theme.colors.background.secondary},
        ]}>
        <TouchableOpacity
          style={[
            styles.addServerButton,
            {backgroundColor: theme.colors.button.primary},
          ]}
          onPress={handleAddServer}>
          <Text
            style={[
              styles.addServerButtonText,
              {color: theme.colors.button.text},
            ]}>
            + Add Server
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add/Edit Server Form */}
      {(!selectedServer || isEditingForm) && (
        <View
          style={[
            styles.card,
            {backgroundColor: theme.colors.background.secondary},
          ]}>
          <View style={styles.editHeader}>
            <Text
              style={[styles.formTitle, {color: theme.colors.text.primary}]}>
              {isEditingForm ? 'Edit Server' : 'Add New Server'}
            </Text>
            <TouchableOpacity
              style={styles.cancelEditButton}
              onPress={handleCancelEdit}>
              <Text
                style={[
                  styles.cancelEditButtonText,
                  {color: theme.colors.text.primary},
                ]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>

          <ServerFormFields formData={formData} onUpdateField={updateField} />

          <ServerActions
            onTest={testConnection}
            onSave={saveServer}
            onDelete={
              isEditingForm ? () => deleteServer(formData.id) : undefined
            }
            isLoading={isLoading}
            isSaving={isSaving}
            canDelete={!!isEditingForm}
          />
        </View>
      )}

      {/* Saved Servers List */}
      {servers.length > 0 && (
        <View
          style={[
            styles.card,
            {backgroundColor: theme.colors.background.secondary},
          ]}>
          <Text style={[styles.formTitle, {color: theme.colors.text.primary}]}>
            Saved Servers
          </Text>
          {servers.map(server => (
            <View key={server.id} style={[styles.serverItemContainer]}>
              <TouchableOpacity
                style={[
                  styles.serverItem,
                  selectedServer === server.id && [
                    styles.selectedServerBorder,
                    {
                      borderColor: theme.colors.button.primary,
                      backgroundColor: theme.colors.button.primary + '10',
                    },
                  ],
                  {backgroundColor: theme.colors.background.primary},
                ]}
                onPress={() => selectServer(server)}>
                <View style={styles.serverContent}>
                  <View style={styles.serverInfo}>
                    <Text
                      style={[
                        styles.serverName,
                        {color: theme.colors.text.primary},
                      ]}>
                      {server.name || 'Unnamed Server'}
                    </Text>
                    <Text
                      style={[
                        styles.serverDetails,
                        {color: theme.colors.text.primary},
                      ]}>
                      {server.host} • {server.username}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
              <View style={styles.serverActions}>
                <TouchableOpacity
                  style={[
                    styles.editButton,
                    {backgroundColor: theme.colors.button.primary},
                  ]}
                  onPress={() => editServer(server)}>
                  <Text
                    style={[
                      styles.editButtonText,
                      {color: theme.colors.button.text},
                    ]}>
                    ✎
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteServer(server.id)}>
                  <Text style={styles.deleteButtonText}>×</Text>
                </TouchableOpacity>
              </View>
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
  },
  scrollViewContent: {
    flexGrow: 1,
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
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
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
  selectedServerBorder: {
    borderWidth: 2,
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
});

export default ServerConfigScreen;
