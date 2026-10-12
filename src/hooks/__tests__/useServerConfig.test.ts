import {act, renderHook} from '@testing-library/react-native';
import {Alert} from 'react-native';
import {useServerConfig} from '../useServerConfig';
import ServerService from '../../services/serverService';

jest.mock('../../services/serverService');
jest.mock('../../utils/haptics', () => ({hapticNotification: jest.fn()}));

it('activates a saved server before reporting successful setup', async () => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const service = {
    testConnection: jest.fn().mockResolvedValue({success: true}),
    saveServer: jest.fn().mockResolvedValue(true),
    initialize: jest.fn().mockResolvedValue({success: true}),
    setLastUsedServer: jest.fn().mockResolvedValue(undefined),
    getServers: jest.fn().mockResolvedValue([]),
    getCurrentConfig: jest.fn().mockReturnValue(null),
  };
  (ServerService.getInstance as jest.Mock).mockReturnValue(service);
  const {result} = await renderHook(() => useServerConfig());
  await act(() => {
    result.current.updateField('host', 'https://example.com');
    result.current.updateField('username', 'user@example.com');
    result.current.updateField('password', 'test-password');
  });
  await act(async () => {
    await result.current.saveServer();
  });
  expect(service.initialize).toHaveBeenCalledWith(
    expect.objectContaining({host: 'https://example.com'}),
  );
  expect(Alert.alert).toHaveBeenCalledWith(
    'Success',
    'Server saved and connected successfully',
  );
});

it('shows authentication errors when selecting a saved server', async () => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const service = {
    initialize: jest
      .fn()
      .mockResolvedValue({success: false, error: 'Authentication failed'}),
  };
  (ServerService.getInstance as jest.Mock).mockReturnValue(service);
  const {result} = await renderHook(() => useServerConfig());
  await act(async () => {
    await result.current.selectServer({
      id: 'one',
      host: 'https://example.com',
      username: 'user',
      password: '',
      status: 'online',
    });
  });
  expect(Alert.alert).toHaveBeenCalledWith(
    'Connection Failed',
    'Authentication failed',
  );
  expect(result.current.selectedServer).toBe('');
});
