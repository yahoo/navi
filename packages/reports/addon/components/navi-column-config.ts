/**
 * Copyright 2021, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import Component from '@glimmer/component';
import { action, computed } from '@ember/object';
//@ts-expect-error
import move from 'ember-animated/motions/move';
import { easeOut, easeIn } from 'ember-animated/easings/cosine';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import type ReportModel from 'navi-core/models/report';
import type ColumnFragment from 'navi-core/models/bard-request-v2/fragments/column';
import type { Parameters, SortDirection } from 'navi-data/adapters/facts/interface';
import type ColumnMetadataModel from 'navi-data/models/metadata/column';
import type NaviFormatterService from 'navi-data/services/navi-formatter';
import type RequestConstrainer from 'navi-reports/services/request-constrainer';

interface NaviColumnConfigArgs {
  isOpen: boolean;
  report: ReportModel;
  lastAddedColumn: ColumnFragment;
  onAddColumn(metadata: ColumnMetadataModel, parameters: Parameters): void;
  onRemoveColumn(metadata: ColumnMetadataModel, parameters: Parameters): void;
  onAddFilter(column: ColumnFragment): void;
  onUpsertSort(column: ColumnFragment, direction: SortDirection): void;
  onRemoveSort(column: ColumnFragment): void;
  onRenameColumn(column: ColumnFragment, alias: string): void;
  onReorderColumn(column: ColumnFragment, index: number): void;
  openFilters(): void;
  drawerDidChange(): void;
}

export type ConfigColumn = {
  isFiltered: boolean;
  isRequired: boolean;
  fragment: ColumnFragment;
};

export default class NaviColumnConfig extends Component<NaviColumnConfigArgs> {
  @service requestConstrainer!: RequestConstrainer;

  /**
   * Dimension and metric columns from the request
   */
  @computed('args.report.request.{columns.[],columns.@each.parameters,filters.[],sorts.[]}')
  get columns(): ConfigColumn[] {
    const { request } = this.args.report;
    const requiredColumns = this.requestConstrainer.getConstrainedProperties(request).columns || new Set();
    if (request.table !== undefined) {
      const { columns, filters } = request;

      const filteredColumns = filters.map(({ canonicalName }) => canonicalName);

      return columns.map((column) => {
        return {
          isFiltered: filteredColumns.includes(column.canonicalName),
          isRequired: requiredColumns.has(column),
          fragment: column,
        };
      });
    }
    return [];
  }

  @service
  naviFormatter!: NaviFormatterService;

  @tracked
  currentlyOpenColumn?: ConfigColumn;

  @tracked
  componentElement!: Element;

  /**
   * Adds a copy of the given column to the request including its parameters
   * @param column - The metric/dimension column to make a copy of
   */
  @action
  cloneColumn(column: ConfigColumn) {
    const { columnMetadata, parameters } = column.fragment;
    this.args.onAddColumn(columnMetadata, { ...parameters });
  }

  /**
   * @param column - the column fragment to be renamed
   * @param index - the new name for the column
   */
  @action
  reorderColumns(newColumns: ConfigColumn[], draggedColumn: ConfigColumn) {
    this.args.onReorderColumn(draggedColumn.fragment, newColumns.indexOf(draggedColumn));
  }

  /**
   * Opens a column
   * @param column - The column to open
   */
  @action
  openColumn(column: ConfigColumn) {
    this.currentlyOpenColumn = column;
  }

  /**
   * Adds a filter for the column
   * @param column - The column to filter
   */
  @action
  onAddFilter(column: ColumnFragment) {
    this.args.onAddFilter(column);

    // TODO: should be done a level higher
    this.args.openFilters();
  }

  /**
   * Stores element reference and opens the default column after render
   * @param element - element inserted
   */
  @action
  setupElement(element: Element) {
    this.componentElement = element;
  }

  /**
   * Drawer transition
   * @param context - animation context
   */
  @action
  *drawerTransition(context: TODO) {
    const { insertedSprites, removedSprites } = context;
    const offset = 500; // 2x the size of the drawer
    const x = this.componentElement.getBoundingClientRect().left - offset;
    yield Promise.all([
      ...removedSprites.map((sprite: TODO) => {
        sprite.applyStyles({ 'z-index': '1' });
        sprite.endAtPixel({ x });
        return move(sprite, { easing: easeIn });
      }),
      ...insertedSprites.map((sprite: TODO) => {
        sprite.startAtPixel({ x });
        sprite.applyStyles({ 'z-index': '1' });
        return move(sprite, { easing: easeOut });
      }),
    ]);
    this.args.drawerDidChange?.();
  }
}
