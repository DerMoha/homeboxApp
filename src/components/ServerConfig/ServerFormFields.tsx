import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Input } from '../common';
import { ServerConfig } from '../../services/serverService';

interface ServerFormFieldsProps {
  formData: ServerConfig;
  onUpdateField: (field: keyof ServerConfig, value: string) => void;
}

export const ServerFormFields: React.FC<ServerFormFieldsProps> = ({
  formData,
  onUpdateField,
}) => {

  return (
    <View>
      <View style={styles.inputWrapper}>
        <Input
          label="Server Name"
          placeholder="My Server"
          value={formData.name || ''}
          onChangeText={(text) => onUpdateField('name', text)}
        />
      </View>

      <View style={styles.inputWrapper}>
        <Input
          label="Host"
          placeholder="localhost:8080 or 192.168.1.100:8080"
          value={formData.host}
          onChangeText={(text) => onUpdateField('host', text)}
          autoCapitalize="none"
          required
        />
      </View>

      <View style={styles.inputWrapper}>
        <Input
          label="Username"
          placeholder="admin"
          value={formData.username}
          onChangeText={(text) => onUpdateField('username', text)}
          autoCapitalize="none"
          autoCorrect={false}
          required
        />
      </View>

      <View style={styles.inputWrapper}>
        <Input
          label="Password"
          placeholder="••••••••"
          value={formData.password}
          onChangeText={(text) => onUpdateField('password', text)}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          required
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputWrapper: {
    marginBottom: 4,
  },
});
