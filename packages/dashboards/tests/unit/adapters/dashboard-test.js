import { moduleFor, test } from 'ember-qunit';
import config from 'ember-get-config';

moduleFor('adapter:dashboard', 'Unit | Adapter | dashboard');

test('default host', function(assert) {
  assert.expect(1);

  let adapter = this.subject(),
    originalUri = config.navi.appPersistence.uri;

  config.navi.appPersistence.uri = undefined;

  assert.equal(adapter.get('host'), '', 'host defaults to empty string');

  config.navi.appPersistence.uri = originalUri;
});

test('host configuration', function(assert) {
  assert.expect(1);

  let adapter = this.subject(),
    originalUri = config.navi.appPersistence.uri;

  config.navi.appPersistence.uri = 'https://newuri.naviapp.io/';

  assert.equal(
    adapter.get('host'),
    'https://newuri.naviapp.io/',
    'host can be configured by setting navi.appPersistence.uri in environment.js'
  );

  config.navi.appPersistence.uri = originalUri;
});
