import {AxiosInstance} from 'axios';
import {
  ApiResponse,
  CreateItemRequest,
  InventoryResponse,
  Item,
  UpdateItemRequest,
} from '../../../types';
import {logger} from '../../../utils/logger';
import {toAuthenticatedRequestError, toMutationError} from '../serverErrors';
import {CreateItemResponse} from '../types';

const noConnectionError = 'No active server connection or authentication token';

export const getInventory = async (
  axiosInstance: AxiosInstance | null,
  token: string | null,
  page: number,
  pageSize: number,
): Promise<ApiResponse<InventoryResponse>> => {
  try {
    if (!axiosInstance || !token) {
      return {success: false, error: noConnectionError};
    }

    const response = await axiosInstance.get('/api/v1/items', {
      params: {page, pageSize},
    });

    if (!response.data || !Array.isArray(response.data.items)) {
      return {success: false, error: 'Invalid response format from server'};
    }

    return {success: true, data: response.data};
  } catch (error) {
    return toAuthenticatedRequestError(error, 'Failed to get inventory');
  }
};

export const getItemById = async (
  axiosInstance: AxiosInstance | null,
  token: string | null,
  id: string,
): Promise<ApiResponse<Item>> => {
  try {
    if (!axiosInstance || !token) {
      return {success: false, error: noConnectionError};
    }

    const response = await axiosInstance.get(`/api/v1/items/${id}`);

    if (!response.data || !response.data.id) {
      return {success: false, error: 'Invalid response format from server'};
    }

    return {success: true, data: response.data};
  } catch (error) {
    return toAuthenticatedRequestError(error, 'Failed to get item');
  }
};

export const createItem = async (
  axiosInstance: AxiosInstance | null,
  item: CreateItemRequest,
): Promise<CreateItemResponse> => {
  try {
    if (!axiosInstance) {
      throw new Error('No active server connection');
    }

    const response = await axiosInstance.post('/api/v1/items', item);
    return {success: true, data: response.data};
  } catch (error) {
    logger.error('Error creating item', {error});
    return toMutationError(
      error,
      'Failed to create item',
    ) as CreateItemResponse;
  }
};

export const updateItem = async (
  axiosInstance: AxiosInstance | null,
  item: UpdateItemRequest,
): Promise<CreateItemResponse> => {
  try {
    if (!axiosInstance) {
      throw new Error('No active server connection');
    }

    const {id, ...payload} = item;
    const response = await axiosInstance.put(`/api/v1/items/${id}`, payload);
    return {success: true, data: response.data};
  } catch (error) {
    logger.error('Error updating item', {error});
    return toMutationError(
      error,
      'Failed to update item',
    ) as CreateItemResponse;
  }
};

export const uploadItemImage = async (
  axiosInstance: AxiosInstance | null,
  itemId: string,
  formData: FormData,
): Promise<ApiResponse<Item>> => {
  try {
    if (!axiosInstance) {
      throw new Error('No active server connection');
    }

    logger.log('Uploading image', {
      path: `/api/v1/items/${itemId}/attachments`,
    });

    const response = await axiosInstance.post(
      `/api/v1/items/${itemId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    logger.log('Upload response received');
    return {success: true, data: response.data};
  } catch (error) {
    logger.error('Error uploading image', {error});
    return toMutationError(
      error,
      'Failed to upload image',
    ) as ApiResponse<Item>;
  }
};

export const deleteItem = async (
  axiosInstance: AxiosInstance | null,
  itemId: string,
): Promise<ApiResponse> => {
  try {
    if (!axiosInstance) {
      return {success: false, error: 'No active server connection'};
    }

    await axiosInstance.delete(`/api/v1/items/${itemId}`);
    return {success: true};
  } catch (error) {
    logger.error('Error deleting item', {error});
    return toMutationError(error, 'Failed to delete item');
  }
};
