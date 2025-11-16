import ServerService from '../services/serverService';

/**
 * Generates the full URL for an item's image attachment
 *
 * @param itemId - The ID of the item
 * @param imageId - The ID of the image attachment
 * @returns Full URL to the image
 *
 * @example
 * const url = getImageUrl('123', 'abc-456');
 * // Returns: "http://server.com/api/v1/items/123/attachments/abc-456"
 */
export const getImageUrl = (itemId: string, imageId: string): string => {
  const service = ServerService.getInstance();
  return `${service.getBaseUrl()}/api/v1/items/${itemId}/attachments/${imageId}`;
};

/**
 * Gets the authorization headers for authenticated requests
 * Extracts the Bearer token from the ServerService instance
 *
 * @returns Object with Authorization header
 *
 * @example
 * const headers = getAuthHeaders();
 * // Returns: { 'Authorization': 'Bearer token...' }
 *
 * // Usage with Image component:
 * <Image
 *   source={{
 *     uri: getImageUrl(itemId, imageId),
 *     headers: getAuthHeaders(),
 *   }}
 * />
 */
export const getAuthHeaders = (): Record<string, string> => {
  const service = ServerService.getInstance();
  const axiosInstance = service.getAxiosInstance();
  const token = axiosInstance?.defaults.headers.common.Authorization;

  return {
    Authorization: `Bearer ${token}`,
  };
};

/**
 * Gets the complete image source object for React Native Image component
 * Combines URL and auth headers in one convenient function
 *
 * @param itemId - The ID of the item
 * @param imageId - The ID of the image attachment
 * @returns Object with uri and headers for Image component
 *
 * @example
 * <Image source={getImageSource(item.id, item.imageId)} />
 */
export const getImageSource = (
  itemId: string,
  imageId: string
): { uri: string; headers: Record<string, string> } => {
  return {
    uri: getImageUrl(itemId, imageId),
    headers: getAuthHeaders(),
  };
};

/**
 * Formats a date string to locale date string
 *
 * @param dateString - ISO date string
 * @returns Formatted date string
 *
 * @example
 * formatDate('2024-01-15T10:30:00Z')
 * // Returns: "1/15/2024" (depending on locale)
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

/**
 * Formats a date string to locale date and time string
 *
 * @param dateString - ISO date string
 * @returns Formatted date and time string
 *
 * @example
 * formatDateTime('2024-01-15T10:30:00Z')
 * // Returns: "1/15/2024, 10:30:00 AM" (depending on locale)
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString();
};
