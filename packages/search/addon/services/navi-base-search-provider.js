/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * Base search provider service.
 */

import Service from '@ember/service';
import { assert } from '@ember/debug';

export default class NaviBaseSearchProviderService extends Service {
  /**
   * @property {number} resultThreshold
   */
  resultThreshold = 10;

  /**
   * @method search
   * @returns {Array} array of search results
   */
  search() {
    assert('Search method must be called from a subclass');
  }
}
