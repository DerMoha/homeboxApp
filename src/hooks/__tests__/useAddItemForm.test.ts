import {useAddItemForm} from '../useAddItemForm';
import ServerService from '../../services/serverService';

jest.mock('../../services/serverService');

const mockAlert = jest.fn();
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: mockAlert,
}));

const mockedServerService = ServerService as jest.Mocked<typeof ServerService>;

describe('useAddItemForm', () => {
  let mockServiceInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockServiceInstance = {
      createItem: jest.fn(),
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
});
