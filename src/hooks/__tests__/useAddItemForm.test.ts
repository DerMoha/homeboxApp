import {renderHook, act} from '@testing-library/react-native';
import {Alert} from 'react-native';
import {useAddItemForm} from '../useAddItemForm';
import ServerService from '../../services/serverService';

jest.mock('../../services/serverService');

const mockAlert = jest.fn();

const mockedServerService = ServerService as jest.Mocked<typeof ServerService>;

describe('useAddItemForm', () => {
  let mockServiceInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation((...args) => {
      mockAlert(...args);
    });

    mockServiceInstance = {
      createItem: jest.fn(),
      updateItem: jest.fn(),
      uploadItemImage: jest.fn(),
    };

    mockedServerService.getInstance = jest
      .fn()
      .mockReturnValue(mockServiceInstance);
  });

  describe('Hook structure', () => {
    it('should export useAddItemForm function', () => {
      expect(typeof useAddItemForm).toBe('function');
    });
  });

  describe('ServerService integration', () => {
    it('should have createItem method available', () => {
      const service = ServerService.getInstance();
      expect(service.createItem).toBeDefined();
    });

    it('should have uploadItemImage method available', () => {
      const service = ServerService.getInstance();
      expect(service.uploadItemImage).toBeDefined();
    });

    it('should have updateItem method available', () => {
      const service = ServerService.getInstance();
      expect(service.updateItem).toBeDefined();
    });
  });

  describe('Mock validation', () => {
    it('should mock ServerService.getInstance', () => {
      const service = ServerService.getInstance();
      expect(mockedServerService.getInstance).toHaveBeenCalled();
      expect(service).toBe(mockServiceInstance);
    });

    it('should mock createItem to return success', async () => {
      mockServiceInstance.createItem.mockResolvedValueOnce({
        success: true,
        data: {id: 'item-1', name: 'Test Item'},
      });

      const result = await mockServiceInstance.createItem({
        name: 'Test Item',
        quantity: 1,
        locationId: 'loc-1',
      });

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('item-1');
    });

    it('should mock createItem to return error', async () => {
      mockServiceInstance.createItem.mockResolvedValueOnce({
        success: false,
        error: 'Server error',
      });

      const result = await mockServiceInstance.createItem({
        name: 'Test Item',
        quantity: 1,
        locationId: 'loc-1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
    });

    it('should mock uploadItemImage to return success', async () => {
      mockServiceInstance.uploadItemImage.mockResolvedValueOnce({
        success: true,
        data: {imageId: 'img-1'},
      });

      const formData = new FormData();
      const result = await mockServiceInstance.uploadItemImage(
        'item-1',
        formData,
      );

      expect(result.success).toBe(true);
      expect(result.data.imageId).toBe('img-1');
    });

    it('should mock uploadItemImage to return error', async () => {
      mockServiceInstance.uploadItemImage.mockResolvedValueOnce({
        success: false,
        error: 'Upload failed',
      });

      const formData = new FormData();
      const result = await mockServiceInstance.uploadItemImage(
        'item-1',
        formData,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Upload failed');
    });
  });

  describe('Alert mock', () => {
    it('should have Alert.alert mocked', () => {
      expect(mockAlert).toBeDefined();
      expect(typeof mockAlert).toBe('function');
    });
  });

  describe('submitItem', () => {
    it.each([false, true])(
      'quick entry handles photo warning=%s without silently losing it',
      async warning => {
        const item = {id: 'item-1', name: 'Basement item'};
        mockServiceInstance.createItem.mockResolvedValueOnce({
          success: true,
          data: item,
        });
        mockServiceInstance.uploadItemImage.mockResolvedValueOnce({
          success: !warning,
          data: warning ? undefined : item,
        });
        const onSuccess = jest.fn();
        const {result} = await renderHook(() => useAddItemForm());
        await act(() => {
          result.current.updateFormField('name', item.name);
          result.current.setSelectedLocation({
            id: 'loc-1',
            name: 'Basement',
            description: '',
          });
        });
        await act(async () => {
          await result.current.submitItem(
            undefined,
            'file:///photo.jpg',
            {
              description: false,
              purchasePrice: false,
              insured: false,
              labels: false,
            },
            onSuccess,
            false,
          );
        });
        if (warning) {
          expect(onSuccess).not.toHaveBeenCalled();
          expect(mockAlert).toHaveBeenCalledWith(
            'Item saved with a warning',
            expect.stringContaining('image upload failed'),
            expect.any(Array),
          );
          await act(() => mockAlert.mock.calls[0][2][0].onPress());
        } else {
          expect(mockAlert).not.toHaveBeenCalled();
        }
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onSuccess).toHaveBeenCalledWith(item);
      },
    );

    it('keeps the draft when quick entry cannot save', async () => {
      mockServiceInstance.createItem.mockResolvedValueOnce({success: false});
      const onSuccess = jest.fn();
      const {result} = await renderHook(() => useAddItemForm());
      await act(() => {
        result.current.updateFormField('name', 'Keep this draft');
        result.current.setSelectedLocation({
          id: 'loc-1',
          name: 'Basement',
          description: '',
        });
      });
      await act(async () => {
        await result.current.submitItem(
          undefined,
          null,
          {
            description: false,
            purchasePrice: false,
            insured: false,
            labels: false,
          },
          onSuccess,
          false,
        );
      });
      expect(onSuccess).not.toHaveBeenCalled();
      expect(result.current.formData.name).toBe('Keep this draft');
      expect(result.current.selectedLocation?.id).toBe('loc-1');
      expect(mockAlert).toHaveBeenCalledWith('Error', expect.any(String));
    });

    it('should include barcode when creating an item', async () => {
      mockServiceInstance.createItem.mockResolvedValueOnce({
        success: true,
        data: {id: 'item-1', name: 'Test Item'},
      });

      const onSuccess = jest.fn();
      const {result} = await renderHook(() => useAddItemForm());

      await act(() => {
        result.current.updateFormField('name', 'Test Item');
        result.current.updateFormField('barcode', '123456789');
        result.current.setSelectedLocation({
          id: 'loc-1',
          name: 'Shelf',
          description: '',
        });
      });

      await act(async () => {
        await result.current.submitItem(
          undefined,
          null,
          {
            description: true,
            purchasePrice: true,
            insured: true,
            labels: true,
          },
          onSuccess,
        );
      });

      expect(mockServiceInstance.createItem).toHaveBeenCalledWith(
        expect.objectContaining({barcode: '123456789'}),
      );
      expect(mockAlert).toHaveBeenCalledWith(
        'Success',
        'Item added successfully!',
        expect.any(Array),
      );
    });

    it('should update an existing item when itemId is provided', async () => {
      const updatedItem = {id: 'item-1', name: 'Updated Item'};
      mockServiceInstance.updateItem.mockResolvedValueOnce({
        success: true,
        data: updatedItem,
      });

      const onSuccess = jest.fn();
      const {result} = await renderHook(() => useAddItemForm());

      await act(() => {
        result.current.updateFormField('name', 'Updated Item');
        result.current.setSelectedLocation({
          id: 'loc-1',
          name: 'Shelf',
          description: '',
        });
      });

      await act(async () => {
        await result.current.submitItem(
          'item-1',
          null,
          {
            description: true,
            purchasePrice: true,
            insured: true,
            labels: true,
          },
          onSuccess,
        );
      });

      expect(mockServiceInstance.updateItem).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'item-1',
          name: 'Updated Item',
        }),
      );

      const successAlert = mockAlert.mock.calls.find(
        call => call[1] === 'Item updated successfully!',
      );
      const buttons = successAlert?.[2] as Array<{onPress?: () => void}>;
      buttons[0].onPress?.();

      expect(onSuccess).toHaveBeenCalledWith(updatedItem);
    });
  });
});
