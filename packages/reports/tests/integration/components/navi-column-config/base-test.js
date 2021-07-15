import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { helper as buildHelper } from '@ember/component/helper';
import { render, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import config from 'ember-get-config';

const TEMPLATE = hbs`
<NaviColumnConfig::Base
  @column={{this.column}}
  @metadata={{this.metadata}}
  @cloneColumn={{this.cloneColumn}}
  @toggleColumnFilter={{this.toggleColumnFilter}}
  @onUpdateColumnName={{this.onUpdateColumnName}}
  @toggleRollup={{this.toggleRollup}}
/>`;

module('Integration | Component | navi-column-config/base', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.owner.register(
      'helper:update-report-action',
      buildHelper(() => {}),
      { instantiate: false }
    );

    this.metadata = {};
    this.cloneColumn = () => undefined;
    this.toggleColumnFilter = () => undefined;
    this.onUpdateColumnName = () => undefined;
    this.toggleRollup = () => undefined;
  });

  test('it renders ', async function(assert) {
    this.set('column', {
      name: 'property',
      type: 'dimension',
      displayName: 'Property',
      fragment: { dimension: { id: 'property', name: 'Property' } }
    });

    await render(TEMPLATE);

    assert
      .dom('.navi-column-config-base__api-column-name')
      .hasText(this.column.fragment.dimension.id, 'NaviColumnConfig::Base renders dimension API column name');

    assert
      .dom('.navi-column-config-base__api-column-name')
      .hasAttribute(
        'title',
        `API Column: ${this.column.fragment.dimension.id}`,
        'NaviColumnConfig::Base renders a title attribute for the API Column name'
      );

    this.set('column', {
      name: 'clicks',
      type: 'metric',
      displayName: 'Clicks',
      fragment: { metric: { id: 'clicks', name: 'Clicks' } }
    });

    assert
      .dom('.navi-column-config-base__api-column-name')
      .hasText(this.column.fragment.metric.id, 'NaviColumnConfig::Base renders metric API column name');

    this.set('column', {
      name: 'dateTime',
      type: 'timeDimension',
      displayName: 'Date Time',
      fragment: 'dateTime' //TODO make me real
    });

    assert
      .dom('.navi-column-config-base__api-column-name')
      .hasText('dateTime', 'NaviColumnConfig::Base has a special case for rendering the dateTime API column name');
  });

  test('it supports action', async function(assert) {
    assert.expect(2);
    this.column = {
      name: 'property',
      type: 'dimension',
      displayName: 'Property',
      fragment: { dimension: { id: 'property', name: 'Property' } }
    };
    this.cloneColumn = () => assert.ok(true, 'cloneColumn is called when clone is clicked');
    this.toggleColumnFilter = () => assert.ok(true, 'toggleColumnFilter is called when filter is clicked');
    this.onUpdateColumnName = newName =>
      assert.equal(newName, 'Some other value', 'onUpdateColumnName action is called with new column name');

    await render(TEMPLATE);

    /**
     * TODO: Uncomment when Column Renaming is enabled
     * assert
     *   .dom('input.navi-column-config-base__column-name-input')
     *   .hasValue('Property', "Column Name field has value of column's display name");
     * await fillIn('input.navi-column-config-base__column-name-input', 'Some other value');
     * await triggerKeyEvent('input.navi-column-config-base__column-name-input', 'keyup', 13);
     */

    await click('.navi-column-config-base__clone-icon');
    await click('.navi-column-config-base__filter-icon');
  });

  test('Filter is active when column is filtered', async function(assert) {
    assert.expect(2);

    this.column = {
      name: 'property',
      type: 'dimension',
      displayName: 'Property',
      isFiltered: false,
      fragment: { dimension: { name: 'Property' } }
    };

    await render(TEMPLATE);

    assert
      .dom('.navi-column-config-base__filter-icon')
      .doesNotHaveClass('navi-column-config-base__filter-icon--active', 'The filter is not active by default');

    this.set('column', {
      ...this.column,
      isFiltered: true
    });

    assert
      .dom('.navi-column-config-base__filter-icon')
      .hasClass('navi-column-config-base__filter-icon--active', 'The filter is active when the column is filtered');
  });

  test('it renders rollup button', async function(assert) {
    const OG = config.navi.FEATURES.enableFiliTotals;
    config.navi.FEATURES.enableFiliTotals = true;

    this.column = {
      name: 'property',
      type: 'dimension',
      displayName: 'Property',
      isFiltered: false,
      isRollup: false,
      fragment: { dimension: { name: 'Property' } }
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
