/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import ReportsReportViewRoute from 'navi-reports/routes/reports/report/view';

export default class DashboardsDashboardWidgetsWidgetViewRoute extends ReportsReportViewRoute {
  /**
   * @property {Object} parentModel - object containing request to view
   */
  get parentModel() {
    return this.modelFor('dashboards.dashboard.widgets.widget');
  }
}
