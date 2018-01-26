import { test, moduleForComponent } from 'ember-qunit';
import Ember from 'ember';
const { get } = Ember;

let Component;

moduleForComponent('navi-visualizations/goal-gauge', 'Unit | Component | Goal Gauge', {
  unit: 'true',
  beforeEach() {
    Component = this.subject({
      actualValue: 75,
      options: {
        goalValue: 100,
        baselineValue: 50,
        metric: 'm1',
        metricTitle: 'Custom Metric Title',
        unit: '%'
      }
    });
  }
});

test('data', function(assert) {
  assert.expect(1);

  assert.deepEqual(get(Component, 'data'), {
    columns: [
      ['data', 75]
    ],
    type: 'gauge'
  }, 'data is correctly computed based on actualValue');
});

test('gauge', function(assert) {
  assert.expect(2);

  assert.equal(get(Component, 'gauge.min'),
    get(Component, 'baselineValue'),
    'gauge.min is correctly set based on baseline property');

  assert.equal(get(Component, 'gauge.max'),
    get(Component, 'goalValue'),
    'gauge.max is correctly set based on goal property');
});

test('thresholdValues', function(assert) {
  assert.expect(1);

  assert.deepEqual(get(Component, 'thresholdValues'), [
    87.5,
    92.5,
    100
  ], 'thresholdValues are correctly computed based on goal & baseline values');
});

test('color', function(assert) {
  assert.expect(1);

  assert.deepEqual(get(Component, 'color'), {
    'pattern': [
      '#f05050',
      '#ffc831',
      '#44b876'
    ],
    'threshold': {
      'max': 100,
      'unit': 'value',
      'values': [
        87.5,
        92.5,
        100
      ]
    }
  }, 'color is correctly computed based on goal & baseline values');
});

test('_formatNumber', function(assert) {
  assert.expect(2);

  assert.equal(Component._formatNumber(123456789),
    '123.46M',
    '_formatNumber uses a precision of 2 for numbers under 1B');

  assert.equal(Component._formatNumber(9123456789),
    '9.123B',
    '_formatNumber uses a precision of 3 for numbers over 1B');
});

test('metricTitle', function(assert) {
  assert.expect(2);

  assert.equal(get(Component, 'metricTitle'),
    'Custom Metric Title',
    'metricTitle is the value of options.metricTitle if provided');

  //Set options without metricTitle
  Component.set('options', { metric: 'm1' });

  assert.equal(get(Component, 'metricTitle'),
    'm1',
    'metricTitle is the value of options.metric if if options.metricTitle is not provided');
});
