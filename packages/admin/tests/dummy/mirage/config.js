import config from 'ember-get-config';
import BardLite from 'navi-data/mirage/routes/bard-lite';
import BardMeta from 'navi-data/mirage/routes/bard-meta';
import users from './routes/user';

export default function() {
  // https://github.com/kategengler/ember-cli-code-coverage#create-a-passthrough-when-intercepting-all-ajax-requests-in-tests
  this.passthrough('/write-coverage');

  /* == Mock Fact Data == */
  this.urlPrefix = `${config.navi.dataSources[0].uri}/v1`;
  BardMeta.call(this);
  BardLite.call(this);

  /* == Mock Persistence == */
  this.urlPrefix = config.navi.appPersistence.uri;
  users.call(this);
}
