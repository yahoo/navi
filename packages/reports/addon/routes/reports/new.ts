/**
 * Copyright 2021, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import type NaviNotificationsService from 'navi-core/services/interfaces/navi-notifications';
import type NaviVisualizationsService from 'navi-reports/services/navi-visualizations';
import type CompressionService from 'navi-core/services/compression';
import type UserService from 'navi-core/services/user';
import type { Transition } from 'navi-core/utils/type-utils';
import type ReportModel from 'navi-core/models/report';
import type { ReportLike } from 'navi-reports/routes/reports/report';
import { getDataSource } from 'navi-data/utils/adapter';
export default class ReportsNewRoute extends Route {
  @service declare naviNotifications: NaviNotificationsService;

  @service declare naviVisualizations: NaviVisualizationsService;

  @service declare compression: CompressionService;

  @service declare user: UserService;

  queryParams = {
    datasource: {},
  };

  model(_params: {}, transition: Transition): Promise<ReportLike> {
    const modelQueryParam = transition.to?.queryParams?.model;
    const datasource = transition.to?.queryParams?.datasource;
    // Allow for a report to be passed through the URL
    return modelQueryParam ? this.deserializeUrlModel(modelQueryParam) : this.newModel(datasource);
  }

  /**
   * Transitions to newly created report
   */
  afterModel(report: ReportModel) {
    return this.replaceWith('reports.report.edit', report.tempId);
  }

  private async deserializeUrlModel(modelString: string): Promise<ReportLike> {
    try {
      const model = (await this.compression.decompressModel(modelString)) as ReportModel;
      await model.request?.loadMetadata();
      return this.store.createRecord('report', model.clone());
    } catch (e) {
      throw new Error('Could not parse model query param');
    }
  }

  /**
   * Returns a new model for this route
   */
  protected async newModel(dataSource?: string): Promise<ReportLike> {
    const owner = this.user.getUser();
    const defaultVisualization = this.naviVisualizations.defaultVisualization();
    if (dataSource !== undefined) {
      try {
        getDataSource(dataSource); //validate datasource param
      } catch (e) {
        throw new Error('Could not locate requested data source');
      }
    }
    const report = this.store.createRecord('report', {
      owner,
      request: this.store.createFragment('bard-request-v2/request', {
        dataSource,
      }),
      visualization: { type: defaultVisualization },
    });
    return report;
  }
}
