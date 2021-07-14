/**
 * Copyright 2021, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import { A } from '@ember/array';
import ReportsNewRoute from 'navi-reports/routes/reports/new';
import type { ReportLike } from 'navi-reports/routes/reports/report';

export default class DashboardsDashboardWidgetsNewRoute extends ReportsNewRoute {
  /**
   * Transitions to newly created widget
   * @param widget - resolved widget model
   * @override
   */
  afterModel(widget: ReportLike) {
    return this.replaceWith('dashboards.dashboard.widgets.widget.edit', widget.tempId);
  }

  /**
   * Returns a new model for this route
   */
  protected async newModel() {
    const owner = await this.user.findOrRegister();
    const defaultVisualization = this.naviVisualizations.defaultVisualization();
    const dashboard = this.modelFor('dashboards.dashboard');

    const widget = this.store.createRecord('dashboard-widget', {
      owner,
      dashboard,
      requests: A([this.store.createFragment('bard-request-v2/request', {})]),
      visualization: { type: defaultVisualization },
    });

    return widget;
  }
}
