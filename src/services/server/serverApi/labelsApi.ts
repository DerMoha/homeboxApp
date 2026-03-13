import {AxiosInstance} from 'axios';
import {ApiResponse, Label} from '../../../types';
import {toBootstrapError} from '../serverErrors';

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

    const response = await axiosInstance.get('/api/v1/labels');
    return {success: true, data: response.data};
  } catch (error) {
    return toBootstrapError(error as any) as ApiResponse<Label[]>;
  }
};
