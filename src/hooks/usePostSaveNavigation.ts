import {useCallback} from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Item} from '../types';
import {RootStackParamList} from '../navigation/types';

export const usePostSaveNavigation = (
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddItem'>,
  resetForm: () => void,
  clearImage: () => void,
) => {
  return useCallback(
    (item: Item) => {
      resetForm();
      clearImage();
      navigation.goBack();
      navigation.navigate('Main', {
        screen: 'InventoryTab',
        params: {screen: 'ItemDetail', params: {itemId: item.id}},
      });
    },
    [clearImage, navigation, resetForm],
  );
};
