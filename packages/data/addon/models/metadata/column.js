/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */

import EmberObject from '@ember/object';

export default class Column extends EmberObject {
  /**
   * @property {String} id
   */
  id;

  /**
   * @property {String} name - Display name
   */
  name;

  /**
   * @property {String} description
   */
  description;

  /**
   * @property {Table} table
   */
  table;

  /**
   * @property {String} source - name of the data source this column is from.
   */
  source;

  /**
   * @property {String} type - will be "ref", "formula", or "field" depending on where its values are sourced from
   */
  type;

  /**
   * @property {String} expression - e.g. tableA.name if type is ref
   */
  expression;

  /**
   * @property {String} category
   */
  category;

  /**
   * @property {ValueType} valueType - enum value describing what type the values of this column hold
   */
  valueType;

  /**
   * @property {String[]} tags
   */
  tags = [];

  /**
   * @property {String[]} timegrains - supported timegrains for a column
   */
  timegrains = [];
}
