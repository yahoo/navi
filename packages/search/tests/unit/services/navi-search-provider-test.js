import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import setupMirage from 'ember-cli-mirage/test-support/setup-mirage';

module('Unit | Service | navi-search-provider', function(hooks) {
  setupTest(hooks);
  setupMirage(hooks);

  let service;

  hooks.beforeEach(async function() {
    // Load metadata needed for request fragment
    await this.owner.lookup('service:bard-metadata').loadMetadata();
    service = this.owner.lookup('service:navi-search-provider');
    const store = this.owner.lookup('service:store'),
      mockAuthor = store.createRecord('user', { id: 'ciela' });
    this.owner.register(
      'service:user',
      Service.extend({
        getUser: () => mockAuthor
      })
    );
  });

  test('get all search providers', function(assert) {
    assert.expect(1);

    let availableSearchProviders = service._all();
    let systemSearchProviders = ['NaviSampleSearchProviderService', 'NaviAssetSearchProviderService'];
    assert.deepEqual(
      availableSearchProviders.map(provider => provider.constructor.name).sort(),
      systemSearchProviders.sort(),
      'Discovered 2 search provider.'
    );
  });

  test('search all providers', async function(assert) {
    assert.expect(1);

    let results = await service.search.perform('Revenue');
    let expectedResults = ['Revenue result', 'Revenue success'];
    assert.deepEqual(
      results.find(result => result.component === 'navi-search-result/sample').data,
      expectedResults,
      'Search returns the expected results'
    );
  });

  test('search with no results', async function(assert) {
    assert.expect(1);

    let results = await service.search.perform('something');
    assert.equal(results.length, 0, 'Returns no results');
  });
});
