import {AxiosInstance} from 'axios';
import {ApiResponse, Label} from '../../../types';
import {toAuthenticatedRequestError} from '../serverErrors';
import {HOMEBOX_ENDPOINTS, HomeboxTag, mapHomeboxTag} from '../homeboxAdapter';

export const getLabels = async (
  axiosInstance: AxiosInstance | null,
  token: string | null,
): Promise<ApiResponse<Label[]>> => {
  try {
    if (!axiosInstance || !token) {
      return {
        success: false,
        error: 'No active server connection or authentication token',
      };
    }

    const response = await axiosInstance.get<HomeboxTag[]>(
      HOMEBOX_ENDPOINTS.tags,
    );
    if (!Array.isArray(response.data)) {
      return {success: false, error: 'Invalid response format from server'};
    }

    return {success: true, data: response.data.map(mapHomeboxTag)};
  } catch (error) {
    return toAuthenticatedRequestError(
      error,
      'Failed to get labels',
    ) as ApiResponse<Label[]>;
  }
};
