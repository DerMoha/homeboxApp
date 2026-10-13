import {AxiosInstance} from 'axios';
import {ApiResponse, Label} from '../../../types';
import {toBootstrapError} from '../serverErrors';
import {TagSummary} from '../types';
import {mapTagSummaryToLabel} from './entityAdapter';

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

    const response = await axiosInstance.get('/api/v1/tags');
    const tags: TagSummary[] = Array.isArray(response.data)
      ? response.data
      : [];

    return {success: true, data: tags.map(mapTagSummaryToLabel)};
  } catch (error) {
    return toBootstrapError(error as any) as ApiResponse<Label[]>;
  }
};
