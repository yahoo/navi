/**
 * Copyright 2017, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('landing', { path: '/' });

  this.route('directory', function() {
    this.route('my-data');
  });

  this.route('dashboardCollections', function() {
    this.route('collection', { path: '/:collectionId' });
  });

  this.route('dashboards', function() {
    this.route('new');
    this.route('dashboard', { path: '/:dashboardId' }, function() {
      this.route('clone');
      this.route('view');

      this.route('widgets', function() {
        this.route('add');
        this.route('new');
        this.route('widget', { path: '/:widgetId' }, function() {
          this.route('edit');
          this.route('invalid');
          this.route('view');
          this.route('clone-to-report');
        });
      });
    });
  });

  this.route('reports', function() {
    this.route('new');
    this.route('report', { path: '/:reportId' }, function() {
      this.route('edit');
      this.route('invalid');
      this.route('view');
      this.route('clone');
      this.route('save-as');
    });
  });

  this.route('beta', function() {
    this.route('reports', function() {
      this.route('report', { path: '/:reportId' }, function() {
        this.route('view');
      });
    });
  });
});

export default Router;
