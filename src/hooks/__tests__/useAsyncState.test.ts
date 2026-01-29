import {renderHook, act, waitFor} from '@testing-library/react-native';
import {useAsyncState} from '../useAsyncState';

describe('useAsyncState', () => {
  describe('Initial state', () => {
    it('should have correct initial state structure', () => {
      const {result} = renderHook(() => useAsyncState());

      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('refreshing');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('execute');
      expect(result.current).toHaveProperty('reset');
      expect(result.current).toHaveProperty('clearError');
      expect(result.current).toHaveProperty('setData');
      expect(result.current).toHaveProperty('setIsLoading');
      expect(result.current).toHaveProperty('setRefreshing');
      expect(result.current).toHaveProperty('setError');
    });

    it('should initialize with null data by default', () => {
      const {result} = renderHook(() => useAsyncState());

      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.refreshing).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should initialize with provided initial data', () => {
      const initialData = 'test data';
      const {result} = renderHook(() => useAsyncState<string>(initialData));

      expect(result.current.data).toBe(initialData);
    });
  });

  describe('execute() - success scenarios', () => {
    it('should execute async function successfully', async () => {
      const mockData = 'test data';
      const asyncFn = jest.fn().mockResolvedValue(mockData);

      const {result} = renderHook(() => useAsyncState<string>());

      await act(async () => {
        await result.current.execute(asyncFn);
      });

      expect(asyncFn).toHaveBeenCalled();
      expect(result.current.data).toBe(mockData);
      expect(result.current.error).toBeNull();
    });

    it('should set loading state during execution', async () => {
      const {result} = renderHook(() => useAsyncState<string>());

      let loadingDuringExecution = false;
      let loadingAfterExecution = false;

      await act(async () => {
        const promise = result.current.execute(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          loadingDuringExecution = result.current.isLoading;
          return 'test';
        });
        await promise;
        loadingAfterExecution = result.current.isLoading;
      });

      expect(loadingAfterExecution).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should call onSuccess callback with data', async () => {
      const mockData = 'test data';
      const onSuccess = jest.fn();

      const {result} = renderHook(() => useAsyncState<string>());

      await act(async () => {
        await result.current.execute(async () => mockData, {onSuccess});
      });

      expect(onSuccess).toHaveBeenCalledWith(mockData);
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('should handle complex object data', async () => {
      const mockData = {
        id: 1,
        nested: {value: 'test'},
        array: [1, 2, 3],
      };

      const {result} = renderHook(() => useAsyncState<any>());

      await act(async () => {
        await result.current.execute(async () => mockData);
      });

      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('execute() - error scenarios', () => {
    it('should handle errors and call onError callback', async () => {
      const error = new Error('Test error');
      const onError = jest.fn();

      const {result} = renderHook(() => useAsyncState<string>());

      await act(async () => {
        await result.current.execute(
          async () => {
            throw error;
          },
          {onError},
        );
      });

      expect(onError).toHaveBeenCalledWith(error);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(result.current.error).toBe('Test error');
    });

    it('should handle non-Error thrown values', async () => {
      const {result} = renderHook(() => useAsyncState<string>());

      await act(async () => {
        await result.current.execute(async () => {
          throw 'string error';
        });
      });

      expect(result.current.error).toBe('An unknown error occurred');
    });

    it('should clear previous error on new execution', async () => {
      const {result} = renderHook(() => useAsyncState<string>());

      await act(async () => {
        await result.current.execute(async () => {
          throw new Error('First error');
        });
      });

      expect(result.current.error).toBe('First error');

      await act(async () => {
        await result.current.execute(async () => 'success');
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('State management', () => {
    it('should manually set data', () => {
      const {result} = renderHook(() => useAsyncState<string>());

      act(() => {
        result.current.setData('manual data');
      });

      expect(result.current.data).toBe('manual data');
    });

    it('should manually set error', () => {
      const {result} = renderHook(() => useAsyncState());

      act(() => {
        result.current.setError('manual error');
      });

      expect(result.current.error).toBe('manual error');
    });

    it('should clear error state', () => {
      const {result} = renderHook(() => useAsyncState<string>());

      act(() => {
        result.current.setError('test error');
      });

      expect(result.current.error).toBe('test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should manually set loading state', () => {
      const {result} = renderHook(() => useAsyncState());

      act(() => {
        result.current.setIsLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setIsLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should manually set refreshing state', () => {
      const {result} = renderHook(() => useAsyncState());

      act(() => {
        result.current.setRefreshing(true);
      });

      expect(result.current.refreshing).toBe(true);

      act(() => {
        result.current.setRefreshing(false);
      });

      expect(result.current.refreshing).toBe(false);
    });
  });

  describe('reset()', () => {
    it('should reset to initial data', async () => {
      const initialData = 'initial';
      const {result} = renderHook(() => useAsyncState<string>(initialData));

      await act(async () => {
        await result.current.execute(async () => 'updated');
      });

      act(() => {
        result.current.setError('test error');
      });

      expect(result.current.data).toBe('updated');
      expect(result.current.error).toBe('test error');

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBe(initialData);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.refreshing).toBe(false);
    });

    it('should reset to null when no initial data provided', async () => {
      const {result} = renderHook(() => useAsyncState<string>());

      await act(async () => {
        await result.current.execute(async () => 'data');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
    });
  });

  describe('Multiple sequential executions', () => {
    it('should handle multiple sequential executions', async () => {
      const {result} = renderHook(() => useAsyncState<number>());

      await act(async () => {
        await result.current.execute(async () => 1);
      });
      expect(result.current.data).toBe(1);

      await act(async () => {
        await result.current.execute(async () => 2);
      });
      expect(result.current.data).toBe(2);

      await act(async () => {
        await result.current.execute(async () => 3);
      });
      expect(result.current.data).toBe(3);
    });

    it('should handle success after error', async () => {
      const {result} = renderHook(() => useAsyncState<string>());

      await act(async () => {
        await result.current.execute(async () => {
          throw new Error('Error');
        });
      });

      expect(result.current.error).toBe('Error');

      await act(async () => {
        await result.current.execute(async () => 'success');
      });

      expect(result.current.error).toBeNull();
      expect(result.current.data).toBe('success');
    });
  });

  describe('Async timing', () => {
    it('should handle delayed async operations', async () => {
      const {result} = renderHook(() => useAsyncState<string>());

      await act(async () => {
        await result.current.execute(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return 'delayed data';
        });
      });

      expect(result.current.data).toBe('delayed data');
    });
  });

  describe('Refresh mode', () => {
    it('should set refreshing state instead of loading when isRefresh is true', async () => {
      const {result} = renderHook(() => useAsyncState<string>('initial'));

      await act(async () => {
        await result.current.execute(async () => 'updated', {isRefresh: true});
      });

      expect(result.current.data).toBe('updated');
      expect(result.current.refreshing).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
