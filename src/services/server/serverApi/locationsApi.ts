import {AxiosInstance} from 'axios';
import {ApiResponse, InventoryResponse, LocationResponse} from '../../../types';
import {toAuthenticatedRequestError} from '../serverErrors';
import {
  HOMEBOX_ENDPOINTS,
  HomeboxEntityListResponse,
  HomeboxTreeItem,
  mapHomeboxLocation,
  mapHomeboxSummary,
  mapHomeboxTree,
} from '../homeboxAdapter';
import {TreeNode} from '../types';

const noConnectionError = 'No active server connection or authentication token';

const noConnectionResponse = <T>(): ApiResponse<T> => ({
  success: false,
  error: noConnectionError,
});

export const getLocations = async (
  axiosInstance: AxiosInstance | null,
  token: string | null,
): Promise<ApiResponse<LocationResponse>> => {
  try {
    if (!axiosInstance || !token) {
      return noConnectionResponse();
    }

    const response = await axiosInstance.get<HomeboxEntityListResponse>(
      HOMEBOX_ENDPOINTS.entities,
      {
        params: {
          isLocation: true,
          page: -1,
          pageSize: -1,
        },
      },
    );

    if (!response.data || !Array.isArray(response.data.items)) {
      return {success: false, error: 'Invalid response format from server'};
    }

    const locations = response.data.items.map(mapHomeboxLocation);
    return {
      success: true,
      data: {
        locations,
        page: response.data.page ?? 1,
        pageSize: response.data.pageSize ?? locations.length,
        total: response.data.total ?? locations.length,
      },
    };
  } catch (error) {
    return toAuthenticatedRequestError(error, 'Failed to get locations');
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

    const response = await axiosInstance.get<HomeboxEntityListResponse>(
      HOMEBOX_ENDPOINTS.entities,
      {
        params: {
          isLocation: false,
          parentIds: [locationId],
          page: -1,
          pageSize: -1,
        },
        paramsSerializer: {indexes: null},
      },
    );

    if (!response.data || !Array.isArray(response.data.items)) {
      return {success: false, error: 'Invalid response format from server'};
    }

    return {
      success: true,
      data: {
        items: response.data.items.map(mapHomeboxSummary),
        page: response.data.page ?? 1,
        pageSize: response.data.pageSize ?? response.data.items.length,
        total: response.data.total ?? response.data.items.length,
      },
    };
  } catch (error) {
    return toAuthenticatedRequestError(error, 'Failed to get location items');
  }
};

export const getLocationTree = async (
  axiosInstance: AxiosInstance | null,
): Promise<ApiResponse<TreeNode[]>> => {
  try {
    if (!axiosInstance) {
      return {success: false, error: 'No active server connection'};
    }

    const response = await axiosInstance.get<HomeboxTreeItem[]>(
      HOMEBOX_ENDPOINTS.entityTree,
      {params: {withItems: false}},
    );

    if (!Array.isArray(response.data)) {
      return {success: false, error: 'Invalid response format from server'};
    }

    return {success: true, data: response.data.map(mapHomeboxTree)};
  } catch (error) {
    return toAuthenticatedRequestError(error, 'Failed to get location tree');
  }
};
