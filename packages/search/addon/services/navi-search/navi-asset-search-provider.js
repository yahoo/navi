/**
 * Copyright 2021, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * This service is used to search for reports and dashboards stored in the persistence layer.
 */
import { inject as service } from '@ember/service';
import NaviBaseSearchProviderService from '../navi-base-search-provider';
import { task } from 'ember-concurrency';
import { pluralize } from 'ember-inflector';
import { getPartialMatchWeight } from 'navi-core/utils/search';

export default class NaviAssetSearchProviderService extends NaviBaseSearchProviderService {
  /**
   * @property {Ember.Service} store
   */
  @service store;

  /**
   * @property {Ember.Service} user
   */
  @service user;

  /**
   * @property {String} _displayComponentName
   * @private
   */
  _displayComponentName = 'navi-search-result/asset';

  /**
   * @method _parseParamsFilterString – Parses string query to search parameters
   * @private
   * @param {String} query
   * @param {String} type
   * @returns {Object} query object
   */
  _parseParamsFilterString(query, type) {
    let paramsFilterString = '';
    if (typeof query === 'string' && query) {
      if (type === 'report') {
        paramsFilterString = `(title=='*${query}*',request=='*${query}*')`;
      } else if (type === 'dashboard') {
        paramsFilterString = `(title=='*${query}*')`;
      }
    }
    return paramsFilterString;
  }

  /**
   * @method _constructSearchQuery – Constructs the query filter parameters adhering to the RSQL standard
   * The query is built to return results from the specified owner. The user's query is matched against multiple fields,
   * therefore an 'or' is used between the different parameters and finally there's an 'and' with the owner.
   * @private
   * @param {String} userQuery
   * @param {String} type
   * @returns {Object} search query object
   */
  _constructSearchQuery(userQuery, type) {
    const owner = this.user.getUser().id;
    const pluralType = pluralize(type);
    let query = { filter: { [pluralType]: '' }, page: { limit: this.resultThreshold } };

    const paramsFilterString = this._parseParamsFilterString(userQuery, type);
    const ownerFilterString = owner ? (paramsFilterString ? `;owner.id==${owner}` : `owner.id==${owner}`) : '';

    query.filter[pluralType] = `${paramsFilterString}${ownerFilterString}`;

    return query;
  }

  /**
   * @method search – Searches for reports and dashboards in the persistence layer
   * @override
   * @param {String} query
   * @yields {Promise} promise with search query results
   * @returns {Object} Object containing component, title, and data to be displayed
   */
  @task({ restartable: true })
  *search(query) {
    const types = ['report', 'dashboard'];
    const promises = [];

    types.forEach((type) => {
      promises.push(this.store.query(type, this._constructSearchQuery(query, type)));
    });

    const data = yield Promise.all(promises).then(function (values) {
      return values.flatMap((value) => value.toArray());
    });

    // sort results by best match
    return {
      component: this._displayComponentName,
      title: 'Reports & Dashboards',
      data: data.sort(
        (resultA, resultB) =>
          getPartialMatchWeight(resultA.title.toLowerCase(), query.toLowerCase()) -
          getPartialMatchWeight(resultB.title.toLowerCase(), query.toLowerCase())
      ),
    };
  }
}
