import { set } from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import $ from 'jquery';
import { render, click, findAll, triggerEvent } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import setupMirage from 'ember-cli-mirage/test-support/setup-mirage';
import { assertTooltipRendered, assertTooltipNotRendered, assertTooltipContent } from 'ember-tooltips/test-support';
import config from 'ember-get-config';
import {
  clickItem,
  clickItemFilter,
  clickShowSelected,
  getItem,
  getAll,
  getAllSelected
} from 'navi-reports/test-support/report-builder';

let Store, MetadataService, Age;

module('Integration | Component | dimension selector', function(hooks) {
  setupRenderingTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(function() {
    Store = this.owner.lookup('service:store');
    MetadataService = this.owner.lookup('service:bard-metadata');

    this.set('addTimeGrain', () => {});
    this.set('removeTimeGrain', () => {});
    this.set('addDimension', () => {});
    this.set('removeDimension', () => {});
    this.set('addDimFilter', () => {});

    return MetadataService.loadMetadata().then(async () => {
      Age = MetadataService.getById('dimension', 'age');

      //set report object
      this.set(
        'request',
        Store.createFragment('bard-request/request', {
          logicalTable: Store.createFragment('bard-request/fragments/logicalTable', {
            table: MetadataService.getById('table', 'tableA'),
            timeGrainName: 'day'
          }),
          dimensions: [{ dimension: Age }],
          filters: [{ dimension: Age }],
          responseFormat: 'csv'
        })
      );

      await render(hbs`{{dimension-selector
            request=request
            onAddTimeGrain=(action addTimeGrain)
            onRemoveTimeGrain=(action removeTimeGrain)
            onAddDimension=(action addDimension)
            onRemoveDimension=(action removeDimension)
            onToggleDimFilter=(action addDimFilter)
          }}`);
    });
  });

  test('it renders', function(assert) {
    assert.expect(3);

    assert.dom('.checkbox-selector--dimension').isVisible('The dimension selector component is rendered');

    assert
      .dom('.navi-list-selector')
      .isVisible('a navi-list-selector component is rendered as part of the dimension selector');

    assert.dom('.grouped-list').exists('a grouped-list component is rendered as part of the dimension selector');
  });

  test('groups', function(assert) {
    assert.expect(2);

    let groups = findAll('.grouped-list__group-header').map(el => el.textContent.trim());

    assert.ok(
      groups[0].includes('Time Grain'),
      'Time Grains are included as the first group in the dimension selector'
    );

    assert.deepEqual(
      groups,
      ['Time Grain (6)', 'test (26)', 'Asset (4)'],
      'The groups rendered by the component include dimension groups and Time Grain'
    );
  });

  test('show selected', async function(assert) {
    assert.expect(4);

    const allDimensions = await getAll('dimension');
    assert.ok(
      allDimensions.length > this.get('request.dimensions.length') + 1 /*for timegrain*/,
      'Initially all the dimensions are shown in the dimension-selector'
    );

    const selectedDimensions = await getAllSelected('dimension');
    assert.deepEqual(
      selectedDimensions,
      ['Day', 'Age'],
      'When show selected is clicked only the selected age dimension and the selected timegrain are shown'
    );

    assert.notOk(
      findAll('.grouped-list__item-checkbox')
        .filter(el => !el.checked)
        .concat(findAll('.grouped-list__add-icon--deselected')).length,
      'No items are marked as unselected'
    );

    config.navi.FEATURES.enableRequestPreview = true;

    await render(hbs`{{dimension-selector
      request=request
      onAddTimeGrain=(action addTimeGrain)
      onRemoveTimeGrain=(action removeTimeGrain)
      onAddDimension=(action addDimension)
      onRemoveDimension=(action removeDimension)
      onToggleDimFilter=(action addDimFilter)
    }}`);

    await clickShowSelected('dimension');

    assert.equal(
      findAll('.grouped-list__item-checkbox')
        .filter(el => el.checked)
        .concat(findAll('.grouped-list__item-container--selected')).length,
      2,
      'The selected items are marked as added or selected when enableRequestPreview is on'
    );

    config.navi.FEATURES.enableRequestPreview = false;
  });

  test('actions', async function(assert) {
    assert.expect(4);

    this.set('addTimeGrain', item => {
      assert.equal(item.get('name'), 'week', 'the week time grain item is passed as a param to the action');
    });

    this.set('removeTimeGrain', item => {
      assert.equal(item.get('name'), 'day', 'the day time grain item is passed as a param to the action');
    });

    //select first time grain

    //addTimeGrain when a different time grain is clicked
    await clickItem('timeGrain', 'Week');

    //removeTimeGrain when selected time grain is clicked
    await clickItem('timeGrain', 'Day');

    this.set('addDimension', item => {
      assert.equal(
        item.get('longName'),
        'Gender',
        'the gender dimension item is passed as a param to the action for addition'
      );
    });

    this.set('removeDimension', item => {
      assert.equal(
        item.get('longName'),
        'Age',
        'the Age dimension item is passed as a param to the action for removal'
      );
    });

    //select a random dimension

    //addDimension when an unselected dimension is clicked
    await clickItem('dimension', 'Gender');

    //removeDimension when a selected dimension is clicked
    await clickItem('dimension', 'Age');
  });

  test('filter icon', async function(assert) {
    assert.expect(3);

    const { item: age, reset: resetAge } = await getItem('dimension', 'Age');
    assert
      .dom(age.querySelector('.grouped-list__filter'))
      .hasClass('grouped-list__filter--active', 'The filter icon with the age dimension has the active class');
    await resetAge();

    const { item: gender, reset: resetGender } = await getItem('dimension', 'Gender');
    assert
      .dom(gender.querySelector('.grouped-list__filter'))
      .doesNotHaveClass(
        'grouped-list__filter--active',
        'The filter icon with the gender dimension does not have the active class'
      );
    await resetGender();

    this.set('addDimFilter', dimension => {
      assert.deepEqual(dimension, Age, 'The age dimension is passed to the action when filter icon is clicked');
    });

    await clickItemFilter('dimension', 'Age');
  });

  test('tooltip', async function(assert) {
    assert.expect(3);

    assertTooltipNotRendered(assert);
    set(Age, 'extended', {
      content: { description: 'foo' }
    });

    await click($('.grouped-list__group-header:contains(test)')[0]);
    // triggerTooltipTargetEvent will not work for hidden element

    const { item: age, reset: resetAge } = await getItem('dimension', 'Age');
    await triggerEvent(age.querySelector('.grouped-list__item-info'), 'mouseenter');

    assertTooltipRendered(assert);
    assertTooltipContent(assert, {
      contentString: 'foo'
    });
    await resetAge();
  });

  test('ranked search', async function(assert) {
    assert.expect(2);

    const allDimensions = await getAll('dimension');
    assert.deepEqual(
      allDimensions.filter(dim => dim.includes('Country')),
      ['Property Country', 'User Country'],
      'Initially the country dimensions are ordered alphabetically'
    );

    const filteredDimensions = await getAll('dimension', 'count');

    assert.deepEqual(
      filteredDimensions,
      ['User Country', 'Property Country'],
      'The search results are ranked based on relevance'
    );
  });
});
