/**
 * Utility functions for handling image URLs in the trade journal app
 */

/**
 * Gets the base URL for API requests based on environment
 */
const getApiBaseUrl = (): string => {
  return process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_BASE_URL || ""
    : "";
};

/**
 * Constructs the full URL for uploaded trade images
 * In development, this uses the proxy configured in package.json
 * In production, this uses the environment variable
 *
 * @param filePath - The file path stored in the database (e.g., "images-123456.jpg")
 * @returns Full URL to the image
 */
export const getImageUrl = (filePath: string): string => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/uploads/${filePath}`;
};

/**
 * Constructs the full URL for downloaded stock chart images
 * In development, this uses the proxy configured in package.json
 * In production, this uses the environment variable
 *
 * @param filePath - The file path stored in the database (e.g., "/charts/RELIANCE_daily_121.png" or "RELIANCE_daily_121.png")
 * @returns Full URL to the chart image
 */
export const getChartImageUrl = (filePath: string): string => {
  const baseUrl = getApiBaseUrl();

  // If the filePath already starts with "/charts/", use it as is
  if (filePath.startsWith("/charts/")) {
    return `${baseUrl}${filePath}`;
  }

  // If it starts with "charts/", add the leading slash
  if (filePath.startsWith("charts/")) {
    return `${baseUrl}/${filePath}`;
  }

  // Otherwise, assume it's just the filename and add the full path
  const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
  return `${baseUrl}/charts/${cleanPath}`;
};

/**
 * Creates a fallback image URL for when an image fails to load
 */
export const getFallbackImageUrl = (): string => {
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGhJQMDKMwhqj/fAIcloxgHQqxAjIHBEgZsNA0Z4CJhh0RjNQNhMnR9";
};
