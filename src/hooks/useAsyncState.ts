import {useState, useCallback, useMemo} from 'react';

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  refreshing: boolean;
  error: string | null;
}

export interface UseAsyncStateReturn<T> {
  data: T | null;
  isLoading: boolean;
  refreshing: boolean;
  error: string | null;
  setData: (data: T | null) => void;
  setIsLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
  execute: (
    asyncFn: () => Promise<T>,
    options?: {
      isRefresh?: boolean;
      onSuccess?: (data: T) => void;
      onError?: (error: Error) => void;
    },
  ) => Promise<void>;
}

/**
 * Custom hook for managing async state (loading, error, data, refreshing)
 * Eliminates boilerplate code across screens that fetch data
 *
 * @param initialData - Initial data value (default: null)
 * @returns Object with data, loading states, error, and helper functions
 *
 * @example
 * const { data, isLoading, error, execute } = useAsyncState<Item[]>([]);
 *
 * useEffect(() => {
 *   execute(async () => {
 *     const response = await service.getItems();
 *     return response.data;
 *   });
 * }, []);
 */
export const useAsyncState = <T = any>(
  initialData: T | null = null,
): UseAsyncStateReturn<T> => {
  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setData(initialData);
    setIsLoading(false);
    setRefreshing(false);
    setError(null);
  }, [initialData]);

  /**
   * Execute an async function and manage loading/error states automatically
   * @param asyncFn - The async function to execute
   * @param options - Optional configuration
   *   - isRefresh: If true, sets refreshing state instead of loading
   *   - onSuccess: Callback executed on success with the data
   *   - onError: Callback executed on error
   */
  const execute = useCallback(
    async (
      asyncFn: () => Promise<T>,
      options?: {
        isRefresh?: boolean;
        onSuccess?: (data: T) => void;
        onError?: (error: Error) => void;
      },
    ): Promise<void> => {
      const {isRefresh = false, onSuccess, onError} = options || {};

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const result = await asyncFn();
        setData(result);

        if (onSuccess) {
          onSuccess(result);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);

        if (onError && err instanceof Error) {
          onError(err);
        }
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [setData, setError, setIsLoading, setRefreshing],
  );

  return useMemo(
    () => ({
      data,
      isLoading,
      refreshing,
      error,
      setData,
      setIsLoading,
      setRefreshing,
      setError,
      clearError,
      reset,
      execute,
    }),
    [data, isLoading, refreshing, error, clearError, reset, execute],
  );
};
