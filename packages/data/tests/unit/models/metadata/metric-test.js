import { get } from '@ember/object';
import { module, test } from 'qunit';
import MetricMetadataModel from 'navi-data/models/metadata/metric';
import { setupTest } from 'ember-qunit';
import Pretender from 'pretender';
import metadataRoutes from '../../../helpers/metadata-routes';

let Payload, Metric;

module('Unit | Metadata Model | Metric', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    Payload = {
      name: 'dayAvgPageViews',
      longName: 'Page Views (Daily Avg)',
      category: 'Page Views',
      valueType: 'number',
      parameters: {
        testParam: {
          type: 'dimension',
          dimensionName: 'testParamDim',
          defaultValue: 'testValue'
        }
      }
    };

    Metric = MetricMetadataModel.create(this.owner.ownerInjection(), Payload);
  });

  test('factory has identifierField defined', function(assert) {
    assert.expect(1);

    assert.equal(get(MetricMetadataModel, 'identifierField'), 'name', 'identifierField property is set to `name`');
  });

  test('it properly hydrates properties', function(assert) {
    assert.expect(4);

    assert.deepEqual(get(Metric, 'name'), Payload.name, 'name property is hydrated properly');

    assert.equal(get(Metric, 'longName'), Payload.longName, 'longName property was properly hydrated');

    assert.equal(get(Metric, 'category'), Payload.category, 'category property was properly hydrated');

    assert.equal(get(Metric, 'valueType'), Payload.valueType, 'value type property was properly hydrated');
  });

  test('Parameterized Metrics', function(assert) {
    assert.expect(4);

    assert.equal(get(Metric, 'parameters'), Payload.parameters, 'paramters property was properly hydrated');

    assert.ok(get(Metric, 'hasParameters'), 'hasParamters property is computed');

    assert.deepEqual(
      get(Metric, 'paramNames'),
      ['testParam'],
      'keys of the parameter object are retrieved as paramNames'
    );

    assert.deepEqual(
      Metric.getParameter('testParam'),
      Payload.parameters['testParam'],
      'the queried parameter object is retrived from parameters'
    );
  });

  test('Non Parameterized Metric', function(assert) {
    assert.expect(4);

    let payload = {
        name: 'dayAvgPageViews',
        longName: 'Page Views (Daily Avg)',
        category: 'Page Views',
        valueType: 'number',
        parameters: {}
      },
      metric = MetricMetadataModel.create(payload);

    assert.deepEqual(get(metric, 'paramNames'), [], 'paramNames is an empty array when metric has no parameters');

    assert.notOk(get(metric, 'hasParameters'), 'hasParamters property is false since the metric has no parameters');

    (payload = {
      name: 'pageViews',
      longName: 'Page Views',
      category: 'Page Views',
      valueType: 'number'
    }),
      (metric = MetricMetadataModel.create(payload));

    assert.deepEqual(get(metric, 'paramNames'), [], 'paramNames is an empty array when metric has no parameters');

    assert.notOk(get(metric, 'hasParameters'), 'hasParamters property is false since the metric has no parameters');
  });

  test('getDefaultParameters', function(assert) {
    assert.expect(3);

    assert.deepEqual(
      Metric.getDefaultParameters(),
      { testParam: 'testValue' },
      'The default values of the metric parameters are returned as a key value pair'
    );

    let payload = {
        name: 'dayAvgPageViews',
        longName: 'Page Views (Daily Avg)',
        category: 'Page Views',
        valueType: 'number',
        parameters: {}
      },
      metric = MetricMetadataModel.create(payload);

    assert.deepEqual(
      metric.getDefaultParameters(),
      undefined,
      'The method returns undefined when trying to fetch defaults from a metric without parameters'
    );

    (payload = {
      name: 'revenue',
      longName: 'revenue',
      category: 'Revenue',
      parameters: {
        currency: {
          dimensionName: 'currency',
          defaultValue: 'USD'
        },
        country: {
          dimensionName: 'country',
          defaultValue: 'US'
        }
      }
    }),
      (metric = MetricMetadataModel.create(payload));

    assert.deepEqual(
      metric.getDefaultParameters(),
      { currency: 'USD', country: 'US' },
      'The method returns all the defaults for all the parameters of the metric'
    );
  });

  test('extended property', async function(assert) {
    const metricOne = MetricMetadataModel.create(this.owner.ownerInjection(), {
      name: 'metricOne'
    });
    const server = new Pretender(metadataRoutes);

    const result = await metricOne.get('extended');
    assert.deepEqual(result, 	{
      'category': 'category',
      'longName': 'Metric One',
      'name': 'metricOne'
    }, 'metric model can fetch extended attributes');
    server.shutdown();
  });
});
