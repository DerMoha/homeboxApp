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
import {EntitySummary, CreateItemResponse, EntityListResult} from '../types';
import {buildEntityUpdatePayload, mapEntityToItem} from './entityAdapter';

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

    const response = await axiosInstance.get('/api/v1/entities', {
      params: {isLocation: false, page, pageSize},
    });

    const result: EntityListResult = response.data;

    if (!result || !Array.isArray(result.items)) {
      return {success: false, error: 'Invalid response format from server'};
    }

    const items = result.items.map(mapEntityToItem);

    return {
      success: true,
      data: {
        items,
        page: result.page ?? page,
        pageSize: result.pageSize ?? pageSize,
        total: result.total ?? items.length,
      },
    };
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

    const response = await axiosInstance.get(`/api/v1/entities/${id}`);

    const entity: EntitySummary = response.data;

    if (!entity || !entity.id) {
      return {success: false, error: 'Invalid response format from server'};
    }

    return {success: true, data: mapEntityToItem(entity)};
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

    // EntityCreate does not accept insured/purchasePrice; entityTypeId is
    // omitted so the server resolves the group's default "Item" type.
    const response = await axiosInstance.post('/api/v1/entities', {
      name: item.name,
      description: item.description ?? '',
      quantity: item.quantity,
      parentId: item.locationId,
      tagIds: item.labels ?? [],
    });

    let entity: EntitySummary = response.data;

    if (item.insured || item.purchasePrice) {
      const updateResponse = await axiosInstance.put(
        `/api/v1/entities/${entity.id}`,
        buildEntityUpdatePayload(entity, {
          purchasePrice: item.purchasePrice,
          insured: item.insured,
        }),
      );
      entity = updateResponse.data;
    }

    return {success: true, data: mapEntityToItem(entity)};
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

    // PUT is a full replace: fetch current state first and merge the app's
    // changes on top so unmanaged fields (assetId, notes, etc.) survive.
    const currentResponse = await axiosInstance.get(
      `/api/v1/entities/${item.id}`,
    );
    const current: EntitySummary = currentResponse.data;

    const response = await axiosInstance.put(
      `/api/v1/entities/${item.id}`,
      buildEntityUpdatePayload(current, {
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        parentId: item.locationId,
        tagIds: item.labels,
        purchasePrice: item.purchasePrice,
        insured: item.insured,
      }),
    );

    return {success: true, data: mapEntityToItem(response.data)};
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
      path: `/api/v1/entities/${itemId}/attachments`,
    });

    const response = await axiosInstance.post(
      `/api/v1/entities/${itemId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    logger.log('Upload response received');
    return {success: true, data: mapEntityToItem(response.data)};
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

    await axiosInstance.delete(`/api/v1/entities/${itemId}`);
    return {success: true};
  } catch (error) {
    logger.error('Error deleting item', {error});
    return toMutationError(error, 'Failed to delete item');
  }
};
