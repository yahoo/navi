/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * Description: A serializer for the metric function endpoint
 */

import EmberObject from '@ember/object';
import { RawMetricFunctionArguments, RawMetricFunctionArgument, RawMetricFunction } from './bard';
import { MetricFunctionMetadataPayload } from 'navi-data/models/metadata/metric-function';
import {
  FunctionArgumentMetadataPayload,
  INTRINSIC_VALUE_EXPRESSION
} from 'navi-data/models/metadata/function-argument';

type RawMetricFunctionEnvelope = {
  'metric-functions': {
    rows: RawMetricFunction[];
  };
};

/**
 * @param parameters - raw metric function parameters
 * @param source - data source name
 */
export function constructFunctionArguments(
  parameters: RawMetricFunctionArguments,
  source: string
): FunctionArgumentMetadataPayload[] {
  return Object.keys(parameters).map(param => {
    const paramObj: RawMetricFunctionArgument = parameters[param];
    const { type, defaultValue, values, dimensionName, description } = paramObj;

    const normalized: FunctionArgumentMetadataPayload = {
      id: param,
      name: param,
      description,
      valueType: 'TEXT',
      type: 'ref', // It will always be ref for our case because all our parameters have their valid values defined in a dimension or enum
      expression: type === 'dimension' ? `dimension:${dimensionName}` : INTRINSIC_VALUE_EXPRESSION,
      _localValues: values,
      source,
      defaultValue
    };
    return normalized;
  });
}

/**
 * @param metricFunctions - raw metric functions
 * @param source - data source name
 */
export function normalizeMetricFunctions(
  metricFunctions: RawMetricFunction[],
  source: string
): MetricFunctionMetadataPayload[] {
  return metricFunctions.map(func => {
    const { id, name, description, arguments: args } = func;
    const normalizedFunc: MetricFunctionMetadataPayload = {
      id,
      name,
      description,
      source
    };
    if (args) {
      normalizedFunc.arguments = constructFunctionArguments(args, source);
    }
    return normalizedFunc;
  });
}

export default class MetricFunctionSerializer extends EmberObject {
  /**
   * @param payload - raw metric function with envelope
   * @param source - data source name
   */
  normalize(payload: RawMetricFunctionEnvelope, source: string): MetricFunctionMetadataPayload[] | undefined {
    if (payload?.['metric-functions']?.rows) {
      return normalizeMetricFunctions(payload['metric-functions'].rows, source);
    } else {
      return undefined;
    }
  }
}