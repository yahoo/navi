import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('reports', function() {
    this.route('new');
    this.route('report', { path: '/:reportId'}, function() {
      this.route('clone');
      this.route('invalid');
      this.route('new');
      this.route('view');
      this.route('unauthorized');
    });
  });

  this.route('reportCollections', function() {
    this.route('collection', {path: '/:collectionId'});
  });

  this.route('print', function() {
    this.route('reports', function() {
      this.route('new');
      this.route('report', { path: '/:reportId'}, function() {
        this.route('view');
        this.route('invalid');
      });
    });
  });
});

export default Router;
