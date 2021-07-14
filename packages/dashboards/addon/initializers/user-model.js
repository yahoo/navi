/**
 * Copyright 2021, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import { hasMany } from '@ember-data/model';
import User from 'navi-core/models/user';

export function initialize(/* application */) {
  User.reopen({
    dashboards: hasMany('dashboard', { async: true, inverse: 'owner' }),
    favoriteDashboards: hasMany('dashboard', { async: true, inverse: null }),
  });
}

export default {
  name: 'user-model',
  initialize,
};
