import { module, test, skip } from 'qunit';
import { setupTest } from 'ember-qunit';
import { run } from '@ember/runloop';
import { setupMirage } from 'ember-cli-mirage/test-support';

let Store;

module('Unit | Model | dashboard', function (hooks) {
  setupTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function () {
    Store = this.owner.lookup('service:store');
    await this.owner.lookup('service:navi-metadata').loadMetadata();
    await this.owner.lookup('service:user').findUser();
  });

  test('Retrieving Records', async function (assert) {
    assert.expect(2);

    await run(async () => {
      const rec = await Store.findRecord('dashboard', 2);
      assert.deepEqual(
        JSON.parse(JSON.stringify(rec.toJSON())), //to remove undefined props
        {
          owner: 'navi_user',
          createdOn: '2016-02-01 00:00:00.000',
          filters: [
            {
              type: 'dimension',
              field: 'property',
              parameters: {
                field: 'id',
              },
              operator: 'contains',
              values: ['114', '100001'],
            },
            {
              type: 'dimension',
              field: 'property',
              parameters: {
                field: 'id',
              },
              operator: 'notin',
              values: ['1'],
            },
            {
              type: 'dimension',
              field: 'property',
              parameters: {
                field: 'id',
              },
              operator: 'notin',
              values: ['2', '3'],
            },
            {
              type: 'dimension',
              field: 'eventId',
              parameters: {
                field: 'id',
              },
              operator: 'in',
              values: ['1'],
            },
          ],
          presentation: {
            columns: 40,
            layout: [
              {
                column: 0,
                height: 6,
                row: 0,
                widgetId: 4,
                width: 9,
              },
              {
                column: 0,
                height: 5,
                row: 6,
                widgetId: 5,
                width: 9,
              },
            ],
            version: 1,
          },
          title: 'Dashboard 2',
          updatedOn: '2016-02-01 00:00:00.000',
        },
        'dashboard record with id 2 is found in the store'
      );

      assert.equal(
        rec.hasMany('widgets').link(),
        '/dashboards/2/widgets',
        'The nested resource link is set by the dashboard model serializer'
      );
    });
  });

  test('user relationship', async function (assert) {
    assert.expect(4);

    await run(async () => {
      const userModel = await Store.findRecord('user', 'navi_user');
      const dashboard = await Store.findRecord('dashboard', 2);
      const owner = await dashboard.get('owner');

      assert.deepEqual(owner, userModel, 'Dashboard owner property contains user model');

      assert.ok(dashboard.get('isUserOwner'), 'Dashboard is owned by current user');

      assert.notOk(dashboard.get('isUserEditor'), 'Editors list is not currently supported');

      assert.ok(dashboard.get('canUserEdit'), 'Owner can edit dashboard');
    });
  });

  test('isFavorite', async function (assert) {
    assert.expect(2);

    await run(async () => {
      // Make sure user is loaded into store
      await Store.findRecord('user', 'navi_user');
      const dashboard2 = await Store.findRecord('dashboard', 2);
      assert.notOk(dashboard2.get('isFavorite'), 'isFavorite returns false when dashboard is not in favorite list');

      const dashboard1 = await Store.findRecord('dashboard', 1);
      assert.ok(dashboard1.get('isFavorite'), 'isFavorite returns true when dashboard is in favorite list');
    });
  });

  test('Cloning Dashboards', async function (assert) {
    assert.expect(2);

    await run(async () => {
      const model = await Store.findRecord('dashboard', 3);
      const clonedModel = model.clone().toJSON();
      const expectedModel = model.toJSON();

      expectedModel.owner = 'navi_user';

      // setting attributes to null, which are not necessary to check in clone object
      expectedModel.createdOn = null;
      expectedModel.updatedOn = null;

      assert.deepEqual(clonedModel, expectedModel, 'The cloned dashboard model has the same attrs as original model');

      await this.owner.lookup('service:navi-metadata').loadMetadata({ dataSourceName: 'bardTwo' });

      const filterModel = await Store.findRecord('dashboard', 6);
      const clonedFilterModel = filterModel.clone().toJSON();
      assert.deepEqual(
        clonedFilterModel.filters,
        [
          {
            type: 'dimension',
            field: 'age',
            parameters: {
              field: 'id',
            },
            operator: 'in',
            values: [1, 2, 3],
          },
          {
            type: 'dimension',
            field: 'container',
            parameters: {
              field: 'id',
            },
            operator: 'notin',
            values: [1],
          },
        ],
        'multi datasource filters has the datasource specified'
      );
    });
  });

  // TODO Fix test after moving to core
  skip('deliveryRuleForUser', function (assert) {
    assert.expect(1);

    return run(() => {
      return Store.findRecord('user', 'navi_user').then(() => {
        return Store.findRecord('dashboard', 2).then((dashboardModel) => {
          dashboardModel.user = {
            getUser: () => Store.peekRecord('user', 'navi_user'),
          };

          return dashboardModel.get('deliveryRuleForUser').then((rule) => {
            assert.deepEqual(rule, Store.peekRecord('deliveryRule', 3), 'deliveryRule is fetched for current user');
          });
        });
      });
    });
  });
});
