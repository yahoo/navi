import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

const TEMPLATE = hbs`
  {{cell-renderers/dimension
    data=data
    column=column
    request=request
  }}`;

const data = {
  dateTime: '2016-05-30 00:00:00.000',
  'os|id': 'BlackBerry',
  'os|desc': 'BlackBerry OS',
  uniqueIdentifier: 172933788,
  totalPageViews: 3669828357
};

const column = {
  field: { dimension: 'os' },
  type: 'dimension',
  displayName: 'Operating System'
};

const request = {
  dimensions: [{ dimension: 'os' }],
  metrics: [{ metric: 'uniqueIdentifier' }, { metric: 'totalPageViews' }],
  logicalTable: {
    table: 'network',
    timeGrain: 'day'
  }
};

moduleForComponent('cell-renderers/dimension', 'Integration | Component | cell renderers/dimension', {
  integration: true,
  beforeEach() {
    this.set('data', data);
    this.set('column', column);
    this.set('request', request);
  }
});

test('dimension renders description value correctly', function(assert) {
  assert.expect(3);
  this.render(TEMPLATE);

  assert.ok($('.table-cell-content').is(':visible'), 'The dimension cell renderer is visible');

  assert.equal(
    $('.table-cell-content')
      .text()
      .trim(),
    'BlackBerry OS',
    'The dimension cell renders correctly when present description field is present'
  );

  assert.equal(
    $('.table-cell-content span').attr('title'),
    'BlackBerry OS (BlackBerry)',
    'The dimension cell title renders correctly when present description and id field is present'
  );
});

test('dimension renders id value when description is empty', function(assert) {
  assert.expect(2);
  let data2 = {
    dateTime: '2016-05-30 00:00:00.000',
    'os|id': 'BlackBerry',
    'os|desc': '',
    uniqueIdentifier: 172933788,
    totalPageViews: 3669828357
  };

  this.set('data', data2);
  this.render(TEMPLATE);

  assert.equal(
    $('.table-cell-content')
      .text()
      .trim(),
    'BlackBerry',
    'The dimension cell renders id correctly when description empty'
  );

  assert.equal(
    $('.table-cell-content span').attr('title'),
    'BlackBerry',
    'The dimension cell renders id correctly in title when description empty'
  );
});

test('dimension renders desc value when id is empty', function(assert) {
  assert.expect(2);
  let data2 = {
    dateTime: '2016-05-30 00:00:00.000',
    'os|desc': 'BlackBerry OS',
    uniqueIdentifier: 172933788,
    totalPageViews: 3669828357
  };

  this.set('data', data2);
  this.render(TEMPLATE);

  assert.equal(
    $('.table-cell-content')
      .text()
      .trim(),
    'BlackBerry OS',
    'The dimension cell renders desc correctly when id empty'
  );

  assert.equal(
    $('.table-cell-content span').attr('title'),
    'BlackBerry OS',
    'The dimension cell renders desc correctly in title when id empty'
  );
});

test('dimension renders no value with dashes correctly', function(assert) {
  assert.expect(2);

  this.set('data', {});

  this.render(hbs`
    {{cell-renderers/dimension
      data=data
      column=column
      request=request
    }}
  `);

  assert.equal(
    $('.table-cell-content')
      .text()
      .trim(),
    '--',
    'The dimension cell renders correctly when present description field is not present'
  );

  assert.equal(
    $('.table-cell-content span').attr('title'),
    '',
    'The dimension cell renders title correctly when present description field is not present'
  );
});
