import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';

module('Unit | Service | navi-search-provider', function (hooks) {
  setupTest(hooks);
  setupMirage(hooks);

  let service;

  hooks.beforeEach(async function () {
    // Load metadata needed for request fragment
    await this.owner.lookup('service:navi-metadata').loadMetadata();
    service = this.owner.lookup('service:navi-search-provider');
    const store = this.owner.lookup('service:store'),
      mockOwner = store.createRecord('user', { id: 'ciela' });
    this.owner.register(
      'service:user',
      class extends Service {
        getUser = () => mockOwner;
      }
    );
  });

  test('get all search providers', function (assert) {
    assert.expect(1);

    let availableSearchProviders = service._all();
    let systemSearchProviders = [
      'NaviSampleSearchProviderService',
      'NaviAssetSearchProviderService',
      'NaviDefinitionSearchProviderService',
    ];
    assert.deepEqual(
      availableSearchProviders.map((provider) => provider.constructor.name).sort(),
      systemSearchProviders.sort(),
      'Discovered 2 search provider.'
    );
  });

  test('search all providers', async function (assert) {
    assert.expect(1);

    let results = service.search('sample');

    assert.deepEqual(
      results.map((result) => result.task.context.constructor.name),
      ['NaviAssetSearchProviderService', 'NaviDefinitionSearchProviderService', 'NaviSampleSearchProviderService'],
      'Search returns a task instance of every available search provider'
    );
  });
});
