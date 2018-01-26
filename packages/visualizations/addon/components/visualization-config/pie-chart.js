/**
 * Copyright 2017, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * {{visualization-config/pie-chart
 *    request=request
 *    response=response
 *    options=chartOptions
 *    onUpdateConfig=(action 'onUpdateChartConfig')
 * }}
 */

import Ember from 'ember';
import layout from '../../templates/components/visualization-config/pie-chart';

const { get, set, copy } = Ember;

export default Ember.Component.extend({
  layout,

  /**
   * @property classNames
   */
  classNames: ['pie-chart-config'],

  actions: {
    /**
     * Method to replace the seriesConfig in visualization config object.
     *
     * @method onUpdateConfig
     * @param {Object} seriesConfig
     */
    onUpdateConfig(seriesConfig) {
      let newOptions = copy(get(this, 'options'));
      set(newOptions, 'series.config', seriesConfig);
      this.attrs.onUpdateConfig(newOptions);
    }
  }
});
