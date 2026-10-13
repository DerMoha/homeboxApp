import {AxiosInstance} from 'axios';
import {
  ApiResponse,
  InventoryResponse,
  LocationResponse,
} from '../../../types';
import {logger} from '../../../utils/logger';
import {toBootstrapError} from '../serverErrors';
import {EntityListResult, TreeNode} from '../types';
import {
  mapEntitySummaryToLocation,
  mapEntityToItem,
} from './entityAdapter';

const noConnectionResponse = <T>(): ApiResponse<T> => ({
  success: false,
  error: 'No active server connection or authentication token',
});

export const getLocations = async (
  axiosInstance: AxiosInstance | null,
  token: string | null,
): Promise<ApiResponse<LocationResponse>> => {
  try {
    if (!axiosInstance || !token) {
      return noConnectionResponse();
    }

    const response = await axiosInstance.get('/api/v1/entities', {
      params: {isLocation: true, page: 1, pageSize: 1000, orderBy: 'name'},
    });

    const result: EntityListResult = response.data;
    const locations = (result.items ?? []).map(mapEntitySummaryToLocation);

    return {
      success: true,
      data: {
        locations,
        page: 1,
        pageSize: locations.length,
        total: result.total ?? locations.length,
      },
    };
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

    const response = await axiosInstance.get('/api/v1/entities', {
      params: {
        parentIds: locationId,
        isLocation: false,
        page: 1,
        pageSize: 1000,
      },
    });

    const result: EntityListResult = response.data;
    const items = (result.items ?? []).map(mapEntityToItem);

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

    const response = await axiosInstance.get('/api/v1/entities/tree');
    return {success: true, data: response.data};
  } catch (error) {
    logger.error('Error getting location tree', {error});
    return {success: false, error: 'Failed to get location tree'};
  }
};
