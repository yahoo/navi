import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';

let Store;

module('Unit | Serializer | Report', function (hooks) {
  setupTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function () {
    Store = this.owner.lookup('service:store');
    await this.owner.lookup('service:navi-metadata').loadMetadata();
  });

  test('Serializing record', async function (assert) {
    assert.expect(3);

    let expectedResult = {
      data: {
        attributes: {
          request: {
            columns: [
              {
                alias: null,
                cid: 'c1',
                field: 'network.dateTime',
                parameters: {
                  grain: 'day',
                },
                type: 'timeDimension',
              },
              {
                alias: null,
                cid: 'c2',
                field: 'adClicks',
                parameters: {},
                type: 'metric',
              },
              {
                alias: null,
                cid: 'c3',
                field: 'property',
                parameters: {
                  field: 'id',
                },
                type: 'dimension',
              },
            ],
            dataSource: 'bardOne',
            filters: [
              {
                field: 'network.dateTime',
                operator: 'bet',
                parameters: {
                  grain: 'day',
                },
                type: 'timeDimension',
                values: ['2015-10-02T00:00:00.000Z', '2015-10-14T00:00:00.000Z'],
              },
            ],
            limit: null,
            requestVersion: '2.0',
            sorts: [],
            table: 'network',
          },
          title: 'RequestV2 testing report',
          visualization: {
            metadata: {
              columnAttributes: {
                c1: {
                  canAggregateSubtotal: false,
                },
                c2: {
                  canAggregateSubtotal: false,
                },
                c3: {
                  canAggregateSubtotal: false,
                },
              },
              showTotals: {},
            },
            type: 'table',
            version: 2,
          },
        },
        relationships: {
          owner: {
            data: {
              id: 'navi_user',
              type: 'users',
            },
          },
        },
        type: 'reports',
      },
    };

    let report = await Store.findRecord('report', 13);
    assert.ok(report.get('createdOn'), 'Report model contains "createdOn" attribute');

    assert.ok(report.get('updatedOn'), 'Report model contains "updatedOn" attribute');

    assert.deepEqual(
      report.serialize(),
      expectedResult,
      'Serialize method does not serialize createdOn and updatedOn attributes as expected'
    );
  });

  test('Serializing multi param request', async function (assert) {
    assert.expect(1);

    let expectedResult = {
      data: {
        attributes: {
          request: {
            columns: [
              {
                alias: null,
                cid: 'c1',
                field: 'network.dateTime',
                parameters: {
                  grain: 'day',
                },
                type: 'timeDimension',
              },
              {
                alias: null,
                cid: 'c2',
                field: 'multipleParamMetric',
                parameters: {
                  age: '6',
                  currency: 'EUR',
                },
                type: 'metric',
              },
              {
                alias: null,
                cid: 'c3',
                field: 'property',
                parameters: {
                  field: 'id',
                },
                type: 'dimension',
              },
            ],
            dataSource: 'bardOne',
            filters: [
              {
                field: 'network.dateTime',
                operator: 'bet',
                parameters: {
                  grain: 'day',
                },
                type: 'timeDimension',
                values: ['2015-10-02T00:00:00.000Z', '2015-10-14T00:00:00.000Z'],
              },
            ],
            limit: null,
            requestVersion: '2.0',
            sorts: [],
            table: 'network',
          },
          title: 'RequestV2 multi-param testing report',
          visualization: {
            metadata: {
              columnAttributes: {
                c1: {
                  canAggregateSubtotal: false,
                },
                c2: {
                  canAggregateSubtotal: false,
                },
                c3: {
                  canAggregateSubtotal: false,
                },
              },
              showTotals: {},
            },
            type: 'table',
            version: 2,
          },
        },
        relationships: {
          owner: {
            data: {
              id: 'navi_user',
              type: 'users',
            },
          },
        },
        type: 'reports',
      },
    };

    let report = await Store.findRecord('report', 14);

    assert.deepEqual(
      report.serialize(),
      expectedResult,
      'Serialize report with parameterized metric serializes as expected'
    );
  });
});
