import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, findAll, fillIn, triggerEvent } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import setupMirage from 'ember-cli-mirage/test-support/setup-mirage';
import { clickTrigger, nativeMouseUp } from 'ember-power-select/test-support/helpers';
import AgeValues from 'navi-data/mirage/bard-lite/dimensions/age';
import ContainerValues from 'navi-data/mirage/bard-lite/dimensions/container';
import config from 'ember-get-config';
import $ from 'jquery';
import { set } from '@ember/object';

const MockFilter = {
  subject: {
    name: 'age',
    storageStrategy: 'loaded',
    primaryKeyFieldName: 'id'
  },
  values: ['1', '2', '3'],
  validations: {}
};

const HOST = config.navi.dataSources[0].uri;

module('Integration | Component | filter values/dimension select', function(hooks) {
  setupRenderingTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(function() {
    this.filter = MockFilter;
    return this.owner.lookup('service:bard-metadata').loadMetadata();
  });

  test('it renders', async function(assert) {
    assert.expect(3);

    await render(hbs`<FilterValues::DimensionSelect @filter={{this.filter}} @isCollapsed={{this.isCollapsed}} />`);

    // Open value selector
    await clickTrigger();

    let selectedValueText = findAll('.ember-power-select-multiple-option span:nth-of-type(2)').map(el =>
        el.textContent.trim()
      ),
      expectedValueDimensions = AgeValues.filter(age => MockFilter.values.includes(age.id));

    assert.deepEqual(
      selectedValueText,
      expectedValueDimensions.map(age => `${age.description} (${age.id})`),
      'Filter value ids are converted into full dimension objects and displayed as selected'
    );

    let optionText = findAll('.ember-power-select-option').map(el => el.textContent.trim()),
      expectedOptionText = AgeValues.map(age => `${age.description} (${age.id})`);

    /*
     * Since ember-collection is used for rendering the dropdown options,
     * some later options may be cropped from the DOM, so just check the first 10
     */
    optionText.length = 10;
    expectedOptionText.length = 10;

    assert.deepEqual(
      optionText,
      expectedOptionText,
      'Given Age as the filter subject, all age values are present in the value selector'
    );

    this.set('isCollapsed', true);

    assert.dom().hasText('under 13 (1) 13-17 (2) 18-20 (3)', 'Selected values are rendered correctly when collapsed');
  });

  test('it works for dimensions from other datasources', async function(assert) {
    assert.expect(3);
    await this.owner.lookup('service:bard-metadata').loadMetadata({ dataSourceName: 'blockhead' });

    const datasourceFilter = {
      subject: {
        name: 'container',
        storageStrategy: 'loaded',
        primaryKeyFieldName: 'id',
        source: 'blockhead'
      },
      values: ['1', '2', '3'],
      validations: {}
    };

    this.filter = datasourceFilter;

    await render(hbs`<FilterValues::DimensionSelect @filter={{this.filter}} @isCollapsed={{this.isCollapsed}} />`);

    // Open value selector
    await clickTrigger();

    let selectedValueText = findAll('.ember-power-select-multiple-option span:nth-of-type(2)').map(el =>
        el.textContent.trim()
      ),
      expectedValueDimensions = ContainerValues.filter(container => MockFilter.values.includes(container.id));

    assert.deepEqual(
      selectedValueText,
      expectedValueDimensions.map(container => `${container.description} (${container.id})`),
      'Filter value ids are converted into full dimension objects and displayed as selected'
    );

    let optionText = findAll('.ember-power-select-option').map(el => el.textContent.trim()),
      expectedOptionText = ContainerValues.map(container => `${container.description} (${container.id})`);

    /*
     * Since ember-collection is used for rendering the dropdown options,
     * some later options may be cropped from the DOM, so just check the first 10
     */
    optionText.length = 10;
    expectedOptionText.length = 10;

    assert.deepEqual(
      optionText,
      expectedOptionText,
      'Given Age as the filter subject, all age values are present in the value selector'
    );

    this.set('isCollapsed', true);

    assert.dom().hasText('Bag (1) Bank (2) Saddle Bag (3)', 'Selected values are rendered correctly when collapsed');
  });

  test('no values', async function(assert) {
    assert.expect(1);

    this.server.get(`${HOST}/v1/dimensions/age/values`, (schema, request) => {
      if (request.queryParams.filters === 'age|id-in[]') {
        assert.notOk(true, 'dimension-select should not request dimension values when the filter has no values');
      }

      return { rows: [] };
    });

    this.filter = {
      subject: { name: 'age', longName: 'Age' },
      values: []
    };

    await render(hbs`<FilterValues::DimensionSelect @filter={{this.filter}} />`);

    assert
      .dom('input')
      .hasAttribute('placeholder', 'Age Values', 'The dimension long name is used as the placeholder text');
  });

  test('changing values', async function(assert) {
    assert.expect(1);

    this.onUpdateFilter = changeSet => {
      assert.deepEqual(
        changeSet.rawValues,
        MockFilter.values.concat(['5']),
        'The newly selected value is added to existing values and given to action'
      );
    };

    await render(
      hbs`<FilterValues::DimensionSelect @filter={{this.filter}} @onUpdateFilter={{this.onUpdateFilter}} />`
    );

    // Select a new value
    await clickTrigger();
    await nativeMouseUp($('.ember-power-select-option:contains(25-29)')[0]);
    // Assert handled in action
  });

  test('error state', async function(assert) {
    assert.expect(3);

    await render(hbs`<FilterValues::DimensionSelect @filter={{this.filter}} @isCollapsed={{this.isCollapsed}} />`);
    assert.dom('.filter-values--dimension-select--error').isNotVisible('The input should not have error state');

    this.set('filter.validations', { attrs: { rawValues: { isInvalid: true } } });
    assert.dom('.filter-values--dimension-select--error').isVisible('The input should have error state');

    this.set('isCollapsed', true);
    assert.dom('.filter-values--selected-error').exists('Error is rendered correctly when collapsed');
  });

  test('alternative primary key', async function(assert) {
    assert.expect(1);
    this.filter = {
      subject: {
        name: 'multiSystemId',
        storageStrategy: 'loaded',
        primaryKeyFieldName: 'key'
      },
      values: ['k1', 'k3'],
      validations: {}
    };

    await render(hbs`<FilterValues::DimensionSelect @filter={{this.filter}} />`);

    let selectedValueText = findAll('.ember-power-select-multiple-option span:nth-of-type(2)').map(el => {
      let text = el.textContent.trim();
      return text.substr(text.lastIndexOf('('));
    });

    assert.deepEqual(selectedValueText, ['(1)', '(3)'], 'Select values by key instead of id');
  });

  test('filters stay applied while selecting', async function(assert) {
    assert.expect(2);
    this.filter = {
      ...MockFilter,
      values: []
    };

    const searchTerm = '5';
    const selectedId = '5';

    this.onUpdateFilter = changeSet => {
      set(this, 'filter', { ...this.filter, values: changeSet.rawValues });
    };

    await render(
      hbs`<FilterValues::DimensionSelect @filter={{this.filter}} @onUpdateFilter={{this.onUpdateFilter}} />`
    );

    await clickTrigger();
    await fillIn('.ember-power-select-trigger-multiple-input', searchTerm);
    await triggerEvent('.ember-power-select-trigger-multiple-input', 'keyup');

    let visibleOptions = () =>
      findAll('.ember-power-select-option')
        .filter(el => el.offsetParent !== null) // only visible elements
        .map(el => el.textContent.trim());

    const expectedValueDimensions = AgeValues.map(age => `${age.description} (${age.id})`).filter(str =>
      str.includes(searchTerm)
    );

    assert.deepEqual(visibleOptions(), expectedValueDimensions, `Only values containing '${searchTerm}' are displayed`);

    await nativeMouseUp($(`.ember-power-select-option:contains("(${selectedId})")`)[0]);

    assert.deepEqual(
      visibleOptions(),
      expectedValueDimensions,
      `Only values containing ${searchTerm} are displayed, even after changing selection`
    );
  });
});
