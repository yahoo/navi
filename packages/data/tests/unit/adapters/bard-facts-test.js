import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Pretender from 'pretender';
import config from 'ember-get-config';
import { assign } from '@ember/polyfills';
import { cloneDeep } from 'lodash-es';

const HOST = config.navi.dataSources[0].uri;
const HOST2 = config.navi.dataSources[1].uri;

const TestRequest = {
    logicalTable: {
      table: 'table1',
      timeGrain: 'grain1'
    },
    metrics: [{ metric: 'm1' }, { metric: 'm2' }, { metric: 'r', parameters: { p: '123', as: 'a' } }],
    dimensions: [{ dimension: 'd1' }, { dimension: 'd2' }],
    filters: [
      { dimension: 'd3', operator: 'in', values: ['v1', 'v2'] },
      {
        dimension: 'd4',
        operator: 'in',
        values: ['v3', 'v4']
      },
      { dimension: 'd5', operator: 'notnull', values: [''] }
    ],
    intervals: [
      {
        start: '2015-01-03',
        end: '2015-01-04'
      }
    ],
    having: [
      {
        metric: 'm1',
        operator: 'gt',
        values: [0]
      }
    ]
  },
  TestRequestWithRollup = Object.assign(cloneDeep(TestRequest), {
    rollup: { columns: [{ dimension: 'dateTime' }, { dimension: 'd3' }, { dimension: 'd5' }], grandTotal: true }
  }),
  Response = {
    rows: [
      {
        table: 'table1',
        grain: 'grain1'
      }
    ],
    meta: {
      test: true
    }
  },
  MockBardResponse = [200, { 'Content-Type': 'application/json' }, JSON.stringify(Response)];

let Adapter,
  Server,
  aliasFunction = alias => (alias === 'a' ? 'r(p=123)' : alias);

module('Unit | Bard facts Adapter', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    Adapter = this.owner.lookup('adapter:bard-facts');

    //setup Pretender
    Server = new Pretender(function() {
      this.get(`${HOST}/v1/data/table1/grain1/d1/d2/`, function(request) {
        if (request.queryParams.page && request.queryParams.perPage) {
          let paginatedResponse = assign({}, Response);
          paginatedResponse.meta.pagination = {
            page: request.queryParams.page,
            perPage: request.queryParams.perPage
          };
          return [200, { 'Content-Type': 'application/json' }, JSON.stringify(paginatedResponse)];
        }

        return MockBardResponse;
      });
    });
  });

  hooks.afterEach(function() {
    //shutdown pretender
    Server.shutdown();
  });

  test('_buildDimensionsPath', function(assert) {
    assert.expect(4);

    let singleDim = {
      dimensions: [{ dimension: 'd1' }]
    };
    assert.equal(
      Adapter._buildDimensionsPath(singleDim),
      '/d1',
      '_buildDimensionsPath built the correct string for a single dimension'
    );

    let manyDims = {
      dimensions: [{ dimension: 'd1' }, { dimension: 'd2' }]
    };
    assert.equal(
      Adapter._buildDimensionsPath(manyDims),
      '/d1/d2',
      '_buildDimensionsPath built the correct string for many dimensions'
    );

    let duplicateDims = {
      dimensions: [{ dimension: 'd1' }, { dimension: 'd2' }, { dimension: 'd1' }]
    };
    assert.equal(
      Adapter._buildDimensionsPath(duplicateDims),
      '/d1/d2',
      '_buildDimensionsPath built the correct string for duplicate dimensions'
    );

    let noDims = {};
    assert.equal(
      Adapter._buildDimensionsPath(noDims),
      '',
      '_buildDimensionsPath built the correct string for no dimensions'
    );
  });

  test('_buildDateTimeParam', function(assert) {
    assert.expect(2);

    let singleInterval = {
      intervals: [{ start: 'start', end: 'end' }]
    };
    assert.equal(
      Adapter._buildDateTimeParam(singleInterval),
      'start/end',
      '_buildDateTimeParam built the correct string for a single interval'
    );

    let manyIntervals = {
      intervals: [
        { start: 'start1', end: 'end1' },
        { start: 'start2', end: 'end2' }
      ]
    };
    assert.equal(
      Adapter._buildDateTimeParam(manyIntervals),
      'start1/end1,start2/end2',
      '_buildDateTimeParam built the correct string for many intervals'
    );
  });

  test('_buildMetricsParam', function(assert) {
    assert.expect(5);

    let singleMetric = {
      metrics: [{ metric: 'm1' }]
    };
    assert.equal(
      Adapter._buildMetricsParam(singleMetric),
      'm1',
      '_buildMetricsParam built the correct string for a single metric'
    );

    let manyMetrics = {
      metrics: [{ metric: 'm1' }, { metric: 'm2' }]
    };
    assert.equal(
      Adapter._buildMetricsParam(manyMetrics),
      'm1,m2',
      '_buildMetricsParam built the correct string for many metrics'
    );

    let differentParams = {
      metrics: [
        { metric: 'm1' },
        { metric: 'm2' },
        { metric: 'r', parameters: { p: '123', as: 'm1' } },
        { metric: 'r', parameters: { p: 'xyz', as: 'm2' } }
      ]
    };
    assert.equal(
      Adapter._buildMetricsParam(differentParams),
      'm1,m2,r(p=123),r(p=xyz)',
      '_buildMetricsParam built the correct string for different parameters'
    );

    let duplicateMetrics = {
      metrics: [
        { metric: 'm1' },
        { metric: 'm2' },
        { metric: 'm1' },
        { metric: 'r', parameters: { p: '123', as: 'm1' } },
        { metric: 'r', parameters: { p: '123', as: 'm2' } }
      ]
    };
    assert.equal(
      Adapter._buildMetricsParam(duplicateMetrics),
      'm1,m2,r(p=123)',
      '_buildMetricsParam built the correct string for duplicate metrics'
    );

    let nullParams = {
      metrics: [
        { metric: 'm1' },
        { metric: 'm2' },
        { metric: 'r', parameters: { p: '123', q: 'bar' } },
        { metric: 'r', parameters: { p: 'xyz', q: null } },
        { metric: 'r', parameters: { p: 'tuv', q: undefined } }
      ]
    };
    assert.equal(
      Adapter._buildMetricsParam(nullParams),
      'm1,m2,r(p=123,q=bar),r(p=xyz),r(p=tuv)',
      '_buildMetricsParam built correctly with null parameter values'
    );
  });

  test('_buildFiltersParam', function(assert) {
    assert.expect(7);

    let singleFilter = {
      filters: [{ dimension: 'd1', field: 'desc', operator: 'in', values: ['v1', 'v2'] }]
    };
    assert.equal(
      Adapter._buildFiltersParam(singleFilter),
      'd1|desc-in["v1","v2"]',
      '_buildFiltersParam built the correct string for a single filter'
    );

    let manyFilters = {
      filters: [
        {
          dimension: 'd1',
          field: 'desc',
          operator: 'in',
          values: ['v1', 'v2']
        },
        {
          dimension: 'd2',
          field: 'id',
          operator: 'notin',
          values: ['v3', 'v4']
        }
      ]
    };
    assert.equal(
      Adapter._buildFiltersParam(manyFilters),
      'd1|desc-in["v1","v2"],d2|id-notin["v3","v4"]',
      '_buildFiltersParam built the correct string for many filters'
    );

    let noFilters = {};
    assert.equal(
      Adapter._buildFiltersParam(noFilters),
      undefined,
      '_buildFiltersParam returns undefined with no filters'
    );

    let emptyFilters = { filters: [] };
    assert.equal(
      Adapter._buildFiltersParam(emptyFilters),
      undefined,
      '_buildFiltersParam returns undefined with empty filters'
    );

    let commaFilters = {
      filters: [{ dimension: 'd3', field: 'id', operator: 'in', values: ['with, comma', 'no comma'] }]
    };
    assert.equal(
      Adapter._buildFiltersParam(commaFilters),
      'd3|id-in["with, comma","no comma"]',
      '_buildFiltersParam quotes values correctly with commas'
    );

    let noIdFilters = {
      filters: [{ dimension: 'd3', operator: 'in', values: ['with, comma', 'no comma'] }]
    };
    assert.equal(
      Adapter._buildFiltersParam(noIdFilters),
      'd3|id-in["with, comma","no comma"]',
      '_buildFiltersParam defaults to "id" field'
    );

    let quoteFilters = {
      filters: [{ dimension: 'd3', field: 'id', operator: 'in', values: ['with "quote"', 'but why'] }]
    };
    assert.equal(
      Adapter._buildFiltersParam(quoteFilters),
      'd3|id-in["with ""quote""","but why"]',
      '_buildFiltersParam correctly escapes " in filters'
    );
  });

  test('_buildSortParam', function(assert) {
    assert.expect(8);

    let singleSort = {
      sort: [
        {
          metric: 'm1',
          direction: 'asc'
        }
      ]
    };
    assert.equal(
      Adapter._buildSortParam(singleSort),
      'm1|asc',
      '_buildSortParam built the correct string for a single sort'
    );

    let sortNoDirection = {
      sort: [
        {
          metric: 'm1'
        }
      ]
    };
    assert.equal(
      Adapter._buildSortParam(sortNoDirection),
      'm1|desc',
      '_buildSortParam uses desc as default sort direction'
    );

    let manySorts = {
      sort: [
        {
          metric: 'm1',
          direction: 'asc'
        },
        {
          metric: 'm2',
          direction: 'asc'
        }
      ]
    };
    assert.equal(
      Adapter._buildSortParam(manySorts),
      'm1|asc,m2|asc',
      '_buildSortParam built the correct string for multiple sorts'
    );

    assert.equal(
      Adapter._buildSortParam(
        {
          sort: [
            {
              metric: 'a',
              direction: 'asc'
            }
          ]
        },
        aliasFunction
      ),
      'r(p=123)|asc',
      'sort param with aliases work'
    );

    assert.equal(
      Adapter._buildSortParam(
        {
          sort: [
            {
              metric: 'a',
              direction: 'asc'
            },
            {
              metric: 'm1',
              direction: 'desc'
            }
          ]
        },
        aliasFunction
      ),
      'r(p=123)|asc,m1|desc',
      'sort param with aliases mixed with non aliases work'
    );

    let noSorts = {};
    assert.equal(Adapter._buildSortParam(noSorts), undefined, '_buildSortParam returns undefined with no sort');

    let emptySorts = { sort: [] };
    assert.equal(Adapter._buildSortParam(emptySorts), undefined, '_buildSortParam returns undefined with empty sort');

    let invalidSort = {
      sort: [
        { metric: 'valid1' },
        { metric: 'valid2', direction: 'asc' },
        { metric: 'valid3', direction: 'desc' },
        { metric: 'invalid', direction: 'foo' }
      ]
    };
    assert.throws(
      () => {
        Adapter._buildSortParam(invalidSort);
      },
      /'foo' is not a valid sort direction \(desc,asc\)/,
      '_buildSortParam throws error when invalid sort is given'
    );
  });

  test('_buildHavingParam', function(assert) {
    assert.expect(6);

    let singleHaving = {
      having: [
        {
          metric: 'm1',
          operator: 'gt',
          values: [0]
        }
      ]
    };
    assert.equal(
      Adapter._buildHavingParam(singleHaving),
      'm1-gt[0]',
      '_buildHavingParam built the correct string for a single having'
    );

    let manyHavings = {
      having: [
        {
          metric: 'm1',
          operator: 'gt',
          values: [0]
        },
        {
          metric: 'm2',
          operator: 'lte',
          values: [10]
        }
      ]
    };
    assert.equal(
      Adapter._buildHavingParam(manyHavings),
      'm1-gt[0],m2-lte[10]',
      '_buildHavingParam built the correct string for multiple having'
    );

    let noHavings = {};
    assert.equal(Adapter._buildHavingParam(noHavings), undefined, '_buildHavingParam returns undefined with no having');

    let emptyHavings = { having: [] };
    assert.equal(
      Adapter._buildHavingParam(emptyHavings),
      undefined,
      '_buildHavingParam returns undefined with empty having'
    );

    let havingValueArray = {
      having: [
        {
          metric: 'm1',
          operator: 'gt',
          values: [1, 2, 3]
        }
      ]
    };
    assert.equal(
      Adapter._buildHavingParam(havingValueArray),
      'm1-gt[1,2,3]',
      '_buildHavingParam built the correct string when having a `values` array'
    );

    let aliasedHaving = {
      having: [
        {
          metric: 'm1',
          operator: 'gt',
          values: [1, 2, 3]
        },
        {
          metric: 'a',
          operator: 'lt',
          values: [50]
        }
      ]
    };

    assert.equal(
      Adapter._buildHavingParam(aliasedHaving, aliasFunction),
      'm1-gt[1,2,3],r(p=123)-lt[50]',
      '_buildHavingParam built the correct string when having a `values` array'
    );
  });

  test('_buildRollupParam', function(assert) {
    assert.expect(3);

    assert.equal(Adapter._buildRollupParam({}), '', 'Returns empty string with no rollup property');

    assert.equal(Adapter._buildRollupParam({ rollup: { columns: [] } }), '', 'Returns empty string with empty columns');

    assert.equal(
      Adapter._buildRollupParam({
        rollup: { columns: [{ dimension: 'dateTime' }, { dimension: 'property' }, { dimension: 'userDeviceType' }] }
      }),
      'dateTime,property,userDeviceType',
      'Returns dimension name in correct order comma separated'
    );
  });

  test('_buildURLPath', function(assert) {
    assert.expect(3);

    assert.equal(
      Adapter._buildURLPath(TestRequest),
      `${HOST}/v1/data/table1/grain1/d1/d2/`,
      '_buildURLPath correctly built the URL path for the provided request when a host is not configured'
    );

    assert.equal(
      Adapter._buildURLPath(TestRequest),
      `${HOST}/v1/data/table1/grain1/d1/d2/`,
      '_buildURLPath correctly built the URL path for the provided request when a host is configured'
    );

    assert.equal(
      Adapter._buildURLPath(TestRequestWithRollup),
      `${HOST}/v1/data/table1/grain1/d1/d2/__rollupMask/`,
      '_buildPath adds rollup mask dimension when rollups are requested'
    );
  });

  test('_buildQuery', function(assert) {
    assert.expect(8);

    assert.deepEqual(
      Adapter._buildQuery(TestRequest),
      {
        dateTime: '2015-01-03/2015-01-04',
        filters: 'd3|id-in["v1","v2"],d4|id-in["v3","v4"],d5|id-notnull[""]',
        metrics: 'm1,m2,r(p=123)',
        having: 'm1-gt[0]',
        format: 'json'
      },
      '_buildQuery correctly built the query object for the provided request'
    );

    let noFiltersAndNoHavings = assign({}, TestRequest, {
      filters: [],
      having: []
    });
    assert.deepEqual(
      Adapter._buildQuery(noFiltersAndNoHavings),
      {
        dateTime: '2015-01-03/2015-01-04',
        metrics: 'm1,m2,r(p=123)',
        format: 'json'
      },
      '_buildQuery correctly built the query object for a request with no filters and no having'
    );

    assert.deepEqual(
      Adapter._buildQuery(TestRequest, { format: 'jsonApi' }),
      {
        dateTime: '2015-01-03/2015-01-04',
        filters: 'd3|id-in["v1","v2"],d4|id-in["v3","v4"],d5|id-notnull[""]',
        metrics: 'm1,m2,r(p=123)',
        having: 'm1-gt[0]',
        format: 'jsonApi'
      },
      '_buildQuery sets non default format if format is set in the options object'
    );

    let sortRequest = assign({}, TestRequest, { sort: [{ metric: 'm1' }] });
    assert.deepEqual(
      Adapter._buildQuery(sortRequest),
      {
        dateTime: '2015-01-03/2015-01-04',
        filters: 'd3|id-in["v1","v2"],d4|id-in["v3","v4"],d5|id-notnull[""]',
        format: 'json',
        metrics: 'm1,m2,r(p=123)',
        having: 'm1-gt[0]',
        sort: 'm1|desc'
      },
      '_buildQuery correctly built the query object for a request with sort'
    );

    sortRequest = assign({}, TestRequest, { sort: [{ metric: 'a' }] });
    assert.deepEqual(
      Adapter._buildQuery(sortRequest),
      {
        dateTime: '2015-01-03/2015-01-04',
        filters: 'd3|id-in["v1","v2"],d4|id-in["v3","v4"],d5|id-notnull[""]',
        format: 'json',
        metrics: 'm1,m2,r(p=123)',
        having: 'm1-gt[0]',
        sort: 'r(p=123)|desc'
      },
      '_buildQuery correctly built the query object for an aliased with sort'
    );

    let havingRequest = assign({}, TestRequest, {
      having: [{ metric: 'a', operator: 'lt', values: [50] }]
    });
    assert.deepEqual(
      Adapter._buildQuery(havingRequest),
      {
        dateTime: '2015-01-03/2015-01-04',
        filters: 'd3|id-in["v1","v2"],d4|id-in["v3","v4"],d5|id-notnull[""]',
        format: 'json',
        metrics: 'm1,m2,r(p=123)',
        having: 'r(p=123)-lt[50]'
      },
      '_buildQuery correctly built the query object for an aliased having'
    );

    assert.deepEqual(
      Adapter._buildQuery(TestRequest, { cache: false }),
      {
        dateTime: '2015-01-03/2015-01-04',
        filters: 'd3|id-in["v1","v2"],d4|id-in["v3","v4"],d5|id-notnull[""]',
        metrics: 'm1,m2,r(p=123)',
        having: 'm1-gt[0]',
        format: 'json',
        _cache: false
      },
      '_buildQuery correctly built the query object for a request without caching'
    );

    assert.deepEqual(
      Adapter._buildQuery(TestRequestWithRollup),
      {
        dateTime: '2015-01-03/2015-01-04',
        filters: 'd3|id-in["v1","v2"],d4|id-in["v3","v4"],d5|id-notnull[""]',
        metrics: 'm1,m2,r(p=123)',
        having: 'm1-gt[0]',
        rollupTo: 'dateTime,d3,d5',
        rollupGrandTotal: true,
        format: 'json'
      },
      '_buildQuery adds correct rollup params'
    );
  });

  test('_buildQuery with catchAll Query Params', function(assert) {
    assert.expect(1);

    let options = {
      page: 1,
      perPage: 100,
      queryParams: {
        perPage: 150,
        topN: 150
      }
    };

    assert.deepEqual(
      Adapter._buildQuery(TestRequest, options),
      {
        dateTime: '2015-01-03/2015-01-04',
        filters: 'd3|id-in["v1","v2"],d4|id-in["v3","v4"],d5|id-notnull[""]',
        metrics: 'm1,m2,r(p=123)',
        having: 'm1-gt[0]',
        format: 'json',
        page: 1,
        perPage: 150,
        topN: 150
      },
      '_buildQuery correctly built the query object for a request catching all unsupported query params'
    );
  });

  test('_buildQuery with pagination', function(assert) {
    assert.expect(4);

    assert.deepEqual(
      Adapter._buildQuery(TestRequest),
      {
        dateTime: '2015-01-03/2015-01-04',
        filters: 'd3|id-in["v1","v2"],d4|id-in["v3","v4"],d5|id-notnull[""]',
        metrics: 'm1,m2,r(p=123)',
        having: 'm1-gt[0]',
        format: 'json'
      },
      '_buildQuery correctly builds the query object for the provided request ' +
        'without any pagination options when options passed in are undefined'
    );

    assert.deepEqual(
      Adapter._buildQuery(TestRequest, {}),
      {
        dateTime: '2015-01-03/2015-01-04',
        filters: 'd3|id-in["v1","v2"],d4|id-in["v3","v4"],d5|id-notnull[""]',
        metrics: 'm1,m2,r(p=123)',
        having: 'm1-gt[0]',
        format: 'json'
      },
      '_buildQuery correctly builds the query object for the provided request ' +
        'without any pagination options when options passed in are empty'
    );

    assert.deepEqual(
      Adapter._buildQuery(TestRequest, { page: 1, perPage: 100 }),
      {
        dateTime: '2015-01-03/2015-01-04',
        filters: 'd3|id-in["v1","v2"],d4|id-in["v3","v4"],d5|id-notnull[""]',
        metrics: 'm1,m2,r(p=123)',
        having: 'm1-gt[0]',
        format: 'json',
        page: 1,
        perPage: 100
      },
      '_buildQuery correctly builds query with pagination options when options are defined'
    );

    assert.deepEqual(
      Adapter._buildQuery(TestRequest, { format: 'csv' }),
      {
        dateTime: '2015-01-03/2015-01-04',
        filters: 'd3|id-in["v1","v2"],d4|id-in["v3","v4"],d5|id-notnull[""]',
        metrics: 'm1,m2,r(p=123)',
        having: 'm1-gt[0]',
        format: 'csv'
      },
      '_buildQuery correctly builds query with provided format setting'
    );
  });

  test('urlForFindQuery', function(assert) {
    assert.expect(7);

    assert.equal(
      decodeURIComponent(Adapter.urlForFindQuery(TestRequest)),
      HOST +
        '/v1/data/table1/grain1/d1/d2/?dateTime=2015-01-03/2015-01-04&' +
        'metrics=m1,m2,r(p=123)&filters=d3|id-in["v1","v2"],d4|id-in["v3","v4"],d5|id-notin[""]&having=m1-gt[0]&' +
        'format=json',
      'urlForFindQuery correctly built the URL for the provided request'
    );

    assert.equal(
      decodeURIComponent(Adapter.urlForFindQuery(TestRequest, { format: 'csv' })),
      HOST +
        '/v1/data/table1/grain1/d1/d2/?dateTime=2015-01-03/2015-01-04&' +
        'metrics=m1,m2,r(p=123)&filters=d3|id-in["v1","v2"],d4|id-in["v3","v4"],d5|id-notin[""]&having=m1-gt[0]&' +
        'format=csv',
      'urlForFindQuery correctly built the URL for the provided request with the format option'
    );

    let noFiltersNoHavings = assign({}, TestRequest, {
      filters: null,
      having: null
    });
    assert.equal(
      decodeURIComponent(Adapter.urlForFindQuery(noFiltersNoHavings)),
      HOST + '/v1/data/table1/grain1/d1/d2/?dateTime=2015-01-03/2015-01-04&' + 'metrics=m1,m2,r(p=123)&format=json',
      'urlForFindQuery correctly built the URL for a request with no filters'
    );

    let requestWithSort = assign({}, TestRequest, {
      filters: null,
      having: null,
      sort: [{ metric: 'm1' }, { metric: 'm2' }]
    });
    assert.equal(
      decodeURIComponent(Adapter.urlForFindQuery(requestWithSort)),
      HOST +
        '/v1/data/table1/grain1/d1/d2/?dateTime=2015-01-03/2015-01-04&' +
        'metrics=m1,m2,r(p=123)&sort=m1|desc,m2|desc&format=json',
      'urlForFindQuery correctly built the URL for a request with sort'
    );

    assert.equal(
      decodeURIComponent(Adapter.urlForFindQuery(TestRequest, { cache: false })),
      HOST +
        '/v1/data/table1/grain1/d1/d2/?dateTime=2015-01-03/2015-01-04&' +
        'metrics=m1,m2,r(p=123)&filters=d3|id-in["v1","v2"],d4|id-in["v3","v4"],d5|id-notin[""]&having=m1-gt[0]&' +
        'format=json&_cache=false',
      'urlForFindQuery correctly built the URL for the provided request with the cache option'
    );

    assert.equal(
      decodeURIComponent(Adapter.urlForFindQuery(TestRequest, { dataSourceName: 'blockhead' })),
      HOST2 +
        '/v1/data/table1/grain1/d1/d2/?dateTime=2015-01-03/2015-01-04&' +
        'metrics=m1,m2,r(p=123)&filters=d3|id-in["v1","v2"],d4|id-in["v3","v4"],d5|id-notin[""]&having=m1-gt[0]&' +
        'format=json',
      'uriForFindQuery renders alternative host name if option is given'
    );

    assert.equal(
      decodeURIComponent(Adapter.urlForFindQuery(TestRequestWithRollup)),
      HOST +
        '/v1/data/table1/grain1/d1/d2/__rollupMask/?dateTime=2015-01-03/2015-01-04&metrics=m1,m2,r(p=123)&filters=d3|id-in["v1","v2"],d4|id-in["v3","v4"],d5|id-notin[""]&having=m1-gt[0]&rollupTo=dateTime,d3,d5&rollupGrandTotal=true&format=json',
      'Rollup query is correct'
    );
  });

  test('fetchDataForRequest', function(assert) {
    assert.expect(1);

    return Adapter.fetchDataForRequest(TestRequest).then(function(result) {
      return assert.deepEqual(result, Response, 'Ajax GET returns the response object for TEST Request');
    });
  });

  test('fetchDataForRequest with pagination options', function(assert) {
    assert.expect(1);
    return Adapter.fetchDataForRequest(TestRequest, {
      page: 1,
      perPage: 100
    }).then(function(result) {
      return assert.deepEqual(
        result,
        {
          rows: [
            {
              table: 'table1',
              grain: 'grain1'
            }
          ],
          meta: {
            pagination: {
              page: '1',
              perPage: '100'
            },
            test: true
          }
        },
        'Ajax GET returns the response object for TEST Request'
      );
    });
  });

  test('fetchDataForRequest with client id options', function(assert) {
    assert.expect(2);

    // Setting up assert for default clientId
    Server.get(`${HOST}/v1/data/table1/grain1/d1/d2/`, request => {
      assert.equal(request.requestHeaders.clientid, 'UI', 'Client id defaults to "UI"');

      return MockBardResponse;
    });

    // Sending request for default clientId
    return Adapter.fetchDataForRequest(TestRequest).then(() => {
      // Setting up assert for provided clientId
      Server.get(`${HOST}/v1/data/table1/grain1/d1/d2/`, request => {
        assert.equal(request.requestHeaders.clientid, 'test id', 'Client id is set to value given in options');

        return MockBardResponse;
      });

      // Sending request for provided clientId
      return Adapter.fetchDataForRequest(TestRequest, {
        clientId: 'test id'
      });
    });
  });

  test('fetchDataForRequest with custom headers', function(assert) {
    assert.expect(2);

    Server.get(`${HOST}/v1/data/table1/grain1/d1/d2/`, request => {
      assert.equal(request.requestHeaders.foo, 'bar', 'custom header `foo` was sent with the request');

      assert.equal(request.requestHeaders.baz, 'qux', 'custom header `baz` was sent with the request');

      return MockBardResponse;
    });

    return Adapter.fetchDataForRequest(TestRequest, {
      customHeaders: {
        foo: 'bar',
        baz: 'qux'
      }
    });
  });

  test('fetchDataForRequest with alternative datasource', function(assert) {
    assert.expect(1);

    Server.get(`${HOST2}/v1/data/table1/grain1/d1/d2/`, request => {
      assert.ok(request.url.startsWith(HOST2), 'Alternative host was accessed');

      return MockBardResponse;
    });

    return Adapter.fetchDataForRequest(TestRequest, { dataSourceName: 'blockhead' });
  });
});
