/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * Usage:
 * <NaviCellRenderers::Metric
 *   @data={{row}}
 *   @column={{column}}
 *   @request={{request}}
 *   @requestColumn={{request}}
 * />
 */
import Component from '@glimmer/component';
import { CellRendererArgs } from '../navi-table-cell-renderer';

export default class BaseCellRenderer extends Component<CellRendererArgs> {
  /**
   * value of the column
   */
  get columnValue() {
    const { column, data } = this.args;
    const { canonicalName } = column.fragment;

    return data?.[canonicalName];
  }

  /**
   * value that should be displayed in table cell
   */
  get displayValue() {
    return this.columnValue;
  }
}
