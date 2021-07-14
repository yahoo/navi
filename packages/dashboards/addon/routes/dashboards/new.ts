/**
 * Copyright 2021, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import { action } from '@ember/object';
import type NaviNotificationsService from 'navi-core/services/interfaces/navi-notifications';
import type DashboardModel from 'navi-core/models/dashboard';
import type UserService from 'navi-core/services/user';
import type RouterService from '@ember/routing/router-service';
import type { Transition } from 'navi-core/utils/type-utils';

export default class DashboardsNewRoute extends Route {
  @service declare naviNotifications: NaviNotificationsService;

  @service declare user: UserService;

  @service declare router: RouterService;

  /**
   * Sets the model for this route
   *
   * @override
   * @returns route model
   */
  model(_params: {}, transition: Transition): Promise<DashboardModel> {
    const title = transition.to?.queryParams?.title;
    return this._newModel(title);
  }

  /**
   * Transitions to dashboard
   *
   * @param dashboard - resolved dashboard model
   * @override
   */
  afterModel(dashboard: DashboardModel, transition: Transition) {
    const queryParams = transition.to?.queryParams || {};

    // If an initial widget was given in the query params, create it
    if (queryParams.unsavedWidgetId) {
      return this.replaceWith('dashboards.dashboard.widgets.add', dashboard.id, { queryParams });
    } else {
      return this.replaceWith('dashboards.dashboard', dashboard.id);
    }
  }

  /**
   * Returns a new model for this route
   *
   * @private
   * @param title - Containing Title of the dashboard, with default value
   * @returns route model
   */
  async _newModel(title = 'Untitled Dashboard') {
    const owner = await this.user.findOrRegister();
    const dashboard = this.store.createRecord('dashboard', { owner, title });
    return dashboard.save();
  }

  /**
   * @action error
   * action to handle errors in route
   */
  @action
  error() {
    this.naviNotifications.add({
      title: 'An error occurred while creating a new dashboard',
      style: 'danger',
      timeout: 'medium',
    });
    this.replaceWith('dashboards');
  }
}
