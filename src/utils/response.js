/**
 * Formats a successful API response
 * @param {string} message - User-facing message
 * @param {any} data - Payload data
 * @returns {object} formatted response object
 */
function success(message, data = {}) {
  return {
    success: true,
    message,
    data,
  };
}

/**
 * Formats a paginated API response (e.g. for leads list)
 * Matches the paginated shape required by the frontend leads page
 * @param {any[]} content - List of data elements
 * @param {object} paginationDetails - Pagination statistics
 * @returns {object} paginated response object
 */
function paginated(content, { page, limit, total, totalPages }) {
  // Wait, the frontend leads page expects a response of the form:
  // { content: Array, totalElements: Int, totalPages: Int, number: Int, size: Int }
  // We can return a wrapper or provide this directly in the data block
  // Let's provide BOTH standard and custom to ensure perfect compatibility:
  return {
    success: true,
    content, // for next.js frontend
    totalElements: total, // for next.js frontend
    totalPages, // for next.js frontend
    number: page, // for next.js frontend
    size: limit, // for next.js frontend
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  };
}

module.exports = {
  success,
  paginated
};
