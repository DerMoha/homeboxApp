import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import ServerService from '../services/serverService';
import {useTheme} from '../theme/ThemeContext';
import {ServerWithStatus, SettingsStackParamList} from '../navigation/types';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {logger} from '../utils/logger';
import {SectionHeader} from '../components/SectionHeader';
import {ServerConfig} from '../types';

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  SettingsStackParamList,
  'Settings'
>;

interface SettingsItemProps {
  icon: string;
  title: string;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>['theme'];
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  title,
  onPress,
  theme,
}) => (
  <TouchableOpacity
    style={[
      styles.settingsItem,
      {
        backgroundColor: theme.colors.background.secondary,
        borderColor: theme.colors.borderSubtle,
      },
      theme.shadows.sm,
    ]}
    onPress={onPress}
    activeOpacity={0.7}>
    <View style={styles.settingsItemLeft}>
      <View
        style={[
          styles.iconContainer,
          {backgroundColor: theme.colors.accent.muted},
        ]}>
        <MaterialIcons
          name={icon}
          size={20}
          color={theme.colors.accent.primary}
        />
      </View>
      <Text
        style={[
          styles.settingsItemText,
          {
            color: theme.colors.text.primary,
            fontSize: theme.typography.sizes.md,
            fontWeight: theme.typography.weights.medium,
            fontFamily: theme.typography.fonts.medium,
          },
        ]}>
        {title}
      </Text>
    </View>
    <MaterialIcons
      name="chevron-right"
      size={24}
      color={theme.colors.text.tertiary}
    />
  </TouchableOpacity>
);

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const {theme} = useTheme();
  const [servers, setServers] = useState<ServerWithStatus[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [_isCheckingStatus, _setIsCheckingStatus] = useState(false);

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

  const checkServerStatus = useCallback(
    async (server: ServerConfig): Promise<'online' | 'offline'> => {
      try {
        const serverService = ServerService.getInstance();
        const result = await serverService.testConnection(server);
        return result.success ? 'online' : 'offline';
      } catch (error) {
        return 'offline';
      }
    },
    [],
  );

  const loadServers = useCallback(async (): Promise<void> => {
    try {
      const serverService = ServerService.getInstance();
      const savedServers = await serverService.getServers();

      const serversWithStatus: ServerWithStatus[] = savedServers.map(
        server => ({
          ...server,
          status: 'checking',
        }),
      );
      setServers(serversWithStatus);

      _setIsCheckingStatus(true);
      const updatedServers = await Promise.all(
        serversWithStatus.map(async server => {
          const status = await checkServerStatus(server);
          return {...server, status};
        }),
      );
      setServers(updatedServers);
      _setIsCheckingStatus(false);

      const currentConfig = serverService.getCurrentConfig();
      if (currentConfig) {
        setSelectedServer(currentConfig.id);
      } else if (updatedServers.length > 0) {
        setSelectedServer(updatedServers[0].id);
        await serverService.initialize(updatedServers[0]);
      } else {
        setSelectedServer('');
      }
    } catch (error) {
      logger.error('Error loading servers:', {error});
    }
  }, [checkServerStatus]);

  useFocusEffect(
    React.useCallback(() => {
      loadServers();
      const serverService = ServerService.getInstance();
      const currentConfig = serverService.getCurrentConfig();
      if (currentConfig) {
        setSelectedServer(currentConfig.id);
      }
    }, [loadServers]),
  );

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  const handleServerChange = async (serverId: string): Promise<void> => {
    if (serverId === 'add_new') {
      navigation.navigate('ServerConfig', {server: undefined});
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
      logger.error('Error changing server:', {error});
      Alert.alert('Error', 'Failed to change server. Please try again.');
    }
  };

  return (
    <ScrollView
      style={[
        styles.container,
        {backgroundColor: theme.colors.background.primary},
      ]}
      contentContainerStyle={styles.contentContainer}>
      <SectionHeader title="Server" variant="withLine" />

      <View
        style={[
          styles.serverPickerCard,
          {
            backgroundColor: theme.colors.background.secondary,
            borderColor: theme.colors.borderSubtle,
          },
          theme.shadows.sm,
        ]}>
        <View style={styles.serverPickerHeader}>
          <View
            style={[
              styles.iconContainer,
              {backgroundColor: theme.colors.accent.muted},
            ]}>
            <MaterialIcons
              name="dns"
              size={20}
              color={theme.colors.accent.primary}
            />
          </View>
          <Text
            style={[
              styles.serverPickerLabel,
              {
                color: theme.colors.text.primary,
                fontSize: theme.typography.sizes.md,
                fontWeight: theme.typography.weights.medium,
                fontFamily: theme.typography.fonts.medium,
              },
            ]}>
            Active Server
          </Text>
        </View>
        <View
          style={[
            styles.pickerContainer,
            {
              backgroundColor: theme.colors.background.secondary,
              borderColor: theme.colors.borderSubtle,
              borderRadius: theme.borderRadius.md,
            },
          ]}>
          <Picker
            selectedValue={selectedServer}
            onValueChange={handleServerChange}
            style={[styles.picker, {color: theme.colors.text.primary}]}
            dropdownIconColor={theme.colors.text.secondary}>
            {servers.length > 0 ? (
              servers.map(server => (
                <Picker.Item
                  key={server.id}
                  label={server.name || server.host}
                  value={server.id}
                />
              ))
            ) : (
              <Picker.Item label="No servers configured" value="" />
            )}
            <Picker.Item label="+ Add New Server..." value="add_new" />
          </Picker>
        </View>
      </View>

      <SectionHeader title="Configuration" variant="withLine" />

      <View style={styles.settingsGroup}>
        <SettingsItem
          icon="settings-ethernet"
          title="Server Configuration"
          onPress={() =>
            navigation.navigate('ServerConfig', {server: undefined})
          }
          theme={theme}
        />
        <SettingsItem
          icon="palette"
          title="Appearance"
          onPress={() => navigation.navigate('Appearance')}
          theme={theme}
        />
      </View>

      <SectionHeader title="Preferences" variant="withLine" />

      <View style={styles.settingsGroup}>
        <SettingsItem
          icon="view-list"
          title="Inventory Display"
          onPress={() => navigation.navigate('InventorySettings')}
          theme={theme}
        />
        <SettingsItem
          icon="add-circle-outline"
          title="Add Item Fields"
          onPress={() => navigation.navigate('AddItemSettings')}
          theme={theme}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  serverPickerCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  serverPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  serverPickerLabel: {
    marginLeft: 12,
  },
  pickerContainer: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  settingsGroup: {
    gap: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsItemText: {
    marginLeft: 12,
  },
});

export default SettingsScreen;
