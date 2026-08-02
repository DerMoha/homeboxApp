import axios, {AxiosError} from 'axios';
import {ApiResponse} from '../../types';

const statusToMessage: Record<number, string> = {
  400: 'Invalid request. Please check your server settings.',
  401: 'Authentication failed. Please check your credentials.',
  403: 'Access denied.',
  404: 'Server endpoint not found. Please check your host address.',
  429: 'Too many requests. Please try again later.',
  500: 'Server error. Please try again later.',
  502: 'Server unavailable. Please try again later.',
  503: 'Server unavailable. Please try again later.',
  422: 'The server rejected the submitted data. Please check the fields and try again.',
};

const messageForStatus = (status: number, fallback: string): string =>
  statusToMessage[status] ?? fallback;

export const toBootstrapError = (error: AxiosError): ApiResponse => {
  if (error.response) {
    const genericMessage = statusToMessage[error.response.status];
    return {
      success: false,
      error: genericMessage ?? 'An unexpected server error occurred.',
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

    return error.response
      ? {
          success: false,
          error: messageForStatus(error.response.status, fallbackMessage),
        }
      : {
          success: false,
          error: `${fallbackMessage}. Please check your connection.`,
        };
  }

  return {success: false, error: 'An unexpected error occurred'};
};

export const toMutationError = (
  error: unknown,
  fallbackMessage: string,
): ApiResponse => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      return {
        success: false,
        error: messageForStatus(error.response.status, fallbackMessage),
      };
    }

    return {
      success: false,
      error: error.request
        ? `${fallbackMessage}. Please check your connection.`
        : fallbackMessage,
    };
  }

  return {
    success: false,
    error: error instanceof Error ? error.message : fallbackMessage,
  };
};
