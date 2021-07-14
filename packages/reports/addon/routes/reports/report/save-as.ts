/**
 * Copyright 2021, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */

import Route from '@ember/routing/route';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import type UserService from 'navi-core/services/user';
import type NaviNotificationsService from 'navi-core/services/interfaces/navi-notifications';
import type ReportsReportRoute from 'navi-reports/routes/reports/report';
import type { ModelFrom } from 'navi-core/utils/type-utils';
import type ReportModel from 'navi-core/models/report';
import type { ReportLike } from 'navi-reports/routes/reports/report';

export default class ReportsReportSaveAsRoute extends Route {
  @service declare user: UserService;

  @service declare naviNotifications: NaviNotificationsService;

  /**
   * @param title - Title of newly created report
   * @returns new copy of report with different title
   */
  model({ title }: { title: string }) {
    const report = this.modelFor('reports.report') as ModelFrom<ReportsReportRoute>;
    // Return new report with new title
    return this.store.createRecord('report', this._saveAsReport(report, title));
  }

  /**
   * Method called when report is saved as successfully
   */
  @action
  _onSaveAsSuccess(): void {
    // Show success notification
    this.naviNotifications.add({
      title: 'Report saved',
      style: 'success',
      timeout: 'short',
    });
  }

  /**
   * Method called when a failure occurs while saving as the report
   */
  @action
  _onSaveAsFailure(): void {
    // Show error notification
    this.naviNotifications.add({
      title: 'An error occurred while trying to save the report',
      style: 'danger',
      timeout: 'medium',
    });
  }

  /**
   * OnSuccess: Show notifications, Save the report to a new name. Leave the
   * original report untouched and Transitions to newly created report.
   * OnFailure: Show notification
   *
   * @param report - resolved report model
   * @override
   */
  afterModel(report: ReportModel) {
    // get Old Report
    const oldReport = this.modelFor('reports.report') as ModelFrom<ReportsReportRoute>;
    // Save report
    report
      .save()
      .then(() => {
        this._onSaveAsSuccess();
        // Roll back old report to revert any changes applied to original report
        oldReport.rollbackAttributes();
        // Switch to the newly created report
        return this.replaceWith('reports.report.view', report.id);
      })
      .catch(() => {
        // Throws falure and sends user back to old report dirty state
        this._onSaveAsFailure();
        this.replaceWith('reports.report.view');
      });
  }

  /**
   * @param report - The report to save As
   * @returns copy of report
   */
  _saveAsReport(report: ReportLike, title: string) {
    const owner = this.user.getUser();
    const clonedReportModel = report.clone();

    // Setting the title and owner of report
    Object.assign(clonedReportModel, {
      title: title.substring(0, 150),
      owner,
    });
    return clonedReportModel;
  }
}
