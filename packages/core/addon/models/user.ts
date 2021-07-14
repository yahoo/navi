/**
 * Copyright 2021, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import Model, { hasMany } from '@ember-data/model';
import ReportModel from './report';
import DeliveryRuleModel from './delivery-rule';
import DashboardModel from './dashboard';
import Role from './role';
// eslint-disable-next-line ember/use-ember-data-rfc-395-imports
import DS from 'ember-data';

export default class UserModel extends Model {
  @hasMany('report', { async: true, inverse: 'owner' })
  reports!: DS.PromiseManyArray<ReportModel>;

  @hasMany('report', { async: true, inverse: null })
  favoriteReports!: DS.PromiseManyArray<ReportModel>;

  @hasMany('delivery-rule', { async: true, inverse: 'owner' })
  deliveryRules!: DS.PromiseManyArray<DeliveryRuleModel>;

  @hasMany('dashboard', { async: true, inverse: 'owner' })
  dashboards!: DS.PromiseManyArray<DashboardModel>;

  @hasMany('dashboard', { async: true, inverse: null })
  favoriteDashboards!: DS.PromiseManyArray<DashboardModel>;

  @hasMany('role', { async: true })
  roles!: DS.PromiseManyArray<Role>;
}

// DO NOT DELETE: this is how TypeScript knows how to look up your models.
declare module 'ember-data/types/registries/model' {
  export default interface ModelRegistry {
    user: UserModel;
  }
}
