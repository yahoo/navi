/**
 * Copyright 2021, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import type UserService from 'navi-core/services/user';
import type ReportModel from 'navi-core/models/report';
import type { ModelFrom } from 'navi-core/utils/type-utils';
import type ReportsReportRoute from 'navi-reports/routes/reports/report';
import type { ReportLike } from 'navi-reports/routes/reports/report';

export default class ReportsReportCloneRoute extends Route {
  @service declare user: UserService;

  /**
   * @returns copy of report
   */
  model() {
    const report = this.modelFor('reports.report') as ModelFrom<ReportsReportRoute>;

    return this.store.createRecord('report', this.cloneReport(report));
  }

  /**
   * Transitions to newly created report
   *
   * @param report - resolved report model
   * @override
   */
  afterModel(report: ReportModel) {
    return this.replaceWith('reports.report.view', report.tempId);
  }

  /**
   * @param report - The report to clone
   * @returns copy of report
   */
  private cloneReport(report: ReportLike) {
    const owner = this.user.getUser();
    const clonedReportModel = report.clone();

    // Making sure the title does not exceed the 150 char limit
    Object.assign(clonedReportModel, {
      title: `Copy of ${clonedReportModel.title}`.substring(0, 150),
      owner,
    });

    return clonedReportModel;
  }
}
