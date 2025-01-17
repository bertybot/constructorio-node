/* eslint-disable object-curly-newline, no-param-reassign */
const qs = require('qs');
const { AbortController } = require('node-abort-controller');
const helpers = require('../utils/helpers');

// Create URL from supplied parameters
function createRecommendationsUrl(podId, parameters, userParameters, options) {
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
  } = userParameters;
  let queryParams = { c: version };

  queryParams.key = apiKey;
  queryParams.i = clientId;
  queryParams.s = sessionId;

  // Validate pod identifier is provided
  if (!podId || typeof podId !== 'string') {
    throw new Error('podId is a required parameter of type string');
  }

  // Pull user segments from options
  if (segments && segments.length) {
    queryParams.us = segments;
  }

  // Pull user id from options and ensure string
  if (userId) {
    queryParams.ui = String(userId);
  }

  if (parameters) {
    const { numResults, itemIds, section, term, filters, variationsMap } = parameters;

    // Pull num results number from parameters
    if (!helpers.isNil(numResults)) {
      queryParams.num_results = numResults;
    }

    // Pull item ids from parameters
    if (itemIds) {
      queryParams.item_id = itemIds;
    }

    // Pull section from parameters
    if (section) {
      queryParams.section = section;
    }

    // Pull term from parameters
    if (term) {
      queryParams.term = term;
    }

    // Pull filters from parameters
    if (filters) {
      queryParams.filters = filters;
    }

    // Pull variations map from parameters
    if (variationsMap) {
      queryParams.variations_map = JSON.stringify(variationsMap);
    }
  }

  queryParams = helpers.cleanParams(queryParams);

  const queryString = qs.stringify(queryParams, { indices: false });

  return `${serviceUrl}/recommendations/v1/pods/${helpers.encodeURIComponentRFC3986(helpers.trimNonBreakingSpaces(podId))}?${queryString}`;
}

/**
 * Interface to recommendations related API calls
 *
 * @module recommendations
 * @inner
 * @returns {object}
 */
class Recommendations {
  constructor(options) {
    this.options = options || {};
  }

  /**
   * Get recommendations for supplied pod identifier
   *
   * @function getRecommendations
   * @param {string} podId - Pod identifier
   * @param {object} [parameters] - Additional parameters to refine results
   * @param {string|array} [parameters.itemIds] - Item ID(s) to retrieve recommendations for (strategy specific)
   * @param {number} [parameters.numResults] - The number of results to return
   * @param {string} [parameters.section] - The section to return results from
   * @param {string} [parameters.term] - The term to use to refine results (strategy specific)
   * @param {object} [parameters.filters] - Key / value mapping of filters used to refine results
   * @param {object} [parameters.variationsMap] - The variations map object to aggregate variations. Please refer to https://docs.constructor.io/rest_api/variations_mapping for details
   * @param {object} [userParameters] - Parameters relevant to the user request
   * @param {number} [userParameters.sessionId] - Session ID, utilized to personalize results
   * @param {number} [userParameters.clientId] - Client ID, utilized to personalize results
   * @param {string} [userParameters.userId] - User ID, utilized to personalize results
   * @param {string} [userParameters.segments] - User segments
   * @param {object} [userParameters.testCells] - User test cells
   * @param {string} [userParameters.userIp] - Origin user IP, from client
   * @param {string} [userParameters.userAgent] - Origin user agent, from client
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {Promise}
   * @see https://docs.constructor.io/rest_api/recommendations
   * @example
   * constructorio.recommendations.getRecommendations('t-shirt-best-sellers', {
   *     numResults: 5,
   *     filters: {
   *         size: 'medium'
   *     },
   * }, {
   *     testCells: {
   *         testName: 'cellName',
   *    },
   * });
   */
  getRecommendations(podId, parameters = {}, userParameters = {}, networkParameters = {}) {
    let requestUrl;
    const { fetch } = this.options;
    const controller = new AbortController();
    const { signal } = controller;
    const headers = {};

    parameters = parameters || {};

    try {
      requestUrl = createRecommendationsUrl(podId, parameters, userParameters, this.options);
    } catch (e) {
      return Promise.reject(e);
    }

    Object.assign(headers, helpers.combineCustomHeaders(this.options, networkParameters));

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

    // Handle network timeout if specified
    helpers.applyNetworkTimeout(this.options, networkParameters, controller);

    return fetch(requestUrl, { headers, signal }).then((response) => {
      if (response.ok) {
        return response.json();
      }

      return helpers.throwHttpErrorFromResponse(new Error(), response);
    }).then((json) => {
      // Recommendations results
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

      throw new Error('getRecommendations response data is malformed');
    });
  }

  /**
   * Get all recommendation pods
   *
   * @function getRecommendationPods
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {Promise}
   * @example
   * constructorio.recommendations.getRecommendationPods();
   */
  getRecommendationPods(networkParameters = {}) {
    const {
      apiKey,
      serviceUrl,
    } = this.options;
    const { fetch } = this.options;
    const controller = new AbortController();
    const { signal } = controller;
    const headers = {};
    const requestUrl = `${serviceUrl}/v1/recommendation_pods?key=${apiKey}`;

    Object.assign(headers, helpers.combineCustomHeaders(this.options, networkParameters));

    // Append security token as 'x-cnstrc-token' if available
    if (this.options.securityToken && typeof this.options.securityToken === 'string') {
      headers['x-cnstrc-token'] = this.options.securityToken;
    }

    // Handle network timeout if specified
    helpers.applyNetworkTimeout(this.options, networkParameters, controller);

    return fetch(requestUrl, { headers: { ...headers, ...helpers.createAuthHeader(this.options) }, signal })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }

        return helpers.throwHttpErrorFromResponse(new Error(), response);
      });
  }
}

module.exports = Recommendations;
