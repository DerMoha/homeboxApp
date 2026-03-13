import {useCallback} from 'react';
import {NavigationProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Item} from '../types';
import {AddItemStackParamList, RootTabParamList} from '../types/navigation';

export const usePostSaveNavigation = (
  navigation: NativeStackNavigationProp<AddItemStackParamList, 'AddItem'>,
  resetForm: () => void,
  clearImage: () => void,
) => {
  return useCallback(
    (item: Item) => {
      resetForm();
      clearImage();
      navigation.setParams({barcode: undefined, itemId: undefined});
      navigation
        .getParent<NavigationProp<RootTabParamList>>()
        ?.navigate('InventoryTab', {
          screen: 'ItemDetail',
          params: {itemId: item.id},
        });
    },
    [clearImage, navigation, resetForm],
  );
};
