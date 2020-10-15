/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */

import { readOnly } from '@ember/object/computed';
import { set, get, computed } from '@ember/object';
import DS from 'ember-data';
import ChartVisualization from './chart-visualization';
import { validator, buildValidations } from 'ember-cp-validations';
import { METRIC_SERIES, DIMENSION_SERIES, chartTypeForRequest } from 'navi-core/utils/chart-data';

const SERIES_PATH = 'metadata.series';
const CONFIG_PATH = `${SERIES_PATH}.config`;

/**
 * @constant {Object} Validations - Validation object
 */
const Validations = buildValidations(
  {
    //Global Validations
    [`${SERIES_PATH}.type`]: validator('chart-type'),

    //Metric Series Validation
    [`${CONFIG_PATH}.metrics`]: validator('request-metrics', {
      disabled: computed('chartType', function() {
        return get(this, 'chartType') !== METRIC_SERIES;
      }),
      dependentKeys: ['model._request.metrics.@each.parameters.{}']
    }),

    //Dimension Series Validations
    [`${CONFIG_PATH}.metric`]: validator('request-metric-exist', {
      disabled: computed('chartType', function() {
        return get(this, 'chartType') !== DIMENSION_SERIES;
      }),
      dependentKeys: ['model._request.metrics.@each.parameters.{}']
    }),

    [`${CONFIG_PATH}.dimensionOrder`]: validator('request-dimension-order', {
      disabled: computed('chartType', function() {
        return get(this, 'chartType') !== DIMENSION_SERIES;
      }),
      dependentKeys: ['model._request.dimensions.[]']
    }),

    [`${CONFIG_PATH}.dimensions`]: validator(
      'length',
      { min: 1 },
      {
        disabled: computed('chartType', function() {
          return get(this, 'chartType') !== DIMENSION_SERIES;
        }),
        dependentKeys: ['model._request.dimensions.[]']
      }
    )
  },
  {
    //Global Validation Options
    chartType: computed('model._request.{dimensions.[],metrics.[],intervals.firstObject.interval}', function() {
      const request = get(this, 'request');
      return request && chartTypeForRequest(request);
    }),
    request: readOnly('model._request')
  }
);

export default ChartVisualization.extend(Validations, {
  type: DS.attr('string', { defaultValue: 'pie-chart' }),
  version: DS.attr('number', { defaultValue: 1 }),
  metadata: DS.attr({
    defaultValue: () => {
      return {
        series: {
          type: null,
          config: {}
        }
      };
    }
  }),

  /**
   * Rebuild config based on request and response
   *
   * @method rebuildConfig
   * @param {MF.Fragment} request - request model fragment
   * @param {Object} response - response object
   * @return {Object} this object
   */
  rebuildConfig(request, response) {
    this.isValidForRequest(request);

    const chartType = chartTypeForRequest(request),
      series = this.getSeriesBuilder(chartType).call(this, CONFIG_PATH, get(this, 'validations'), request, response);
    set(this, 'metadata', { series });
    return this;
  }
});
