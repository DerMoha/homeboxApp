import {useEffect, useState} from 'react';
import ServerService from '../services/serverService';
import {logger} from '../utils/logger';

/**
 * Centralized hook for managing server connection initialization
 * Replaces scattered autoConnect logic across the app
 */
export const useServerConnection = () => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeConnection = async () => {
      try {
        setIsConnecting(true);
        setError(null);

        const service = ServerService.getInstance();
        const response = await service.autoConnect();

        if (response.success) {
          setIsConnected(true);
          logger.log('Server auto-connected successfully');
        } else {
          setIsConnected(false);
          setError(response.error || 'Failed to connect to server');
          logger.warn('Server auto-connect failed:', {error: response.error});
        }
      } catch (err) {
        setIsConnected(false);
        setError(err instanceof Error ? err.message : 'Unknown error');
        logger.error('Server connection error:', {error: err});
      } finally {
        setIsConnecting(false);
      }
    };

    initializeConnection();
  }, []);

  return {
    isConnecting,
    isConnected,
    error,
  };
};
