import { module } from 'qunit';
import { visit, click, findAll, currentURL } from '@ember/test-helpers';
import { setupApplicationTest, test } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { selectChoose } from 'ember-power-select/test-support';
import { clickItem } from 'navi-reports/test-support/report-builder';

module('Acceptance | Multi datasource Dashboard', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  test('Load multi-datasource dashboard', async function(assert) {
    assert.expect(7);
    await visit('/dashboards/6/view');

    assert.dom('.navi-widget__header').exists({ count: 3 }, 'Three widgets loaded');
    assert.dom('.c3-chart-component').exists({ count: 3 }, 'Three visualizations loaded');

    assert.dom('.navi-widget__filter-errors-icon').exists({ count: 3 }, 'Filter warning is shown on each widget');

    assert
      .dom('.filter-collection--collapsed')
      .hasText(
        'Age equals under 13 (1) 13-17 (2) 18-20 (3) Container not equals Bag (1)',
        'Collapsed filter has the right text'
      );

    await click('.dashboard-filters__toggle');

    assert.deepEqual(
      findAll('.filter-builder-dimension__subject').map(el => el.textContent.trim()),
      ['Age', 'Container'],
      'Dimensions are properly labeled in filters'
    );

    assert.deepEqual(
      findAll('.filter-builder-dimension__operator').map(el => el.textContent.trim()),
      ['Equals', 'Not Equals'],
      'Dimension filter operators are shown correctly'
    );

    assert.deepEqual(
      findAll('.filter-builder-dimension__values').map(el =>
        [
          ...el.querySelectorAll(
            '.ember-power-select-multiple-option span:not(.ember-power-select-multiple-remove-btn)'
          )
        ].map(el => el.textContent.trim())
      ),
      [['under 13 (1)', '13-17 (2)', '18-20 (3)'], ['Bag (1)']],
      'Dimension value selector showing the right values'
    );
  });

  test('Create new multisource dashboard', async function(assert) {
    assert.expect(8);

    await visit('/dashboards/new');
    await click('.add-widget button');
    await selectChoose('.report-select', 'Report 12');
    await click('.add-to-dashboard');

    assert.dom('.navi-widget__header').exists({ count: 1 }, 'One widget loaded');
    assert.dom('.c3-chart-component').exists({ count: 1 }, 'One visualization loaded');

    await click('.add-widget button');
    await selectChoose('.report-select', 'Create new...');
    await click('.add-to-dashboard');

    await selectChoose('.navi-table-select__dropdown', 'Inventory');
    await clickItem('dimension', 'Container');
    await clickItem('metric', 'Used Amount');

    await click('.navi-report-widget__run-btn');
    await click('.navi-report-widget__save-btn');

    assert.dom('.navi-widget__header').exists({ count: 2 }, 'Two widgets loaded');
    assert.dom('.c3-chart-component').exists({ count: 1 }, 'One visualization loaded');
    assert.dom('.table-widget').exists({ count: 1 }, 'Table widget is loaded');

    //add filters
    await click('.dashboard-filters__toggle');
    await click('.dashboard-filters--expanded__add-filter-button');
    await selectChoose('.dashboard-dimension-selector', 'Container');
    await selectChoose('.filter-builder-dimension__values', 'Bag');

    const widgetsWithFilterWarning = () =>
      [...findAll('.navi-widget__filter-errors-icon')].map(el => el.closest('.navi-widget__title').textContent.trim());

    assert.deepEqual(
      widgetsWithFilterWarning(),
      ['Report 12'],
      'Widget with dummy datasource has a warning that filter does not apply'
    );

    //add another filter for other datasource
    await click('.dashboard-filters--expanded__add-filter-button');
    await selectChoose('.dashboard-dimension-selector', 'Age');
    await selectChoose(findAll('.filter-builder-dimension__values')[1], 'under 13 (1)');

    assert.deepEqual(
      widgetsWithFilterWarning(),
      ['Report 12', 'Untitled Widget'],
      'Both widgets have a warning that filter does not apply'
    );

    await click('.navi-dashboard__save-button');
    assert.equal(currentURL(), '/dashboards/7/view', 'Dashboard saves without issue');
  });
});
