/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * A component that displays results for reports and dashboards
 */

import Component from '@glimmer/component';
import { pluralize } from 'ember-inflector';
import { set } from '@ember/object';

export default class NaviAssetSearchResultComponent extends Component {
  /**
   * @property {Array} results
   */
  get results() {
    return this.args.data?.map(value => {
      set(value, 'route', this._getRouteFor(value));
      set(value, 'type', value.constructor?.modelName);
      set(value, 'icon', value.type === 'report' ? 'file-text' : 'bar-chart');
      return value;
    });
  }

  /**
   * @method _extractRoute – Extracts the route name of a given asset (report or dashboard)
   * @private
   * @param {Object} asset
   * @returns {String} Route
   */
  _getRouteFor(asset) {
    const type = asset?.constructor?.modelName,
      pluralType = pluralize(type);
    return `${pluralType}.${type}`;
  }
}
