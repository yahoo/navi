import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';

let Route, Store, MetadataService, compression;

module('Unit | Route | dashboards/dashboard/view', function (hooks) {
  setupTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function () {
    Route = this.owner.lookup('route:dashboards/dashboard/view');
    this.owner.lookup('service:user').findUser();
    Store = this.owner.lookup('service:store');
    MetadataService = this.owner.lookup('service:navi-metadata');
    compression = this.owner.lookup('service:compression');

    await MetadataService.loadMetadata();
  });

  test('_addFiltersFromQueryParams', async function (assert) {
    assert.expect(7);

    let owner = await Store.findRecord('user', 'navi_user'),
      genderFilter = Store.createFragment('bard-request-v2/fragments/filter', {
        type: 'dimension',
        field: 'gender',
        parameters: {
          field: 'id',
        },
        operator: 'in',
        values: ['Male'],
        source: 'bardOne',
      }),
      ageFilter = Store.createFragment('bard-request-v2/fragments/filter', {
        type: 'dimension',
        field: 'age',
        parameters: {
          field: 'desc',
        },
        operator: 'notin',
        values: ['13-17', '18-20'],
        source: 'bardOne',
      }),
      dashboard = Store.createRecord('dashboard', {
        title: 'Test Dashboard',
        owner,
      });
    assert.notOk(Route.get('filters'), 'No filter query params are set');
    assert.equal(dashboard.get('filters.length'), 0, 'Dashboard has no filters');

    await Route._addFiltersFromQueryParams(dashboard, '');
    assert.equal(dashboard.get('filters.length'), 0, 'No filters added when query params are empty');

    let compressedFilters = await compression.compress({ filters: [genderFilter.serialize(), ageFilter.serialize()] });
    await Route._addFiltersFromQueryParams(dashboard, compressedFilters);

    assert.deepEqual(
      dashboard.get('filters').map((fil) => fil.serialize()),
      [genderFilter.serialize(), ageFilter.serialize()],
      'Two filters are added from valid filter query params'
    );

    dashboard.rollbackAttributes();

    assert.equal(dashboard.get('filters.length'), 0, 'Dashboard has no filters');

    await Route._addFiltersFromQueryParams(dashboard, 'SomeInvalidFilterString').catch((e) => {
      assert.equal(
        e.message,
        `Error decompressing filter query params: SomeInvalidFilterString\nError: Assertion Failed: The decompressed string is not null`,
        "query params that don't decompress properly throw a decompression error"
      );
    });

    let singleCompressedFilter = await compression.compress(ageFilter);
    await Route._addFiltersFromQueryParams(dashboard, singleCompressedFilter).catch((e) => {
      assert.equal(
        e.message,
        `Error decompressing filter query params: ${singleCompressedFilter}\nError: Filter query params are not valid filters`,
        'query params that only contain a single filter rather than an array throw an error'
      );
    });
  });
});
