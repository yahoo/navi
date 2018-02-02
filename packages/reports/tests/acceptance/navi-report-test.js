import Ember from 'ember';
import { module, test } from 'qunit';
import startApp from '../helpers/start-app';
import { teardownModal } from '../helpers/teardown-modal';
import config from 'ember-get-config';
import Mirage from 'ember-cli-mirage';

const { get } = Ember;

let Application;

// Regex to check that a string ends with "{uuid}/view"
const TempIdRegex = /\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\/view$/;

// Regex to check that a string ends with "{integer}/view"
const PersistedIdRegex = /\/\d+\/view$/;


let CompressionService;

module('Acceptances | Navi Report', {
  beforeEach() {
    Application = startApp();

    CompressionService = Application.__container__.lookup('service:model-compression');
    // Mocking add-to-dashboard component
    Application.register(
      'component:report-actions/add-to-dashboard',
      Ember.Component.extend({ classNames: 'add-to-dashboard'}),
      {instantiate: false}
    );
  },
  afterEach() {
    teardownModal();
    server.shutdown();
    Ember.run(Application, 'destroy');
  }
});

test('validation errors', function(assert) {
  assert.expect(3);

  // Make an invalid change and run report
  visit('/reports/1');
  click('.grouped-list__item:Contains(Operating System) .checkbox-selector__filter');
  click('.navi-report__run-btn');

  andThen(function() {
    assert.equal(currentURL(),
      '/reports/1/invalid',
      'User is transitioned to invalid route');

    let errors = find('.navi-info-message__error-list-item').toArray().map(el => $(el).text().trim());
    assert.deepEqual(errors,
      ['Operating System filter needs at least one value'],
      'Form errors are displayed to user');
  });

  // Fix the errors and run report
  click('.filter-collection__remove:eq(1)');
  click('.navi-report__run-btn');

  andThen(function() {
    assert.equal(currentURL(),
      '/reports/1/view',
      'Fixing errors and clicking "Run" returns user to view route');
  });
});

test('Clone report', function(assert) {
  assert.expect(2);

  visit('/reports/1/clone');

  andThen(() => {
    assert.ok($('.report-view').is(':visible'),
      'The route transistions to report view');

    assert.equal($('.navi-report__title').text().trim(),
      'Copy of Hyrule News',
      'Cloned report is being viewed');
  });
});

test('Clone invalid report', function(assert) {
  assert.expect(1);

  visit('/reports/1');
  // Add a metric filter
  click('.grouped-list__item:Contains(Operating System) .checkbox-selector__filter');
  click('.navi-report__action-link:contains(Clone)');

  andThen(() => {
    assert.ok(currentURL().endsWith('new'),
      'An invalid new report transitions to the reports/new route');
  });
});

test('New report', function(assert) {
  assert.expect(4);

  visit('/reports/new');

  /* == Run with errors == */
  click('.navi-report__run-btn');
  andThen(() => {
    assert.ok(currentURL().endsWith('/invalid'),
      'After clicking the run button, the route transitions to the invalid route');
  });

  /* == Fix errors == */
  click('.checkbox-selector--metric .grouped-list__item:contains(Ad Clicks) .grouped-list__item-label');
  click('.navi-report__run-btn');
  andThen(() => {
    assert.ok(currentURL().endsWith('/view'),
      'Running a report with no errors transitions to view route');

    assert.ok(!!find('.table-widget').length,
      'Data table visualization is shown by default');

    assert.ok(!!find('.table-header-cell:contains(Ad Clicks)').length,
      'Ad Clicks column is displayed');
  });
});

test('New report - copy api', function(assert) {
  assert.expect(2);

  visit('/reports/new');
  click('.checkbox-selector--metric .grouped-list__item:contains(Ad Clicks) .grouped-list__item-label');
  click('.navi-report__copy-api-btn .get-api__btn');
  andThen(() => {
    assert.ok(find('.get-api-modal-container').is(':visible'),
      'Copy modal is open after fixing error clicking button');
  });

  /* == Add some more metrics and check that copy modal updates == */
  click('.navi-modal__close');
  click('.checkbox-selector--metric .grouped-list__item:contains(Additive Page Views) .grouped-list__item-label');
  click('.navi-report__copy-api-btn .get-api__btn');
  andThen(() => {
    assert.ok(find('.navi-modal__input').val().includes('metrics=adClicks%2CaddPageViews'),
      'API query updates with request');
  });
});

test('Revert changes - existing report', function(assert) {
  assert.expect(4);

  visit('/reports/1/view');
  andThen(() => {
    assert.ok($('.filter-builder__subject:contains(Day)').is(':visible'),
      'After navigating out of the route, the report model is rolled back');
  });

  // Remove a metric
  click('.checkbox-selector--dimension .grouped-list__item:contains(Week) .grouped-list__item-label');
  andThen(() => {
    assert.ok($('.navi-report__revert-btn').is(':visible'),
      'Revert changes button is visible once a change has been made');
  });

  click('.navi-report__revert-btn');
  andThen(() => {
    assert.ok($('.filter-builder__subject:contains(Day)').is(':visible'),
      'After navigating out of the route, the report model is rolled back');

    assert.notOk($('.navi-report__revert-btn').is(':visible'),
      'After clicking "Revert Changes", button is once again hidden');
  });
});

test('Revert changes - new report', function(assert) {
  assert.expect(2);

  visit('/reports/new');
  andThen(() => {
    assert.notOk($('.navi-report__revert-btn').is(':visible'),
      'Revert changes button is not initially visible');

    click('.checkbox-selector--metric .grouped-list__item:contains(Ad Clicks) .grouped-list__item-label');
    andThen(() => {
      assert.notOk($('.navi-report__revert-btn').is(':visible'),
        'Revert changes button is not visible on a new report even after making a change');
    });
  });
});

test('Revert and Save report', function(assert) {
  assert.expect(2);

  visit('/reports');
  visit('/reports/new');
  let container = Application.__container__;

  //Add three metrics and save the report
  click('.checkbox-selector--metric .grouped-list__item:contains(Page Views) .grouped-list__item-label');
  click('.navi-report__save-btn');

  //remove a metric and save the report
  click('.checkbox-selector--metric .grouped-list__item:contains(Total Page Views) .grouped-list__item-label');
  click('.navi-report__save-btn');

  //remove another metric and run the report
  click('.checkbox-selector--metric .grouped-list__item:contains(Additive Page Views) .grouped-list__item-label');
  click('.navi-report__run-btn');

  //revert changes
  click('.navi-report__revert-btn');

  andThen(() => {
    let emberId = find('.report-view.ember-view').attr('id'),
        component = container.lookup('-view-registry:main')[emberId];
    assert.equal(component.get('report.visualization.type'),
      'table',
      'Report has a valid visualization type after running then reverting.');
  });

  //run after reverting
  click('.navi-report__run-btn');

  andThen(() => {
    assert.notOk(find('.navi-info-message.navi-report-error__info-message.ember-view').attr('id'),
      'Error message is not displayed when reverting and running');
  });
});

test('Save report', function(assert) {
  assert.expect(4);

  visit('/reports');
  visit('/reports/new');
  andThen(() => {
    assert.ok($('.navi-report__save-btn').is(':visible'),
      'Save button is visible in the new route');
  });

  // Build a report
  click('.checkbox-selector--metric .grouped-list__item:contains(Ad Clicks) .grouped-list__item-label');
  click('.navi-report__run-btn');
  andThen(() => {
    assert.ok(TempIdRegex.test(currentURL()),
      'Creating a report brings user to /view route with a temp id');
  });

  click('.navi-report__save-btn');
  andThen(() => {
    assert.ok(PersistedIdRegex.test(currentURL()),
      'After saving, user is brought to /view route with persisted id');

    assert.notOk($('.navi-report__save-btn').is(':visible'),
      'Save button is not visible when report is saved and has no changes');
  });
});

test('Clone action', function(assert) {
  assert.expect(2);

  visit('/reports/1/view');
  click('.navi-report__action-link:contains(Clone)');

  andThen(() => {
    assert.ok(TempIdRegex.test(currentURL()),
      'After cloning, user is brought to view route for a new report with a temp id');

    assert.equal($('.navi-report__title').text().trim(),
      'Copy of Hyrule News',
      'Cloned report is being viewed');
  });
});

test('Clone action - enabled/disabled', function(assert) {
  assert.expect(2);

  visit('/reports/1/view');
  andThen(() => {
    assert.notOk($('.navi-report__action-link:contains(Clone)').is('.navi-report__action-link--force-disabled'),
      'Clone action is enabled for a valid report');
  });

  // Remove all metrics to create , but do not save
  click('.checkbox-selector--metric .grouped-list__item:contains(Ad Clicks) .grouped-list__item-label');
  click('.checkbox-selector--metric .grouped-list__item:contains(Nav Link Clicks) .grouped-list__item-label');
  andThen(() => {
    assert.notOk($('.navi-report__action-link:contains(Clone)').is('.navi-report__action-link--force-disabled'),
      'Clone action is enabled from a valid save report');
  });
});


test('Export action - enabled/disabled', function(assert) {
  assert.expect(4);

  visit('/reports/1/view');
  andThen(() => {
    assert.notOk($('.navi-report__action-link:contains(Export)').is('.navi-report__action-link--force-disabled'),
      'Export action is enabled for a valid report');
  });

  // Add new dimension to make it out of sync with the visualization
  click('.checkbox-selector--dimension .grouped-list__item:contains(Product Family) .grouped-list__item-label');
  andThen(() => {
    assert.ok($('.navi-report__action-link:contains(Export)').is('.navi-report__action-link--force-disabled'),
      'Export action is disabled when report is not valid');
  });

  // Remove new dimension to make it in sync with the visualization
  click('.checkbox-selector--dimension .grouped-list__item:contains(Product Family) .grouped-list__item-label');
  andThen(() => {
    assert.notOk($('.navi-report__action-link:contains(Export)').is('.navi-report__action-link--force-disabled'),
      'Export action is enabled for a valid report');
  });

  // Remove all metrics to create an invalid report
  click('.checkbox-selector--metric .grouped-list__item:contains(Ad Clicks) .grouped-list__item-label');
  click('.checkbox-selector--metric .grouped-list__item:contains(Nav Link Clicks) .grouped-list__item-label');
  andThen(() => {
    assert.ok($('.navi-report__action-link:contains(Export)').is('.navi-report__action-link--force-disabled'),
      'Export action is disabled when report is not valid');
  });
});

test('Export action - href', function(assert) {
  assert.expect(4);

  let originalFeatureFlag = config.navi.FEATURES.enableMultipleExport;

  // Turn flag off
  config.navi.FEATURES.enableMultipleExport = false;

  visit('/reports/1/view');
  andThen(() => {
    assert.ok(find('.navi-report__action-link:contains(Export)').attr('href').includes('/network/day/property/?dateTime='),
      'Export url contains dimension path param');
  });

  /* == Add groupby == */
  click('.checkbox-selector--dimension .grouped-list__item:contains(Product Family) .grouped-list__item-label');
  click('.navi-report__run-btn');
  andThen(() => {
    assert.ok(find('.navi-report__action-link:contains(Export)').attr('href').includes('/network/day/property/productFamily/?dateTime='),
      'Groupby changes are automatically included in export url');

    assert.notOk(find('.navi-report__action-link:contains(Export)').attr('href').includes('filter'),
      'No filters are initially present in export url');
  });

  /* == Add filter == */
  click('.navi-report__run-btn');
  click('.checkbox-selector--dimension .grouped-list__item:contains(Product Family) .checkbox-selector__filter');

  /* == Update filter value == */
  selectChoose('.filter-values--dimension-select', '(1)');
  click('.navi-report__run-btn');
  andThen(() => {
    assert.ok(find('.navi-report__action-link:contains(Export)').attr('href').includes('productFamily%7Cid-in%5B1%5D'),
      'Filter updates are automatically included in export url');

    config.navi.FEATURES.enableMultipleExport = originalFeatureFlag;
  });
});

test('Multi export action - csv href', function(assert) {
  assert.expect(4);

  visit('/reports/1/view');
  clickDropdown('.multiple-format-export');
  andThen(() => {
    assert.ok(find('.multiple-format-export__dropdown a:contains(CSV)').attr('href').includes('/network/day/property/?dateTime='),
      'Export url contains dimension path param');
  });

  /* == Add groupby == */
  click('.checkbox-selector--dimension .grouped-list__item:contains(Product Family) .grouped-list__item-label');
  click('.navi-report__run-btn');
  clickDropdown('.multiple-format-export');
  andThen(() => {
    assert.ok(find('.multiple-format-export__dropdown a:contains(CSV)').attr('href').includes('/network/day/property/productFamily/?dateTime='),
      'Groupby changes are automatically included in export url');

    assert.notOk(find('.multiple-format-export__dropdown a:contains(CSV)').attr('href').includes('filter'),
      'No filters are initially present in export url');
  });

  /* == Add filter == */
  click('.checkbox-selector--dimension .grouped-list__item:contains(Product Family) .checkbox-selector__filter');
  /* == Update filter value == */
  selectChoose('.filter-values--dimension-select', '(1)');
  click('.navi-report__run-btn');
  clickDropdown('.multiple-format-export');
  andThen(() => {
    assert.ok(find('.multiple-format-export__dropdown a:contains(CSV)').attr('href').includes('productFamily%7Cid-in%5B1%5D'),
      'Filter updates are automatically included in export url');
  });
});

test('Multi export action - pdf href', function(assert) {
  assert.expect(4);

  const initialUrl  = '/export?reportModel=EQbwOsAmCGAu0QFzmAS0kiBGCAaCcsATqgEYCusApgM5IoBuqN50ANqgF5yoD2AdvQiwAngAcqmYB35UAtAGMAFtCKw8EBlSI0-g4Iiz5gAWyrwY8IcGgAPZtZHWa21LWuiJUyKjP9dAhrACgIAZqgA5tZmxKgKUtCQAMIcCgDWdMDGPn4B_ADyRJDaSADaEGJEvBJqTsAAutm-VP56mYilKPzQZlIAClU1ogAEOFma7OTuBiiV1dqiUlhYACwQAL7ruF09kgYQA_O1wwBMQQyT08gVgwt1iNgADM-PY5vbEN29-8CHQyLDADM50u7Vmt1qSxejzOwE29U2iK2wlQsDYewewAAEiIiOR0cMAHJUADumWMRCoAEcpjR1DMIGxeBE4uwACrQUjojyc7k_WSwEm8IhpIKwZoAcSI0FQ-kxMDqyNM5hICnanQgMVVCWSqQyGw-yti8X50AYKTi-rhjQgORaeXVKDtrUCPzm_w2NuA4TY1B0ZS9KiY_CiBlKXpowvpHRQWriUm65r15NtqEpCnFrsx0BoJvWXtlfoubEdEDpqmjEBOrwArHJlnJHgBOYbPRBt54AOheQRaGB-1awdYbWAAbK3Hu3J12e9bjKRVJAAGraPJSBhjCnU2mwFc6PTrt5KylsHgCGhKVBiMEEShKYXWSwIBnATwYiDkFz-8ZofuYxOoAA-p-JRwu8wjiO-wCUmIUaZJswBAAA';
  visit('/reports/1/view');
  clickDropdown('.multiple-format-export');
  andThen(() => {
    assert.equal(find('.multiple-format-export__dropdown a:contains(PDF)').attr('href'), initialUrl,
      'Export url contains serialized report');
  });

  /* == Add groupby == */
  click('.checkbox-selector--dimension .grouped-list__item:contains(Product Family) .grouped-list__item-label');
  click('.navi-report__run-btn');
  clickDropdown('.multiple-format-export');
  andThen(() => {
    let modelStr = find('.multiple-format-export__dropdown a:contains(PDF)').attr('href').split('=')[1];
    return CompressionService.decompress(modelStr).then(model => {
      assert.ok(get(model, 'request.dimensions').objectAt(1).get('dimension.name'),
        'productFamily',
        'Groupby changes are automatically included in export url');
    });
  });

  /* == Change to table == */
  click('.report-view__visualization-option:contains(Data Table)');
  click('.navi-report__run-btn');
  clickDropdown('.multiple-format-export');
  andThen(() => {
    let modelStr = find('.multiple-format-export__dropdown a:contains(PDF)').attr('href').split('=')[1];
    return CompressionService.decompress(modelStr).then(model => {
      assert.equal(get(model, 'visualization.type'),
        'table',
        'Visualization type changes are automatically included in export url');
    });
  });

  /* == Add grand total to table == */
  click('.report-view__visualization-edit-btn');
  click('.table-config__total-toggle-button--grand-total .x-toggle-btn');
  click('.navi-report__run-btn');
  clickDropdown('.multiple-format-export');
  andThen(() => {
    let modelStr = find('.multiple-format-export__dropdown a:contains(PDF)').attr('href').split('=')[1];
    return CompressionService.decompress(modelStr).then(model => {
      assert.equal(get(model, 'visualization.metadata.showTotals.grandTotal'),
        true,
        'Visualization config changes are automatically included in export url');
    });
  });
});

test('Get API action - enabled/disabled', function(assert) {
  assert.expect(2);

  visit('/reports/1/view');
  andThen(() => {
    assert.notOk($('.get-api').is('.navi-report__action--is-disabled'),
      'Get API action is enabled for a valid report');
  });

  // Remove all metrics to create an invalid report
  click('.checkbox-selector--metric .grouped-list__item:contains(Ad Clicks) .grouped-list__item-label');
  click('.checkbox-selector--metric .grouped-list__item:contains(Nav Link Clicks) .grouped-list__item-label');
  andThen(() => {
    assert.ok($('.get-api').is('.navi-report__action--is-disabled'),
      'Get API action is disabled for an invalid report');
  });
});

test('Share report', function(assert) {
  assert.expect(3);

  /* == Saved report == */
  visit('/reports/1/view');
  click('.navi-report__action:contains(Share) button');

  andThen(() => {
    assert.equal($('.navi-modal .primary-header').text(),
      'Share "Hyrule News"',
      'Clicking share action brings up share modal');
  });

  // Remove all metrics to create an invalid report
  click('.checkbox-selector--metric .grouped-list__item:contains(Ad Clicks) .grouped-list__item-label');
  click('.checkbox-selector--metric .grouped-list__item:contains(Nav Link Clicks) .grouped-list__item-label');
  andThen(() => {
    assert.notOk($('.navi-report__action:contains(Share)').is('.navi-report__action--is-disabled'),
      'Share action is disabled for invalid report');
  });

  // Share is disabled on new
  visit('/reports/new');
  andThen(() => {
    assert.notOk($('.navi-report__action:contains(Share)').is('.navi-report__action--is-disabled'),
      'Share action is disabled for new report');
  });
});

test('Delete report on success', function(assert) {
  assert.expect(5);

  /* == Delete success == */
  visit('/reports');
  andThen(() => {
    let reportNames = $('.table tbody td:first-child').map(function() {
      return this.textContent.trim();
    }).toArray();

    assert.deepEqual(reportNames,
      [
        'Hyrule News',
        'Hyrule Ad&Nav Clicks',
        'Report 12'
      ],
      'Report 1 is initially listed in reports route');
  });

  visit('/reports/1/view');
  click('.navi-report__action:contains(Delete) button');

  andThen(() => {
    assert.equal(find('.primary-header').text().trim(),
      'Delete "Hyrule News"',
      'Delete modal pops up when action is clicked');
  });

  click('.navi-modal .btn-primary');

  andThen(() => {
    assert.ok(currentURL().endsWith('/reports'),
      'After deleting, user is brought to report list view');

    let reportNames = $('.table tbody td:first-child').map(function() {
      return this.textContent.trim();
    }).toArray();

    assert.deepEqual(reportNames,
      [
        'Hyrule Ad&Nav Clicks',
        'Report 12'
      ],
      'Deleted report is removed from list');
  });

  // /* == Not author == */
  visit('/reports/3/view');
  andThen(() => {
    assert.notOk($('.navi-report__action:contains(Delete)').is(':visible'),
      'Delete action is not available if user is not the author');
  });
});

test('Delete action - enabled at all times', function(assert) {
  assert.expect(4);

  // Delete is not Disabled on new
  visit('/reports/new');
  andThen(() => {
    assert.notOk($('.navi-report__action:contains(Delete)').is('.navi-report__action--is-disabled'),
      'Delete action is enabled for a valid report');
  });

  // Delete is not Disabled on valid
  visit('/reports/1/view');
  andThen(() => {
    assert.notOk($('.navi-report__action:contains(Delete)').is('.navi-report__action--is-disabled'),
      'Delete action is enabled for a valid report');
  });

  /*
   * Remove all metrics to create an invalid report
   * Delete is not Disabled on invalid
   */
  click('.checkbox-selector--metric .grouped-list__item:contains(Ad Clicks) .grouped-list__item-label');
  click('.checkbox-selector--metric .grouped-list__item:contains(Nav Link Clicks) .grouped-list__item-label');
  andThen(() => {
    assert.notOk($('.navi-report__action-link:contains(Delete)').is('.navi-report__action--is-disabled'),
      'Delete action is enabled when report is not valid');
  });

  // Check Delete modal appear
  click('.navi-report__action:contains(Delete) button');
  andThen(() => {
    assert.equal(find('.primary-header').text().trim(),
      'Delete "Hyrule News"',
      'Delete modal pops up when action is clicked');
  });
});

test('Delete report on failure', function(assert) {
  assert.expect(1);

  server.urlPrefix = `${config.navi.appPersistence.uri}`;
  server.delete('/reports/:id', () => {
    return new Mirage.Response(500);
  });

  visit('/reports/2/view');
  click('.navi-report__action:contains(Delete) button');
  click('.navi-modal .btn-primary');

  andThen(() => {
    assert.ok(currentURL().endsWith('reports/2/view'),
      'User stays on current view when delete fails');
  });
});

test('Add to dashboard button - flag false', function(assert) {
  assert.expect(1);

  let originalFeatures = config.navi.FEATURES;

  // Turn flag off
  config.navi.FEATURES = { dashboards: false };

  visit('/reports/1/view');
  andThen(() => {
    assert.notOk(find('.add-to-dashboard').is(':visible'),
      'Add to Dashboard button is not visible when feature flag is off');

    config.navi.FEATURES = originalFeatures;
  });
});

test('Switch Visualization Type', function(assert) {
  assert.expect(7);

  visit('/reports/1/view');

  andThen(() => {
    assert.ok(!!find('.line-chart-widget').length,
      'Line chart visualization is shown as configured');

    assert.equal(find('.report-view__visualization-edit-btn').text().trim(),
      'Edit Line Chart',
      'Edit Line Chart label is displayed');

    assert.equal(find('.c3-legend-item').length,
      3,
      'Line chart visualization has 3 series as configured');
  });

  click('.report-view__visualization-option:contains(Data Table)');
  andThen(() => {
    assert.ok(!!find('.table-widget').length,
      'table visualization is shown when selected');

    assert.equal(find('.report-view__visualization-edit-btn').text().trim(),
      'Edit Table',
      'Edit Data Table label is displayed');
  });

  click('.report-view__visualization-option:contains(Line Chart)');
  andThen(() => {
    assert.ok(!!find('.line-chart-widget').length,
      'line-chart visualization is shown when selected');

    assert.equal(find('.report-view__visualization-edit-btn').text().trim(),
      'Edit Line Chart',
      'Edit Line Chart label is displayed');
  });
});

test('redirect from report/index route', function(assert) {
  assert.expect(2);

  visit('/reports/1');
  andThen(() => {
    assert.equal(currentURL(),
      '/reports/1/view',
      'The url of the index route is replaced with the url of the view route');

    assert.ok($('.navi-report__body .report-view').is(':visible'),
      'The report/index route redirects to the reports view route by default');
  });
});

test('visiting Reports Route', function(assert) {
  assert.expect(1);

  visit('/reports');
  andThen(() => {
    let titles = find('.navi-collection .table tr td:first-of-type').toArray().map(el => $(el).text().trim());
    assert.deepEqual(titles, [
      'Hyrule News',
      'Hyrule Ad&Nav Clicks',
      'Report 12'
    ], 'the report list with `navi-users`s reports is shown');
  });
});

test('reports route actions -- clone', function(assert) {
  assert.expect(2);

  visit('/reports');

  // TriggerEvent does not work here, need to use jquery trigger mouseenter
  andThen(() => $('.navi-collection__row:first-of-type').trigger('mouseenter'));
  // Click "Clone"
  click('.navi-collection__row:first-of-type .clone');
  andThen(() => {
    assert.ok(TempIdRegex.test(currentURL()),
      'After cloning, user is brought to view route for a new report with a temp id');

    assert.equal($('.navi-report__title').text().trim(),
      'Copy of Hyrule News',
      'Cloned report is being viewed');
  });
});

test('reports route actions -- share', function(assert) {
  assert.expect(1);

  visit('/reports');

  // TriggerEvent does not work here, need to use jquery trigger mouseenter
  andThen(() => $('.navi-collection__row:first-of-type').trigger('mouseenter'));
  // Click "Share"
  click('.navi-collection__row:first-of-type .share .btn');

  andThen(() => {
    assert.equal(find('.primary-header').text().trim(),
      'Share "Hyrule News"',
      'Share modal pops up when action is clicked');

    // Click "Cancel"
    click('.navi-modal .btn-secondary');
  });
});

test('reports route actions -- delete', function(assert) {
  assert.expect(3);

  visit('/reports');

  // TriggerEvent does not work here, need to use jquery trigger mouseenter
  andThen(() => $('.navi-collection__row:first-of-type').trigger('mouseenter'));
  // Click "Delete"
  click('.navi-collection__row:first-of-type .delete .btn');

  andThen(() => {
    assert.equal(find('.primary-header').text().trim(),
      'Delete "Hyrule News"',
      'Delete modal pops up when action is clicked');
  });

  //Click "Confirm"
  click('.navi-modal .btn-primary');

  andThen(() => {
    assert.ok(currentURL().endsWith('/reports'),
      'After deleting, user is brought to report list view');

    let reportNames = $('.table tbody td:first-child').map(function() {
      return this.textContent.trim();
    }).toArray();

    assert.deepEqual(reportNames, [
      'Hyrule Ad&Nav Clicks',
      'Report 12'
    ], 'Deleted report is removed from list');
  });
});

test('Visiting Reports Route From Breadcrumb', function(assert) {
  assert.expect(1);

  visit('/reports/1/view');

  //Click "Reports"
  click('.navi-report__breadcrumb-link');

  andThen(() => {
    assert.ok(currentURL().endsWith('/reports'),
      'When "Reports" clicked on the Breadcrumb link, it lands to "/reports" index page' );
  });
});

test('Revert report changes when exiting from route', function(assert) {
  assert.expect(2);

  visit('/reports/4/view');
  andThen(() => {
    assert.ok($('.filter-builder__subject:contains(Day)').is(':visible'),
      'After navigating out of the route, the report model is rolled back');
  });

  click('.checkbox-selector--dimension .grouped-list__item:contains(Week) .grouped-list__item-label');

  //Navigate out of report
  click('.navi-report__breadcrumb-link');

  //Navigate back to `Report 12`
  click('.navi-collection a:contains(Report 12)');

  andThen(() => {
    assert.ok($('.filter-builder__subject:contains(Day)').is(':visible'),
      'After navigating out of the route, the report model is rolled back');
  });
});

test('Revert Visualization Type - Back to Original Type', function(assert) {
  assert.expect(3);

  /* == Load report == */
  visit('/reports/1/view');
  andThen(() => {
    assert.ok(!!find('.line-chart-widget').length,
      'Line chart visualization is shown as configured');
  });

  /* == Switch to table == */
  click('.report-view__visualization-option:contains(Data Table)');
  andThen(() => {
    assert.ok(!!find('.table-widget').length,
      'table visualization is shown when selected');
  });

  /* == Revert == */
  click('.navi-report__revert-btn');
  andThen(() => {
    assert.ok(!!find('.line-chart-widget').length,
      'line-chart visualization is shown when reverted');
  });
});

test('Revert Visualization Type - Updated Report', function(assert) {
  assert.expect(5);

  /* == Load report == */
  visit('/reports/1/view');
  andThen(() => {
    assert.ok(!!find('.line-chart-widget').length,
      'Line chart visualization is shown as configured');
  });

  /* == Switch to table == */
  click('.report-view__visualization-option:contains(Data Table)');
  andThen(() => {
    assert.ok(!!find('.table-widget').length,
      'table visualization is shown when selected');
  });

  /* == Save report == */
  click('.navi-report__save-btn');
  andThen(() => {
    assert.ok(!!find('.table-widget').length,
      'table visualization is still shown when saved');
  });

  /* == Switch to chart == */
  click('.report-view__visualization-option:contains(Line Chart)');
  andThen(() => {
    assert.ok(!!find('.line-chart-widget').length,
      'line-chart visualization is shown when selected');
  });

  /* == Revert == */
  click('.navi-report__revert-btn');
  andThen(() => {
    assert.ok(!!find('.table-widget').length,
      'table visualization is shown when reverted');
  });
});

test('Revert Visualization Type - New Report', function(assert) {
  assert.expect(4);

  /* == Create report == */
  visit('/reports');
  visit('/reports/new');
  click('.checkbox-selector--metric .grouped-list__item:contains(Ad Clicks) .grouped-list__item-label');
  click('.navi-report__run-btn');
  andThen(() => {
    assert.ok(!!find('.table-widget').length,
      'Table visualization is shown by default');
  });

  /* == Save report == */
  click('.navi-report__save-btn');
  andThen(() => {
    assert.ok(!!find('.table-widget').length,
      'Table visualization is still shown when saved');
  });

  /* == Switch to metric label == */
  click('.report-view__visualization-option:contains(Metric Label)');
  andThen(() => {
    assert.ok(!!find('.metric-label-vis').length,
      'Metric label visualization is shown when selected');
  });

  /* == Revert == */
  click('.navi-report__revert-btn');
  andThen(() => {
    assert.ok(!!find('.table-widget').length,
      'table visualization is shown when reverted');
  });
});

test('Toggle Edit Visualization', function(assert) {
  assert.expect(3);

  /* == Visit report == */
  visit('/reports/1/view');

  /* == Verify visualization config is not shown == */
  andThen(() => {
    assert.notOk(!!find('.report-view__visualization-edit').length,
      'visualization config is closed on initial report load');
  });

  /* == Open config == */
  click('.report-view__visualization-edit-btn');
  andThen(() => {
    assert.ok(!!find('.report-view__visualization-edit').length,
      'visualization config is opened after clicking edit button');
  });

  /* == Close config == */
  click('.report-view__visualization-edit-btn');
  andThen(() => {
    assert.notOk(!!find('.report-view__visualization-edit').length,
      'visualization config is closed after clicking edit button');
  });
});

test('Disabled Visualization Edit', function(assert) {
  assert.expect(4);

  // Visit report and make a change that invalidates visualization
  visit('/reports/1/view');
  click('.grouped-list__item:contains(Product Family) .checkbox-selector__checkbox');
  andThen(() => {
    assert.notOk(find('.report-view__visualization-edit-btn').is(':visible'),
      'Edit visualization button is no longer visible');

    assert.equal(find('.report-view__info-text').text().trim(),
      'Run request to update Line Chart',
      'Notification to run request is visible');
  });

  // Run report
  click('.navi-report__run-btn');
  andThen(() => {
    assert.ok(find('.report-view__visualization-edit-btn').is(':visible'),
      'After running, edit visualization button is once again visible');

    assert.notOk(find('.report-view__info-text').is(':visible'),
      'After running, notification to run is no longer visible');
  });
});

test('Disabled Visualization Edit While Editing', function(assert) {
  assert.expect(4);

  visit('/reports/1/view');
  click('.report-view__visualization-edit-btn');
  andThen(() => {
    assert.ok(find('.report-view__visualization-edit').is(':visible'),
      'Visualization edit panel is visible after clicking the edit button');
  });

  // Make a change that invalidates visualization
  click('.grouped-list__item:contains(Product Family) .checkbox-selector__checkbox');
  andThen(() => {
    assert.notOk(find('.report-view__visualization-edit').is(':visible'),
      'Visualization edit panel is hidden when there are request changes that have not been run');

    assert.notOk(find('.report-view__visualization-edit-btn').is(':visible'),
      'Visualization edit button is hidden when there are request changes that have not been run');
  });

  // Run report
  click('.navi-report__run-btn');
  andThen(() => {
    assert.ok(find('.report-view__visualization-edit-btn').is(':visible'),
      'Visualization edit button is back after running report');
  });
});

test('Save changes', function(assert) {
  assert.expect(2);

  visit('/reports/1/view');
  click('.checkbox-selector--metric .grouped-list__item:contains(Ad Clicks) .grouped-list__item-label');
  andThen(() => {
    assert.ok($('.navi-report__save-btn').is(':visible'),
      'Save changes button is visible once a change has been made and when owner of report');
  });

  visit('/reports/3/view');
  click('.checkbox-selector--metric .grouped-list__item:contains(Ad Clicks) .grouped-list__item-label');
  andThen(() => {
    assert.notOk($('.navi-report__save-btn').is(':visible'),
      'Save changes button is visible when not owner of a report');
  });
});

test('Error route', function(assert) {
  assert.expect(1);

  //suppress errors and exceptions for this test
  let originalLoggerError = Ember.Logger.error,
      originalException = Ember.Test.adapter.exception;

  Ember.Logger.error = function(){};
  Ember.Test.adapter.exception = function(){};

  visit('/reports/invalidRoute');
  andThen(() => {
    assert.equal($('.report-not-found').text().replace(/\s+/g, " ").trim(),
      'Oops! Something went wrong with this report. Try going back to where you were last or to the reports page.',
      'An error message is displayed for an invalid route');

    Ember.Logger.error = originalLoggerError;
    Ember.Test.adapter.exception = originalException;
  });
});

test('Error data request', function(assert) {
  assert.expect(1);

  server.get(`${config.navi.dataSources[0].uri}/v1/data/*path`, () => {
    return new Mirage.Response(
      400,
      {},
      { description: 'Cannot merge mismatched time grains month and day' }
    );
  });

  //suppress errors and exceptions for this test
  let originalLoggerError = Ember.Logger.error,
      originalException = Ember.Test.adapter.exception;

  Ember.Logger.error = function(){};
  Ember.Test.adapter.exception = function(){};

  visit('/reports/5/view');
  andThen(() => {
    assert.equal($('.navi-report-error__info-message').text().replace(/\s+/g, " ").trim(),
      'Oops! There was an error with your request. Cannot merge mismatched time grains month and day',
      'An error message is displayed for an invalid request');

    Ember.Logger.error = originalLoggerError;
    Ember.Test.adapter.exception = originalException;
  });
});

test('Updating chart series', function(assert) {
  assert.expect(3);

  // Check inital series
  visit('/reports/1/view');
  andThen(() => {
    let seriesLabels = find('.c3-legend-item').map(function() { return this.textContent.trim(); }).get();
    assert.deepEqual(seriesLabels,
      [
        'Property 1',
        'Property 2',
        'Property 3'
      ],
      '3 series are initially present');
  });

  // Delete a series
  click('.report-view__visualization-edit-btn');
  click('.series-collection .navi-icon__delete:eq(1)');
  andThen(() => {
    let seriesLabels = find('.c3-legend-item').map(function() { return this.textContent.trim(); }).get();
    assert.deepEqual(seriesLabels,
      [
        'Property 1',
        'Property 3'
      ],
      'Selected series has been deleted from chart');
  });

  // Add a series
  click('.add-series .table-row:contains(Property 4)');
  andThen(() => {
    let seriesLabels = find('.c3-legend-item').map(function() { return this.textContent.trim(); }).get();
    assert.deepEqual(seriesLabels,
      [
        'Property 1',
        'Property 3',
        'Property 4'
      ],
      'Selected series has been added chart');
  });
});

test('favorite reports', function(assert) {
  assert.expect(3);

  // Filter by favorites
  visit('/reports');
  click('.pick-form li:contains(Favorites)');

  andThen(() => {
    let listedReports = find('tbody tr td:first-of-type').toArray().map(el => $(el).text().trim());

    assert.deepEqual(listedReports,[
      'Hyrule Ad&Nav Clicks'
    ], 'Report 2 is in favorites section');
  });

  // Favorite report 1
  visit('/reports/1');
  click('.favorite-item');

  // Filter by favorites
  visit('/reports');
  click('.pick-form li:contains(Favorites)');

  andThen(() => {
    let listedReports = find('tbody tr td:first-of-type').toArray().map(el => $(el).text().trim());

    assert.deepEqual(listedReports,[
      'Hyrule News',
      'Hyrule Ad&Nav Clicks',
    ], 'Two reports are in favorites now');
  });

  // Unfavorite report 2
  click('tbody tr td a:contains(Hyrule Ad&Nav Clicks)');
  click('.favorite-item');
  visit('/reports');
  click('.pick-form li:contains(Favorites)');

  andThen(() => {
    let listedReports = find('tbody tr td:first-of-type').toArray().map(el => $(el).text().trim());

    assert.deepEqual(listedReports,[
      'Hyrule News'
    ], 'Only one report is in favorites now');
  });
});

test('favorite report - rollback on failure', function(assert) {
  assert.expect(2);

  // Mock server path endpoint to mock failure
  server.urlPrefix = `${config.navi.appPersistence.uri}`;
  server.patch('/users/:id', () => {
    return new Mirage.Response(500);
  });

  // Filter by favorites
  visit('/reports');
  click('.pick-form li:contains(Favorites)');

  andThen(() => {
    let listedReports = find('tbody tr td:first-of-type').toArray().map(el => $(el).text().trim());

    assert.deepEqual(listedReports,[
      'Hyrule Ad&Nav Clicks'
    ], 'Report 2 is in favorites section');
  });

  visit('/reports/1');

  andThen(() => {
    click('.favorite-item');

    andThen(() => {
      visit('/reports');
      andThen(() => {
        click('.pick-form li:contains(Favorites)');

        andThen(() => {
          let listedReports = find('tbody tr td:first-of-type').toArray().map(el => $(el).text().trim());

          assert.deepEqual(listedReports,[
            'Hyrule Ad&Nav Clicks',
          ], 'The user state is rolled back on failure');
        });
      });
    });
  });
});

test('running report after reverting changes', function(assert) {
  assert.expect(2);

  /* == Modify report by adding a metric == */
  visit('/reports/1/view');
  click('.report-view__visualization-option:contains(Data Table)');
  click('.checkbox-selector--metric .grouped-list__item:contains(Time Spent) .grouped-list__item-label');
  click('.navi-report__run-btn');
  andThen(() => {
    assert.ok($('.table-header-cell:contains(Time Spent)').is(':visible'),
      'Time Spent column is displayed');
  });

  /* == Revert report to its original state == */
  click('.checkbox-selector--metric .grouped-list__item:contains(Time Spent) .grouped-list__item-label');
  click('.navi-report__run-btn');
  andThen(() => {
    assert.notOk($('.table-header-cell:contains(Time Spent)').is(':visible'),
      'Time Spent column is not displayed');
  });
});

test('Running a report against unauthorized table shows unauthorized route', function(assert) {
  assert.expect(5);
  visit('/reports/1/view');

  selectChoose('.navi-table-select__dropdown', 'Protected Table');

  click('.navi-report__run-btn');
  andThen(() => {
    assert.equal(currentURL(),
      '/reports/1/unauthorized',
      "check to seee if we are on the unauthorized route");

    assert.ok(!!find('.navi-report-invalid__info-message .fa-lock').length,
      'unauthorized component is loaded');
  });

  selectChoose('.navi-table-select__dropdown', 'Network');
  click('.navi-report__run-btn');
  andThen(() => {
    assert.equal(currentURL(),
      '/reports/1/view',
      "check to seee if we are on the view route");

    assert.notOk(!!find('.navi-report-invalid__info-message .fa-lock').length,
      'unauthorized component is not loaded');

    assert.ok(!!find('.table-widget').length,
      'Data table visualization loads');

  });
});

test('filtering on a dimension with a storage strategy of \'none\'', function(assert) {
  assert.expect(7);

  //Add filter for a dimension where storageStrategy is 'none' and try to run the report
  visit('/reports/1/view');
  click('.grouped-list__group-header:contains(test)');
  click('.grouped-list__item:contains(Context Id)');
  click('.grouped-list__item:contains(Context Id) > .checkbox-selector__filter');
  click('.navi-report__run-btn');

  andThen(()=> {
    assert.equal(find('.navi-info-message__error-list-item').text().trim(),
      'Context Id filter needs at least one value',
      'Error message is shown when trying to run a report with an empty filter');
  });

  //Give the filter a value that will not match any dimension values
  fillIn('.emberTagInput-new>input', 'This_will_not_match_any_dimension_values');
  triggerEvent('.js-ember-tag-input-new', 'blur');
  andThen(() => {
    assert.notOk(find('.navi-info-message__error-list-item').is(':visible'),
      'No errors are shown after giving a value to filter on');

    server.urlPrefix = `${config.navi.dataSources[0].uri}/v1`;
    server.get('/data/*path', (db, request) => {
      assert.equal(get(request, 'queryParams.filters'),
        'contextId|id-in[This_will_not_match_any_dimension_values]',
        'Filter value is passed even when the value doesn\'nt match any dimension IDs');

      return { rows: [] };
    });
  });

  //Run the report with the invalid dimension value to filter on
  click('.navi-report__run-btn');
  andThen(() => {
    assert.notOk(find('.navi-report-invalid__info-message').is(':visible'),
      'The report is run even when no dimension values match the filter');
  });

  //Give the filter an empty value
  click('.emberTagInput-remove');
  triggerEvent('.filter-values--multi-value-input', 'blur');
  click('.navi-report__run-btn');

  andThen(()=> {
    assert.equal(find('.navi-info-message__error-list-item').text().trim(),
      'Context Id filter needs at least one value',
      'Error message is shown when trying to run a report with an empty filter value');

    assert.ok(find('.filter-values--multi-value-input--error').is(':visible'),
      'Filter value input validation errors are shown');
  });

  click('.grouped-list__item:contains(Operating System)');
  click('.grouped-list__item:contains(Operating System) > .checkbox-selector__filter');

  andThen(() => {
    assert.ok(find('.filter-values--dimension-select').is(':visible'),
      'Dimension select is used when the dimension\'s storage strategy is not \'none\'');
  });
});


test('filter - add and remove using filter icon', function(assert) {
  assert.expect(4);

  visit('/reports/1');
  //add dimension filter
  click('.grouped-list__item:contains(Operating System) .checkbox-selector__filter');
  andThen(() => {
    assert.ok(find('.filter-builder__subject:contains(Operating System)').is(':visible'),
      'The Operating System dimension filter is added');
  });

  //remove filter by clicking on filter icon again
  click('.grouped-list__item:contains(Operating System) .checkbox-selector__filter');
  andThen(() => {
    assert.notOk(find('.filter-builder__subject:contains(Operating System)').is(':visible'),
      'The Operating System dimension filter is removed when filter icon is clicked again');
  });

  //add metric filter
  click('.grouped-list__item:contains(Ad Clicks) .checkbox-selector__filter');
  andThen(() => {
    assert.ok(find('.filter-builder__subject:contains(Ad Clicks)').is(':visible'),
      'The Ad Clicks metric filter is added');
  });

  //remove metric filter by clicking on filter icon again
  click('.grouped-list__item:contains(Ad Clicks) .checkbox-selector__filter');
  andThen(() => {
    assert.notOk(find('.filter-builder__subject:contains(Ad Clicks)').is(':visible'),
      'The Ad Clicks metric filter is removed when filter icon is clicked again');
  });
});
