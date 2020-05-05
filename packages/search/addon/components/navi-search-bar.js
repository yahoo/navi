/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * Navi Search Bar
 */

import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { restartableTask } from 'ember-concurrency-decorators';
import { timeout } from 'ember-concurrency';

/**
 * @constant EMPTY_RESULT – Empty result object
 */
const EMPTY_RESULT = {
  title: '',
  component: 'navi-search-result/no-result'
};

/**
 * @constant ENTER_KEY
 */
const ENTER_KEY = 13;

/**
 * @constant ESCAPE_KEY
 */
const ESCAPE_KEY = 27;

/**
 * @constant DEBOUNCE_MS
 */
const DEBOUNCE_MS = 250;

export default class NaviSearchBarComponent extends Component {
  /**
   * @property {Ember.Service} searchProviderService
   */
  @service('navi-search-provider') searchProviderService;

  /**
   * @property {String} searchQuery
   */
  @tracked searchQuery = '';

  /**
   * @method onKeyUp – Perform search based on user query
   * @param {Object} dd
   * @param {Object} event
   */
  @action
  onKeyUp(dd, event) {
    // Close results window if the user deletes the query or presses escape
    if (this.searchQuery.length === 0 || event.keyCode === ESCAPE_KEY) {
      // Empty results if search query is deleted
      if (this.searchQuery.length === 0) {
        this.searchResults = [];
      }

      dd.actions.close(event);
      // Don't perform query if you press escape or delete query
      return;
    }

    // Perform search on enter press or when there's a search query
    if ((event.keyCode === ENTER_KEY && this.searchQuery.length !== 0) || this.searchQuery.length > 0) {
      dd.actions.open(event);
      this.launchQuery.perform(this.searchQuery, dd, event);
    }
  }

  /**
   * @method launchQuery – Launch search task
   * @param {String} query
   * @returns {Array} results
   */
  @restartableTask
  *launchQuery(query) {
    yield timeout(DEBOUNCE_MS);
    const results = yield this.searchProviderService.search.perform(query);
    if (results.length === 0 && query !== '') {
      return [EMPTY_RESULT];
    }
    return results;
  }
}
