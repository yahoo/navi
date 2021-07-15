import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, findAll, getContext, triggerEvent } from '@ember/test-helpers';
import { A as arr } from '@ember/array';
import { helper as buildHelper } from '@ember/component/helper';
import { selectChoose } from 'ember-power-select/test-support/helpers';
import hbs from 'htmlbars-inline-precompile';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { assertTooltipContent } from 'ember-tooltips/test-support/dom';
import config from 'ember-get-config';

let MetadataService;

const TEMPLATE = hbs`
<NaviColumnConfig::Base
  @column={{this.column}}
  @metadata={{this.metadata}}
  @cloneColumn={{this.cloneColumn}}
  @toggleColumnFilter={{this.toggleColumnFilter}}
  @onUpdateColumnName={{action this.onUpdateColumnName}}
/>
`;
module('Integration | Component | navi-column-config/metric', function(hooks) {
  setupRenderingTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function() {
    MetadataService = this.owner.lookup('service:bard-metadata');
    await MetadataService.loadMetadata();

    this.metadata = { style: { aliases: arr([]) } };
    this.cloneColumn = () => undefined;
    this.toggleColumnFilter = () => undefined;
    this.onUpdateColumnName = () => undefined;

    this.owner.register(
      'helper:update-report-action',
      buildHelper(() => {
        return (metricFragment, paramId, paramKey) => {
          this.updateMetricParameters?.(metricFragment, paramId, paramKey);
          metricFragment.updateParameter(paramId, paramKey);
        };
      }),
      { instantiate: false }
    );
  });

  async function getMetricColumn(metric, parameters) {
    const metricFragment = getContext()
      .owner.lookup('service:store')
      .createFragment('bard-request/fragments/metric', {
        metric: await MetadataService.findById('metric', metric),
        parameters
      });

    return {
      type: 'metric',
      name: metricFragment.canonicalName,
      displayName: metric,
      fragment: metricFragment,
      isFiltered: false,
      isRollup: false
    };
  }

  test('Configuring multiple parameters', async function(assert) {
    assert.expect(6);

    this.column = await getMetricColumn('multipleParamMetric', {
      type: 'l',
      aggregation: 'total',
      age: '6',
      currency: 'USD',
      currencyButNullDefault: 'CAD'
    });
    await render(TEMPLATE);

    assert.deepEqual(
      findAll('.navi-column-config-item__parameter-label').map(el => el.textContent.trim()),
      ['Type Type', 'Aggregation Type', 'Age Type', 'Currency Type', 'CurrencyButNullDefault Type'],
      'Multiple parameters config lists are displayed'
    );
    assert.deepEqual(
      findAll('.navi-column-config-item__parameter-trigger').map(el => el.textContent.trim()),
      ['Left', 'Total', '30-34', 'Dollars (USD)', 'Dollars (CAD)'],
      'Mulitple parameters values are filled in with selected values'
    );

    await click('.navi-column-config-item__parameter-trigger.ember-power-select-trigger');
    assert.deepEqual(
      findAll('.ember-power-select-option').map(el => el.textContent.trim()),
      ['Left', 'Right', 'Middle'],
      'Param values with name key show up correctly'
    );

    await selectChoose('.navi-column-config-item__parameter', 'Right');
    await selectChoose(findAll('.navi-column-config-item__parameter')[1], 'Daily Average');
    await selectChoose(findAll('.navi-column-config-item__parameter')[2], '13-17');
    await selectChoose(findAll('.navi-column-config-item__parameter')[3], 'Euro');
    await selectChoose(findAll('.navi-column-config-item__parameter')[4], 'Drams');

    assert.deepEqual(
      findAll('.navi-column-config-item__parameter-trigger').map(el => el.textContent.trim()),
      ['Right', 'Daily Average', '13-17', 'Euro', 'Drams'],
      'A selected parameter can be changed and a null valued parameter can be changed'
    );

    assert
      .dom('.ember-tooltip-target')
      .exists({ count: 1 }, 'Description tooltip shows once for the one parameter that has a description');

    await triggerEvent('.ember-tooltip-target', 'mouseenter');

    assertTooltipContent(assert, {
      targetSelector: '.ember-tooltip-target',
      contentString: 'Gives the metric power to have directionality'
    });
  });

  test('Configuring null parameter', async function(assert) {
    assert.expect(2);

    this.column = await getMetricColumn('multipleParamMetric', {
      type: null,
      aggregation: 'total',
      age: '6',
      currency: 'USD',
      currencyButNullDefault: null
    });
    await render(TEMPLATE);

    assert.deepEqual(
      findAll('.navi-column-config-item__parameter-trigger').map(el => el.textContent.trim()),
      ['', 'Total', '30-34', 'Dollars (USD)', ''],
      'Null parameters have no selected values in trigger'
    );

    await selectChoose('.navi-column-config-item__parameter', 'Right');
    await selectChoose('.navi-column-config-item__parameter:last-child', 'Dollars (CAD)');

    assert.deepEqual(
      findAll('.navi-column-config-item__parameter-trigger').map(el => el.textContent.trim()),
      ['Right', 'Total', '30-34', 'Dollars (USD)', 'Dollars (CAD)'],
      'Null value parameters can be changed'
    );
  });

  test('Configuring metric column', async function(assert) {
    assert.expect(5);

    this.column = await getMetricColumn('revenue', { currency: 'USD' });
    this.onUpdateColumnName = (/*newName*/) => {
      // this must be called with action in the template
      /**
       * TODO: Reenable column relabeling, uncomment line below
       */
      // assert.equal(newName, 'Money', 'New display name is passed to name update action');
      return undefined;
    };
    this.updateMetricParameters = (metricFragment, paramId, paramKey) => {
      assert.equal(
        metricFragment.canonicalName,
        'revenue(currency=USD)',
        'Metric name is passed with the currently selected parameter'
      );
      assert.equal(`${paramKey}=${paramId}`, 'currency=CAD', 'Parameter is passed to onUpdateMetricParam method');
    };
    await render(TEMPLATE);

    // assert.dom('.navi-column-config-base__column-name-input').hasValue('Revenue', 'Display name of column is shown in the column input');
    assert
      .dom('.navi-column-config-item__parameter-trigger')
      .hasText('Dollars (USD)', 'Current parameter is displayed in the dropdown input');

    await click('.navi-column-config-item__parameter-trigger.ember-power-select-trigger');
    assert.deepEqual(
      findAll('.ember-power-select-option').map(el => el.textContent.trim()),
      [
        'NULL',
        'UNKNOWN',
        'Dirhams',
        'Afghanis',
        'Leke',
        'Drams',
        'Guilders',
        'Kwanza',
        'Pesos',
        'Dollars (AUD)',
        'Dollars (CAD)',
        'Dollars (USD)',
        'Euro',
        'Rupees'
      ],
      'The parameter values are loaded into the dropdown'
    );
    await selectChoose('.navi-column-config-item__parameter', 'Dollars (CAD)');

    // assert.dom('.navi-column-config-base__column-name-input').hasValue('Revenue', 'Custom display name is still shown when parameter is changed');
    assert
      .dom('.navi-column-config-item__parameter-trigger')
      .hasText('Dollars (CAD)', 'Parameter selector shows new parameter value');

    // await fillIn('.navi-column-config-base__column-name-input', 'Money');

    // await triggerKeyEvent('.navi-column-config-base__column-name-input', 'keyup', 13);
  });

  test('metrics do not render rollup button', async function(assert) {
    const OG = config.navi.FEATURES.enableFiliTotals;
    config.navi.FEATURES.enableFiliTotals = true;

    this.column = await getMetricColumn('multipleParamMetric', {});

    await render(TEMPLATE);

    assert.dom('.navi-column-config-base__rollup-icon').doesNotExist('Rollup is not available on a metric column');

    config.navi.FEATURES.enableFiliTotals = OG;
  });
});
