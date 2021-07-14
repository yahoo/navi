/**
 * Copyright 2021, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import type UserService from 'navi-core/services/user';
import type ReportModel from 'navi-core/models/report';
import type { ModelFrom } from 'navi-core/utils/type-utils';
import type DashboardsDashboardWidgetsWidgetRoute from 'navi-dashboards/routes/dashboards/dashboard/widgets/widget';
import type DashboardWidget from 'navi-core/models/dashboard-widget';

export default class DashboardsDashboardWidgetsWidgetCloneToReportRoute extends Route {
  @service declare user: UserService;

  /**
   * @returns report model
   */
  model() {
    const widget = this.modelFor(
      'dashboards.dashboard.widgets.widget'
    ) as ModelFrom<DashboardsDashboardWidgetsWidgetRoute>;
    return this._cloneToReport(widget);
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
   * Convert a widget to a report
   *
   * @private
   * @param widget - the widget to clone
   * @returns report model from widget
   */
  _cloneToReport(widget: DashboardWidget) {
    // TODO This isn't really a DashboardWidget object
    const clonedWidget = widget.toJSON() as DashboardWidget;

    return this.store.createRecord('report', {
      title: `Copy of ${widget.title}`.substring(0, 150),
      owner: this.user.getUser(),
      request: widget.request?.clone(),
      visualization: this.store.createFragment(clonedWidget.visualization.type, clonedWidget.visualization),
    });
  }
}
