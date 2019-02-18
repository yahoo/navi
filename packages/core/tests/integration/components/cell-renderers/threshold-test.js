import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import merge from 'lodash/merge';

const TEMPLATE = hbs`
  {{cell-renderers/threshold
    data=data
    column=column
    request=request
  }}`;

const data = {
  dateTime: '2016-05-30 00:00:00.000',
  'os|id': 'All Other',
  'os|desc': 'All Other',
  uniqueIdentifier: 172933788.2,
  totalPageViewsWoW: 2.3
};

const column = {
  attributes: { name: 'totalPageViewsWoW', parameters: {} },
  type: 'threshold',
  displayName: 'Total Page Views WoW'
};

const request = {
  dimensions: [{ dimension: 'os' }],
  metrics: [{ metric: 'uniqueIdentifier' }, { metric: 'totalPageViews' }],
  logicalTable: {
    table: 'network',
    timeGrain: 'day'
  }
};

moduleForComponent('cell-renderers/threshold', 'Integration | Component | cell renderers/threshold', {
  integration: true,
  beforeEach() {
    this.set('data', data);
    this.set('column', column);
    this.set('request', request);
  }
});

test('threshold renders strong class correctly', function(assert) {
  assert.expect(3);
  this.render(TEMPLATE);

  assert.ok($('.table-cell-content').is(':visible'), 'The threshold cell renderer is visible');
  assert.equal(
    $('.table-cell-content')
      .text()
      .trim(),
    '2.3',
    'The threshold cell renders the value correctly'
  );
  assert.ok(
    $('.table-cell-content.threshold').hasClass('strong'),
    'The threshold renders the value with strong class correctly'
  );
});

test('threshold renders weak class correctly', function(assert) {
  assert.expect(2);

  this.set('data', { totalPageViewsWoW: -8.3 });
  this.render(TEMPLATE);

  assert.equal(
    $('.table-cell-content')
      .text()
      .trim(),
    '-8.3',
    'The threshold cell renders the value correctly'
  );
  assert.ok(
    $('.table-cell-content.threshold').hasClass('weak'),
    'The threshold renders the value with weak class correctly'
  );
});

test('threshold renders neutral class correctly', function(assert) {
  assert.expect(2);

  this.set('data', { totalPageViewsWoW: 0.0 });
  this.render(TEMPLATE);

  assert.equal(
    $('.table-cell-content')
      .text()
      .trim(),
    '0',
    'The threshold cell renders the value correctly'
  );
  assert.ok(
    $('.table-cell-content.threshold').hasClass('neutral'),
    'The threshold renders the value with neutral class correctly'
  );
});

test('threshold renders null value correctly', function(assert) {
  assert.expect(1);

  this.set('data', { totalPageViewsWoW: null });
  this.render(TEMPLATE);

  assert.equal(
    $('.table-cell-content')
      .text()
      .trim(),
    '--',
    'The threshold cell renders the null value with -- correctly'
  );
});

test('render value based on column format', function(assert) {
  assert.expect(1);

  this.set('column', merge({}, column, { attributes: { format: '$0,0[.]00' } }));
  this.render(TEMPLATE);

  assert.equal(
    $('.table-cell-content')
      .text()
      .trim(),
    '$2.30',
    'The threshold cell renders the value with format correctly'
  );
});
