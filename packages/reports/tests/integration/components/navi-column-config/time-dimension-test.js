import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { helper as buildHelper } from '@ember/component/helper';
import { selectChoose } from 'ember-power-select/test-support/helpers';
import hbs from 'htmlbars-inline-precompile';
import config from 'ember-get-config';
import click from '@ember/test-helpers/dom/click';

const TEMPLATE = hbs`
  <NaviColumnConfig::Base
    @column={{this.column}}
    @metadata={{this.metadata}}
    @cloneColumn={{this.cloneColumn}}
    @toggleColumnFilter={{this.toggleColumnFilter}}
    @onUpdateColumnName={{action this.onUpdateColumnName}}
    @toggleRollup={{this.toggleRollup}}
  />
`;

module('Integration | Component | navi-column-config/time-dimension', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(async function() {
    this.cloneColumn = () => undefined;
    this.toggleColumnFilter = () => undefined;
    this.onUpdateColumnName = () => undefined;
    this.toggleRollup = () => undefined;
  });

  test('Configuring time grain', async function(assert) {
    assert.expect(3);

    this.owner.register(
      'helper:update-report-action',
      buildHelper(() => timeGrain => {
        assert.deepEqual(
          timeGrain,
          { id: 'day', name: 'Day' },
          'The Time Grain is passed correctly to the action handler'
        );
      }),
      { instantiate: false }
    );

    this.column = {
      type: 'timeDimension',
      name: 'dateTime',
      fragment: 'dateTime',
      isFiltered: true,
      timeGrain: 'week',
      timeGrains: [
        {
          id: 'hour',
          name: 'Hour'
        },
        {
          id: 'day',
          name: 'Day'
        },
        {
          id: 'week',
          name: 'Week'
        }
      ]
    };

    await render(TEMPLATE);

    assert
      .dom('.navi-column-config-item__parameter-label')
      .hasText('Time Grain', 'The Time Grain parameters is displayed');
    assert.dom('.navi-column-config-item__parameter-trigger').hasText('Week', 'The "Week" Time Grain is selected');

    await selectChoose('.navi-column-config-item__parameter', 'Day');
  });

  test('Rollup button', async function(assert) {
    const OG = config.navi.FEATURES.enableFiliTotals;
    config.navi.FEATURES.enableFiliTotals = true;

    this.owner.register(
      'helper:update-report-action',
      buildHelper(() => {}),
      { instantiate: false }
    );

    this.column = {
      type: 'timeDimension',
      name: 'dateTime',
      fragment: 'dateTime',
      isFiltered: true,
      isRollup: false,
      timeGrain: 'week',
      timeGrains: [
        {
          id: 'hour',
          name: 'Hour'
        },
        {
          id: 'day',
          name: 'Day'
        },
        {
          id: 'week',
          name: 'Week'
        }
      ]
    };

    this.toggleRollup = () => {
      this.set('column.isRollup', !this.column.isRollup);
    };

    await render(TEMPLATE);

    assert.dom('.navi-column-config-base__rollup-icon').exists('Rollup toggle button exists');
    assert.dom('.navi-column-config-base__rollup-icon--active').doesNotExist('Rollup is not active on this column');

    await click('.navi-column-config-base__rollup-icon');

    assert.dom('.navi-column-config-base__rollup-icon--active').exists('Rollup is active when button is clicked');

    config.navi.FEATURES.enableFiliTotals = OG;
  });
});
