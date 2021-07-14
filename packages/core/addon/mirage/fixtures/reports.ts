/**
 * Copyright 2019, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * Reports Mock Data
 */
export default [
  {
    id: 1,
    title: 'Hyrule News',
    createdOn: '2015-01-01 00:00:00',
    updatedOn: '2015-01-01 00:00:00',
    ownerId: 'navi_user',
    deliveryRuleIds: [],
    visualization: {
      type: 'line-chart',
      version: 1,
      metadata: {
        axis: {
          y: {
            series: {
              type: 'dimension',
              config: {
                metric: 'adClicks',
                dimensionOrder: ['property'],
                dimensions: [
                  { name: 'Property 1', values: { property: '114' } },
                  { name: 'Property 2', values: { property: '100001' } },
                  { name: 'Property 3', values: { property: '100002' } },
                  { name: 'Property 4', values: { property: '101272' } },
                ],
              },
            },
          },
        },
      },
    },
    request: {
      logicalTable: {
        table: 'network',
        timeGrain: 'day',
      },
      metrics: [{ metric: 'adClicks' }, { metric: 'navClicks' }],
      dimensions: [{ dimension: 'property' }],
      filters: [],
      sort: [
        {
          metric: 'navClicks',
          direction: 'asc',
        },
      ],
      intervals: [
        {
          end: '2015-11-16 00:00:00.000',
          start: '2015-11-09 00:00:00.000',
        },
      ],
      bardVersion: 'v1',
      requestVersion: 'v1',
    },
  },
  {
    id: 2,
    title: 'Hyrule Ad&Nav Clicks',
    createdOn: '2016-04-01 11:00:00',
    updatedOn: '2016-04-01 11:00:00',
    ownerId: 'navi_user',
    deliveryRuleIds: [],
    visualization: {
      type: 'table',
      version: 1,
      metadata: {
        columns: [
          {
            field: 'dateTime',
            type: 'dateTime',
            displayName: 'Date',
          },
          {
            field: 'property',
            type: 'dimension',
            displayName: 'Property',
          },
          {
            field: 'adClicks',
            type: 'metric',
            displayName: 'Ad Clicks',
          },
          {
            field: 'navClicks',
            type: 'metric',
            displayName: 'Nav Clicks',
          },
        ],
      },
    },
    request: {
      logicalTable: {
        table: 'network',
        timeGrain: 'day',
      },
      metrics: [{ metric: 'adClicks' }, { metric: 'navClicks' }],
      dimensions: [
        {
          dimension: 'property',
        },
      ],
      filters: [
        {
          dimension: 'property',
          operator: 'in',
          field: 'id',
          values: ['114', '100001'],
        },
      ],
      intervals: [
        {
          end: '2015-11-16 00:00:00.000',
          start: '2015-11-09 00:00:00.000',
        },
      ],
      having: [{ metric: 'adClicks', operator: 'gt', values: [1000] }],
      bardVersion: 'v1',
      requestVersion: 'v1',
    },
  },
  {
    id: 3,
    title: 'Report 123',
    createdOn: '2015-01-01 02:00:00',
    updatedOn: '2015-01-01 02:00:00',
    ownerId: 'ciela',
    deliveryRuleIds: [1],
    visualization: {
      type: 'table',
      version: 1,
      metadata: {
        columns: [
          {
            field: 'dateTime',
            type: 'dateTime',
            displayName: 'Date',
          },
          {
            field: 'adClicks',
            type: 'metric',
            displayName: 'Ad Clicks',
          },
          {
            field: 'navClicks',
            type: 'metric',
            displayName: 'Nav Clicks',
          },
        ],
      },
    },
    request: {
      logicalTable: {
        table: 'network',
        timeGrain: 'day',
      },
      metrics: [{ metric: 'adClicks' }, { metric: 'navClicks' }],
      dimensions: [],
      filters: [],
      sort: [],
      intervals: [
        {
          end: '2015-11-16 00:00:00.000',
          start: '2015-11-09 00:00:00.000',
        },
      ],
      bardVersion: 'v1',
      requestVersion: 'v1',
    },
  },
  {
    id: 4,
    title: 'Report 12',
    createdOn: '2015-01-03 00:00:00',
    updatedOn: '2015-01-03 00:00:00',
    ownerId: 'navi_user',
    deliveryRuleIds: [2],
    visualization: {
      type: 'line-chart',
      version: 1,
      metadata: {
        axis: {
          y: {
            series: {
              type: 'metric',
              config: {
                metrics: ['adClicks', 'navClicks'],
              },
            },
          },
        },
      },
    },
    request: {
      logicalTable: {
        table: 'network',
        timeGrain: 'day',
      },
      metrics: [{ metric: 'adClicks' }, { metric: 'navClicks' }],
      dimensions: [],
      filters: [],
      sort: [],
      intervals: [
        {
          end: '2015-11-16 00:00:00.000',
          start: '2015-11-09 00:00:00.000',
        },
      ],
      bardVersion: 'v1',
      requestVersion: 'v1',
    },
  },
  {
    id: 5,
    title: 'Null Visualization',
    createdOn: '2015-07-01 00:00:00',
    updatedOn: '2015-07-01 00:00:00',
    ownerId: 'navi_user',
    deliveryRuleIds: [],
    visualization: {
      type: 'table',
      version: 1,
      metadata: {
        columns: [
          {
            field: 'dateTime',
            type: 'dateTime',
            displayName: 'Date',
          },
          {
            field: 'adClicks',
            type: 'metric',
            displayName: 'Ad Clicks',
          },
          {
            field: 'navClicks',
            type: 'metric',
            displayName: 'Nav Clicks',
          },
        ],
      },
    },
    request: {
      logicalTable: {
        table: 'network',
        timeGrain: 'day',
      },
      metrics: [{ metric: 'adClicks' }, { metric: 'navClicks' }],
      dimensions: [],
      filters: [],
      sort: [],
      intervals: [
        {
          end: '2015-11-16 00:00:00.000',
          start: '2015-11-09 00:00:00.000',
        },
      ],
      bardVersion: 'v1',
      requestVersion: 'v1',
    },
  },
  {
    id: 6,
    title: 'Invalid report',
    createdOn: '2015-04-01 00:00:00',
    updatedOn: '2015-04-01 00:00:00',
    ownerId: 'navi_user',
    deliveryRuleIds: [],
    visualization: null,
    request: {
      table: 'network',
      dataSource: 'bardOne',
      requestVersion: '2.0',
      limit: null,
      columns: [],
      filters: [],
      sorts: [],
    },
  },
  {
    id: 7,
    title: 'Revenue report 1',
    createdOn: '2015-01-01 00:00:00',
    updatedOn: '2015-01-01 00:00:00',
    ownerId: 'ciela',
    deliveryRuleIds: [],
    visualization: {
      type: 'table',
      version: 1,
      metadata: {
        columns: [
          {
            field: 'dateTime',
            type: 'dateTime',
            displayName: 'Date',
          },
          {
            field: 'revenue(currency=USD)',
            type: 'metric',
            displayName: 'Revenue (USD)',
          },
        ],
      },
    },
    request: {
      logicalTable: {
        table: 'tableA',
        timeGrain: 'day',
      },
      metrics: [
        {
          metric: 'revenue',
          parameters: {
            currency: 'USD',
          },
        },
      ],
      dimensions: [],
      filters: [],
      intervals: [
        {
          end: '2018-02-16 00:00:00.000',
          start: '2018-02-09 00:00:00.000',
        },
      ],
      bardVersion: 'v1',
      requestVersion: 'v1',
    },
  },
  {
    id: 8,
    title: 'Revenue report 2',
    createdOn: '2015-03-01 00:00:00',
    updatedOn: '2015-03-01 00:00:00',
    ownerId: 'navi_user',
    deliveryRuleIds: [],
    visualization: {
      type: 'table',
      version: 1,
      metadata: {
        columns: [
          {
            field: 'dateTime',
            type: 'dateTime',
            displayName: 'Date',
          },
          {
            field: 'property',
            type: 'dimension',
            displayName: 'Property',
          },
          {
            field: 'revenue(currency=USD)',
            type: 'metric',
            displayName: 'Revenue (USD)',
          },
          {
            field: 'revenue(currency=EUR)',
            type: 'metric',
            displayName: 'Revenue (EUR)',
          },
        ],
      },
    },
    request: {
      logicalTable: {
        table: 'tableA',
        timeGrain: 'day',
      },
      metrics: [
        {
          metric: 'revenue',
          parameters: {
            currency: 'USD',
          },
        },
        {
          metric: 'revenue',
          parameters: {
            currency: 'EUR',
          },
        },
      ],
      dimensions: [
        {
          dimension: 'property',
        },
      ],
      filters: [],
      intervals: [
        {
          end: '2018-02-16 00:00:00.000',
          start: '2018-02-09 00:00:00.000',
        },
      ],
      bardVersion: 'v1',
      requestVersion: 'v1',
    },
  },
  {
    id: 9,
    title: 'Report with unknown table',
    createdOn: '2015-02-01 00:00:00',
    updatedOn: '2015-02-01 00:00:00',
    ownerId: 'navi_user',
    deliveryRuleIds: [],
    visualization: {
      type: 'table',
      version: 1,
      metadata: {
        columns: [
          {
            field: 'dateTime',
            type: 'dateTime',
            displayName: 'Date',
          },
          {
            field: 'revenue(currency=USD)',
            type: 'metric',
            displayName: 'Revenue (USD)',
          },
        ],
      },
    },
    request: {
      logicalTable: {
        table: 'oak',
        timeGrain: 'day',
      },
      metrics: [
        {
          metric: 'revenue',
          parameters: {
            currency: 'USD',
          },
        },
      ],
      dimensions: [],
      filters: [],
      intervals: [
        {
          end: '2018-02-16 00:00:00.000',
          start: '2018-02-09 00:00:00.000',
        },
      ],
      bardVersion: 'v1',
      requestVersion: 'v1',
    },
  },
  {
    id: 10,
    title: 'Report with missing intervals',
    createdOn: '2018-01-01 00:00:00',
    updatedOn: '2018-01-01 00:00:00',
    ownerId: 'navi_user',
    deliveryRuleIds: [],
    visualization: {
      type: 'line-chart',
      version: 1,
      metadata: {
        axis: {
          y: {
            series: {
              type: 'metric',
              config: {
                metrics: ['uniqueIdentifier'],
              },
            },
          },
        },
      },
    },
    request: {
      logicalTable: {
        table: 'network',
        timeGrain: 'day',
      },
      metrics: [{ metric: 'uniqueIdentifier' }],
      dimensions: [],
      filters: [],
      sort: [],
      intervals: [
        {
          end: '2018-11-18 00:00:00.000',
          start: '2018-11-11 00:00:00.000',
        },
      ],
      bardVersion: 'v1',
      requestVersion: 'v1',
    },
  },
  {
    id: 11,
    title: 'old report without params',
    createdOn: '2015-01-01 00:00:00',
    updatedOn: '2015-01-01 00:00:00',
    ownerId: 'navi_user',
    deliveryRuleIds: [],
    visualization: {
      type: 'table',
      version: 1,
      metadata: {
        columns: [
          {
            field: 'dateTime',
            type: 'dateTime',
            displayName: 'Date',
          },
          {
            field: 'property',
            type: 'dimension',
            displayName: 'Property',
          },
          {
            field: { metric: 'revenue', parameters: {} },
            type: 'metric',
            displayName: 'Revenue',
          },
        ],
      },
    },
    request: {
      logicalTable: {
        table: 'tableA',
        timeGrain: 'day',
      },
      metrics: [
        {
          metric: 'revenue',
          parameters: {},
        },
      ],
      dimensions: [
        {
          dimension: 'property',
        },
      ],
      filters: [],
      intervals: [
        {
          end: '2018-02-16 00:00:00.000',
          start: '2018-02-09 00:00:00.000',
        },
      ],
      bardVersion: 'v1',
      requestVersion: 'v1',
    },
  },
  {
    id: 12,
    title: 'Report for different datasource',
    createdOn: '2020-01-01 00:00:00',
    updatedOn: '2020-01-01 00:00:00',
    ownerId: 'navi_user',
    deliveryRuleIds: [],
    visualization: {
      type: 'table',
      version: 1,
      metadata: {
        columns: [
          {
            field: 'dateTime',
            type: 'dateTime',
            displayName: 'Date',
          },
          {
            field: 'container',
            type: 'dimension',
            displayName: 'Container',
          },
          {
            field: 'displayCurrency',
            type: 'dimension',
            displayName: 'Display Currency',
          },
          {
            field: { metric: 'usedAmount', parameters: {} },
            type: 'metric',
            displayName: 'Used Amount',
          },
          {
            field: { metric: 'revenue', parameters: { currency: 'GIL' } },
            type: 'metric',
            displayName: 'Revenue (GIL)',
          },
        ],
      },
    },
    request: {
      logicalTable: {
        table: 'inventory',
        timeGrain: 'day',
      },
      metrics: [
        {
          metric: 'usedAmount',
          parameters: {},
        },
        {
          metric: 'revenue',
          parameters: { currency: 'GIL' },
        },
      ],
      dimensions: [
        {
          dimension: 'container',
        },
        {
          dimension: 'displayCurrency',
        },
      ],
      filters: [
        {
          dimension: 'container',
          field: 'id',
          operator: 'in',
          values: ['2'],
        },
      ],
      having: [
        {
          metric: 'usedAmount',
          operator: 'gt',
          values: [50],
        },
      ],
      intervals: [
        {
          end: 'current',
          start: 'P3D',
        },
      ],
      bardVersion: 'v1',
      requestVersion: 'v1',
      dataSource: 'bardTwo',
    },
  },
  {
    id: 13,
    title: 'RequestV2 testing report',
    createdOn: '2015-04-01 00:00:00',
    updatedOn: '2015-04-01 00:00:00',
    ownerId: 'navi_user',
    deliveryRuleIds: [],
    visualization: {
      type: 'table',
      version: 2,
      metadata: {
        columnAttributes: {
          c1: { canAggregateSubtotal: false },
          c3: { canAggregateSubtotal: false },
          c2: { canAggregateSubtotal: false },
        },
        showTotals: {},
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
          values: ['2015-10-02T00:00:00.000Z', '2015-10-14T00:00:00.000Z'],
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
        },
        {
          cid: 'c2',
          type: 'metric',
          field: 'adClicks',
          parameters: {},
        },
        {
          cid: 'c3',
          type: 'dimension',
          field: 'property',
          parameters: { field: 'id' },
        },
      ],
      sorts: [],
    },
  },
  {
    id: 14,
    title: 'RequestV2 multi-param testing report',
    createdOn: '2015-04-01 00:00:00',
    updatedOn: '2015-04-01 00:00:00',
    ownerId: 'navi_user',
    deliveryRuleIds: [],
    visualization: {
      type: 'table',
      version: 2,
      metadata: {
        columnAttributes: {
          c1: { canAggregateSubtotal: false },
          c3: { canAggregateSubtotal: false },
          c2: { canAggregateSubtotal: false },
        },
        showTotals: {},
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
          dataSource: 'bardOne',
          field: 'network.dateTime',
          parameters: { grain: 'day' },
          operator: 'bet',
          values: ['2015-10-02T00:00:00.000Z', '2015-10-14T00:00:00.000Z'],
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
        },
        {
          cid: 'c2',
          type: 'metric',
          field: 'multipleParamMetric',
          parameters: {
            currency: 'EUR',
            age: '6',
          },
        },
        {
          cid: 'c3',
          type: 'dimension',
          field: 'property',
          parameters: { field: 'id' },
        },
      ],
      sorts: [],
    },
  },
  {
    id: 15,
    title: 'Unownerized',
    createdOn: '2015-04-01 00:00:00',
    updatedOn: '2015-04-01 00:00:00',
    ownerId: 'navi_user',
    deliveryRuleIds: [],
    visualization: {
      type: 'table',
      version: 2,
      metadata: {
        columnAttributes: {
          c1: { canAggregateSubtotal: false },
        },
        showTotals: {},
      },
    },
    request: {
      table: 'protected',
      dataSource: 'bardOne',
      limit: null,
      requestVersion: '2.0',
      filters: [
        {
          type: 'timeDimension',
          dataSource: 'bardOne',
          field: 'protected.dateTime',
          parameters: { grain: 'day' },
          operator: 'bet',
          values: ['2015-10-02T00:00:00.000Z', '2015-10-14T00:00:00.000Z'],
        },
      ],
      columns: [
        {
          cid: 'c1',
          field: 'protected.dateTime',
          parameters: {
            grain: 'day',
          },
          type: 'timeDimension',
        },
      ],
      sorts: [],
    },
  },
];
