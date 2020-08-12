/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import EmberObject from '@ember/object';
import config from 'ember-get-config';
import { ColumnFunctionMetadataPayload } from '../../models/metadata/column-function';
import CARDINALITY_SIZES from '../../utils/enums/cardinality-sizes';
import { MetricMetadataPayload } from 'navi-data/models/metadata/metric';
import { DimensionMetadataPayload } from 'navi-data/models/metadata/dimension';
import { TimeDimensionMetadataPayload } from 'navi-data/models/metadata/time-dimension';
import NaviMetadataSerializer, { MetadataPayloadMap, EverythingMetadataPayload } from './interface';
import { assert } from '@ember/debug';
import { isNone } from '@ember/utils';
import {
  FunctionParameterMetadataPayload,
  INTRINSIC_VALUE_EXPRESSION,
  ColumnFunctionParametersValues
} from 'navi-data/models/metadata/function-parameter';

const LOAD_CARDINALITY = config.navi.searchThresholds.contains;
const MAX_LOAD_CARDINALITY = config.navi.searchThresholds.in;

export type RawEverythingPayload = {
  tables: RawTablePayload[];
  metricFunctions?: RawColumnFunction[];
};

type RawDimensionField = {
  name: string;
  description?: string;
  tags?: string[];
};

type RawColumnPayload = {
  name: string;
  description?: string;
  longName: string;
  category?: string;
};

export type RawDimensionPayload = RawColumnPayload & {
  datatype: TODO<'text' | 'date'>;
  storageStrategy?: TODO<'loaded' | 'none'>;
  cardinality: number;
  fields: RawDimensionField[];
};

export type RawMetricPayload = RawColumnPayload & {
  type: TODO<string>;
  metricFunctionId?: string;
  parameters?: RawColumnFunctionArguments;
};

export type RawColumnFunction = {
  id: string;
  name: string;
  description: string;
  arguments: RawColumnFunctionArguments;
};

export type RawColumnFunctionArguments = {
  [k: string]: RawColumnFunctionArgument;
};

export type RawColumnFunctionArgument =
  | { type: 'enum'; defaultValue?: string | null; values: ColumnFunctionParametersValues; description?: string }
  | { type: 'dimension'; defaultValue?: string | null; dimensionName: string; description?: string };

type RawTimeGrainPayload = {
  name: string;
  longName: string;
  description?: string;
  retention?: string;
  dimensions: RawDimensionPayload[];
  metrics: RawMetricPayload[];
};

export type RawTablePayload = {
  timeGrains: RawTimeGrainPayload[];
  name: string;
  longName: string;
  description?: string;
  category?: string;
};

export default class BardMetadataSerializer extends EmberObject implements NaviMetadataSerializer {
  private namespace = 'normalizer-generated';

  /**
   * Transform the bard metadata into a shape that our internal data models can use
   * @param rawPayload - object containing all metadata for a datasource
   * @param source - datasource of the payload
   * @returns normalized table object
   */
  private normalizeEverything(rawPayload: RawEverythingPayload, dataSourceName: string): EverythingMetadataPayload {
    const { tables: rawTables, metricFunctions: rawColumnFunctions } = rawPayload;

    // build dimension and metric arrays
    const metrics: { [k: string]: MetricMetadataPayload } = {};
    const dimensions: { [k: string]: DimensionMetadataPayload } = {};
    const timeDimensions: { [k: string]: TimeDimensionMetadataPayload } = {};
    const convertedToColumnFunctions: { [k: string]: ColumnFunctionMetadataPayload } = {};
    const tables = rawTables.map((table: RawTablePayload) => {
      // Reduce all columns regardless of timegrain into one object
      const allTableColumns = table.timeGrains.reduce(
        (acc, timegrain) => {
          const {
            metrics: currentMetrics,
            dimensions: currentDimensions,
            timeDimensions: currentTimeDimensions,
            tableMetricIds,
            tableDimensionIds,
            tableTimeDimensionIds
          } = acc;

          // Construct each dimension / time-dimension
          timegrain.dimensions.forEach(dimension => {
            const isTimeDimension = dimension.datatype === 'date';

            const normalize = isTimeDimension
              ? (dims: RawDimensionPayload[], dataSourceName: string) =>
                  this.normalizeTimeDimensions(table, dims, dataSourceName) // call function with table partially applied
              : this.normalizeDimensions;
            const accDimensionList = isTimeDimension ? currentTimeDimensions : currentDimensions;
            const accTableDimensionList = isTimeDimension ? tableTimeDimensionIds : tableDimensionIds;

            const [newDim] = normalize([dimension], dataSourceName);

            // Create function for selecting dimension field
            const columnFunction = this.createDimensionFieldColumnFunction(dimension, dataSourceName);
            convertedToColumnFunctions[columnFunction.id] = columnFunction;
            newDim.columnFunctionId = columnFunction.id; // attach function to dimension

            const newDimCardinality = newDim.cardinality || CARDINALITY_SIZES[2];
            if (CARDINALITY_SIZES.indexOf(newDimCardinality) > CARDINALITY_SIZES.indexOf(acc.tableCardinality)) {
              acc.tableCardinality = newDimCardinality;
            }

            accDimensionList[newDim.id] = newDim; // Add dim to all dimensions list
            accTableDimensionList.add(newDim.id); // Add dim id to table's dimensionIds/timeDimensionIds list
          });

          // Construct each metric and metric function + function parameters if necessary
          timegrain.metrics.forEach((metric: RawMetricPayload) => {
            const convertedToColumnFunction = this.getColumnFunctionFromParameters(metric, dataSourceName);
            if (convertedToColumnFunction) {
              metric.metricFunctionId = convertedToColumnFunction.id;
              convertedToColumnFunctions[convertedToColumnFunction.id] = convertedToColumnFunction;
            }

            const [newMetric] = this.normalizeMetrics([metric], dataSourceName);
            currentMetrics[newMetric.id] = newMetric; // Add metric to all metrics list
            tableMetricIds.add(newMetric.id); // Add metric id to table's metricIds list
          });

          return acc;
        },
        {
          metrics,
          dimensions,
          timeDimensions,
          tableMetricIds: new Set<string>(),
          tableDimensionIds: new Set<string>(),
          tableTimeDimensionIds: new Set<string>(),
          tableCardinality: CARDINALITY_SIZES[0] as typeof CARDINALITY_SIZES[number]
        }
      );

      // Create a dateTime timeDimension with columnFunctionId to select timeGrain
      const columnFunction = this.createTimeGrainColumnFunction(table, dataSourceName);
      const dateTime = this.createDateTime(table, dataSourceName);
      dateTime.columnFunctionId = columnFunction.id;
      convertedToColumnFunctions[columnFunction.id] = columnFunction;
      allTableColumns.timeDimensions[dateTime.id] = dateTime;
      allTableColumns.tableTimeDimensionIds.add(dateTime.id);

      return {
        id: table.name,
        name: table.longName,
        description: table.description,
        category: table.category,
        cardinality: allTableColumns.tableCardinality,
        timeGrainIds: table.timeGrains.map(grain => grain.name),
        source: dataSourceName,
        metricIds: [...allTableColumns.tableMetricIds],
        dimensionIds: [...allTableColumns.tableDimensionIds],
        timeDimensionIds: [...allTableColumns.tableTimeDimensionIds]
      };
    });

    const columnFunctions = rawColumnFunctions ? this.normalizeColumnFunctions(rawColumnFunctions, dataSourceName) : [];

    return {
      tables,
      dimensions: Object.values(dimensions),
      metrics: Object.values(metrics),
      timeDimensions: Object.values(timeDimensions),
      columnFunctions: [...columnFunctions, ...Object.values(convertedToColumnFunctions)]
    };
  }

  /**
   * Creates a column function consisting of the dimension fields
   * @param dimension - the dimension to extract fields from
   * @param dataSourceName - data source name
   */
  createDimensionFieldColumnFunction(
    dimension: RawDimensionPayload,
    dataSourceName: string
  ): ColumnFunctionMetadataPayload {
    const { fields = [] } = dimension;
    const sorted = fields.map(field => field.name).sort();
    const columnFunctionId = `${this.namespace}:dimensionField(fields=${sorted.join(',')})`;
    return {
      id: columnFunctionId,
      name: 'Dimension Field',
      source: dataSourceName,
      description: 'Dimension Field',
      _parametersPayload: [
        {
          id: 'field',
          name: 'Dimension Field',
          description: 'The field to be projected for this dimension',
          source: dataSourceName,
          type: 'ref',
          expression: INTRINSIC_VALUE_EXPRESSION,
          defaultValue: fields[0]?.name,
          _localValues: fields.map(field => ({
            id: field.name,
            description: undefined, // ignoring dimension field description for
            name: field.name
          }))
        }
      ]
    };
  }

  /**
   * Constructs a fili dateTime as a timeDimension column specific to the given table
   * @param table - the table to create a dateTime for
   * @param dataSourceName - data source name
   */
  private createDateTime(table: RawTablePayload, dataSourceName: string): TimeDimensionMetadataPayload {
    const id = `${table.name}.dateTime`;
    return {
      category: 'Date',
      description: undefined,
      fields: undefined,
      id,
      name: 'Date Time',
      source: dataSourceName,
      type: 'field',
      valueType: 'date',
      supportedGrains: table.timeGrains.map(g => ({
        id: `${id}.${g.name}`,
        expression: '',
        grain: g.name.toUpperCase()
      })),
      timeZone: 'UTC'
    };
  }

  /**
   * Creates a column function to select the time grains from a given table
   * @param table - the table to create a dateTime for
   * @param dataSourceName - data source name
   */
  private createTimeGrainColumnFunction(table: RawTablePayload, dataSourceName: string): ColumnFunctionMetadataPayload {
    const grainIds = table.timeGrains.map(g => g.name);
    const grains = grainIds.sort().join(',');
    const columnFunctionId = `${this.namespace}:timeGrain(table=${table.name};grains=${grains})`;
    let defaultValue;
    const { defaultTimeGrain } = config.navi;
    if (defaultTimeGrain && grainIds.includes(defaultTimeGrain)) {
      defaultValue = defaultTimeGrain;
    } else {
      defaultValue = grainIds[0];
    }
    return {
      id: columnFunctionId,
      name: 'Time Grain',
      source: dataSourceName,
      description: 'Time Grain',
      _parametersPayload: [
        {
          id: 'grain',
          name: 'Time Grain',
          description: 'The time grain to group dates by',
          source: dataSourceName,
          type: 'ref',
          expression: INTRINSIC_VALUE_EXPRESSION,
          defaultValue,
          _localValues: table.timeGrains.map(grain => ({
            id: grain.name,
            description: grain.description,
            name: grain.longName
          }))
        }
      ]
    };
  }

  /**
   * @param metric - raw metrics
   * @param dataSourceName - data source name
   */
  private getColumnFunctionFromParameters(
    metric: RawMetricPayload,
    dataSourceName: string
  ): ColumnFunctionMetadataPayload | null {
    const { parameters, metricFunctionId } = metric;

    //only if just `parameters` exists, since metricId take precedence
    if (parameters && !metricFunctionId) {
      const sorted = Object.keys(parameters).sort();
      const newColumnFunction: ColumnFunctionMetadataPayload = {
        id: `${this.namespace}:columnFunction(parameters=${sorted.join(',')})`,
        name: '',
        description: '',
        _parametersPayload: this.constructFunctionParameters(parameters, dataSourceName),
        source: dataSourceName
      };
      return newColumnFunction;
    }
    return null;
  }

  /**
   * @param parameters - raw function parameters
   * @param dataSourceName - data source name
   */
  private constructFunctionParameters(
    parameters: RawColumnFunctionArguments,
    dataSourceName: string
  ): FunctionParameterMetadataPayload[] {
    return Object.keys(parameters).map(paramName => {
      const param = parameters[paramName];
      const { defaultValue, description } = param;

      const normalized: FunctionParameterMetadataPayload = {
        id: paramName,
        name: paramName,
        description,
        type: 'ref', // It will always be ref for our case because all our parameters have their valid values defined in a dimension or enum
        expression: param.type === 'dimension' ? `dimension:${param.dimensionName}` : INTRINSIC_VALUE_EXPRESSION,
        _localValues: param.type === 'enum' ? param.values : undefined,
        source: dataSourceName,
        defaultValue
      };
      return normalized;
    });
  }

  /**
   * Defaults the supported grains to the day grain of the table in utc timezone
   * @param table - raw table
   * @param dimensions - raw dimensions
   * @param dataSourceName - data source name
   */
  private normalizeTimeDimensions(
    table: RawTablePayload,
    dimensions: RawDimensionPayload[],
    dataSourceName: string
  ): TimeDimensionMetadataPayload[] {
    return this.normalizeDimensions(dimensions, dataSourceName)
      .filter(d => d.valueType === 'date')
      .map(d => ({
        supportedGrains: [{ id: `${table.name}.grain.day`, expression: '', grain: 'DAY' }],
        timeZone: 'utc',
        ...d
      }));
  }

  /**
   * @param dimensions - raw dimensions
   * @param dataSourceName - data source name
   */
  private normalizeDimensions(dimensions: RawDimensionPayload[], dataSourceName: string): DimensionMetadataPayload[] {
    return dimensions.map(dimension => {
      const {
        name,
        longName,
        description,
        category,
        datatype: valueType,
        storageStrategy,
        cardinality,
        fields
      } = dimension;

      let dimCardinality: typeof CARDINALITY_SIZES[number] = CARDINALITY_SIZES[0];
      if (cardinality > MAX_LOAD_CARDINALITY) {
        dimCardinality = CARDINALITY_SIZES[2];
      } else if (cardinality > LOAD_CARDINALITY) {
        dimCardinality = CARDINALITY_SIZES[1];
      }
      return {
        id: name,
        name: longName,
        category,
        description,
        valueType,
        type: 'field',
        fields,
        cardinality: dimCardinality,
        storageStrategy: storageStrategy || null,
        source: dataSourceName,
        partialData: isNone(description)
      };
    });
  }

  /**
   * @param metrics - raw metrics
   * @param dataSourceName - data source name
   */
  private normalizeMetrics(metrics: RawMetricPayload[], dataSourceName: string): MetricMetadataPayload[] {
    return metrics.map(metric => {
      const { type: valueType, longName, name, description, category, metricFunctionId } = metric;
      return {
        id: name,
        name: longName,
        description,
        type: 'field',
        valueType,
        source: dataSourceName,
        category,
        partialData: isNone(description),
        columnFunctionId: metricFunctionId
      };
    });
  }

  /**
   * @param metricFunctions - raw metric functions
   * @param dataSourceName - data source name
   */
  private normalizeColumnFunctions(
    columnFunctions: RawColumnFunction[],
    dataSourceName: string
  ): ColumnFunctionMetadataPayload[] {
    return columnFunctions.map(func => {
      const { id, name, description, arguments: args } = func;
      const normalizedFunc: ColumnFunctionMetadataPayload = {
        id,
        name,
        description,
        source: dataSourceName
      };
      if (args) {
        normalizedFunc._parametersPayload = this.constructFunctionParameters(args, dataSourceName);
      }
      return normalizedFunc;
    });
  }

  private supportedTypes = new Set<keyof MetadataPayloadMap>(['everything', 'metric', 'dimension', 'columnFunction']);

  normalize<K extends keyof MetadataPayloadMap>(
    type: K,
    rawPayload: TODO,
    dataSourceName: string
  ): MetadataPayloadMap[K] | undefined {
    assert(
      `BardMetadataSerializer only supports normalizing types: ${[...this.supportedTypes]}`,
      this.supportedTypes.has(type)
    );

    if ('everything' === type) {
      const normalized: MetadataPayloadMap['everything'] = this.normalizeEverything(rawPayload, dataSourceName);
      return normalized as MetadataPayloadMap[K];
    }

    if ('metric' === type) {
      const normalized: MetadataPayloadMap['metric'] = this.normalizeMetrics(rawPayload, dataSourceName);
      return normalized as MetadataPayloadMap[K];
    }

    if ('dimension' === type) {
      const normalized: MetadataPayloadMap['dimension'] = this.normalizeDimensions(rawPayload, dataSourceName);
      return normalized as MetadataPayloadMap[K];
    }

    if ('columnFunction' === type) {
      const normalized: MetadataPayloadMap['columnFunction'] = this.normalizeColumnFunctions(
        rawPayload,
        dataSourceName
      );
      return normalized as MetadataPayloadMap[K];
    }
    return undefined;
  }
}
