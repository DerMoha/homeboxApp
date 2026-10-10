import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Input} from '../common';
import {ServerConfig} from '../../types';

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
          onChangeText={text => onUpdateField('name', text)}
          maxLength={100}
        />
      </View>

      <View style={styles.inputWrapper}>
        <Input
          label="Host"
          placeholder="https://homebox.example.com"
          value={formData.host}
          onChangeText={text => onUpdateField('host', text)}
          autoCapitalize="none"
          required
          maxLength={253}
        />
      </View>

      <View style={styles.inputWrapper}>
        <Input
          label="Username"
          placeholder="admin"
          value={formData.username}
          onChangeText={text => onUpdateField('username', text)}
          autoCapitalize="none"
          autoCorrect={false}
          required
          maxLength={100}
        />
      </View>

      <View style={styles.inputWrapper}>
        <Input
          label="Password"
          placeholder="••••••••"
          value={formData.password}
          onChangeText={text => onUpdateField('password', text)}
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
