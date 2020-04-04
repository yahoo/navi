/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * This service is used to search for definitions stored in the metadata.
 */

import { inject as service } from '@ember/service';
import NaviBaseSearchProviderService from '../navi-base-search-provider';
import { keepLatestTask } from 'ember-concurrency-decorators';

export default class NaviDefinitionSearchProviderService extends NaviBaseSearchProviderService {
  /**
   * @property {Ember.Service} metadataService
   */
  @service('bard-metadata') metadataService;

  /**
   * @property {String} _displayComponentName
   * @private
   */
  _displayComponentName = 'navi-search-result/definition';

  /**
   * @method search – Searches for definitions in the metadata
   * @param {String} query
   * @yields {Promise} promise with search results
   * @returns {Object} Object containing, component, title and data
   */
  @keepLatestTask
  *search(query) {
    const types = ['table', 'dimension', 'metric'];
    const promises = [];

    types.forEach(type => {
      promises.push(this.metadataService.findById(type, query));
    });

    const data = yield Promise.all(promises.map(p => p.catch(() => undefined)));

    return {
      component: this._displayComponentName,
      title: 'Definition',
      data: data.filter(result => result !== undefined)
    };
  }
}
