import { all } from 'rsvp';
import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import config from 'ember-get-config';
import Mirage from 'ember-cli-mirage';
import DeliverableItem from 'navi-core/models/deliverable-item';
import { unset } from 'lodash-es';

let Store;

const ExpectedRequest = {
    filters: [
      {
        operator: 'bet',
        values: ['2015-11-09T00:00:00.000Z', '2015-11-15T00:00:00.000Z'],
        field: 'network.dateTime',
        parameters: {
          grain: 'day',
        },
        type: 'timeDimension',
      },
    ],
    columns: [
      {
        alias: null,
        field: 'network.dateTime',
        parameters: {
          grain: 'day',
        },
        type: 'timeDimension',
      },
      {
        alias: null,
        field: 'property',
        parameters: {
          field: 'id',
        },
        type: 'dimension',
      },
      {
        alias: null,
        field: 'adClicks',
        parameters: {},
        type: 'metric',
      },
      {
        alias: null,
        field: 'navClicks',
        parameters: {},
        type: 'metric',
      },
    ],
    table: 'network',
    sorts: [
      {
        direction: 'asc',
        field: 'navClicks',
        parameters: {},
        type: 'metric',
      },
    ],
    limit: null,
    requestVersion: '2.0',
    dataSource: 'bardOne',
  },
  ExpectedReport = {
    data: {
      attributes: {
        title: 'Hyrule News',
        request: ExpectedRequest,
        visualization: {
          type: 'line-chart',
          version: 2,
          metadata: {
            axis: {
              y: {
                series: {
                  type: 'dimension',
                  config: {
                    metricCid: 'cid_adClicks',
                    dimensions: [
                      { name: 'Property 1', values: { 'cid_property(field=id)': '114' } },
                      { name: 'Property 2', values: { 'cid_property(field=id)': '100001' } },
                      { name: 'Property 3', values: { 'cid_property(field=id)': '100002' } },
                      { name: 'Property 4', values: { 'cid_property(field=id)': '101272' } },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      relationships: {
        owner: {
          data: {
            type: 'users',
            id: 'navi_user',
          },
        },
      },
      type: 'reports',
    },
  };

module('Unit | Model | report', function (hooks) {
  setupTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function () {
    Store = this.owner.lookup('service:store');
    await this.owner.lookup('service:navi-metadata').loadMetadata();
  });

  test('Retrieving records', async function (assert) {
    assert.expect(6);

    await run(async () => {
      const report = await Store.findRecord('report', 1);
      const cids = report.request.columns.mapBy('cid');
      const cidToReadable = report.request.columns.reduce((map, col) => {
        map[col.cid] = `cid_${col.canonicalName}`;
        return map;
      }, {});
      const vizConfig = report.visualization.metadata.axis.y.series.config;
      vizConfig.metricCid = cidToReadable[vizConfig.metricCid];
      vizConfig.dimensions.forEach((series) => {
        Object.keys(series.values).forEach((key) => {
          series.values[cidToReadable[key]] = series.values[key];
          delete series.values[key];
        });
      });
      const serialized = report.serialize();

      cids.forEach((cid, idx) => {
        assert.equal(cid.length, 10, 'column cid has proper value');
        //TODO remove this once fixtures are converted request v2
        //remove from validation since cid value is non deterministic
        unset(serialized, `data.attributes.request.columns[${idx}].cid`);
      });

      assert.ok(report instanceof DeliverableItem, 'Report should be instance of DeliverableItem');
      assert.deepEqual(serialized, ExpectedReport, 'Fetched report has all attributes as expected');
    });
  });

  test('Coalescing find requests', async function (assert) {
    assert.expect(1);

    this.server.urlPrefix = `${config.navi.appPersistence.uri}`;
    this.server.get('/reports', (schema, request) => {
      assert.equal(
        request.queryParams.filter,
        'id=in=(1,2,4)',
        'Multiple find requests are grouped using filter query param'
      );

      // Test case doesn't care about actual repsonse, so skip mocking it
      return new Mirage.Response(204);
    });

    await run(() =>
      all([
        this.owner.lookup('service:store').findRecord('report', 1),
        this.owner.lookup('service:store').findRecord('report', 2),
        this.owner.lookup('service:store').findRecord('report', 4),
      ]).catch(() => 'Ignore empty response error')
    );
  });

  test('Saving records', async function (assert) {
    assert.expect(1);

    await run(async () => {
      const user = await Store.findRecord('user', 'navi_user');
      const report = {
        title: 'New Report',
        owner: user,
        request: null,
      };

      const savedReport = await Store.createRecord('report', report).save();
      const id = savedReport.get('id');
      Store.unloadAll('report'); // flush cache/store

      await Store.findRecord('report', id);
      assert.ok(true, 'Newly created report is persisted');
    });
  });

  test('Cloning Reports', async function (assert) {
    assert.expect(2);

    await run(async () => {
      const model = await Store.findRecord('report', 1);
      const clonedModel = model.clone(Store);
      const expectedTitle = model.toJSON().title;

      assert.equal(clonedModel.title, expectedTitle, 'The report model is cloned as expected');

      assert.deepEqual(
        clonedModel.visualization.toJSON(),
        model.get('visualization').toJSON(),
        'Visualization config is also cloned'
      );
    });
  });

  test('isOwner', async function (assert) {
    assert.expect(2);

    await run(async () => {
      // Make sure user is loaded into store
      await Store.findRecord('user', 'navi_user');

      const report3 = await Store.findRecord('report', 3);
      assert.notOk(report3.get('isOwner'), 'isOwner returns false when owner does not match user');

      const report1 = await Store.findRecord('report', 1);
      assert.ok(report1.get('isOwner'), 'isOwner returns true when user is the owner of the report');
    });
  });

  test('isFavorite', async function (assert) {
    assert.expect(2);

    await run(async () => {
      // Make sure user is loaded into store
      await Store.findRecord('user', 'navi_user');
      const report1 = await Store.findRecord('report', 1);

      assert.notOk(report1.get('isFavorite'), 'isFavorite returns false when report is not in favorite list');

      const report2 = await Store.findRecord('report', 2);
      assert.ok(report2.get('isFavorite'), 'isFavorite returns true when report is in favorite list');
    });
  });

  test('tempId', async function (assert) {
    assert.expect(3);

    await run(async () => {
      const owner = await Store.findRecord('user', 'navi_user');
      const report = Store.createRecord('report', {
        owner,
        request: null,
      });

      assert.ok(!!report.tempId, '`tempId` exists when `id` does not');

      assert.equal(report.tempId, report.tempId, '`tempId` is always the same value');

      await report.save();
      assert.notOk(!!report.tempId, '`tempId` is null when `id` exists');
    });
  });

  test('delivery rules relationship', async function (assert) {
    assert.expect(1);

    await run(async () => {
      const reportModel = await Store.findRecord('report', 3);
      const rules = await reportModel.get('deliveryRules');

      assert.equal(
        rules.get('firstObject'),
        Store.peekRecord('deliveryRule', 1),
        'report deliveryRule property contains deliveryRule model'
      );
    });
  });

  test('Validations', async function (assert) {
    assert.expect(5);

    await run(async () => {
      const reportModel = await Store.findRecord('report', 1);
      const s1 = await reportModel.validate();

      assert.ok(s1.validations.get('isValid'), 'report is valid');
      assert.equal(s1.validations.get('messages').length, 0, 'There are no validation errors');
      reportModel.set('title', '');

      const s2 = await reportModel.validate();
      assert.notOk(s2.validations.get('isValid'), 'report is invalid');
      assert.equal(s2.validations.get('messages').length, 1, 'There is one validation error');
      assert.notOk(s2.model.get('validations.attrs.title.isValid'), 'Title must have a value');
    });
  });

  test('deliveryRuleForUser', async function (assert) {
    assert.expect(1);

    await run(async () => {
      const user = await Store.findRecord('user', 'navi_user');
      const reportModel = await Store.findRecord('report', 3);

      Object.defineProperty(reportModel, 'user', {
        value: { getUser: () => user },
      });

      const rule = await reportModel.get('deliveryRuleForUser');
      assert.deepEqual(rule, Store.peekRecord('deliveryRule', 1), 'deliveryRule is fetched for current user');
    });
  });
});
