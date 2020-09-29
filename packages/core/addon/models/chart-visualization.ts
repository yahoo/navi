/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import { topN, maxDataByDimensions } from 'navi-core/utils/data';
import {
  METRIC_SERIES,
  DIMENSION_SERIES,
  DATE_TIME_SERIES,
  getRequestDimensions,
  ChartType
} from 'navi-core/utils/chart-data';
import Visualization from './visualization';
import RequestFragment from 'navi-core/models/bard-request-v2/request';
import { ResponseV1 } from 'navi-data/serializers/facts/interface';
import ColumnFragment from './bard-request-v2/fragments/column';

export default class ChartVisualization extends Visualization {
  /**
   * Get a series builder based on type of chart
   *
   * @param type - type of chart series
   * @returns a series builder function
   */
  getSeriesBuilder(
    type: ChartType
  ): (config: unknown, validations: TODO, request: RequestFragment, response: ResponseV1) => Series {
    let builders = {
      [METRIC_SERIES]: this.buildMetricSeries,
      [DIMENSION_SERIES]: this.buildDimensionSeries,
      [DATE_TIME_SERIES]: this.buildDateTimeSeries
    };

    return builders[type];
  }

  private buildDimensionSeriesValues(request: RequestFragment, rows: ResponseV1['rows']): SeriesValues[] {
    const series: Record<string, SeriesValues> = {};
    const dimensions = getRequestDimensions(request);
    rows.forEach(row => {
      const values: Record<string, string | number | boolean> = {};
      const dimensionLabels: Array<string | number | boolean> = [];
      dimensions.forEach(dimension => {
        const id = row[dimension.canonicalName];
        values[dimension.cid] = id as string | number | boolean;
        dimensionLabels.push(id as string);
      });
      //Use object key to dedup dimension value combinations
      series[Object.values(values).join('|')] = {
        name: dimensionLabels.join(','),
        values
      };
    });
    return Object.values(series);
  }

  /**
   * Rebuild dimension series attributes based on request and response
   *
   * @param config - series config object
   * @param validations - validations object
   * @param request - request object
   * @param response - response object
   * @returns series config object
   */
  buildDimensionSeries(config: string, validations: unknown, request: RequestFragment, _response: ResponseV1) {
    const validationAttrs = validations.attrs;
    const currentMetric = config.metricCid;
    const currentDimension = config.dimensions;

    const isMetricValid = validationAttrs.config.metricCid.isValid;
    const areDimensionsValid = validationAttrs.config.dimensions.isValid;

    const metric = isMetricValid
      ? (request.metricColumns.find(({ cid }) => cid === currentMetric) as ColumnFragment)
      : request.metricColumns[0];

    const responseRows = topN(
      maxDataByDimensions(response.rows, dimensionOrder, metric.canonicalName),
      metric.canonicalName,
      10
    );
    const dimensions = areDimensionsValid ? currentDimension : this.buildDimensionSeriesValues(request, responseRows);

    return {
      type: DIMENSION_SERIES,
      config: {
        metricCid: metric.cid,
        dimensions: undefined // TODO bring back
      }
    };
  }

  /**
   * Rebuild metric series attributes based on request and response
   *
   * @param config - series config object
   * @param validations - validations object
   * @param request - request object
   * @param response - response object
   * @returns series config object
   */
  buildMetricSeries(_config: string, _validations: unknown, _request: RequestFragment, _response: ResponseV1) {
    return {
      type: METRIC_SERIES,
      config: {}
    };
  }

  /**
   * Rebuild date time series attributes based on request
   *
   * @param config - series config object
   * @param validations - validations object
   * @param request - request object
   * @param response - response object
   * @returns series config object
   */
  buildDateTimeSeries(_config: string, _validations: unknown, request: RequestFragment, _response: ResponseV1) {
    return {
      type: DATE_TIME_SERIES,
      config: {
        metric: request.metricColumns[0].cid,
        timeGrain: 'year'
      }
    };
  }
}
