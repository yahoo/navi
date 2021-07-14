import { module, test, skip } from 'qunit';
import {
  blur,
  click,
  currentURL,
  fillIn,
  find,
  findAll,
  triggerEvent,
  visit,
  waitFor,
  setupOnerror,
} from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupAnimationTest, animationsSettled } from 'ember-animated/test-support';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { Response } from 'ember-cli-mirage';
import { selectChoose, selectSearch } from 'ember-power-select/test-support';
import { clickTrigger } from 'ember-basic-dropdown/test-support/helpers';
import { clickItem, clickItemFilter } from 'navi-reports/test-support/report-builder';
import { reorder } from 'ember-sortable/test-support/helpers';
import Component from '@ember/component';
import { get } from '@ember/object';
import $ from 'jquery';
import config from 'ember-get-config';
import moment from 'moment';

// Regex to check that a string ends with "{uuid}/view"
const TempIdRegex = /\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\/view$/;

// Regex to check that a string ends with "{integer}/view"
const PersistedIdRegex = /\/\d+\/view$/;

let CompressionService;

async function newReport() {
  await visit('/reports/new');
  await click('.report-builder-source-selector__source-button[data-source-name="Bard One"]');
  await click('.report-builder-source-selector__source-button[data-source-name="Network"]');
  await animationsSettled();
}

module('Acceptance | Navi Report', function (hooks) {
  setupApplicationTest(hooks);
  setupAnimationTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(function () {
    CompressionService = this.owner.lookup('service:compression');
    // Mocking add-to-dashboard component
    this.owner.application.register(
      'component:report-actions/add-to-dashboard',
      Component.extend({ classNames: 'add-to-dashboard' }),
      { instantiate: false }
    );

    config.navi.FEATURES.enableVerticalCollectionTableIterator = true;
  });

  hooks.afterEach(function () {
    config.navi.FEATURES.enableVerticalCollectionTableIterator = false;
  });

  test('validation errors', async function (assert) {
    assert.expect(3);

    // Make an invalid change and run report
    await visit('/reports/13');
    await click('.navi-column-config-item__remove-icon[aria-label="delete metric Ad Clicks"]');
    await click('.navi-column-config-item__remove-icon[aria-label="delete dimension Property (id)"]');
    await click('.navi-column-config-item__remove-icon[aria-label="delete time-dimension Date Time (day)"]');
    await click('.navi-report__run-btn');

    assert.equal(currentURL(), '/reports/13/invalid', 'User is transitioned to invalid route');

    let errors = findAll('.navi-info-message__error-list-item').map((el) => find(el).innerText.trim());
    assert.deepEqual(errors, ['At least one column should be selected'], 'Form errors are displayed to user');

    await clickItem('dimension', 'Date Time');
    await clickItem('dimension', 'Property');
    await clickItem('metric', 'Ad Clicks');
    await click('.navi-report__run-btn');

    assert.equal(currentURL(), '/reports/13/view', 'Fixing errors and clicking "Run" returns user to view route');
  });

  test('Clone report', async function (assert) {
    assert.expect(2);

    await visit('/reports/1/clone');

    assert.dom('.report-view').exists('The route transistions to report view');

    assert.equal(
      find('.report-header__title').innerText.trim(),
      'Copy Of Hyrule News',
      'Cloned report is being viewed'
    );
  });

  test('Clone invalid report', async function (assert) {
    assert.expect(2);

    await visit('/reports/13');
    // Add a dimension filter
    await click('.navi-column-config-item__remove-icon[aria-label="delete metric Ad Clicks"]');
    await click('.navi-column-config-item__remove-icon[aria-label="delete dimension Property (id)"]');
    await click('.navi-column-config-item__remove-icon[aria-label="delete time-dimension Date Time (day)"]');
    await click('.report-actions__clone-btn');

    assert.ok(
      currentURL().endsWith('/edit'),
      'After clicking the run button, the route transitions to the invalid route'
    );

    assert.notOk(currentURL().startsWith('/reports/13'), 'After clicking, the url no longer is on report 13');
  });

  test('New report', async function (assert) {
    assert.expect(4);
    let originalFlag = config.navi.FEATURES.exportFileTypes;
    config.navi.FEATURES.exportFileTypes = ['csv', 'png'];
    await newReport();

    /* == Add filter == */
    await clickItemFilter('dimension', 'Operating System');

    /* == Run with errors == */
    await click('.navi-report__run-btn');

    assert.ok(
      currentURL().endsWith('/invalid'),
      'After clicking the run button, the route transitions to the invalid route'
    );

    /* == Fix errors == */
    await clickItem('dimension', 'Date Time');
    await selectChoose('.navi-column-config-item__parameter-trigger', 'Day');
    await clickItemFilter('dimension', 'Operating System');
    await clickItem('metric', 'Ad Clicks');
    await selectChoose('.filter-builder__operator-trigger', 'Between');

    await clickTrigger('.filter-values--date-range-input__low-value');

    await click($('button.ember-power-calendar-day--current-month:contains(1)')[0]);
    await clickTrigger('.filter-values--date-range-input__high-value .ember-basic-dropdown-trigger');
    await click($('button.ember-power-calendar-day--current-month:contains(2)')[0]);
    await click('.navi-report__run-btn');

    assert.ok(currentURL().endsWith('/view'), 'Running a report with no errors transitions to view route');

    assert.ok(!!findAll('.table-widget').length, 'Data table visualization is shown by default');

    assert.ok(
      !!findAll('.table-header-row-vc--view .table-header-cell').filter((el) => el.innerText.includes('Ad Clicks'))
        .length,
      'Ad Clicks column is displayed'
    );

    config.navi.FEATURES.exportFileTypes = originalFlag;
  });

  test('New report - copy api', async function (assert) {
    assert.expect(3);

    await newReport();
    await clickItem('metric', 'Ad Clicks');

    //add date-dimension
    await clickItem('dimension', 'Date Time');

    //set the filter interval
    await selectChoose('.filter-builder__operator-trigger', 'Between');
    await clickTrigger('.filter-values--date-range-input__low-value');
    await click($('button.ember-power-calendar-day--current-month:contains(5)')[0]);
    await clickTrigger('.filter-values--date-range-input__high-value');
    await click($('button.ember-power-calendar-day--current-month:contains(10)')[0]);

    await click('.get-api__action-btn');

    assert.dom('.get-api__modal').exists('Copy modal is open after fixing error clicking button');

    /* == Add some more metrics and check that copy modal updates == */
    await click('.d-close');
    await clickItem('metric', 'Additive Page Views');
    await click('.get-api__action-btn');

    assert.ok(
      find('.get-api__api-input').value.includes('metrics=adClicks%2CaddPageViews'),
      'API query updates with request'
    );

    assert
      .dom('.get-api__api-input')
      .hasValue(/^https:\/\/data.naviapp.io\/\S+$/, 'shows api url from right datasource');
  });

  test('New report - datasource query param', async function (assert) {
    assert.expect(1);
    await visit('/reports/new?datasource=bardTwo');
    assert
      .dom('.report-builder-sidebar__source')
      .hasText('Bard Two', 'Appropriate Datasource is selected in new report');
  });

  test('New report - incorrect datasource query param', async function (assert) {
    assert.expect(1);
    await visit('/reports/new?datasource=Test');
    assert
      .dom('.navi-info-message')
      .containsText(
        'An error occurred while retrieving your report.',
        'An error message is displayed for an invalid datasource'
      );
  });

  test('Revert changes when exiting report - existing report', async function (assert) {
    // visit report 1
    await visit('/reports/1/view');

    assert.dom('.filter-builder__subject').hasText('Date Time day');

    // remove the dateTime column
    await click('.navi-column-config-item__remove-icon[aria-label="delete time-dimension Date Time (day)"]');

    assert.dom('.navi-report__revert-btn').isVisible('Revert changes button is visible once a change has been made');

    await click('.navi-report__revert-btn');

    assert.dom('.navi-report__revert-btn').isNotVisible('After clicking "Revert Changes", button is once again hidden');

    assert.dom('.navi-column-config-item[data-name="dateTime"]');
    assert.dom('.filter-builder__subject').hasText('Date Time day');
  });

  test('Revert changes - existing report', async function (assert) {
    assert.expect(4);

    await visit('/reports/13/view');

    assert.ok(
      !!$('.filter-builder__subject:contains(day)').length,
      'After navigating to a route, the Timegrain "day" option is visible'
    );

    // Remove a metric
    await click('.navi-column-config-item__remove-icon[aria-label="delete time-dimension Date Time (day)"]');

    assert.dom('.navi-report__revert-btn').isVisible('Revert changes button is visible once a change has been made');

    await click('.navi-report__revert-btn');

    assert.ok(
      !!$('.filter-builder__subject:contains(day)').length,
      'After navigating out of the route, the report model is rolled back'
    );

    assert.dom('.navi-report__revert-btn').isNotVisible('After clicking "Revert Changes", button is once again hidden');
  });

  test('Revert changes - new report', async function (assert) {
    assert.expect(2);

    await newReport();

    assert.dom('.navi-report__revert-btn').isNotVisible('Revert changes button is not initially visible');

    await clickItem('metric', 'Ad Clicks');

    assert
      .dom('.navi-report__revert-btn')
      .isNotVisible('Revert changes button is not visible on a new report even after making a change');
  });

  test('Revert and Save report', async function (assert) {
    assert.expect(4);

    await visit('/reports');
    await newReport();

    await clickItem('dimension', 'Date Time');
    await selectChoose('.navi-column-config-item__parameter-trigger', 'Day');
    await selectChoose('.filter-builder__operator-trigger', 'Between');

    //Add metric and save the report
    await clickItem('metric', 'Page Views');
    await click('.navi-report__save-btn');

    server.patch('/reports/:id', function ({ reports }, request) {
      assert.equal(
        request.requestHeaders['Content-Type'],
        'application/vnd.api+json',
        'Request header content-type is correct JSON-API mime type'
      );
      assert.equal(
        request.requestHeaders.Accept,
        'application/vnd.api+json',
        'Request header accept is correct JSON-API mime type'
      );
      const id = request.params.id;
      let attrs = this.normalizedRequestAttrs();

      return reports.find(id).update(attrs);
    });

    //remove a metric and save the report
    await clickItem('metric', 'Total Page Views');
    await click('.navi-report__save-btn');

    //remove another metric and run the report
    await clickItem('metric', 'Additive Page Views');
    await click('.navi-report__run-btn');

    //revert changes
    await click('.navi-report__revert-btn');

    let emberId = find('.report-view.ember-view').id,
      component = this.owner.lookup('-view-registry:main')[emberId];
    assert.equal(
      component.get('report.visualization.type'),
      'table',
      'Report has a valid visualization type after running then reverting.'
    );

    //run after reverting
    await click('.navi-report__run-btn');

    assert
      .dom('.navi-info-message.navi-report-error__info-message.ember-view')
      .isNotVisible('Error message is not displayed when reverting and running');
  });

  test('Cancel Save As report', async function (assert) {
    assert.expect(6);

    await visit('/reports');
    await newReport();

    //Add a metrics and save the report
    await clickItem('dimension', 'Date Time');
    await selectChoose('.filter-builder__operator-trigger', 'Between');
    await clickItem('metric', 'Additive Page Views');
    await click('.navi-report__save-btn');

    // Change the Dim
    await click('.navi-column-config-item__trigger');
    await selectChoose('.navi-column-config-item__parameter', 'Week');

    // And click Save AS the report
    await click('.navi-report__save-as-btn');
    // The Modal with buttons is Visible
    assert.dom('.save-as__cancel-btn').isVisible('Save As Modal is visible with cancel key');

    // Press the Modal X button
    await click('.save-as__cancel-btn');

    // Changes were not reverted, but they were not saved
    assert.ok(
      !!$('.filter-builder__subject:contains(isoWeek)').length,
      'On cancel the dirty state of the report still remains'
    );

    let emberId = find('.report-view.ember-view').id,
      component = this.owner.lookup('-view-registry:main')[emberId];
    assert.equal(
      component.get('report.visualization.type'),
      'table',
      'Report has a valid visualization type after closing Save-As Modal'
    );

    // And click Save AS the report
    await click('.navi-report__save-as-btn');

    // The Modal with buttons is Visible
    assert.dom('.save-as__cancel-btn').isVisible('Save As Modal is visible with cancel key');

    // Press the Modal cancel button
    await click('.save-as__cancel-btn');

    // Changes were not reverted, but they were not saved
    assert.ok(
      !!$('.filter-builder__subject:contains(isoWeek)').length,
      'On cancel the dirty state of the report still remains'
    );

    assert.equal(
      component.get('report.visualization.type'),
      'table',
      'Report has a valid visualization type after canceling Save-As.'
    );
  });

  test('Save As report', async function (assert) {
    assert.expect(6);

    await visit('/reports/13');

    // Change the Dim
    await click('.navi-column-config-item__trigger');

    await selectChoose('.navi-column-config-item__parameter', 'Week');

    // And click Save AS the report
    await click('.navi-report__save-as-btn');

    // The Modal with buttons is Visible

    assert.dom('.save-as__save-as-btn').isVisible('Save As Modal is visible with save as key');

    // Press the save as
    await click('.save-as__save-as-btn');

    assert.ok(!!$('.filter-builder__subject:contains(isoWeek)').length, 'The new Dim is shown in the new report.');

    // New Report is run
    let emberId = find('.report-view.ember-view').id,
      component = this.owner.lookup('-view-registry:main')[emberId];
    assert.equal(
      component.get('report.visualization.type'),
      'table',
      'Report has a valid visualization type after running then reverting.'
    );

    assert
      .dom('.report-header__title')
      .hasText('(New Copy) RequestV2 testing report', 'New Saved Report is being viewed');

    await visit('/reports/13');

    assert.ok(!!$('.filter-builder__subject:contains(day)').length, 'Old unsaved report have the old DIM.');

    assert
      .dom('.report-header__title')
      .hasText('RequestV2 testing report', 'Old Report with unchanged title is being viewed.');
  });

  test('Save As change title manually', async function (assert) {
    assert.expect(6);
    await visit('/reports/13');
    // Change the Dim
    await click('.navi-column-config-item__trigger');

    await selectChoose('.navi-column-config-item__parameter', 'Month');

    // And click Save AS the report
    await click('.navi-report__save-as-btn');

    // The Modal with buttons is Visible
    assert.dom('.save-as__save-as-btn').isVisible('Save As Modal is visible with save as key');

    //fill in new title
    await fillIn('.save-as__report-name', 'Title of Hyrule');

    // Press the save as
    await click('.save-as__save-as-btn');

    assert.ok(!!$('.filter-builder__subject:contains(month)').length, 'The new Dim is shown in the new report.');

    // New Report is run
    let emberId = find('.report-view.ember-view').id,
      component = this.owner.lookup('-view-registry:main')[emberId];
    assert.equal(
      component.get('report.visualization.type'),
      'table',
      'Report has a valid visualization type after running then reverting.'
    );

    assert.dom('.report-header__title').hasText('Title of Hyrule', 'New Saved Report is being viewed');

    await visit('/reports/13');

    assert.ok(!!$('.filter-builder__subject:contains(day)').length, 'Old unsaved report have the old DIM.');

    assert
      .dom('.report-header__title')
      .hasText('RequestV2 testing report', 'Old Report with unchanged title is being viewed.');
  });

  test('Save As on failure', async function (assert) {
    assert.expect(3);

    server.urlPrefix = `${config.navi.appPersistence.uri}`;
    server.post('/reports', () => new Response(500));

    await visit('/reports/13');

    // Change the Dim
    await click('.navi-column-config-item__trigger');
    await selectChoose('.navi-column-config-item__parameter', 'Week');

    // And click Save AS the report
    await click('.navi-report__save-as-btn');

    // Press the save as
    await click('.save-as__save-as-btn');

    // An error will occur and it will go back to old report dirty state

    // Check URL
    assert.equal(currentURL(), '/reports/13/view', 'The url shows report 1');

    // Old Report
    assert
      .dom('.report-header__title')
      .hasText('RequestV2 testing report', 'Old Report with unchanged title is being viewed.');

    // Dirty state of old
    assert.ok(!!$('.filter-builder__subject:contains(isoWeek)').length, 'Old unsaved report have the old DIM.');
  });

  test('Save report', async function (assert) {
    assert.expect(4);

    await visit('/reports');
    await newReport();

    assert.dom('.navi-report__save-btn').isVisible('Save button is visible in the new route');

    // Build a report
    await clickItem('metric', 'Ad Clicks');
    await clickItem('dimension', 'Date Time');
    await click('.navi-report__run-btn');

    assert.ok(TempIdRegex.test(currentURL()), 'Creating a report brings user to /view route with a temp id');

    await click('.navi-report__save-btn');

    assert.ok(PersistedIdRegex.test(currentURL()), 'After saving, user is brought to /view route with persisted id');

    assert
      .dom('.navi-report__save-btn')
      .isNotVisible('Save button is not visible when report is saved and has no changes');
  });

  test('Clone action', async function (assert) {
    assert.expect(2);

    await visit('/reports/1/view');
    await click('.report-actions__clone-btn');

    assert.ok(
      TempIdRegex.test(currentURL()),
      'After cloning, user is brought to view route for a new report with a temp id'
    );

    assert.dom('.report-header__title').hasText('Copy of Hyrule News', 'Cloned report is being viewed');
  });

  test('Clone action - enabled/disabled', async function (assert) {
    assert.expect(2);

    await visit('/reports/1/view');

    assert
      .dom('.report-actions__clone-btn')
      .hasNoClass('navi-report__action-link--force-disabled', 'Clone action is enabled for a valid report');

    // Remove all metrics to create , but do not save
    await clickItem('metric', 'Ad Clicks');
    await clickItem('metric', 'Nav Link Clicks');

    assert
      .dom('.report-actions__clone-btn')
      .hasNoClass('navi-report__action-link--force-disabled', 'Clone action is enabled from a valid save report');
  });

  test('Export feature flag - disabled', async function (assert) {
    assert.expect(1);

    let originalFlag = config.navi.FEATURES.exportFileTypes;

    await visit('/reports/1/view');

    assert.deepEqual(
      findAll('.report-header__header-actions .button').map((e) => e.textContent.trim()),
      ['API Query', 'Clone', 'Share', 'Schedule', 'Delete'],
      'Export is disabled by default'
    );

    config.navi.FEATURES.exportFileTypes = originalFlag;
  });

  test('Export feature flag - enabled', async function (assert) {
    assert.expect(1);

    let originalFlag = config.navi.FEATURES.exportFileTypes;

    config.navi.FEATURES.exportFileTypes = ['csv', 'pdf', 'png'];
    await visit('/reports/1/view');
    assert.deepEqual(
      findAll('.report-header__header-actions .button').map((e) => e.textContent.trim()),
      ['API Query', 'Clone', 'Export', 'Share', 'Schedule', 'Delete'],
      'Export is enabled with the feature flag on'
    );

    config.navi.FEATURES.exportFileTypes = originalFlag;
  });

  test('Export action - enabled/disabled', async function (assert) {
    assert.expect(4);

    let originalFlag = config.navi.FEATURES.exportFileTypes;
    config.navi.FEATURES.exportFileTypes = ['csv', 'pdf', 'png'];

    await visit('/reports/1/view');

    assert
      .dom('.report-actions__export-btn')
      .hasNoClass('navi-report__action-link--force-disabled', 'Export action is enabled for a valid report');

    // Remove dimension to make it out of sync with the visualization
    await click('.navi-column-config-item__remove-icon[aria-label="delete dimension Property (id)"]');

    //currently failing as it should
    assert
      .dom('.report-actions__export-btn')
      .hasClass('is-disabled', 'Export action is disabled when report is not valid');

    // Revert changes to make it in sync with the visualization
    await click('.navi-report__revert-btn');

    assert.dom('.report-actions__export-btn').hasNoClass('is-disabled', 'Export action is enabled for a valid report');

    // Remove visualization metric to create an invalid report
    await click('.navi-column-config-item__remove-icon[aria-label="delete metric Ad Clicks"]');

    assert
      .dom('.report-actions__export-btn')
      .hasClass('is-disabled', 'Export action is disabled when report is not valid');

    config.navi.FEATURES.exportFileTypes = originalFlag;
  });

  test('Export action - href', async function (assert) {
    assert.expect(5);

    let originalFeatureFlag = config.navi.FEATURES.exportFileTypes;

    // Turn flag off
    config.navi.FEATURES.exportFileTypes = ['csv'];
    await visit('/reports/1/view');
    await click($('.report-actions__export-btn:contains(Export)')[0]);
    assert.dom('.alert.is-info').hasText('The CSV download should begin shortly');
    assert.ok(
      $('.export__download-link').attr('href').includes('/network/day/property;show=id/?dateTime='),
      'Export url contains dimension path param'
    );
    /* == Add groupby == */
    await clickItem('dimension', 'Product Family');
    await click('.navi-report__run-btn');
    await click($('.report-actions__export-btn:contains(Export)')[0]);
    assert.ok(
      $('.export__download-link')
        .attr('href')
        .includes('/network/day/property;show=id/productFamily;show=id/?dateTime='),
      'Groupby changes are automatically included in export url'
    );
    assert.notOk(
      $('.export__download-link').attr('href').includes('filter'),
      'No filters are initially present in export url'
    );

    await click('.navi-report__run-btn');
    await clickItemFilter('dimension', 'Product Family');

    /* == Update filter value == */
    await selectChoose('.filter-values--dimension-select__trigger', '1');
    await click('.navi-report__run-btn');
    await click($('.report-actions__export-btn:contains(Export)')[0]);
    assert.ok(
      decodeURIComponent($('.export__download-link').attr('href')).includes('productFamily|id-in["1"]'),
      'Filter updates are automatically included in export url'
    );
    config.navi.FEATURES.exportFileTypes = originalFeatureFlag;
  });

  test('Multi export action - csv href', async function (assert) {
    assert.expect(5);

    let originalFlag = config.navi.FEATURES.exportFileTypes;
    config.navi.FEATURES.exportFileTypes = ['csv', 'pdf', 'png'];

    await visit('/reports/1/view');
    await clickTrigger('.multiple-format-export');

    assert.ok(
      $('.multiple-format-export__dropdown a:contains(CSV)')
        .attr('href')
        .includes('/network/day/property;show=id/?dateTime='),
      'Export url contains dimension path param'
    );

    /* == Add groupby == */
    await clickItem('dimension', 'Product Family');
    await click('.navi-report__run-btn');
    await clickTrigger('.multiple-format-export');

    assert.ok(
      $('.multiple-format-export__dropdown a:contains(CSV)')
        .attr('href')
        .includes('/network/day/property;show=id/productFamily;show=id/?dateTime='),
      'Groupby changes are automatically included in export url'
    );

    assert.notOk(
      $('.multiple-format-export__dropdown a:contains(CSV)').attr('href').includes('filter'),
      'No filters are initially present in export url'
    );

    /* == Add filter == */
    await clickItemFilter('dimension', 'Product Family');
    /* == Update filter value == */
    await selectChoose('.filter-values--dimension-select__trigger', '1');
    await click('.navi-report__run-btn');
    await clickTrigger('.multiple-format-export');

    assert.ok(
      decodeURIComponent($('.multiple-format-export__dropdown a:contains(CSV)').attr('href')).includes(
        'productFamily|id-in["1"]'
      ),
      'Filter updates are automatically included in export url'
    );

    assert
      .dom(findAll('.multiple-format-export__dropdown a').filter((el) => el.textContent.trim() === 'CSV')[0])
      .hasAttribute('href', /^https:\/\/data.naviapp.io\/\S+$/, 'uses csv export from right datasource');

    config.navi.FEATURES.exportFileTypes = originalFlag;
  });

  test('Multi export action - pdf and png href', async function (assert) {
    assert.expect(5);

    let originalExportFlag = config.navi.FEATURES.exportFileTypes;
    let originalTotalsFlag = config.navi.FEATURES.enableTotals;
    config.navi.FEATURES.exportFileTypes = ['csv', 'pdf', 'png'];
    config.navi.FEATURES.enableTotals = true;

    const store = this.owner.lookup('service:store');

    await visit('/reports/1/view');
    await clickTrigger('.multiple-format-export');

    const exportHref = $('.multiple-format-export__dropdown a:contains("PDF")').attr('href');
    let encodedModel = exportHref.split('/export?reportModel=')[1];

    const actualModel = (await CompressionService.decompressModel(encodedModel)).serialize();
    const expectedModel = (await store.findRecord('report', 1)).serialize();

    //strip off owner
    delete expectedModel.data.relationships;

    assert.deepEqual(actualModel, expectedModel, 'PDF link has appropriate link to export service');

    const exportToPngHref = $('.multiple-format-export__dropdown a:contains("PNG")').attr('href');
    assert.equal(`${exportHref}&fileType=png`, exportToPngHref, 'PNG link has appropriate link to export service');

    /* == Add groupby == */
    await clickItem('dimension', 'Product Family');
    await click('.navi-report__run-btn');
    await clickTrigger('.multiple-format-export');

    encodedModel = $('.multiple-format-export__dropdown a:contains("PDF")')
      .attr('href')
      .split('/export?reportModel=')[1];
    await CompressionService.decompressModel(encodedModel).then((model) => {
      assert.equal(
        get(model, 'request.columns').objectAt(4).get('displayName'),
        'Product Family (id)',
        'Groupby changes are automatically included in export url'
      );
    });

    /* == Change to table == */
    await click('.visualization-toggle__option-icon[title="Data Table"]');
    await click('.navi-report__run-btn');
    await clickTrigger('.multiple-format-export');

    encodedModel = $('.multiple-format-export__dropdown a:contains("PDF")')
      .attr('href')
      .split('/export?reportModel=')[1];
    await CompressionService.decompressModel(encodedModel).then((model) => {
      assert.equal(
        get(model, 'visualization.type'),
        'table',
        'Visualization type changes are automatically included in export url'
      );
    });

    /* == Add grand total to table == */
    await click('.report-view__visualization-edit-btn');
    await animationsSettled();
    await click('.table-config__total-toggle-button--grand-total');
    await click('.navi-report__run-btn');
    await clickTrigger('.multiple-format-export');

    encodedModel = $('.multiple-format-export__dropdown a:contains("PNG")')
      .attr('href')
      .replace('&fileType=png', '')
      .split('/export?reportModel=')[1];
    await CompressionService.decompressModel(encodedModel).then((model) => {
      assert.equal(
        get(model, 'visualization.metadata.showTotals.grandTotal'),
        true,
        'Visualization config changes are automatically included in export url'
      );
    });

    config.navi.FEATURES.exportFileTypes = originalExportFlag;
    config.navi.FEATURES.enableTotals = originalTotalsFlag;
  });

  test('Get API action - enabled/disabled', async function (assert) {
    await visit('/reports/13/view');

    assert.dom('.get-api__action-btn').isNotDisabled('Get API action is enabled for a valid report');

    // Remove all metrics
    await click('.navi-column-config-item__remove-icon[aria-label="delete metric Ad Clicks"]');
    await click('.navi-column-config-item__remove-icon[aria-label="delete dimension Property (id)"]');
    await click('.navi-column-config-item__remove-icon[aria-label="delete time-dimension Date Time (day)"]');

    assert.dom('.get-api__action-btn').isDisabled('Get API action is disabled for an invalid report');
  });

  test('Share report', async function (assert) {
    /* == Saved report == */
    await visit('/reports/1/view');
    await click('.report-actions__share-btn');

    // Remove all metrics to create an invalid report
    await clickItem('metric', 'Ad Clicks');
    await clickItem('metric', 'Nav Link Clicks');

    assert
      .dom('.report-actions__share-btn')
      .doesNotHaveAttribute('disabled', '', 'Share action is disabled for invalid report');

    // Share is disabled on new
    await visit('/reports/new');

    assert.dom('.report-actions__share-btn').hasAttribute('disabled', '', 'Share action is disabled for new report');
  });

  test('Delete report on success', async function (assert) {
    assert.expect(5);

    /* == Delete success == */
    await visit('/reports');

    let reportNames = findAll('.table tbody td:first-child').map((el) => el.innerText.trim());

    assert.deepEqual(
      reportNames,
      ['Hyrule News', 'Hyrule Ad&Nav Clicks', 'Report 12'],
      'Report 1 is initially listed in reports route'
    );

    await visit('/reports/1/view');
    await click('.report-actions__delete-btn');

    assert
      .dom('.delete__modal-details')
      .hasText('This action cannot be undone. This will permanently delete the Hyrule News report.');

    await click('.delete__modal-delete-btn');

    assert.ok(currentURL().endsWith('/reports'), 'After deleting, user is brought to report list view');

    reportNames = findAll('.table tbody td:first-child').map((el) => el.innerText.trim());

    assert.deepEqual(reportNames, ['Hyrule Ad&Nav Clicks', 'Report 12'], 'Deleted report is removed from list');

    // /* == Not owner == */
    await visit('/reports/3/view');

    assert.notOk(
      !!$('.navi-report__action:contains(Delete)').length,
      'Delete action is not available if user is not the owner'
    );
  });

  test('Delete action - enabled at all times', async function (assert) {
    assert.expect(4);

    // Delete is not Disabled on new
    await newReport();

    assert
      .dom('.report-actions__delete-btn')
      .doesNotHaveAttribute('disabled', '', 'Delete action is enabled for a valid report');

    // Delete is not Disabled on valid
    await visit('/reports/1/view');

    assert
      .dom('.report-actions__delete-btn')
      .doesNotHaveAttribute('disabled', '', 'Delete action is enabled for a valid report');

    /*
     * Remove all metrics to create an invalid report
     * Delete is not Disabled on invalid
     */
    await clickItem('metric', 'Ad Clicks');
    await clickItem('metric', 'Nav Link Clicks');

    assert
      .dom('.report-actions__delete-btn')
      .doesNotHaveAttribute('disabled', '', 'Delete action is enabled when report is not valid');

    // Check Delete modal appear
    await click('.report-actions__delete-btn');

    assert
      .dom('.delete__modal-details')
      .hasText('This action cannot be undone. This will permanently delete the Hyrule News report.');
  });

  test('Delete report on failure', async function (assert) {
    server.urlPrefix = `${config.navi.appPersistence.uri}`;
    server.delete('/reports/:id', () => new Response(500));

    await visit('/reports/2/view');
    await click('.report-actions__delete-btn');
    await click('.delete__modal-delete-btn');

    assert.ok(currentURL().endsWith('reports/2/view'), 'User stays on current view when delete fails');
  });

  test('Add to dashboard button - flag false', async function (assert) {
    assert.expect(1);

    let originalFeatures = config.navi.FEATURES;

    // Turn flag off
    config.navi.FEATURES = { dashboards: false };

    await visit('/reports/1/view');

    assert.dom('.add-to-dashboard').isNotVisible('Add to Dashboard button is not visible when feature flag is off');

    config.navi.FEATURES = originalFeatures;
  });

  test('Switch Visualization Type', async function (assert) {
    assert.expect(7);

    await visit('/reports/1/view');

    assert.ok(!!findAll('.line-chart-widget').length, 'Line chart visualization is shown as configured');

    assert.dom('.report-view__visualization-edit-btn').hasText('Edit Line Chart', 'Edit Line Chart label is displayed');

    assert.dom('.c3-legend-item').exists({ count: 4 }, 'Line chart visualization has 4 series as configured');

    await click('.visualization-toggle__option-icon[title="Data Table"]');

    assert.ok(!!findAll('.table-widget').length, 'table visualization is shown when selected');

    assert.dom('.report-view__visualization-edit-btn').hasText('Edit Table', 'Edit Data Table label is displayed');

    await click('.visualization-toggle__option-icon[title="Line Chart"]');

    assert.ok(!!findAll('.line-chart-widget').length, 'line-chart visualization is shown when selected');

    assert.dom('.report-view__visualization-edit-btn').hasText('Edit Line Chart', 'Edit Line Chart label is displayed');
  });

  test('redirect from report/index route', async function (assert) {
    assert.expect(2);

    await visit('/reports/1');

    assert.equal(
      currentURL(),
      '/reports/1/view',
      'The url of the index route is replaced with the url of the view route'
    );

    assert
      .dom('.navi-report__body .report-view')
      .isVisible('The report/index route redirects to the reports view route by default');
  });

  test('visiting Reports Route', async function (assert) {
    assert.expect(1);

    await visit('/reports');

    let titles = findAll('.navi-collection .table tr td:first-of-type').map((el) => find(el).innerText.trim());

    assert.deepEqual(
      titles,
      ['Hyrule News', 'Hyrule Ad&Nav Clicks', 'Report 12'],
      'the report list with `navi-users`s reports is shown'
    );
  });

  test('reports route actions - clone', async function (assert) {
    assert.expect(2);

    await visit('/reports');

    await triggerEvent('.navi-collection__row0', 'mouseenter');
    // Click "Clone"
    await click('.navi-collection__row0 .clone');

    assert.ok(
      TempIdRegex.test(currentURL()),
      'After cloning, user is brought to view route for a new report with a temp id'
    );

    assert.dom('.report-header__title').hasText('Copy of Hyrule News', 'Cloned report is being viewed');
  });

  test('reports route actions -- delete', async function (assert) {
    assert.expect(3);

    await visit('/reports');

    await triggerEvent('.navi-collection__row0', 'mouseenter');
    await click('.navi-collection__row0 .navi-actions__delete-btn');

    assert
      .dom('.delete__modal-details')
      .hasText('This action cannot be undone. This will permanently delete the Hyrule News report.');

    await click('.delete__modal-delete-btn');

    assert.ok(currentURL().endsWith('/reports'), 'After deleting, user is brought to report list view');

    let reportNames = findAll('.table tbody td:first-child').map((el) => el.innerText.trim());

    assert.deepEqual(reportNames, ['Hyrule Ad&Nav Clicks', 'Report 12'], 'Deleted report is removed from list');
  });

  test('Visiting Reports Route From Breadcrumb', async function (assert) {
    assert.expect(1);

    await visit('/reports/1/view');

    //Click "Reports"
    await click('.report-header__breadcrumb-link');

    assert.ok(
      currentURL().endsWith('/reports'),
      'When "Directory" clicked on the Breadcrumb link, it lands to "my-data" page'
    );
  });

  test('Revert report changes when exiting from route', async function (assert) {
    assert.expect(2);

    await visit('/reports/13/view');

    assert.ok(
      !!$('.filter-builder__subject:contains(day)').length,
      'After navigating out of the route, the report model is rolled back'
    );

    await click('.navi-column-config-item__trigger');
    await selectChoose('.navi-column-config-item__parameter', 'Week');

    //Navigate out of report
    await click('.report-header__breadcrumb-link');

    //Navigate back to `Report 12`
    await visit('/reports/13/view');

    assert.ok(
      !!$('.filter-builder__subject:contains(day)').length,
      'After navigating out of the route, the report model is rolled back'
    );
  });

  test('Revert Visualization Type - Back to Original Type', async function (assert) {
    assert.expect(3);

    /* == Load report == */
    await visit('/reports/1/view');

    assert.ok(!!findAll('.line-chart-widget').length, 'Line chart visualization is shown as configured');

    /* == Switch to table == */
    await click('.visualization-toggle__option-icon[title="Data Table"]');

    assert.ok(!!findAll('.table-widget').length, 'table visualization is shown when selected');

    /* == Revert == */
    await click('.navi-report__revert-btn');

    assert.ok(!!findAll('.line-chart-widget').length, 'line-chart visualization is shown when reverted');
  });

  test('Revert Visualization Type - Updated Report', async function (assert) {
    assert.expect(5);

    /* == Load report == */
    await visit('/reports/1/view');

    assert.ok(!!findAll('.line-chart-widget').length, 'Line chart visualization is shown as configured');

    /* == Switch to table == */
    await click('.visualization-toggle__option-icon[title="Data Table"]');

    assert.ok(!!findAll('.table-widget').length, 'table visualization is shown when selected');

    /* == Save report == */
    await click('.navi-report__save-btn');

    assert.ok(!!findAll('.table-widget').length, 'table visualization is still shown when saved');

    /* == Switch to chart == */
    await click('.visualization-toggle__option-icon[title="Line Chart"]');

    assert.ok(!!findAll('.line-chart-widget').length, 'line-chart visualization is shown when selected');

    /* == Revert == */
    await click('.navi-report__revert-btn');

    assert.ok(!!findAll('.table-widget').length, 'table visualization is shown when reverted');
  });

  test('Revert Visualization Type - New Report', async function (assert) {
    assert.expect(4);

    /* == Create report == */
    await visit('/reports');
    await newReport();
    await clickItem('metric', 'Ad Clicks');
    await clickItem('dimension', 'Date Time');
    await selectChoose('.navi-column-config-item__parameter-trigger', 'Day');
    await selectChoose('.filter-builder__operator-trigger', 'In The Past');

    await click('.navi-report__run-btn');

    assert.ok(!!findAll('.table-widget').length, 'Table visualization is shown by default');

    /* == Save report == */
    await click('.navi-report__save-btn');

    assert.ok(!!findAll('.table-widget').length, 'Table visualization is still shown when saved');

    /* == Switch to metric label == */
    await click('.visualization-toggle__option-icon[title="Metric Label"]');

    assert.ok(!!findAll('.metric-label-vis').length, 'Metric label visualization is shown when selected');

    /* == Revert == */
    await click('.navi-report__revert-btn');

    assert.ok(!!findAll('.table-widget').length, 'table visualization is shown when reverted');
  });

  test('Toggle Edit Visualization', async function (assert) {
    assert.expect(3);

    /* == Visit report == */
    await visit('/reports/1/view');

    /* == Verify visualization config is not shown == */

    assert
      .dom('.report-view__visualization-edit')
      .doesNotExist('visualization config is closed on initial report load');

    /* == Open config == */
    await click('.report-view__visualization-edit-btn');
    await animationsSettled();

    assert.dom('.report-view__visualization-edit').exists('visualization config is opened after clicking edit button');

    /* == Close config == */
    await click('.report-view__visualization-edit-close');
    await animationsSettled();

    assert
      .dom('.report-view__visualization-edit')
      .doesNotExist('visualization config is closed after clicking edit button');
  });

  test('Disabled Visualization Edit', async function (assert) {
    assert.expect(4);

    // Visit report and make a change that invalidates visualization
    await visit('/reports/1/view');
    await clickItem('dimension', 'Product Family');
    await animationsSettled();

    assert.dom('.report-view__visualization-edit-btn').isNotVisible('Edit visualization button is no longer visible');

    assert
      .dom('.report-view__info-text')
      .hasText('Run request to update Line Chart', 'Notification to run request is visible');

    // Run report
    await click('.navi-report__run-btn');
    await animationsSettled();

    assert
      .dom('.report-view__visualization-edit-btn')
      .isVisible('After running, edit visualization button is once again visible');

    assert.dom('.report-view__info-text').isNotVisible('After running, notification to run is no longer visible');
  });

  test('Disabled Visualization Edit While Editing', async function (assert) {
    assert.expect(9);

    await visit('/reports/2/view');
    await click('.report-view__visualization-edit-btn');
    await animationsSettled();

    assert
      .dom('.report-view__visualization-edit')
      .isVisible('Visualization edit panel is visible after clicking the edit button');

    // Make a change that does NOT invalidate visualization
    await fillIn('.table-header-cell.timeDimension input', 'Foo');
    await blur('.table-header-cell.timeDimension input');
    assert
      .dom('.report-view__visualization-edit')
      .isVisible('Visualization edit panel is still visible after making changes that do not change the request');

    assert
      .dom('.report-view__visualization-edit-close')
      .isVisible('Visualization edit button is is still visible after making changes that do not change the request');

    assert
      .dom('.report-view__info-text')
      .isNotVisible('Notification to run is not visible after making changes that do not change the request');

    // Make a change that invalidates visualization
    await clickItem('dimension', 'Product Family');
    await animationsSettled();

    assert
      .dom('.report-view__visualization-edit')
      .isNotVisible('Visualization edit panel is hidden when there are request changes that have not been run');

    assert
      .dom('.report-view__visualization-edit-btn')
      .isNotVisible('Visualization edit button is hidden when there are request changes that have not been run');

    assert
      .dom('.report-view__info-text')
      .isVisible('Notification to run is visible when there are request changes that have not been run');

    // Run report
    await click('.navi-report__run-btn');
    await animationsSettled();

    assert
      .dom('.report-view__visualization-edit-btn')
      .isVisible('Visualization edit button is back after running report');

    assert
      .dom('.report-view__info-text')
      .isNotVisible('Notification to run is visible when there are request changes that have not been run');
  });

  test('Save changes', async function (assert) {
    assert.expect(2);

    await visit('/reports/13/view');
    await click('.navi-column-config-item__remove-icon[aria-label="delete metric Ad Clicks"]');

    assert
      .dom('.navi-report__save-btn')
      .isVisible('Save changes button is visible once a change has been made and when owner of report');

    await visit('/reports/3/view');
    await clickItem('metric', 'Ad Clicks');

    assert.dom('.navi-report__save-btn').isNotVisible('Save changes button is visible when not owner of a report');
  });

  test('Error route', async function (assert) {
    setupOnerror(() => null);
    await visit('/reports/invalidRoute');

    assert
      .dom('.navi-info-message__title')
      .hasText('An error occurred while retrieving your report.', 'An error message is displayed for an invalid route');
  });

  test('Updating chart series', async function (assert) {
    assert.expect(4);

    // Check inital series
    await visit('/reports/1/view');

    let seriesLabels = findAll('.c3-legend-item').map((el) => el.textContent.trim());
    let hiddenLabels = findAll('.c3-legend-item-hidden').map((el) => el.textContent.trim());
    assert.deepEqual(
      seriesLabels,
      ['Property 1', 'Property 2', 'Property 3', 'Property 4'],
      '3 series are initially present'
    );
    assert.deepEqual(hiddenLabels, [], 'No series are initially hidden from chart');

    // Toggle off first series
    await click('.c3-legend-item');
    hiddenLabels = findAll('.c3-legend-item-hidden').map((el) => el.textContent.trim());
    assert.deepEqual(hiddenLabels, ['Property 1'], 'Selected series has been hidden from chart');

    // Toggle on first series
    await click('.c3-legend-item');
    hiddenLabels = findAll('.c3-legend-item-hidden').map((el) => el.textContent.trim());
    assert.deepEqual(hiddenLabels, [], 'Property 1 is no longer hidden from chart');
  });

  test('favorite reports', async function (assert) {
    assert.expect(3);

    // Filter by favorites
    await visit('/reports');
    await selectChoose('.navi-collection__filter-trigger', 'Favorites');

    let listedReports = findAll('tbody tr td:first-of-type').map((el) => el.innerText.trim());

    assert.deepEqual(listedReports, ['Hyrule Ad&Nav Clicks'], 'Report 2 is in favorites section');

    // Favorite report 1
    await visit('/reports/1');
    await click('.favorite-item');

    // Filter by favorites
    await visit('/reports');
    await selectChoose('.navi-collection__filter-trigger', 'Favorites');

    listedReports = findAll('tbody tr td:first-of-type').map((el) => el.innerText.trim());

    assert.deepEqual(listedReports, ['Hyrule News', 'Hyrule Ad&Nav Clicks'], 'Two reports are in favorites now');

    // Unfavorite report 2
    await click($('tbody tr td a:contains(Hyrule Ad&Nav Clicks)')[0]);
    await click('.favorite-item');
    await visit('/reports');
    await selectChoose('.navi-collection__filter-trigger', 'Favorites');

    listedReports = findAll('tbody tr td:first-of-type').map((el) => el.innerText.trim());

    assert.deepEqual(listedReports, ['Hyrule News'], 'Only one report is in favorites now');
  });

  test('favorite report - rollback on failure', async function (assert) {
    assert.expect(2);

    // Mock server path endpoint to mock failure
    server.urlPrefix = `${config.navi.appPersistence.uri}`;
    server.patch('/users/:id', () => new Response(500));

    // Filter by favorites
    await visit('/reports');
    await selectChoose('.navi-collection__filter-trigger', 'Favorites');

    let listedReports = findAll('tbody tr td:first-of-type').map((el) => el.innerText.trim());

    assert.deepEqual(listedReports, ['Hyrule Ad&Nav Clicks'], 'Report 2 is in favorites section');

    await visit('/reports/1');

    await click('.favorite-item');

    await visit('/reports');

    await selectChoose('.navi-collection__filter-trigger', 'Favorites');

    listedReports = findAll('tbody tr td:first-of-type').map((el) => el.innerText.trim());

    assert.deepEqual(listedReports, ['Hyrule Ad&Nav Clicks'], 'The user state is rolled back on failure');
  });

  test('running report after reverting changes', async function (assert) {
    assert.expect(2);

    /* == Modify report by adding a metric == */
    await visit('/reports/1/view');
    await click('.visualization-toggle__option-icon[title="Data Table"]');
    await clickItem('metric', 'Time Spent');
    await click('.navi-report__run-btn');

    assert.ok(
      !!$('.table-header-row-vc--view .table-header-cell:contains(Time Spent)').length,
      'Time Spent column is displayed'
    );

    /* == Revert report to its original state == */
    await click('.navi-column-config-item__remove-icon[aria-label="delete metric Time Spent"]');
    await click('.navi-report__run-btn');

    assert.notOk(
      !!$('.table-header-row-vc--view .table-header-cell:contains(Time Spent)').length,
      'Time Spent column is not displayed'
    );
  });

  skip('Running a report against unauthorized table shows unauthorized route', async function (assert) {
    //build-data issues
    assert.expect(5);
    await newReport();

    await click('.report-builder-sidebar__breadcrumb-item[data-level="1"]');
    await click('.report-builder-source-selector__source-button[data-source-name="Protected Table"]');
    await animationsSettled();

    await click('.navi-report__run-btn');

    assert.equal(currentURL(), '/reports/1/unauthorized', 'check to seee if we are on the unauthorized route');

    assert.ok(!!findAll('.navi-report-invalid__info-message .fa-lock').length, 'unauthorized component is loaded');

    await click('.navi-report__cancel-btn');

    await click('.report-builder-sidebar__breadcrumb-item[data-level="1"]');
    await click('.report-builder-source-selector__source-button[data-source-name="Network"]');
    await animationsSettled();
    await click('.navi-report__run-btn');
    await click('.visualization-toggle__option-icon[title="Data Table"]');

    assert.equal(currentURL(), '/reports/1/view', 'check to seee if we are on the view route');

    assert.notOk(
      !!findAll('.navi-report-invalid__info-message .fa-lock').length,
      'unauthorized component is not loaded'
    );

    assert.ok(!!findAll('.table-widget').length, 'Data table visualization loads');
  });

  test("filtering on a dimension with a storage strategy of 'none'", async function (assert) {
    assert.expect(4);
    //Add filter for a dimension where storageStrategy is 'none' and try to run the report
    await visit('/reports/13/view');
    await clickItem('dimension', 'Context Id');
    await clickItemFilter('dimension', 'Context Id');
    await fillIn('.emberTagInput-new>input', 'This_will_not_match_any_dimension_values');
    await blur('.js-ember-tag-input-new');
    await click('.navi-report__run-btn');

    assert
      .dom('.navi-info-message__error-list-item')
      .isNotVisible('No errors are shown after giving a value to filter on');

    server.urlPrefix = `${config.navi.dataSources[0].uri}/v1`;
    server.get('/data/*path', (db, request) => {
      assert.equal(
        get(request, 'queryParams.filters'),
        'contextId|id-in["This_will_not_match_any_dimension_values"]',
        "Filter value is passed even when the value doesn'nt match any dimension IDs"
      );

      return { rows: [] };
    });

    //Run the report with the invalid dimension value to filter on
    await click('.navi-report__run-btn');

    assert
      .dom('.navi-report-invalid__info-message')
      .isNotVisible('The report is run even when no dimension values match the filter');

    await clickItem('dimension', 'Operating System');
    await clickItemFilter('dimension', 'Operating System');

    assert
      .dom('.filter-values--dimension-select__trigger')
      .isVisible("Dimension select is used when the dimension's storage strategy is not 'none'");
  });

  test('filter - add using filter icon', async function (assert) {
    assert.expect(4);

    await visit('/reports/1');
    //add dimension filter
    await clickItemFilter('dimension', 'Operating System');

    assert.strictEqual(
      $('.filter-builder__subject:contains(Operating System)').length,
      1,
      'The Operating System dimension filter is added'
    );

    //remove filter by clicking on filter icon again
    await clickItemFilter('dimension', 'Operating System');

    assert.strictEqual(
      $('.filter-builder__subject:contains(Operating System)').length,
      2,
      'The Operating System dimension filter is added a second time'
    );

    //add metric filter
    await clickItemFilter('metric', 'Ad Clicks');

    assert.strictEqual(
      $('.filter-builder__subject:contains(Ad Clicks)').length,
      1,
      'The Ad Clicks metric filter is added'
    );

    //remove metric filter by clicking on filter icon again
    await clickItemFilter('metric', 'Ad Clicks');

    assert.strictEqual(
      $('.filter-builder__subject:contains(Ad Clicks)').length,
      2,
      'The Ad Clicks metric filter is added a second time'
    );
  });

  skip('filters - collapse and expand', async function (assert) {
    // TODO: Fix after https://github.com/yahoo/yavin/pull/1171 is merged
    assert.expect(9);
    //adding dimensions and metrics not currently expanding filter collection

    await visit('/reports/1');

    //collapse filters
    await click('.report-builder__container-header__filters-toggle');
    assert.dom('.filter-collection').hasClass('filter-collection--collapsed', 'Filters are collapsed (1)');

    //expand filters
    await click('.report-builder__container-header__filters-toggle');
    assert
      .dom('.filter-collection')
      .doesNotHaveClass('filter-collection--collapsed', 'Collapsed filters are expanded on click');

    //collapse again
    await click('.report-builder__container-header__filters-toggle');
    assert.dom('.filter-collection').hasClass('filter-collection--collapsed', 'Filters are collapsed (2)');

    //add a dimension filter
    await clickItemFilter('dimension', 'Operating System');
    assert
      .dom('.filter-collection')
      .doesNotHaveClass('filter-collection--collapsed', 'Adding a dimension filter expands filters');

    //collapse again
    await click('.report-builder__container-header__filters-toggle');
    assert.dom('.filter-collection').hasClass('filter-collection--collapsed', 'Filters are collapsed (3)');

    //remove the dimension filter
    await clickItemFilter('dimension', 'Operating System');
    assert
      .dom('.filter-collection')
      .hasClass('filter-collection--collapsed', 'Filters are still collapsed when removing a dimension filter');

    //add a metric filter
    await clickItemFilter('metric', 'Ad Clicks');
    assert
      .dom('.filter-collection')
      .doesNotHaveClass('filter-collection--collapsed', 'Adding a metric filter expands filters');

    //collapse again
    await click('.report-builder__container-header__filters-toggle');
    assert.dom('.filter-collection').hasClass('filter-collection--collapsed', 'Filters are collapsed (4)');

    //remove the metric filter
    await clickItemFilter('metric', 'Ad Clicks');
    assert
      .dom('.filter-collection')
      .hasClass('filter-collection--collapsed', 'Filters are still collapsed when removing a metric filter');
  });

  test('Test filter "Is Empty" is accepted', async function (assert) {
    assert.expect(2);
    await visit('/reports/1');

    await clickItemFilter('dimension', 'Operating System');
    await selectChoose('.filter-collection__row:last-of-type .filter-builder__operator-trigger', 'Is Empty');
    await click('.navi-report__run-btn');

    assert.ok(
      !!findAll('.line-chart-widget').length,
      'line-chart visualization is shown instead of validation error when Is Empty is picked'
    );

    assert.dom('.navi-info-message__error-list-item').isNotVisible('Should not show empty values error');
  });

  test('Test filter "Is Not Empty" is accepted', async function (assert) {
    assert.expect(2);
    await visit('/reports/1');

    await clickItemFilter('dimension', 'Operating System');
    await selectChoose('.filter-collection__row:last-of-type .filter-builder__operator-trigger', 'Is Not Empty');
    await click('.navi-report__run-btn');

    assert.ok(
      !!findAll('.line-chart-widget').length,
      'line-chart visualization is shown instead of validation error when Is Not Empty is  picked'
    );

    assert.dom('.navi-info-message__error-list-item').isNotVisible('Should not show empty values error');
  });

  test("Date Picker doesn't change date when moving to time grain where dates are valid", async function (assert) {
    assert.expect(6);

    await visit('/reports/1');
    await click('.navi-column-config-item__trigger');
    await selectChoose('.navi-column-config-item__parameter', 'Month');

    // Select the month Jan
    await clickTrigger('.filter-values--date-range-input__low-value');
    await click($('.ember-power-calendar-selector-month:contains(Jan)')[0]);
    await clickTrigger('.filter-values--date-range-input__high-value');
    await click($('.ember-power-calendar-selector-month:contains(Jan)')[0]);
    await click('.navi-report__run-btn');

    assert
      .dom('.filter-values--date-range-input__low-value input')
      .hasValue('Jan 2015', 'Start Month is changed to Jan 2015');
    assert
      .dom('.filter-values--date-range-input__high-value input')
      .hasValue('Jan 2015', 'End Month is changed to Jan 2015');

    await selectChoose('.navi-column-config-item__parameter', 'Day');
    await click('.navi-report__run-btn');

    assert
      .dom('.filter-values--date-range-input__low-value input')
      .hasValue('Jan 01, 2015', 'Switching to day time period preserves date to start of month');
    assert
      .dom('.filter-values--date-range-input__high-value input')
      .hasValue('Jan 31, 2015', 'Switching to day time period preserves date to end of month');

    await selectChoose('.navi-column-config-item__parameter', 'Week');
    await click('.navi-report__run-btn');

    assert
      .dom('.filter-values--date-range-input__low-value input')
      .hasValue('Dec 29, 2014', 'Switching to week casts the date to match the start of the date time period');
    assert
      .dom('.filter-values--date-range-input__high-value input')
      .hasValue('Jan 25, 2015', 'Switching to week casts the date to match the end of the date time period');
  });

  test('Date picker change interval type', async function (assert) {
    assert.expect(6);

    await visit('/reports/1');

    assert
      .dom('.filter-values--date-range-input__low-value input')
      .hasValue('Nov 09, 2015', 'The start date is Nov 09, 2015');
    assert
      .dom('.filter-values--date-range-input__high-value input')
      .hasValue('Nov 15, 2015', 'The end date is Nov 15, 2015');

    await selectChoose('.filter-builder__operator-trigger', 'Between');
    assert
      .dom('.filter-values--date-range-input__low-value input')
      .hasValue('Nov 09, 2015', 'The start date is still Nov 09, 2015');
    assert
      .dom('.filter-values--date-range-input__high-value input')
      .hasValue('Nov 15, 2015', 'The end date is still Nov 15, 2015');

    await selectChoose('.filter-builder__operator-trigger', 'Since');
    assert
      .dom('.filter-values--date-input__trigger input')
      .hasValue('Nov 09, 2015', 'The start date is still Nov 09, 2015');

    await selectChoose('.filter-builder__operator-trigger', 'Current Day');

    const today = moment.utc().format('MMM DD, YYYY');
    assert.dom('.filter-builder__values').hasText(`The current day. (${today})`, 'The current day');
  });

  skip("Date picker advanced doesn't modify interval", async function (assert) {
    //TODO advanced date picker has been disabled
    assert.expect(6);
    await visit('/reports/1/view');

    await selectChoose('.filter-builder__operator-trigger', 'Advanced');
    const startInput = findAll('.filter-values--advanced-interval-input__value')[0];
    const endInput = findAll('.filter-values--advanced-interval-input__value')[1];
    assert.dom(startInput).hasValue('P7D', 'The start input is not modified');
    assert.dom(endInput).hasValue('2015-11-16', 'The end input is not modified');

    await click('.get-api__action-btn');
    assert.ok(
      find('.get-api__api-input').value.includes('dateTime=P7D%2F2015-11-16'),
      'The while in advanced mode shows exactly what is in the start/end inputs'
    );
    await click('.d-close');

    await fillIn(startInput, 'P1M');
    await blur(startInput);
    await fillIn(endInput, '2020-04-01');
    await blur(endInput);
    assert.dom(startInput).hasValue('P1M', 'The start input was updated exactly');
    assert.dom(endInput).hasValue('2020-04-01', 'The end input was updated exactly');

    await click('.get-api__action-btn');
    assert.ok(
      find('.get-api__api-input').value.includes('dateTime=P1M%2F2020-04-01'),
      'The query is updated to show the new start/end inputs exactly'
    );
    await click('.d-close');
  });

  test("Report with an unknown table doesn't crash", async function (assert) {
    assert.expect(1);
    await visit('/reports/9');

    assert
      .dom('.navi-info-message__error-list-item')
      .hasText(
        'Table is invalid or unavailable',
        'Should show an error message when table cannot be found in metadata'
      );
  });

  test('Filter with large cardinality dimensions value selection works', async function (assert) {
    assert.expect(2);
    let option;
    const dropdownSelector = '.filter-values--dimension-select__trigger';
    await newReport();

    // Load table A as it has the large cardinality dimensions, and choose a large cardinality dimension
    await click('.report-builder-sidebar__breadcrumb-item[data-level="1"]');
    await click('.report-builder-source-selector__source-button[data-source-name="Table A"]');
    await animationsSettled();
    await clickItem('dimension', 'EventId');
    await clickItem('metric', 'Network Sessions');
    await clickItem('dimension', 'Date Time');
    await selectChoose('.filter-builder__operator-trigger', 'Between');

    await clickTrigger('.filter-values--date-range-input__low-value');
    await click($('button.ember-power-calendar-day--current-month:contains(1)')[0]);

    await clickTrigger('.filter-values--date-range-input__high-value');
    await click($('button.ember-power-calendar-day--current-month:contains(2)')[0]);
    await click($('.navi-report__footer button:Contains(Run)')[0]);

    // Grab one of the dim names after running a report
    option = find('.table-cell-content.dimension').textContent.trim();
    await clickItemFilter('dimension', 'EventId');

    // Open the dimension values so we can get values as they are dynamically created by mirage
    await clickTrigger(dropdownSelector);

    assert
      .dom('.filter-values--dimension-select__dropdown .ember-power-select-option--search-message')
      .hasText('Type to search', 'Message is correct');

    // Simulate typing a search which pulls large cardinality dimension values from the server
    await selectSearch(dropdownSelector, option.toLowerCase().substring(0, 3));
    await click($(`.filter-values--dimension-select__dropdown .ember-power-select-option:contains('${option}')`)[0]);

    // Check if the selected item is still selected after the search
    assert.ok(
      $(`.filter-values--dimension-select__dropdown .ember-power-select-option:contains(${option})`)[0].hasAttribute(
        'aria-selected'
      ),
      'The value is selected after a search is done'
    );
  });

  test('dimension select filter works with dimension ids containing commas', async function (assert) {
    await newReport();
    await clickItemFilter('dimension', 'Dimension with comma');

    await selectChoose('.filter-values--dimension-select__trigger', 'no');
    await selectChoose('.filter-values--dimension-select__trigger', 'yes');

    await clickItem('dimension', 'Date Time');

    await selectChoose('.filter-builder__operator-trigger', 'Between');

    await clickTrigger('.filter-values--date-range-input__low-value');

    await click($('button.ember-power-calendar-day--current-month:contains(1)')[0]);
    await clickTrigger('.filter-values--date-range-input__high-value .ember-basic-dropdown-trigger');
    await click($('button.ember-power-calendar-day--current-month:contains(2)')[0]);

    assert.deepEqual(
      findAll('.ember-power-select-multiple-option span:not(.ember-power-select-multiple-remove-btn)').map((el) =>
        el.textContent.trim()
      ),
      ['no comma', 'yes, comma'],
      'The selected dimensions are shown even with a comma'
    );

    await click('.navi-report__run-btn');
    await click('.get-api__action-btn');

    const url = find('.get-api__api-input').value;
    const expectedFilter = 'commaDim|id-in["no comma","yes, comma"]';
    assert.ok(
      decodeURIComponent(url).includes(expectedFilter),
      `Generated API URL, ${url} is contains filter ${expectedFilter}`
    );
  });

  test('reordering metrics does not rerun the request', async function (assert) {
    assert.expect(1);
    await visit('/reports/2');

    server.urlPrefix = `${config.navi.dataSources[0].uri}/v1`;
    server.get('/data/*path', () => {
      assert.ok(false, 'Request was rerun');
    });

    await reorder(
      'mouse',
      '.table-header-row-vc--view .table-header-cell',
      '.table-header-cell[data-name="navClicks"]',
      '.table-header-cell[data-name="property(field=id)"]',
      '.table-header-cell[data-name="adClicks"]',
      '.table-header-cell[data-name="network.dateTime(grain=day)"]'
    );

    assert.deepEqual(
      findAll('.table-header-row-vc--view .table-header-cell__title').map((el) => el.innerText.trim()),
      ['Nav Link Clicks', 'Property (id)', 'Ad Clicks', 'Date Time (day)'],
      'The headers are reordered as specified by the reorder'
    );
  });

  test('adding metrics to reordered table keeps order', async function (assert) {
    assert.expect(3);
    await visit('/reports/2');

    assert.deepEqual(
      findAll('.table-header-row-vc--view .table-header-cell__title').map((el) => el.innerText.trim()),
      ['Date Time (day)', 'Property (id)', 'Ad Clicks', 'Nav Link Clicks'],
      'The headers are ordered correctly'
    );

    await reorder(
      'mouse',
      '.table-header-row-vc--view .table-header-cell',
      '.table-header-cell[data-name="navClicks"]',
      '.table-header-cell[data-name="property(field=id)"]',
      '.table-header-cell[data-name="adClicks"]',
      '.table-header-cell[data-name="network.dateTime(grain=day)"]'
    );

    assert.deepEqual(
      findAll('.table-header-row-vc--view .table-header-cell__title').map((el) => el.innerText.trim()),
      ['Nav Link Clicks', 'Property (id)', 'Ad Clicks', 'Date Time (day)'],
      'The headers are reordered as specified by the reorder'
    );

    await clickItem('metric', 'Total Clicks');
    await click('.navi-report__run-btn');

    assert.deepEqual(
      findAll('.table-header-row-vc--view .table-header-cell__title').map((el) => el.textContent.trim()),
      ['Nav Link Clicks', 'Property (id)', 'Ad Clicks', 'Date Time (day)', 'Total Clicks'],
      'The headers are reordered as specified by the reorder'
    );
  });

  test('Parameterized metrics with default displayname are not considered custom', async function (assert) {
    assert.expect(2);
    await visit('/reports/8');

    assert
      .dom('.table-header-row-vc--view .table-header-cell.metric > .table-header-cell__title')
      .isVisible('renders metric columns');
    assert
      .dom('.table-header-row-vc--view .table-header-cell.metric > .table-header-cell__title')
      .doesNotHaveClass(
        '.table-header-cell__title--custom-name',
        'Parameterized metrics with default display name should not be considered custom'
      );
  });

  test('Cancel Report', async function (assert) {
    assert.expect(14);

    server.urlPrefix = `${config.navi.dataSources[0].uri}/v1`;
    server.get(
      'data/*path',
      () => {
        return { rows: [] };
      },
      { timing: 10000 } //Slow down mock
    );

    // Load the report without waiting for it to finish loading
    visit('/reports/13').catch((error) => {
      //https://github.com/emberjs/ember-test-helpers/issues/332
      const { message } = error;
      if (message !== 'TransitionAborted') {
        throw error;
      }
    });

    await waitFor('.navi-report__cancel-btn', { timeout: 5000 });

    let buttons = findAll('.navi-report__footer .button');
    assert.dom('.loader').isVisible('Report is loading');
    assert.deepEqual(
      buttons.map((e) => e.textContent.trim()),
      ['Cancel'],
      'When report is loading, the only footer button is `Cancel`'
    );

    assert
      .dom('.report-builder__dimension-selector.report-builder__container--disabled')
      .isVisible('Dimension selector is disabled during run');
    assert
      .dom('.report-builder__metric-selector.report-builder__container--disabled')
      .isVisible('Metric selector is disabled during run');
    assert.dom('.report-builder-sidebar__breadcrumb-item').isDisabled('Table selector is disabled during run');
    assert
      .dom('.report-builder__container--filters.report-builder__container--disabled')
      .isVisible('Filter collection is disabled during run');

    /* ================= Cancel Report ================= */
    await click($('.navi-report__cancel-btn')[0]);

    assert.equal(currentURL(), '/reports/13/edit', 'Clicking `Cancel` brings the user to the edit route');

    assert.deepEqual(
      findAll('.navi-report__footer .button').map((e) => e.textContent.trim()),
      ['Run'],
      'When not loading a report, the standard footer buttons are available'
    );

    //Run the report
    await click('.navi-report__run-btn');
    assert.equal(currentURL(), '/reports/13/view', 'Running the report brings the user to the view route');

    assert.deepEqual(
      findAll('.navi-report__footer .button').map((e) => e.textContent.trim()),
      ['Run'],
      'When not loading a report, the standard footer buttons are available'
    );

    assert
      .dom('.report-builder__dimension-selector')
      .doesNotHaveClass('report-builder__container--disabled', 'Dimension selector is enabled after run');
    assert
      .dom('.report-builder__metric-selector')
      .doesNotHaveClass('report-builder__container--disabled', 'Metric selector is enabled after run');
    assert.dom('.report-builder-sidebar__breadcrumb-item').isNotDisabled('Table selector is disabled during run');
    assert
      .dom('.report-builder__container--filters')
      .doesNotHaveClass('report-builder__container--disabled', 'Filter collection is enabled after run');
  });

  test('Recreating same report after revert runs', async function (assert) {
    await visit('/reports/2/view');

    const columns = () => findAll('.table-widget__table-headers .table-header-cell').map((el) => el.textContent.trim());
    assert.deepEqual(
      columns(),
      ['Date Time (day)', 'Property (id)', 'Ad Clicks', 'Nav Link Clicks'],
      'Report loads with expected columns'
    );

    await clickItem('metric', 'Page Views');
    await click('.navi-report__run-btn');
    assert.deepEqual(
      columns(),
      ['Date Time (day)', 'Property (id)', 'Ad Clicks', 'Nav Link Clicks', 'Page Views'],
      'Report changed and ran successfully'
    );

    await click('.navi-report__revert-btn');
    assert.deepEqual(
      columns(),
      ['Date Time (day)', 'Property (id)', 'Ad Clicks', 'Nav Link Clicks'],
      'Report revertted successfully'
    );

    //make same changes and make sure it's runnable
    await clickItem('metric', 'Page Views');
    await click('.navi-report__run-btn');
    assert.deepEqual(
      columns(),
      ['Date Time (day)', 'Property (id)', 'Ad Clicks', 'Nav Link Clicks', 'Page Views'],
      'Report changed and ran successfully'
    );
  });

  test('Table number formatting works', async function (assert) {
    assert.expect(4);
    await visit('/reports/2/view');

    await click('.visualization-toggle__option-icon[title="Data Table"]');
    await click('.report-view__visualization-edit-btn');

    await click(findAll('.number-format-dropdown__trigger')[1]); // open nav clicks dropdown

    const navClicksCell = () => find('.table-row-vc').querySelectorAll('.table-cell-content.metric')[1];
    assert.dom(navClicksCell()).hasText('880.41', 'The original metric value has no formatting');
    assert.dom('.number-format-selector__radio-custom input').isChecked('The custom input is selected');

    find('.number-format-selector__radio-money input').checked = true; // change format to money
    await triggerEvent('.number-format-selector__radio-money input', 'change');

    assert.dom('.number-format-selector__radio-money input').isChecked('The money input is selected');

    await click('.number-format-dropdown');
    assert.dom(navClicksCell()).hasText('$880.41', 'The metric is re-rendered in the money format');
  });
});
