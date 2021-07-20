/* eslint-disable object-curly-newline, no-underscore-dangle */
const qs = require('qs');
const nodeFetch = require('node-fetch').default;
const helpers = require('../utils/helpers');

// Create URL from supplied query (term) and parameters
function createSearchUrl(query, parameters, userParameters, options) {
  const {
    apiKey,
    version,
    serviceUrl,
  } = options;
  const {
    sessionId,
    clientId,
    userId,
    segments,
    testCells,
  } = userParameters;
  let queryParams = { c: version };

  queryParams.key = apiKey;
  queryParams.i = clientId;
  queryParams.s = sessionId;

  // Validate query (term) is provided
  if (!query || typeof query !== 'string') {
    throw new Error('query is a required parameter of type string');
  }

  // Pull test cells from options
  if (testCells) {
    Object.keys(testCells).forEach((testCellKey) => {
      queryParams[`ef-${testCellKey}`] = testCells[testCellKey];
    });
  }

  // Pull user segments from options
  if (segments && segments.length) {
    queryParams.us = segments;
  }

  // Pull user id from options
  if (userId) {
    queryParams.ui = userId;
  }

  if (parameters) {
    const { page, resultsPerPage, filters, sortBy, sortOrder, section, collectionId, fmtOptions } = parameters;

    // Pull page from parameters
    if (!helpers.isNil(page)) {
      queryParams.page = page;
    }

    // Pull results per page from parameters
    if (!helpers.isNil(resultsPerPage)) {
      queryParams.num_results_per_page = resultsPerPage;
    }

    // Pull filters from parameters
    if (filters) {
      queryParams.filters = filters;
    }

    // Pull sort by from parameters
    if (sortBy) {
      queryParams.sort_by = sortBy;
    }

    // Pull sort order from parameters
    if (sortOrder) {
      queryParams.sort_order = sortOrder;
    }

    // Pull section from parameters
    if (section) {
      queryParams.section = section;
    }

    // Pull collection id from parameters
    if (collectionId) {
      queryParams.collection_id = collectionId;
    }

    // Pull format options from parameters
    if (fmtOptions) {
      queryParams.fmt_options = fmtOptions;
    }
  }

  queryParams._dt = Date.now();
  queryParams = helpers.cleanParams(queryParams);

  const queryString = qs.stringify(queryParams, { indices: false });

  return `${serviceUrl}/search/${encodeURIComponent(query)}?${queryString}`;
}

/**
 * Interface to search related API calls
 *
 * @module search
 * @inner
 * @returns {object}
 */
class Search {
  constructor(options) {
    this.options = options || {};
  }

  /**
   * Retrieve search results from API
   *
   * @function getSearchResults
   * @param {string} query - Term to use to perform a search
   * @param {object} [parameters] - Additional parameters to refine result set
   * @param {number} [parameters.page] - The page number of the results
   * @param {number} [parameters.resultsPerPage] - The number of results per page to return
   * @param {object} [parameters.filters] - Filters used to refine search
   * @param {string} [parameters.sortBy='relevance'] - The sort method for results
   * @param {string} [parameters.sortOrder='descending'] - The sort order for results
   * @param {object} [parameters.fmtOptions] - The format options used to refine result groups
   * @param {object} [userParameters] - Parameters relevant to the user request
   * @param {number} [userParameters.sessionId] - Session ID, utilized to personalize results
   * @param {number} [userParameters.clientId] - Client ID, utilized to personalize results
   * @param {object} [userParameters.userId] - User ID, utilized to personalize results
   * @param {string} [userParameters.segments] - User segments
   * @param {string} [userParameters.testCells] - User test cells
   * @param {string} [userParameters.userIp] - Origin user IP, from client
   * @param {string} [userParameters.userAgent] - Origin user agent, from client
   * @returns {Promise}
   * @see https://docs.constructor.io/rest-api.html#search
   */

  getSearchResults(query, parameters = {}, userParameters = {}) {
    let requestUrl;
    const fetch = (this.options && this.options.fetch) || nodeFetch;
    const headers = {};

    try {
      requestUrl = createSearchUrl(query, parameters, userParameters, this.options);
    } catch (e) {
      return Promise.reject(e);
    }

    // Append security token as 'x-cnstrc-token' if available
    if (this.options.securityToken && typeof this.options.securityToken === 'string') {
      headers['x-cnstrc-token'] = this.options.securityToken;
    }

    // Append user IP as 'X-Forwarded-For' if available
    if (userParameters.userIp && typeof userParameters.userIp === 'string') {
      headers['X-Forwarded-For'] = userParameters.userIp;
    }

    // Append user agent as 'User-Agent' if available
    if (userParameters.userAgent && typeof userParameters.userAgent === 'string') {
      headers['User-Agent'] = userParameters.userAgent;
    }

    return fetch(requestUrl, { headers }).then((response) => {
      if (response.ok) {
        return response.json();
      }

      return helpers.throwHttpErrorFromResponse(new Error(), response);
    }).then((json) => {
      // Search results
      if (json.response && json.response.results) {
        if (json.result_id) {
          json.response.results.forEach((result) => {
            // eslint-disable-next-line no-param-reassign
            result.result_id = json.result_id;
          });
        }

        return json;
      }

      // Redirect rules
      if (json.response && json.response.redirect) {
        return json;
      }

      throw new Error('getSearchResults response data is malformed');
    });
  }
}

module.exports = Search;
