import {AxiosInstance} from 'axios';
import {ApiResponse, Label, Location} from '../../../types';
import {
  HOMEBOX_ENDPOINTS,
  HomeboxEntity,
  HomeboxEntityTypeSummary,
  HomeboxTag,
  mapHomeboxLocation,
  mapHomeboxTag,
} from '../homeboxAdapter';
import {toMutationError} from '../serverErrors';

export async function createLocation(
  client: AxiosInstance | null,
  name: string,
  description = '',
  parentId: string | null = null,
): Promise<ApiResponse<Location>> {
  if (!client) {
    return {success: false, error: 'Connect to a server to create a location.'};
  }
  if (!name.trim() || name.trim().length > 255 || description.length > 1000) {
    return {
      success: false,
      error:
        'Use a name of 1–255 characters and a description of at most 1000 characters.',
    };
  }
  try {
    const types = await client.get<HomeboxEntityTypeSummary[]>(
      HOMEBOX_ENDPOINTS.entityTypes,
    );
    if (!Array.isArray(types.data)) {
      return {
        success: false,
        error: 'The server returned invalid location types.',
      };
    }
    let locationType = types.data.find(type => type.isLocation === true);
    if (!locationType) {
      const createdType = await client.post<HomeboxEntityTypeSummary>(
        HOMEBOX_ENDPOINTS.entityTypes,
        {name: 'Location', isLocation: true},
      );
      locationType = createdType.data;
    }
    if (!locationType?.id) {
      return {
        success: false,
        error: 'A location type could not be configured.',
      };
    }
    const result = await client.post<HomeboxEntity>(
      HOMEBOX_ENDPOINTS.entities,
      {
        name: name.trim(),
        description,
        parentId,
        quantity: 1,
        entityTypeId: locationType.id,
        tagIds: [],
      },
    );
    if (!result.data?.id) {
      return {
        success: false,
        uncertain: true,
        error:
          'The location save could not be confirmed. Check Locations before trying again.',
      };
    }
    return {success: true, data: mapHomeboxLocation(result.data)};
  } catch (error) {
    return toMutationError(
      error,
      'Location could not be created',
    ) as ApiResponse<Location>;
  }
}

export async function createLabel(
  client: AxiosInstance | null,
  name: string,
  description = '',
): Promise<ApiResponse<Label>> {
  if (!client) {
    return {success: false, error: 'Connect to a server to create a label.'};
  }
  if (!name.trim() || name.trim().length > 255 || description.length > 1000) {
    return {
      success: false,
      error:
        'Use a name of 1–255 characters and a description of at most 1000 characters.',
    };
  }
  try {
    const result = await client.post<HomeboxTag>(HOMEBOX_ENDPOINTS.tags, {
      name: name.trim(),
      description,
    });
    if (!result.data?.id) {
      return {
        success: false,
        uncertain: true,
        error:
          'The label save could not be confirmed. Check labels before trying again.',
      };
    }
    return {success: true, data: mapHomeboxTag(result.data)};
  } catch (error) {
    return toMutationError(
      error,
      'Label could not be created',
    ) as ApiResponse<Label>;
  }
}
