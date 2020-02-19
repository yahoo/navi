/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * This service is used to discover all the available search providers.
 */

import Service from '@ember/service';
import { getOwner } from '@ember/application';
import config from 'ember-get-config';

/* global requirejs */

export default class NaviSearchProviderService extends Service {
  /**
   * @method getProvider
   * @param name
   * @returns {Object} search provider service object
   */
  getProvider(name) {
    return getOwner(this).lookup(`service:navi-search/${name}`);
  }

  /**
   * @method all – Discovers all the search provider services
   * under the folder services/navi-search/
   * @returns {Array} array of available search provider services
   */
  all() {
    const searchProvidersRegex = new RegExp(`^(?:${config.modulePrefix}/)?services/navi-search/([a-z-]*)$`),
      searchProviderServices = Object.keys(requirejs.entries).filter(requirejsFileName =>
        searchProvidersRegex.test(requirejsFileName)
      );
    return searchProviderServices.map(providerFileName =>
      this.getProvider(searchProvidersRegex.exec(providerFileName)[1])
    );
  }

  /**
   * @method search – Uses all the discovered search providers to fetch search results
   * @param {String} query
   * @returns {Array} array of objects that contain the search results,
   * the name of the result component as well as result ordering information
   */
  async search(query) {
    const searchProviders = this.all();
    let results = [];
    for (const provider of searchProviders) {
      const data = await provider.search(query);
      if (data.length) {
        results.push({
          component: provider.displayComponentName,
          data
        });
      }
    }
    return results;
  }
}
