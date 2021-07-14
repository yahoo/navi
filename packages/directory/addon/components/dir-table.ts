/**
 * Copyright 2021, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * Usage:
 * <DirTable
 *   @items={{@items}}
 *   @isLoading={{@isLoading}}
 *   @searchQuery={{@searchQuery}}
 *   @sortBy={{@sortBy}}
 *   @sortDir={{@sortDir}}
 *   @onColumnClick={{this.onColumnClick}}
 * />
 */
import Component from '@glimmer/component';
import { action } from '@ember/object';
import moment from 'moment';
import { isEmpty } from '@ember/utils';
// @ts-ignore
import Table from 'ember-light-table';

interface DirTableComponentArgs {
  searchQuery: string;
  items: Array<TODO>;
  sortBy: string;
  sortDir: TODO<'asc' | 'desc'>;
  onColumnClick: TODO<Function>;
}

export default class DirTableComponent extends Component<DirTableComponentArgs> {
  //TODO replace with `is-empty` helper from ember-truth-helpers once that is released
  /**
   * @property {Boolean} isSearching
   */
  get isSearching() {
    return !isEmpty(this.args.searchQuery);
  }

  /**
   * @property {Array} model - Used by ember-light-table to create rows
   */
  get model() {
    const items = this.args.items || [];
    return items.map((item) => ({
      model: item,
      lastUpdatedDate: moment(item.updatedOn).format('MM/DD/YYYY -  hh:mm:ss a'),
    }));
  }

  /**
   * @property {Array} columns - Used by ember-light-table to define each column
   */
  get columns() {
    const columns = [
      {
        label: 'NAME',
        valuePath: 'model',
        sortByKey: 'title',
        hideable: false,
        draggable: false,
        classNames: 'dir-table__header-cell dir-table__header-cell--name',
        cellComponent: 'dir-item-name-cell',
        cellClassNames: 'dir-table__cell dir-table__cell--name',
      },
      {
        label: '',
        valuePath: 'model',
        sortable: false,
        hideable: false,
        draggable: false,
        classNames: 'dir-table__header-cell dir-table__header-cell--actions',
        cellComponent: 'dir-asset-row-actions',
        cellClassNames: 'dir-table__cell dir-table__cell--actions',
        breakpoints: ['tablet', 'desktop', 'jumbo'],
      },
      {
        label: 'OWNER',
        valuePath: 'model.owner.id',
        sortByKey: 'owner',
        hideable: false,
        draggable: false,
        width: '165px',
        classNames: 'dir-table__header-cell',
        cellClassNames: 'dir-table__cell dir-table__cell--owner',
        breakpoints: ['desktop', 'jumbo'],
      },
      {
        label: 'LAST UPDATED DATE',
        valuePath: 'lastUpdatedDate',
        sortByKey: 'updatedOn',
        sortDescFirst: true,
        hideable: false,
        draggable: false,
        width: '200px',
        classNames: 'dir-table__header-cell',
        cellClassNames: 'dir-table__cell dir-table__cell--lastUpdatedDate',
        breakpoints: ['desktop', 'jumbo'],
      },
    ];

    const { sortBy, sortDir } = this.args;
    if (!isEmpty(sortBy)) {
      const sortColumn = columns.find((col) => col.sortByKey === sortBy) as any;

      if (sortColumn) {
        sortColumn.sorted = true;
        sortColumn.ascending = sortDir === 'asc';
      }
    }
    return columns;
  }

  /**
   * @property {Object} table - Used by ember-light-table to create the table
   */
  get table() {
    const { columns, model: rows } = this;

    return Table.create({
      columns,
      rows,
      rowOptions: {
        classNames: 'dir-table__row',
      },
    });
  }

  /**
   * @method _getNextSort
   * Get next sort based on column and current sortBy
   *
   * @private
   * @param {Object} column
   * @returns {Object} sort column key and direction
   */
  _getNextSort(column: TODO) {
    const { sortBy } = this.args;
    const nextSortBy = column.sortByKey;

    let nextSortDir;
    if (sortBy === nextSortBy) {
      nextSortDir = column.ascending ? 'asc' : 'desc';
    } else {
      nextSortDir = column.sortDescFirst ? 'desc' : 'asc';
    }

    return {
      sortBy: nextSortBy,
      sortDir: nextSortDir,
    };
  }

  /**
   * @action onColumnClick
   * @param {Object} column
   */
  @action
  onColumnClick(column: TODO) {
    if (column.sorted) {
      this.args.onColumnClick?.(this._getNextSort(column));
    }
  }
}
