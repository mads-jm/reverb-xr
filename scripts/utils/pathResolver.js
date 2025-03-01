/**
 * Path resolver utility for handling both local development and production deployments
 * Provides consistent path resolution regardless of deployment environment
 */

// Determine the base URL for the application
const getBaseUrl = () => {
  // In a browser environment
  if (typeof window !== 'undefined') {
    // Get the current origin and pathname
    const { origin, pathname } = window.location;
    
    // For local development with http-server, the base is just the origin
    // For Vercel deployments, we need to include any base path
    
    // Extract the base path (everything up to the last directory)
    // This handles cases where the app is deployed to a subdirectory
    const pathParts = pathname.split('/');
    
    // If we're at the root or viewing a file directly at the root
    if (pathParts.length <= 2 || (pathParts.length === 3 && pathParts[2].includes('.'))) {
      return origin + '/';
    }
    
    // For nested paths (like /some/nested/path/index.html)
    // We consider everything up to the directory containing the current page as the base
    pathParts.pop(); // Remove the current page
    return origin + pathParts.join('/') + '/';
  }
  
  // Fallback for non-browser environments
  return '/';
};

/**
 * Resolves a relative path against the application's base URL
 * @param {string} path - The relative path to resolve
 * @returns {string} The resolved absolute path
 */
export const resolvePath = (path) => {
  // Remove leading slash if present as we'll add it in the concatenation
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Get the base URL and combine with the path
  const baseUrl = getBaseUrl();
  return `${baseUrl}${cleanPath}`;
};

/**
 * Creates an absolute URL for a resource
 * @param {string} path - The relative path to the resource
 * @returns {string} The resolved absolute URL
 */
export const resolveUrl = (path) => {
  return resolvePath(path);
};

// Export as default for convenience
export default {
  resolvePath,
  resolveUrl,
  getBaseUrl
}; 