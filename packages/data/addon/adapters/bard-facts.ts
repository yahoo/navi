/**
 * Copyright 2021, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * Description: The adapter for the bard-facts model.
 */

import { deprecate } from '@ember/application/deprecations';
import { assert } from '@ember/debug';
import { inject as service } from '@ember/service';
import { A as array } from '@ember/array';
import { assign } from '@ember/polyfills';
import EmberObject, { getWithDefault } from '@ember/object';
import { canonicalizeMetric, getAliasedMetrics, canonicalizeAlias } from '../utils/metric';
import { configHost } from '../utils/adapter';
import NaviFactAdapter, {
  RequestV1,
  RequestOptions,
  SORT_DIRECTIONS,
  SortDirection,
  AsyncQueryResponse
} from './fact-interface';
import { AliasFn, Query } from './bard-facts-v2';

/**
 * Serializes a list of filters to a fili filter string
 * @param {Array<Filter>} filters - list of filters to be ANDed together for fili
 * @param {Filter} filter - filters object
 * @param {String} filter.dimension - dimension to be filtered on
 * @param {String} filter.field - the dimension field to filter
 * @param {String} filter.operator - the type of filter operator
 * @param {Array<String|number>} filter.values - the values to pass to the operator
 */
export function serializeFilters(filters: TODO[]): string {
  return filters
    .map(filter => {
      const { dimension, field, operator, values } = filter;
      const serializedValues = values
        .map((v: string | number) => String(v).replace(/"/g, '""')) // csv serialize " -> ""
        .map((v: string) => `"${v}"`) // wrap each "value"
        .join(','); // comma to separate

      return `${dimension}|${field}-${operator}[${serializedValues}]`;
    })
    .join(',');
}

export default class BardFactsAdapter extends EmberObject implements NaviFactAdapter {
  /**
   * @property namespace
   */
  namespace = 'v1/data';

  /**
   * @property {Service} ajax
   */
  @service ajax: TODO;

  /**
   * Builds the dimensions path for a request
   *
   * @method _buildDimensionsPath
   * @private
   * @param {Object} request
   * @return {String} dimensions path
   */
  _buildDimensionsPath(request: RequestV1, _options: RequestOptions): string {
    const dimensions = array(request.dimensions);
    return dimensions.length
      ? `/${array(dimensions.mapBy('dimension'))
          .uniq()
          .join('/')}`
      : '';
  }

  /**
   * Builds a dateTime param string for a request
   *
   * @method _buildDateTimeParam
   * @private
   * @param {Object} request
   * @return {String} dateTime param value
   */
  _buildDateTimeParam(request: RequestV1): string {
    return request.intervals
      .map((interval: { start: string; end: string }) => `${interval.start}/${interval.end}`)
      .join(',');
  }

  /**
   * Builds a metrics param string for a request
   *
   * @method _buildMetricsParam
   * @private
   * @param {Object} request
   * @return {String} metrics param value
   */
  _buildMetricsParam(request: RequestV1): string {
    return array((request.metrics || []).map(canonicalizeMetric))
      .uniq()
      .join(',');
  }

  /**
   * Builds a filters param string for a request
   *
   * @method _buildFiltersParam
   * @private
   * @param {Object} request
   * @return {String} filters param value
   */
  _buildFiltersParam(request: RequestV1): string | undefined {
    const { filters } = request;

    if (filters && filters.length) {
      // default field to 'id'
      const defaultedFilters = filters.map((filter: TODO) => ({ field: 'id', ...filter }));
      return serializeFilters(defaultedFilters);
    } else {
      return undefined;
    }
  }

  /**
   * Builds a sort param string for a request
   *
   * @method _buildSortParam
   * @private
   * @param {Object} request
   * @param {function} aliasFunction function that returns metrics from aliases
   * @return {String} sort param value
   */
  _buildSortParam(request: RequestV1, aliasFunction: AliasFn = a => a): string | undefined {
    const { sort } = request;

    if (sort && sort.length) {
      return sort
        .map((sortMetric: { metric: string; direction: SortDirection }) => {
          const metric = aliasFunction(sortMetric.metric);
          const direction = getWithDefault(sortMetric, 'direction', 'desc');

          assert(
            `'${direction}' is not a valid sort direction (${SORT_DIRECTIONS.join()})`,
            SORT_DIRECTIONS.indexOf(direction) !== -1
          );

          return `${metric}|${direction}`;
        })
        .join(',');
    } else {
      return undefined;
    }
  }

  /**
   * Builds a having param string for a request
   *
   * @method _buildHavingParam
   * @private
   * @param {Object} request
   * @param {function} aliasFunction function that returns metrics from aliases
   * @return {String} having param value
   */
  _buildHavingParam(request: RequestV1, aliasFunction: AliasFn = a => a): string | undefined {
    const { having } = request;

    if (having && having.length) {
      return having
        .map((having: { value: TODO; metric?: TODO; operator?: TODO; values?: TODO }) => {
          deprecate('Please use the property `values` instead of `value` in a `having` object', !having.value, {
            id: 'navi-data._buildHavingParam',
            until: '4.0.0'
          });

          //value is deprecated
          const { metric, operator, value, values = [] } = having;
          const valuesStr = array(values.concat(...[value]))
            .compact()
            .join(',');

          return `${aliasFunction(metric)}-${operator}[${valuesStr}]`;
        })
        .join(',');
    } else {
      return undefined;
    }
  }

  /**
   * Builds a URL path for a request
   *
   * @method _buildURLPath
   * @private
   * @param {Object} request
   * @param {Object} options - optional host options
   * @return {String} URL Path
   */
  _buildURLPath(request: RequestV1, options: RequestOptions = {}): string {
    const host = configHost(options);
    const { namespace } = this;
    const table = request.logicalTable.table;
    const timeGrain = request.logicalTable.timeGrain;
    let dimensions = this._buildDimensionsPath(request, options);

    if (request?.rollup?.columns?.length > 0 || request?.rollup?.grandTotal) {
      dimensions = `${dimensions}/__rollupMask`;
    }

    return `${host}/${namespace}/${table}/${timeGrain}${dimensions}/`;
  }

  /**
   * Builds rollup query params
   * @param {RequestV1} request
   * @return {String}
   */
  _buildRollupParam(request: RequestV1) {
    const dimensions = array(request?.rollup?.columns);
    return dimensions.length
      ? array(dimensions.mapBy('dimension'))
          .uniq()
          .join(',')
      : '';
  }

  /**
   * Builds a query object for a request
   *
   * @method _buildQuery
   * @private
   *
   * @param {Object} request
   * @param {Number} options.page - page number
   * @param {Number} options.perPage - number of results per page
   * @param {String} options.format - result format type
   * @param {Boolean} options.cache - with/without cache
   * @param {Object} options.queryParams - other params
   *
   * @return {Object} query object
   */
  _buildQuery(request: RequestV1, options: RequestOptions): Query {
    const query: Query = {};
    const aliasMap = getAliasedMetrics(request.metrics);
    const aliasFunction: AliasFn = alias => canonicalizeAlias(alias, aliasMap);
    const filters = this._buildFiltersParam(request);
    const having = this._buildHavingParam(request, aliasFunction);
    const sort = this._buildSortParam(request, aliasFunction);
    const rollup = this._buildRollupParam(request);

    query.dateTime = this._buildDateTimeParam(request);
    query.metrics = this._buildMetricsParam(request);

    if (filters) {
      query.filters = filters;
    }

    if (having) {
      query.having = having;
    }

    if (sort) {
      query.sort = sort;
    }

    if (rollup) {
      query.rollupTo = rollup;
    }

    if (request?.rollup?.grandTotal) {
      query.rollupGrandTotal = true;
    }

    //default format
    query.format = 'json';

    if (options) {
      if (options.page && options.perPage) {
        query.page = options.page;
        query.perPage = options.perPage;
      }

      if (options.format) {
        query.format = options.format;
      }

      if (options.cache === false) {
        query._cache = false;
      }

      //catch all query param and add to the query
      if (options.queryParams) {
        assign(query, options.queryParams);
      }
    }

    return query;
  }

  /**
   * Returns URL String for a request
   *
   * @method urlForFindQuery
   * @param {Object} request
   * @param {Object} [options] - options object
   * @return {String} url
   */
  urlForFindQuery(request: RequestV1, options: RequestOptions): string {
    // Decorate and translate the request
    const decoratedRequest = this._decorate(request);
    const path = this._buildURLPath(decoratedRequest, options);
    const query = this._buildQuery(decoratedRequest, options);
    const queryStr = Object.entries(query)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    return `${path}?${queryStr}`;
  }

  /**
   * @property {Ember.Service} requestDecorator
   */
  @service requestDecorator: TODO;

  /**
   * @method _decorate
   * @private
   * @param {RequestV1} request - request to decorate
   * @returns {RequestV1} decorated request
   */
  _decorate(request: RequestV1): RequestV1 {
    return this.requestDecorator.applyGlobalDecorators(request);
  }

  /**
   * @method fetchDataForRequest - Uses the url generated using the adapter to make an ajax request
   * @param {Object} request - request object
   * @param {Object} [options] - options object
   *      Ex: {
   *        page: 1,
   *        perPage: 200,
   *        clientId: 'custom id',
   *        ...
   *      }
   * @returns {Promise} - Promise with the response
   */
  fetchDataForRequest(request: RequestV1, options: RequestOptions) {
    // Decorate and translate the request
    const decoratedRequest = this._decorate(request);
    const url = this._buildURLPath(decoratedRequest, options);
    const query = this._buildQuery(decoratedRequest, options);
    let clientId = 'UI';
    let customHeaders: Dict<string> = {};
    let timeout = 600000;

    // Support custom clientid header
    if (options && options.clientId) {
      clientId = options.clientId;
    }

    // Support custom timeout
    if (options && options.timeout) {
      timeout = options.timeout;
    }

    // Support custom headers
    if (options && options.customHeaders) {
      customHeaders = options.customHeaders;
    }

    return this.ajax.request(url, {
      xhrFields: {
        withCredentials: true
      },
      beforeSend(xhr: TODO) {
        xhr.setRequestHeader('clientid', clientId);
        Object.keys(customHeaders).forEach(name => xhr.setRequestHeader(name, customHeaders[name]));
      },
      crossDomain: true,
      data: query,
      timeout: timeout
    });
  }

  asyncFetchDataForRequest(_request: RequestV1, _options: RequestOptions): Promise<AsyncQueryResponse> {
    throw new Error('Method not implemented.');
  }
}
