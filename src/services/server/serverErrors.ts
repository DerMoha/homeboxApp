import axios, {AxiosError} from 'axios';
import {ApiResponse} from '../../types';
import {ErrorResponse} from './types';

export const toBootstrapError = (error: AxiosError): ApiResponse => {
  if (error.response) {
    const errorData = error.response.data as ErrorResponse;
    return {
      success: false,
      error: `Server error: ${error.response.status} - ${
        errorData.message || 'Unknown error'
      }`,
    };
  }

  if (error.request) {
    return {
      success: false,
      error: 'No response from server. Please check your connection.',
    };
  }

  return {
    success: false,
    error: error.message || 'An unexpected error occurred',
  };
};

export const toAuthenticatedRequestError = <T>(
  error: unknown,
  fallbackMessage: string,
): ApiResponse<T> => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return {success: false, error: 'Authentication required'};
    }

    if (error.response?.status === 403) {
      return {success: false, error: 'Access denied'};
    }

    return {
      success: false,
      error: error.response?.data?.message || fallbackMessage,
    };
  }

  return {success: false, error: 'An unexpected error occurred'};
};

export const toMutationError = (
  error: unknown,
  fallbackMessage: string,
): ApiResponse => {
  if (axios.isAxiosError(error)) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || fallbackMessage,
    };
  }

  return {
    success: false,
    error: error instanceof Error ? error.message : fallbackMessage,
  };
};
