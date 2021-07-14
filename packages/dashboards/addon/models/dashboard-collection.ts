/**
 * Copyright 2021, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import Model, { attr, hasMany, belongsTo } from '@ember-data/model';
import type { AsyncHasMany, AsyncBelongsTo } from '@ember-data/model';
import type UserModel from 'navi-core/models/user';
import type { Moment } from 'moment';
import type DashboardModel from 'navi-core/models/dashboard';

export default class DashboardCollection extends Model {
  @belongsTo('user', { async: true })
  declare owner: AsyncBelongsTo<UserModel>;
  @attr('string')
  declare title: string;
  @attr('moment')
  declare createdOn: Moment;
  @attr('moment')
  declare updatedOn: Moment;
  @hasMany('dashboard', { async: true })
  declare dashboards: AsyncHasMany<DashboardModel>;
}

// DO NOT DELETE: this is how TypeScript knows how to look up your models.
declare module 'ember-data/types/registries/model' {
  export default interface ModelRegistry {
    'dashboard-collection': DashboardCollection;
  }
}
