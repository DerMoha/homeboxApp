import {AxiosInstance} from 'axios';
import {
  ApiResponse,
  InventoryResponse,
  Item,
  Location,
  LocationResponse,
} from '../../../types';
import {logger} from '../../../utils/logger';
import {findLocationInTree, getNodeItems} from '../locationTree';
import {toBootstrapError} from '../serverErrors';
import {TreeNode} from '../types';

const noConnectionResponse = <T>(): ApiResponse<T> => ({
  success: false,
  error: 'No active server connection or authentication token',
});

const transformLocationsResponse = (
  locations: Location[],
): LocationResponse => ({
  locations,
  page: 1,
  pageSize: locations.length,
  total: locations.length,
});

export const getLocations = async (
  axiosInstance: AxiosInstance | null,
  token: string | null,
): Promise<ApiResponse<LocationResponse>> => {
  try {
    if (!axiosInstance || !token) {
      return noConnectionResponse();
    }

    const response = await axiosInstance.get('/api/v1/locations');
    return {success: true, data: transformLocationsResponse(response.data)};
  } catch (error) {
    return toBootstrapError(error as any) as ApiResponse<LocationResponse>;
  }
};

export const getLocationItems = async (
  axiosInstance: AxiosInstance | null,
  locationId: string,
): Promise<ApiResponse<InventoryResponse>> => {
  try {
    if (!axiosInstance) {
      return {success: false, error: 'No active server connection'};
    }

    const response = await axiosInstance.get('/api/v1/locations/tree');
    const locationNode = findLocationInTree(response.data, locationId);
    let items = getNodeItems(locationNode);

    if (!items.length) {
      const itemsResponse = await axiosInstance.get('/api/v1/items', {
        params: {page: 1, pageSize: 1000},
      });
      const allItems = itemsResponse.data.items || [];
      items = allItems.filter(
        (item: Item) => item.location && item.location.id === locationId,
      );
    }

    return {
      success: true,
      data: {
        items,
        page: 1,
        pageSize: items.length,
        total: items.length,
      },
    };
  } catch (error) {
    logger.error('Error getting location items', {error});
    return {success: false, error: 'Failed to get location items'};
  }
};

export const getLocationTree = async (
  axiosInstance: AxiosInstance | null,
): Promise<ApiResponse<TreeNode[]>> => {
  try {
    if (!axiosInstance) {
      return {success: false, error: 'No active server connection'};
    }

    const response = await axiosInstance.get('/api/v1/locations/tree');
    return {success: true, data: response.data};
  } catch (error) {
    logger.error('Error getting location tree', {error});
    return {success: false, error: 'Failed to get location tree'};
  }
};
