/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * This service is used to search for reports and dashboards stored in the persistence layer.
 */

import { inject as service } from '@ember/service';
import NaviBaseSearchProviderService from '../navi-base-search-provider';

export default class NaviReportSearchProviderService extends NaviBaseSearchProviderService {
  /**
   * @property {Ember.Service} store
   */
  @service store;

  /**
   * @property {Ember.Service} user
   */
  @service user;

  /**
   * @property {String} displayComponentName
   */
  displayComponentName = 'navi-search-result/report';

  /**
   * @method _parseQueryString – Parses string query to search parameters
   * @private
   * @param {String} query
   * @param {String} type
   * @returns {Object} query object
   */
  _parseQueryString(query, type) {
    let author = this.user.getUser().id;
    let parsedQuery = { searchParams: null, author: author };

    if (typeof query == 'string' && query) {
      if (type === 'report') {
        parsedQuery.searchParams = {
          title: query,
          request: query
        };
      } else if (type === 'dashboard') {
        parsedQuery.searchParams = {
          title: query
        };
      }
    }

    return parsedQuery;
  }

  /**
   * @method _constructSearchQuery – Constructs the query filter parameters adhering to the RSQL standard
   * @private
   * @param {Object} searchParams
   * @param {String} author
   * @param {String} type
   * @returns {Object} search query object
   */
  _constructSearchQuery(searchParams, author, type) {
    let query = { filter: { [type]: '' } };

    let paramsFilterString = '';
    if (searchParams) {
      const paramsFilter = `${Object.keys(searchParams)
        .map(p => `${p}==*${searchParams[p]}*`)
        .join(',')}`; // comma separated list of param filters
      paramsFilterString = paramsFilter ? `(${paramsFilter})` : ''; //wrap in parentheses if param filter present
    }

    let authorFilterString = '';
    if (author) {
      authorFilterString = paramsFilterString ? `;author==*${author}*` : `author==*${author}*`; //add semicolon if param filters present
    }

    query.filter[type] = `${paramsFilterString}${authorFilterString}`;

    return query;
  }

  /**
   * @method search – Searches for reports and dashboards in the persistence layer
   * @override
   * @param {String} query
   * @returns {Promise} promise with search query results
   */
  search(query) {
    const reportParsedQuery = this._parseQueryString(query, 'report');
    const dashboardParsedQuery = this._parseQueryString(query, 'dashboard');
    const reportPromise = this.store.query(
      'report',
      this._constructSearchQuery(reportParsedQuery.searchParams, reportParsedQuery.author, 'reports')
    );
    const dashboardPromise = this.store.query(
      'dashboard',
      this._constructSearchQuery(dashboardParsedQuery.searchParams, dashboardParsedQuery.author, 'dashboards')
    );
    return Promise.all([reportPromise, dashboardPromise]).then(function(values) {
      return values.flatMap(value => value.toArray());
    });
  }
}
