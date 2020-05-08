/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import Service, { inject as service } from '@ember/service';
import Store from 'ember-data/store';
import ColumnMetadata from 'navi-data/models/metadata/column';
import ColumnFragment from '../models/bard-request-v2/fragments/column';
import FilterFragment from '../models/bard-request-v2/fragments/filter';
import SortFragment from '../models/bard-request-v2/fragments/sort';
import { dasherize } from '@ember/string';

interface StoreWithFragment extends Store {
  createFragment(fragmentName: string, attributes: object): ColumnFragment | FilterFragment | SortFragment;
}
type FieldType = 'metric' | 'dimension' | 'time-dimension';

export default class FragmentFactory extends Service {
  @service store!: StoreWithFragment;

  /**
   * Builds a request v2 column fragment given meta data object.
   * @param meta - The metadata object to use as field to build this fragment from
   * @param parameters - parameters to attach to column, if none pass empty object `{}`
   * @param alias - optional alias for this column
   */
  createColumnFromMeta(columnMetadata: ColumnMetadata, parameters: Dict<string> = {}, alias?: string): ColumnFragment {
    const type = this._getMetaColumnType(columnMetadata);
    const field = columnMetadata.id;
    return this.createColumn(type, columnMetadata.source, field, parameters, alias);
  }

  /**
   * Builds a request v2 column fragment and applies the appropriate meta data
   * @param type - metric, dimension or time-dimension
   * @param dataSource - datasource or namespace for metadata lookups
   * @param field - field name, if dimension includes field `dimension.id`
   * @param parameters - parameters to attach to column, if none pass empty object `{}`
   * @param alias - optional alias for this column
   */
  createColumn(
    type: FieldType,
    dataSource: string,
    field: string,
    parameters: Dict<string> = {},
    alias?: string
  ): ColumnFragment {
    const column = this.store.createFragment('bard-request-v2/fragments/column', {
      field,
      type,
      parameters,
      alias
    }) as ColumnFragment;
    column.source = dataSource;
    return column;
  }

  /**
   * Builds a request v2 filter fragment given meta data object.
   * @param meta - meta data object to build this filter from
   * @param parameters - parameters to attach to column, if none pass empty object `{}`
   * @param operator - operator to pass in: 'contains, in, notnull etc'
   * @param values - array of values to filter by
   */
  createFilterFromMeta(
    columnMetadata: ColumnMetadata,
    parameters: Dict<string> = {},
    operator: string,
    values: Array<string | number>
  ): FilterFragment {
    const type = this._getMetaColumnType(columnMetadata);
    const field = columnMetadata.id;
    return this.createFilter(type, columnMetadata.source, field, parameters, operator, values);
  }

  /**
   * Builds a request v2 filter fragment and applies the appropriate meta data
   * @param type - metric, dimension or time-dimension
   * @param dataSource - datasource or namespace for metadata lookups
   * @param field - field name, if dimension includes field `dimension.id`
   * @param parameters - parameters to attach to column, if none pass empty object `{}`
   * @param operator - operator to pass in: 'contains, in, notnull etc'
   * @param values - array of values to filter by
   */
  createFilter(
    type: FieldType,
    dataSource: string,
    field: string,
    parameters: Dict<string> = {},
    operator: string,
    values: Array<string | number>
  ): FilterFragment {
    const filter = this.store.createFragment('bard-request-v2/fragments/filter', {
      field,
      parameters,
      type,
      operator,
      values
    }) as FilterFragment;
    filter.source = dataSource;
    return filter;
  }

  /**
   * Builds a request v2 sort fragment given meta data object.
   * @param meta - meta data object to build this filter from
   * @param parameters - parameters to attach to column, if none pass empty object `{}`
   * @param direction  - `desc` or `asc`
   */
  createSortFromMeta(
    columnMetadata: ColumnMetadata,
    parameters: Dict<string> = {},
    direction: 'asc' | 'desc'
  ): SortFragment {
    const type = this._getMetaColumnType(columnMetadata);
    const field = columnMetadata.id;
    return this.createSort(type, columnMetadata.source, field, parameters, direction);
  }

  /**
   * Builds a request v2 sort fragment and applies the appropriate meta data
   * @param type - metric, dimension or time-dimension
   * @param dataSource - datasource or namespace for metadata lookups
   * @param field - field name, if dimension includes field `dimension.id`
   * @param parameters - parameters to attach to column, if none pass empty object `{}`
   * @param direction - `desc` or `asc`
   */
  createSort(
    type: FieldType,
    dataSource: string,
    field: string,
    parameters: Dict<string> = {},
    direction: 'asc' | 'desc'
  ): SortFragment {
    const sort = this.store.createFragment('bard-request-v2/fragments/sort', {
      field,
      parameters,
      type,
      direction
    }) as SortFragment;
    sort.source = dataSource;
    return sort;
  }

  /**
   * Deducts meta column type from class type
   * @param columnMetadata - meta data to get type from
   */
  private _getMetaColumnType(columnMetadata: ColumnMetadata): FieldType {
    return dasherize(columnMetadata.constructor.name) as FieldType;
  }
}

declare module '@ember/service' {
  interface Registry {
    'fragment-factory': FragmentFactory;
  }
}
