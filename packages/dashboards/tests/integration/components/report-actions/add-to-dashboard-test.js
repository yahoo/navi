import { A as arr } from '@ember/array';
import { set } from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { fillIn, findAll, render, click } from '@ember/test-helpers';
import { selectChoose } from 'ember-power-select/test-support/helpers';
import hbs from 'htmlbars-inline-precompile';
import { setupMirage } from 'ember-cli-mirage/test-support';

let Template;

module('Integration | Component | report actions/add to dashboard', function (hooks) {
  setupRenderingTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(function () {
    Template = hbs`
      <ReportActions::AddToDashboard
        @report={{this.report}}
        @dashboards={{this.dashboards}}
        @onAddToDashboard={{this.addToDashboard}}
        @onAddToNewDashboard={{this.addToNewDashboard}}
        as |toggleModal|
      >  
        <button
          type="button"
          class="action-btn"
          {{on "click" toggleModal}}
        > 
          Add to Dashboard
        </button> 
      </ReportActions::AddToDashboard>
    `;
    set(this, 'report', {
      id: 1,
      title: 'Buzz Blob',
      owner: 'navi_user',
    });

    set(
      this,
      'dashboards',
      arr([
        {
          id: 1,
          title: 'Tumblr Goals Dashboard',
        },
        {
          id: 2,
          title: 'Dashboard 2',
        },
      ])
    );

    set(this, 'addToDashboard', () => undefined);
    set(this, 'addToNewDashboard', () => undefined);
  });

  test('component renders', async function (assert) {
    await render(Template);
    assert.dom('.action-btn').hasText('Add to Dashboard', 'Template content is yielded');
  });

  test('component`s Modal', async function (assert) {
    await render(Template);

    assert
      .dom('.add-to-dashboard__modal')
      .isNotVisible('add to dashboard report action modal is not visible before clicking the component');

    await click('.action-btn');

    assert
      .dom('.add-to-dashboard__modal')
      .isVisible('add to dashboard report modal dialog pops up on clicking the component');

    assert
      .dom('.add-to-dashboard__widget-title')
      .hasValue('Buzz Blob', 'the report title is displayed as the default name for widget title');
  });

  test('create vs select', async function (assert) {
    await render(Template);
    await click('.action-btn');

    assert.dom('.add-to-dashboard__dashboard-select').isVisible('Dashboard selector is shown by default');

    assert.dom('.add-to-dashboard__dashboard-title').isNotVisible('Dashboard title input is not shown by default');

    assert
      .dom('.add-to-dashboard__new-toggle')
      .hasText('Create new dashboard', 'Create new dashboard link is also shown by default');

    await click('.add-to-dashboard__new-toggle');

    assert
      .dom('.add-to-dashboard__dashboard-title')
      .isVisible('Dashboard title input is shown when create dashboard link is clicked');

    assert.dom('.add-to-dashboard__dashboard-select').isNotVisible('Dashboard selector is hidden after link click');

    assert
      .dom('.add-to-dashboard__new-toggle')
      .hasText('Select Existing Dashboard', 'Select Existing Dashboard link is also shown after link click');
  });

  test('dropdown options', async function (assert) {
    await render(Template);
    await click('.action-btn');
    await click('.add-to-dashboard__dashboard-select');

    assert
      .dom('.ember-power-select-group-name')
      .hasText('My Dashboards', 'The user`s dashboards are grouped under `My Dashboards`');

    assert.deepEqual(
      findAll('.ember-power-select-option').map((el) => el.textContent.trim()),
      ['Tumblr Goals Dashboard', 'Dashboard 2'],
      'The user`s dashboard titles are shown in the dropdown'
    );

    // Clean up
    await click('.add-to-dashboard__modal');
    await click('.add-to-dashboard__cancel-btn');
  });

  test('addToDashboard action', async function (assert) {
    assert.expect(4);

    this.set('addToDashboard', (dashboardId, widgetTitle) => {
      assert.equal(dashboardId, '1', 'the selected dashboard id is passed to the action');
      assert.equal(widgetTitle, 'Buzz Blob', 'The value in the input field is passed as widget title to the action');
    });

    await render(Template);
    await click('.action-btn');

    assert.dom('.add-to-dashboard__add-btn').isDisabled('`Add To Dashboard` Button is disabled by default');

    await selectChoose('.add-to-dashboard__dashboard-select', 'Tumblr');

    assert
      .dom('.add-to-dashboard__add-btn')
      .isNotDisabled('`Add To Dashboard` Button is not disabled once a dashboard is selected');

    await click('.add-to-dashboard__add-btn');
  });

  test('addToNewDashboard action', async function (assert) {
    assert.expect(2);

    this.set('addToNewDashboard', (dashboardTitle, widgetTitle) => {
      assert.equal(dashboardTitle, 'Tri Force Heroes', 'the entered dashboard title is passed to the action');
      assert.equal(widgetTitle, 'Buzz Blob', 'The value in the input field is passed as widget title to the action');
    });

    await render(Template);
    await click('.action-btn');

    await click('.add-to-dashboard__new-toggle');
    await fillIn('.add-to-dashboard__dashboard-title', 'Tri Force Heroes');
    await click('.add-to-dashboard__add-btn');
  });

  test('one way widget title', async function (assert) {
    assert.expect(2);

    this.set('addToDashboard', (dashboardId, widgetTitle) => {
      assert.equal(
        widgetTitle,
        'ChuChu',
        'The value in the input field is passed as widget title without changing the report title'
      );
    });

    await render(Template);
    await click('.action-btn');
    await fillIn('.add-to-dashboard__widget-title', 'ChuChu');

    await selectChoose('.add-to-dashboard__dashboard-select', 'Tumblr');

    assert.equal(this.report.title, 'Buzz Blob', 'Report Title remains unchanged as `Buzz Blob`');

    await click('.add-to-dashboard__add-btn');
  });
});
