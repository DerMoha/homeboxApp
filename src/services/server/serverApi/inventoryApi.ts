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
import {
  HOMEBOX_ENDPOINTS,
  HomeboxEntity,
  HomeboxEntityListResponse,
  mapHomeboxEntity,
  mapHomeboxSummary,
  toHomeboxEntityCreate,
  toHomeboxEntityUpdate,
} from '../homeboxAdapter';
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

    const response = await axiosInstance.get<HomeboxEntityListResponse>(
      HOMEBOX_ENDPOINTS.entities,
      {
        params: {page, pageSize, isLocation: false},
      },
    );

    if (!response.data || !Array.isArray(response.data.items)) {
      return {success: false, error: 'Invalid response format from server'};
    }

    return {
      success: true,
      data: {
        items: response.data.items.map(mapHomeboxSummary),
        page: response.data.page ?? page,
        pageSize: response.data.pageSize ?? pageSize,
        total: response.data.total ?? response.data.items.length,
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

    const response = await axiosInstance.get<HomeboxEntity>(
      HOMEBOX_ENDPOINTS.entity(id),
    );

    if (!response.data || !response.data.id) {
      return {success: false, error: 'Invalid response format from server'};
    }

    return {success: true, data: mapHomeboxEntity(response.data)};
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

    const response = await axiosInstance.post<HomeboxEntity>(
      HOMEBOX_ENDPOINTS.entities,
      toHomeboxEntityCreate(item),
    );

    if (!response.data?.id) {
      return {
        success: false,
        uncertain: true,
        error: 'Invalid response format from server',
      };
    }

    let savedItem = mapHomeboxEntity(response.data);

    // Homebox accepts purchase/insurance/asset-id fields on update, not on
    // create. Apply them in a second request only when the caller supplied
    // values that the create contract cannot carry.
    if (item.purchasePrice || item.insured || item.barcode || item.assetId) {
      try {
        const updatePayload = toHomeboxEntityUpdate(
          {...item, id: response.data.id},
          response.data,
        );
        const updateResponse = await axiosInstance.put<HomeboxEntity>(
          HOMEBOX_ENDPOINTS.entity(response.data.id),
          updatePayload,
        );

        if (!updateResponse.data?.id) {
          return {
            success: true,
            data: savedItem,
            warning:
              'Item was created but optional fields could not be saved. Edit this item to retry.',
          };
        }

        savedItem = mapHomeboxEntity(updateResponse.data);
      } catch {
        return {
          success: true,
          data: savedItem,
          warning:
            'Item was created but optional fields could not be saved. Edit this item to retry.',
        };
      }
    }

    return {success: true, data: savedItem};
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

    // EntityUpdate is intentionally a full document update in Homebox. Read
    // first so fields that this mobile UI does not edit are not erased.
    const currentResponse = await axiosInstance.get<HomeboxEntity>(
      HOMEBOX_ENDPOINTS.entity(item.id),
    );
    if (!currentResponse.data?.id) {
      return {success: false, error: 'Invalid response format from server'};
    }

    const response = await axiosInstance.put<HomeboxEntity>(
      HOMEBOX_ENDPOINTS.entity(item.id),
      toHomeboxEntityUpdate(item, currentResponse.data),
    );

    if (!response.data?.id) {
      return {success: false, error: 'Invalid response format from server'};
    }

    return {success: true, data: mapHomeboxEntity(response.data)};
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
      path: HOMEBOX_ENDPOINTS.entityAttachments(itemId),
    });

    const response = await axiosInstance.post<HomeboxEntity>(
      HOMEBOX_ENDPOINTS.entityAttachments(itemId),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    if (!response.data?.id) {
      return {success: false, error: 'Invalid response format from server'};
    }

    logger.log('Upload response received');
    return {success: true, data: mapHomeboxEntity(response.data)};
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

    await axiosInstance.delete(HOMEBOX_ENDPOINTS.entity(itemId));
    return {success: true};
  } catch (error) {
    logger.error('Error deleting item', {error});
    return toMutationError(error, 'Failed to delete item');
  }
};
