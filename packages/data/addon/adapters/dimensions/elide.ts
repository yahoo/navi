/**
 * Copyright 2021, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * Description: The adapter for the Elide dimension model.
 */
import EmberObject from '@ember/object';
import { getOwner } from '@ember/application';
import { assert } from '@ember/debug';
import { AsyncQueryResponse, FilterOperator, QueryStatus, RequestV2 } from '../facts/interface';
import type NaviDimensionAdapter from './interface';
import type { DimensionFilter } from './interface';
import type { ServiceOptions } from 'navi-data/services/navi-dimension';
import type ElideFactsAdapter from '../facts/elide';
import type { DimensionColumn } from 'navi-data/models/metadata/dimension';
import type ElideDimensionMetadataModel from 'navi-data/models/metadata/elide/dimension';

type EnumFilter = (values: string[], filterValues: (string | number)[]) => (string | number)[];

const enumOperators: Partial<Record<FilterOperator, EnumFilter>> = {
  in: (values, filterValues) => values.filter((value) => filterValues.includes(value)),
  eq: (values, filterValues) => values.filter((value) => filterValues[0] === value),
  contains: (values, filterValues) =>
    values.filter((value) => `${value}`.toLowerCase().includes(`${filterValues[0]}`.toLowerCase())),
};

export default class ElideDimensionAdapter extends EmberObject implements NaviDimensionAdapter {
  /**
   * The elide fact adapter that will send asyncQuery requests for the dimension values
   */
  private factAdapter: ElideFactsAdapter = getOwner(this).lookup('adapter:facts/elide');

  private formatEnumResponse(dimension: DimensionColumn, values: (string | number)[]): AsyncQueryResponse {
    const { tableId } = dimension.columnMetadata;
    const field = 'col0';
    const nodes = values.map((value) => `{"node":{"${field}":"${value}"}}`);
    const responseBody = `{"data":{"${tableId}":{"edges":[${nodes.join(',')}]}}}`;

    return {
      asyncQuery: {
        edges: [
          {
            node: {
              id: 'enum query',
              query: 'n/a - enum',
              status: QueryStatus.COMPLETE,
              result: {
                responseBody,
                httpStatus: 200,
                contentLength: 0,
                recordCount: values.length,
              },
            },
          },
        ],
      },
    };
  }

  all(dimension: DimensionColumn, options: ServiceOptions = {}): Promise<AsyncQueryResponse> {
    return this.find(dimension, [], options);
  }

  async find(
    dimension: DimensionColumn,
    predicate: DimensionFilter[] = [],
    options: ServiceOptions = {}
  ): Promise<AsyncQueryResponse> {
    const columnMetadata = dimension.columnMetadata as ElideDimensionMetadataModel;

    return columnMetadata.hasEnumValues
      ? this.findEnum(dimension, predicate, options)
      : this.findRequest(dimension, predicate, options);
  }

  private findEnum(
    dimension: DimensionColumn,
    predicate: DimensionFilter[],
    _options: ServiceOptions
  ): AsyncQueryResponse {
    const columnMetadata = dimension.columnMetadata as ElideDimensionMetadataModel;
    const { values } = columnMetadata;

    const filteredValues = predicate.reduce((values, predicate) => {
      const { operator, values: filterValues } = predicate;
      const filterFn = enumOperators[operator];
      assert(`Dimension enum filter operator is not supported: ${operator}`, filterFn);
      return filterFn(values, filterValues);
    }, values);

    return this.formatEnumResponse(dimension, filteredValues);
  }

  private findRequest(
    dimension: DimensionColumn,
    predicate: DimensionFilter[] = [],
    options: ServiceOptions = {}
  ): Promise<AsyncQueryResponse> {
    const { columnMetadata, parameters = {} } = dimension;
    const lookupMetadata = (columnMetadata as ElideDimensionMetadataModel).lookupColumn;
    const { id, source, tableId } = lookupMetadata;

    // Create a request with only one dimension and its appropriate filters
    const request: RequestV2 = {
      table: tableId || '',
      columns: [{ field: id, parameters, type: 'dimension' }],
      filters: predicate.map((pred) => ({
        field: id,
        parameters,
        type: 'dimension',
        operator: pred.operator,
        values: pred.values.map(String),
      })),
      sorts: [],
      dataSource: source,
      limit: null,
      requestVersion: '2.0',
    };

    return this.factAdapter.fetchDataForRequest(request, options);
  }

  async search(dimension: DimensionColumn, query: string, options: ServiceOptions = {}): Promise<AsyncQueryResponse> {
    const columnMetadata = dimension.columnMetadata as ElideDimensionMetadataModel;

    let predicate: DimensionFilter[];

    if (columnMetadata.hasEnumValues) {
      predicate = query.length
        ? [
            {
              operator: 'contains',
              values: [query],
            },
          ]
        : [];
    } else {
      predicate = query.length
        ? [
            {
              operator: 'ini',
              values: [`*${query}*`],
            },
          ]
        : [];
    }

    return columnMetadata.hasEnumValues
      ? this.findEnum(dimension, predicate, options)
      : this.findRequest(dimension, predicate, options);
  }
}
