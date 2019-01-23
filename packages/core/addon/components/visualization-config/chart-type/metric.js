/**
 * Copyright 2019, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * {{visualization-config/chart-type/metric
 *    request=request
 *    response=response
 *    seriesConfig=seriesConfig
 *    onUpdateConfig=(action 'onUpdateChartConfig')
 * }}
 */

import Ember from 'ember';
import layout from '../../../templates/components/visualization-config/chart-type/metric';
import { computedSetDiff } from 'navi-core/utils/custom-computed-properties';

const { computed, get, set, copy } = Ember;

export default Ember.Component.extend({
  layout,

  /**
   * @property {Array} classNames
   */
  classNames: ['metric-line-chart-config'],

  /**
   * @property {String} chartSeriesClass - chart series class name to be applied to the dropdown
   */
  chartSeriesClass: computed('selectedMetrics', function() {
    return `chart-series-${get(this, 'selectedMetrics.length')}`;
  }),

  /**
   * @property {Array} metrics - request metric
   */
  metrics: computed('request', function() {
    return Ember.A(get(this, 'request.metrics')).mapBy('metric');
  }),

  /**
   * @property {Array} selectedMetrics
   */
  selectedMetrics: computed('seriesConfig', function() {
    let selectedMetrics = get(this, 'seriesConfig.metrics');

    return Ember.A(get(this, 'metrics')).filter(metric => {
      return Ember.A(selectedMetrics).includes(metric.name);
    });
  }),

  /**
   * @property {Array} unselectedMetrics
   */
  unselectedMetrics: computedSetDiff('metrics', 'selectedMetrics'),

  actions: {
    /**
     * @method onUpdateMetric
     * @param {Array} selectedMetrics
     */
    onUpdateMetrics(selectedMetrics) {
      const metrics = Ember.A(selectedMetrics).mapBy('name');
      const newConfig = copy(get(this, 'seriesConfig'));
      const handleUpdateConfig = get(this, 'onUpdateConfig');

      set(newConfig, 'metrics', metrics);
      if (handleUpdateConfig) handleUpdateConfig(newConfig);
    },

    /**
     * @method onRemoveSeries
     * @param {Object} metric
     */
    onRemoveSeries(metric) {
      const selectedMetrics = Ember.A(get(this, 'selectedMetrics'));
      const updatedMetrics = Ember.A(selectedMetrics.mapBy('name')).removeObject(metric.name);
      const newConfig = copy(get(this, 'seriesConfig'));
      const handleUpdateConfig = get(this, 'onUpdateConfig');

      set(newConfig, 'metrics', updatedMetrics);
      if (handleUpdateConfig) handleUpdateConfig(newConfig);
    }
  }
});
