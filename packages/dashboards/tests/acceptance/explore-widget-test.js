import { find, click, fillIn, currentURL, currentRouteName, findAll, blur, visit, waitFor } from '@ember/test-helpers';
import { module, test } from 'qunit';
import config from 'ember-get-config';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { Response } from 'ember-cli-mirage';
import { clickTrigger } from 'ember-basic-dropdown/test-support/helpers';
import $ from 'jquery';
import { clickItem } from 'navi-reports/test-support/report-builder';
import { selectChoose } from 'ember-power-select/test-support';
import { triggerCopySuccess } from 'ember-cli-clipboard/test-support';
import Service from '@ember/service';
import { setupAnimationTest, animationsSettled } from 'ember-animated/test-support';

// Regex to check that a string ends with "{uuid}/view"
const TempIdRegex = /\/reports\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\/view$/;

module('Acceptance | Exploring Widgets', function (hooks) {
  setupApplicationTest(hooks);
  setupAnimationTest(hooks);
  setupMirage(hooks);

  test('Widget title', async function (assert) {
    assert.expect(1);

    await visit('/dashboards/1/widgets/1');

    assert.dom('.navi-report-widget__title').hasText('Mobile DAU Goal', 'Widget title is displayed as the page title');
  });

  test('Editing widget title', async function (assert) {
    assert.expect(1);

    // Edit title
    await visit('/dashboards/1/widgets/2/view');
    await click('.editable-label__icon');
    await fillIn('.editable-label__input', 'A new title');
    await blur('.editable-label__input');

    // Save and return to dashboard
    await click('.navi-report-widget__save-btn');
    await visit('/dashboards/1');

    const widgetNames = findAll('.navi-widget__title').map((el) => el.textContent.trim());

    assert.ok(widgetNames.includes('A new title'), 'New widget title is saved and persisted on dashboard');
  });

  test('Breadcrumb', async function (assert) {
    assert.expect(4);
    let originalFeatureFlag = config.navi.FEATURES.enableDirectory;

    config.navi.FEATURES.enableDirectory = true;

    await visit('/dashboards/1/widgets/1');

    assert.dom('.navi-report-widget__breadcrumb-link').hasText('Directory', 'Breadcrumb begins with "Directory" link');

    assert
      .dom('.navi-report-widget__breadcrumb-link')
      .hasAttribute('href', '/directory/my-data', 'First breadcrumb item links to my-data route');

    assert
      .dom(findAll('.navi-report-widget__breadcrumb-link')[1])
      .hasText('Tumblr Goals Dashboard', 'Breadcrumb begins with "Directory" link');

    assert
      .dom(findAll('.navi-report-widget__breadcrumb-link')[1])
      .hasAttribute('href', /\/dashboards\/1$/, 'Second breadcrumb item links to parent dashboard');

    config.navi.FEATURES.enableDirectory = originalFeatureFlag;
  });

  test('Viewing a widget', async function (assert) {
    assert.expect(2);

    await visit('/dashboards/1/widgets/2/view');

    assert.dom('.navi-report-widget__body .report-builder').isVisible('Widget body has a builder on the view route');

    assert
      .dom('.navi-report-widget__body .report-builder .navi-column-config')
      .exists('The column config exists on the view route');
  });

  test('Exploring a widget', async function (assert) {
    assert.expect(1);

    await visit('/dashboards/1');
    await click(findAll('.navi-widget__edit-btn')[1]);

    assert.ok(currentURL().endsWith('/dashboards/1/widgets/2/view'), 'Explore action links to widget view route');
  });

  test('Changing and saving a widget', async function (assert) {
    assert.expect(4);

    // Add a metric to widget 2, save, and return to dashboard route
    await visit('/dashboards/1/widgets/2/view');

    assert.dom('.report-view__info-text').isNotVisible('Notification to run is not visible before making changes');

    await clickItem('metric', 'Total Clicks');

    assert.dom('.report-view__info-text').isVisible('Notification to run is visible after making changes');

    await click('.navi-report-widget__save-btn');

    assert
      .dom('.report-view__info-text')
      .isNotVisible('Notification to run is no longer visible after saving the report');

    await visit('/dashboards/1');

    const legends = findAll('.line-chart-widget .c3-legend-item').map((el) => el.textContent.trim());

    assert.deepEqual(
      legends,
      ['Ad Clicks', 'Nav Link Clicks', 'Total Clicks'],
      'Added metric appears in dashboard view after saving widget'
    );
  });

  test('Revert changes', async function (assert) {
    assert.expect(4);

    await visit('/dashboards/1/widgets/2/view');

    assert.dom('.navi-report-widget__revert-btn').isNotVisible('Revert changes button is not initially visible');

    // Remove a metric
    await click('.navi-column-config-item__trigger');
    await selectChoose('.navi-column-config-item__parameter', 'Week');

    assert
      .dom('.navi-report-widget__revert-btn')
      .isVisible('Revert changes button is visible once a change has been made');

    await click('.navi-report-widget__revert-btn');

    assert
      .dom('.filter-builder__subject')
      .hasText('Date Time day', 'After clicking "Revert Changes", the changed time grain is returned');

    assert
      .dom('.navi-report-widget__revert-btn')
      .isNotVisible('After clicking "Revert Changes", button is once again hidden');
  });

  test('Export action', async function (assert) {
    let originalFeatureFlag = config.navi.FEATURES.exportFileTypes;

    // Turn flag off
    config.navi.FEATURES.exportFileTypes = [];

    await visit('/dashboards/1/widgets/2/view');

    assert
      .dom($('.report-actions__export-btn:contains(Export)')[0])
      .doesNotHaveClass('.report-actions__export-btn--is-disabled', 'Export action is enabled for a valid request');

    // Remove all columns to create an invalid request
    assert
      .dom('.navi-column-config-item__remove-icon[aria-label="delete time-dimension Date Time (day)"]')
      .exists('The dateTime remove icon exists');
    await click('.navi-column-config-item__remove-icon[aria-label="delete time-dimension Date Time (day)"]');
    await click('.navi-column-config-item__remove-icon[aria-label="delete metric Nav Link Clicks"]');
    await click('.navi-column-config-item__remove-icon[aria-label="delete metric Ad Clicks"]');

    assert
      .dom($('.report-actions__export-btn:contains(Export)')[0])
      .doesNotHaveClass(
        '.report-actions__export-btn--is-disabled',
        'Export action is disabled when request is not valid'
      );

    assert
      .dom('.navi-report-widget__body .report-builder__container--result')
      .isVisible('Widget body has a visualization on the view route');

    config.navi.FEATURES.exportFileTypes = originalFeatureFlag;
  });

  test('Multi export action', async function (assert) {
    assert.expect(1);

    await visit('/dashboards/1/widgets/2/view');
    await clickTrigger('.multiple-format-export');
    assert
      .dom($('.multiple-format-export__dropdown a:contains(PDF)')[0])
      .hasAttribute('href', /export\?reportModel=/, 'Export url contains serialized report');
  });

  test('Get API action - enabled/disabled', async function (assert) {
    assert.expect(2);

    await visit('/dashboards/1/widgets/2/view');
    assert
      .dom('.get-api__action-btn')
      .doesNotHaveAttribute('disabled', 'Get API action is enabled for a valid request');

    // Remove all columns to create an invalid request
    await click('.navi-column-config-item__remove-icon[aria-label="delete time-dimension Date Time (day)"]');
    await click('.navi-column-config-item__remove-icon[aria-label="delete metric Nav Link Clicks"]');
    await click('.navi-column-config-item__remove-icon[aria-label="delete metric Ad Clicks"]');

    assert
      .dom('.get-api__action-btn')
      .hasAttribute('disabled', '', 'Get API action is disabled when request is not valid');
  });

  test('Share action', async function (assert) {
    const done = assert.async();
    assert.expect(2);

    this.owner.register(
      'service:navi-notifications',
      class extends Service {
        add({ extra }) {
          assert.equal(extra, document.location, 'share uses the current location as the default share url');
          done();
        }
      }
    );

    /* == Unsaved widget == */
    await visit('/dashboards/1/widgets/new');
    await click('.report-builder-source-selector__source-button[data-source-name="Bard One"]');
    await click('.report-builder-source-selector__source-button[data-source-name="Network"]');
    await animationsSettled();

    await clickItem('metric', 'Ad Clicks');
    await click('.navi-report-widget__run-btn');

    assert.notOk(
      !!$('.navi-report-widget__action:contains(Share)').length,
      'Share action is not present on an unsaved report'
    );

    /* == Saved widget == */
    await visit('/dashboards/1/widgets/2/view');
    await triggerCopySuccess('.navi-report-widget__share-btn');
  });

  test('Delete widget', async function (assert) {
    assert.expect(5);

    /* == Not owner == */
    await visit('/dashboards/3/widgets/4/view');
    assert.notOk(
      !!$('.navi-report-widget__action:contains(Delete)').length,
      'Delete action is not available if user is not the owner'
    );

    /* == Delete success == */
    await visit('/dashboards/1');

    assert.deepEqual(
      findAll('.navi-widget__title').map((el) => el.textContent.trim()),
      ['Mobile DAU Goal', 'Mobile DAU Graph', 'Mobile DAU Table'],
      '"DAU Graph" widget is initially present on dashboard'
    );

    await visit('/dashboards/1/widgets/2/view');
    await click('.navi-report-widget__delete-btn');
    assert
      .dom('.delete__modal-details')
      .hasText('This action cannot be undone. This will permanently delete the Mobile DAU Graph dashboard widget.');

    await click('.delete__modal-delete-btn');
    assert.ok(currentURL().endsWith('/dashboards/1/view'), 'After deleting, user is brought to dashboard view');

    assert.deepEqual(
      findAll('.navi-widget__title').map((el) => el.textContent.trim()),
      ['Mobile DAU Goal', 'Mobile DAU Table'],
      'Deleted widget is removed from dashboard'
    );
  });

  test('Clone a widget', async function (assert) {
    assert.expect(4);
    let originalWidgetTitle;

    await visit('/dashboards/1/widgets/1/view');
    originalWidgetTitle = find('.navi-report-widget__title').textContent.trim();

    await click($('.navi-report-widget__action-link:contains("Clone As Report")')[0]);

    assert.ok(
      TempIdRegex.test(currentURL()),
      'After cloning, user is brought to view route for a new report with a temp id'
    );

    assert.dom('.report-header__title').hasText('Copy of ' + originalWidgetTitle, 'Cloned Report title is displayed');

    assert.dom('.navi-report__body .report-builder').isVisible('Report body has a builder on the view route');

    assert
      .dom('.navi-report__body .report-view__visualization-main')
      .isVisible('Report body has a visualization on the view route');
  });

  test('Error data request', async function (assert) {
    assert.expect(1);

    server.get(`${config.navi.dataSources[0].uri}/v1/data/*path`, () => {
      return new Response(500, {}, { description: 'Cannot merge mismatched time grains month and day' });
    });

    await visit('/dashboards/2/widgets/4/view');
    assert
      .dom('.routes-reports-report-error__error-list')
      .hasText(
        'Cannot merge mismatched time grains month and day',
        'An error message is displayed for an invalid request'
      );
  });

  test('Cancel Widget', async function (assert) {
    //Slow down mock
    server.timing = 400;
    server.urlPrefix = `${config.navi.dataSources[0].uri}/v1`;
    server.get('data/*path', () => {
      return { rows: [] };
    });

    //Load the widget
    visit('/dashboards/1/widgets/1/view').catch((error) => {
      //https://github.com/emberjs/ember-test-helpers/issues/332
      const { message } = error;
      if (message !== 'TransitionAborted') {
        throw error;
      }
    });

    await waitFor('.navi-report-widget__cancel-btn', { timeout: 2000 });

    assert.equal(currentRouteName(), 'dashboards.dashboard.widgets.widget.loading', 'Widget is loading');

    assert.deepEqual(
      findAll('.navi-report-widget__footer button').map((e) => e.textContent.trim()),
      ['Cancel'],
      'When widget is loading, the only footer button is `Cancel`'
    );

    await click('.navi-report-widget__cancel-btn');

    assert.equal(
      currentRouteName(),
      'dashboards.dashboard.widgets.widget.edit',
      'Clicking `Cancel` brings the user to the edit route'
    );

    assert.deepEqual(
      findAll('.navi-report-widget__footer button').map((e) => e.textContent.trim()),
      ['Run', 'Save Changes', 'Revert'],
      'When not loading a widget, the standard footer buttons are available'
    );

    //Run the widget
    await click('.navi-report-widget__run-btn');

    assert.equal(
      currentRouteName(),
      'dashboards.dashboard.widgets.widget.view',
      'Running the widget brings the user to the view route'
    );

    assert.deepEqual(
      findAll('.navi-report-widget__footer button').map((e) => e.textContent.trim()),
      ['Run', 'Save Changes', 'Revert'],
      'When not loading a widget, the standard footer buttons are available'
    );
  });
});
