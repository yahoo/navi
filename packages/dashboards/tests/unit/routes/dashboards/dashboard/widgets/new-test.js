import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { settled } from '@ember/test-helpers';
import { setupMirage } from 'ember-cli-mirage/test-support';

const NEW_MODEL = {
  createdOn: null,
  requests: [
    {
      table: null,
      filters: [],
      columns: [],
      sorts: [],
      limit: null,
      requestVersion: '2.0',
      dataSource: null,
    },
  ],
  title: 'Untitled Widget',
  updatedOn: null,
  visualization: {
    type: 'table',
    version: 2,
    metadata: {
      columnAttributes: {},
    },
  },
  dashboard: 'dashboard1',
};

let Store, Route;

module('Unit | Route | dashboards/dashboard/widgets/new', function (hooks) {
  setupTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function () {
    Store = this.owner.lookup('service:store');
    Route = this.owner.factoryFor('route:dashboards/dashboard/widgets/new').create({
      modelFor: () =>
        Store.createRecord('dashboard', {
          id: 'dashboard1',
          owner: 'navi_user',
        }),

      router: {
        currentRoute: {
          queryParams: {},
        },
      },
    });

    await this.owner.lookup('service:navi-metadata').loadMetadata();
  });

  test('model', async function (assert) {
    assert.expect(2);

    return settled().then(() => {
      return Route.model({}, { to: { queryParams: {} } }).then((model) => {
        assert.deepEqual(model.toJSON(), NEW_MODEL, 'A new widget model is returned');

        assert.equal(
          model.get('owner.id'),
          'navi_user',
          'the owner of the widget is set using the owner from the dashboard'
        );
      });
    });
  });

  test('newModel', async function (assert) {
    await settled();
    const model = await Route.newModel();
    assert.deepEqual(model.toJSON(), NEW_MODEL, 'A new widget model is returned');
    assert.equal(
      model.get('owner.id'),
      'navi_user',
      'the owner of the widget is set using the owner from the dashboard'
    );
  });
});
