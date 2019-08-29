import EmberRouter from '@ember/routing/router';
import config from './config/environment';
import { reportRoutes, reportCollectionRoutes, reportPrintRoutes } from 'navi-reports/router';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  //mock directoy route
  this.route('directory', function() {
    this.route('my-data');
  });

  reportRoutes(this);
  reportCollectionRoutes(this);
  reportPrintRoutes(this);
});

export default Router;
