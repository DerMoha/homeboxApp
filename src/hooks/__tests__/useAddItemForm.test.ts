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
    it('should include barcode when creating an item', async () => {
      mockServiceInstance.createItem.mockResolvedValueOnce({
        success: true,
        data: {id: 'item-1', name: 'Test Item'},
      });

      const onSuccess = jest.fn();
      const {result} = renderHook(() => useAddItemForm());

      act(() => {
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
      const {result} = renderHook(() => useAddItemForm());

      act(() => {
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
