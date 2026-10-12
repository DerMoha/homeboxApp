import {AxiosInstance} from 'axios';
import {ApiResponse, Item, ItemAttachment} from '../../../types';
import {
  HOMEBOX_ENDPOINTS,
  HomeboxEntity,
  mapHomeboxEntity,
} from '../homeboxAdapter';
import {toMutationError} from '../serverErrors';

export async function updateAttachment(
  client: AxiosInstance | null,
  itemId: string,
  attachmentId: string,
  data: Pick<ItemAttachment, 'title' | 'primary' | 'type'>,
): Promise<ApiResponse<Item>> {
  if (!client) {
    return {success: false, error: 'Connect to update attachments.'};
  }
  try {
    const response = await client.put<HomeboxEntity>(
      HOMEBOX_ENDPOINTS.entityAttachment(itemId, attachmentId),
      data,
    );
    return response.data?.id
      ? {success: true, data: mapHomeboxEntity(response.data)}
      : {success: false, error: 'Attachment update could not be confirmed.'};
  } catch (error) {
    return toMutationError(
      error,
      'Attachment could not be updated',
    ) as ApiResponse<Item>;
  }
}
export async function deleteAttachment(
  client: AxiosInstance | null,
  itemId: string,
  attachmentId: string,
): Promise<ApiResponse> {
  if (!client) {
    return {success: false, error: 'Connect to remove attachments.'};
  }
  try {
    await client.delete(
      HOMEBOX_ENDPOINTS.entityAttachment(itemId, attachmentId),
    );
    return {success: true};
  } catch (error) {
    return toMutationError(error, 'Attachment could not be removed');
  }
}
