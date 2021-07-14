import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { setupMirage } from 'ember-cli-mirage/test-support';
import hbs from 'htmlbars-inline-precompile';
import NaviFactResponse from 'navi-data/models/navi-fact-response';

const TEMPLATE = hbs`
  <PrintReportView
    @report={{this.report}}
    @response={{this.response}}
  />`;

const RESPONSE = NaviFactResponse.create({
  rows: [
    {
      adClicks: 1707077,
      'network.dateTime(grain=day)': '2015-11-09 00:00:00.000',
    },
    {
      adClicks: 1659538,
      'network.dateTime(grain=day)': '2015-11-09 00:00:00.000',
    },
    {
      adClicks: 1977070,
      'network.dateTime(grain=day)': '2015-11-11 00:00:00.000',
    },
    {
      adClicks: 1755382,
      'network.dateTime(grain=day)': '2015-11-12 00:00:00.000',
    },
    {
      adClicks: 1348750,
      'network.dateTime(grain=day)': '2015-11-13 00:00:00.000',
    },
    {
      adClicks: 856732,
      'network.dateTime(grain=day)': '2015-11-14 00:00:00.000',
    },
    {
      adClicks: 716731,
      'network.dateTime(grain=day)': '2015-11-14 00:00:00.000',
    },
    {
      adClicks: 399790,
      'network.dateTime(grain=day)': '2015-11-14 00:00:00.000',
    },
    {
      adClicks: 699490,
      'network.dateTime(grain=day)': '2015-11-14 00:00:00.000',
    },
  ],
});

module('Integration | Component | print report view', function (hooks) {
  setupRenderingTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function () {
    const metadataService = this.owner.lookup('service:navi-metadata');
    const store = this.owner.lookup('service:store');

    await metadataService.loadMetadata();
    this.set('response', RESPONSE);

    //set report object
    this.set(
      'report',
      store.createRecord('report', {
        id: 13,
        title: 'RequestV2 testing report',
        createdOn: '2015-04-01 00:00:00',
        updatedOn: '2015-04-01 00:00:00',
        ownerId: 'navi_user',
        deliveryRuleIds: [],
        visualization: {
          type: 'line-chart',
          version: 2,
          metadata: {
            style: {
              area: false,
              stacked: false,
            },
            axis: {
              y: {
                series: {
                  type: 'metric',
                  config: {},
                },
              },
            },
          },
        },
        request: {
          table: 'network',
          dataSource: 'bardOne',
          limit: null,
          requestVersion: '2.0',
          filters: [
            {
              type: 'timeDimension',
              source: 'bardOne',
              field: 'network.dateTime',
              parameters: { grain: 'day' },
              operator: 'bet',
              values: ['11-04-2020', '11-06-2020'],
            },
          ],
          columns: [
            {
              cid: 'c1',
              field: 'network.dateTime',
              parameters: {
                grain: 'day',
              },
              type: 'timeDimension',
              source: 'bardOne',
            },
            {
              cid: 'c2',
              type: 'metric',
              field: 'adClicks',
              parameters: {},
              source: 'bardOne',
            },
          ],
          sorts: [],
        },
      })
    );
  });

  test('visualization is chosen based on report', async function (assert) {
    assert.expect(3);

    await render(TEMPLATE);

    assert.dom('.line-chart-widget').exists('Visualization is rendered based on the report visualization type');

    this.set('report.visualization', {
      type: 'table',
      version: 2,
      metadata: {
        columnAttributes: {
          c1: { canAggregateSubtotal: false },
          c2: { canAggregateSubtotal: false },
        },
        showTotals: {},
      },
    });

    assert.dom('.table-widget').exists('Rendered visualization updates with report');

    assert.dom('.line-chart-widget').doesNotExist('Old visualization is removed');
  });

  test('no data', async function (assert) {
    assert.expect(1);
    this.set('response', {
      rows: [],
      meta: {
        pagination: {
          currentPage: 1,
          rowsPerPage: 10000,
          numberOfResults: 0,
        },
      },
    });

    await render(TEMPLATE);

    assert
      .dom('.print-report-view__visualization-no-results')
      .hasText('No results available.', 'A message is displayed when the response has no data');
  });
});
