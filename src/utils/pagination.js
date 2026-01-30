/**
 * Pagination Utility
 * Helper functions to handle consistent pagination across the project
 */

/**
 * Get pagination parameters from request query
 * @param {Object} query - Express request query object
 * @returns {Object} - Pagination parameters { page, limit, skip }
 */
const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit) || 10)); // Max limit 100
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Format paginated response
 * @param {Array} data - The array of items for the current page
 * @param {number} total - Total count of items across all pages
 * @param {Object} params - The pagination parameters used { page, limit }
 * @param {string} key - The key to use for the data in the response (default: 'items')
 * @returns {Object} - Formatted response object
 */
const formatPaginatedResponse = (data, total, params, key = 'items') => {
  const { page, limit } = params;
  
  return {
    success: true,
    [key]: data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  getPaginationParams,
  formatPaginatedResponse,
};
