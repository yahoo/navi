import { all } from 'rsvp';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { Response } from 'ember-cli-mirage';

let Route;

const CLONED_MODEL = {
  owner: 'navi_user',
  createdOn: null,
  presentation: {
    columns: 12,
    layout: [
      {
        column: 0,
        height: 4,
        row: 0,
        widgetId: 12,
        width: 6,
      },
      {
        column: 6,
        height: 4,
        row: 0,
        widgetId: 13,
        width: 6,
      },
      {
        column: 0,
        height: 4,
        row: 4,
        widgetId: 14,
        width: 12,
      },
    ],
    version: 1,
  },
  title: 'Copy of Tumblr Goals Dashboard',
  updatedOn: null,
};

module('Unit | Route | dashboards/dashboard/clone', function (hooks) {
  setupTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function () {
    Route = this.owner.lookup('route:dashboards/dashboard/clone');
    this.owner.lookup('service:user').findUser();

    await this.owner.lookup('service:navi-metadata').loadMetadata();
  });

  test('_cloneDashboard - valid dashboard', async function (assert) {
    assert.expect(4);

    const dashboard = await Route.store.findRecord('dashboard', 1);
    const widgetIdInDashboard = dashboard.presentation.layout.map((layout) => layout.widgetId);
    const model = await Route._cloneDashboard(dashboard);
    const expectedModel = model.toJSON();
    const widgetIdInExpectedModel = model.presentation.layout.map((layout) => layout.widgetId);

    assert.equal(expectedModel.title, CLONED_MODEL.title, 'Expected Models title is correct');

    assert.equal(expectedModel.owner, CLONED_MODEL.owner, 'Expected Models Owner is correct');

    assert.notEqual(
      widgetIdInExpectedModel,
      widgetIdInDashboard,
      'WidgetIds in expected dashboard and original dashboard is not the same'
    );

    assert.deepEqual(
      expectedModel.presentation,
      CLONED_MODEL.presentation,
      'Expected Models presentation object is correct'
    );
  });

  test('_cloneDashboard - invalid widgets for a dashboard', async function (assert) {
    assert.expect(1);

    //Mock Server Endpoint
    server.get('/dashboards/:id/widgets/', () => new Response(500));

    const dashboard = await Route.store.findRecord('dashboard', 1);
    await Route._cloneDashboard(dashboard).catch(() => {
      assert.ok(true, 'clone dashboard fails for invalid widgets');
    });
  });

  test('_cloneWidget - valid widget', async function (assert) {
    assert.expect(15);

    const dashboard = await Route.store.findRecord('dashboard', 1);
    const oldWidgets = await dashboard.get('widgets');
    const cloneDashboard = dashboard.clone();

    const cloneDashboardModel = await cloneDashboard.save();
    const widgetPromiseArray = await Route._cloneWidgets(dashboard, cloneDashboardModel);
    const widgets = await all(widgetPromiseArray);

    widgets.forEach((clonedWidget, idx) => {
      assert.equal(clonedWidget.title, oldWidgets.objectAt(idx).title, 'Widget titles are same');

      assert.deepEqual(
        clonedWidget.requests.firstObject.toJSON(),
        oldWidgets.objectAt(idx).requests.firstObject.toJSON(),
        'Widget requests are same'
      );

      assert.deepEqual(
        clonedWidget.visualization.toJSON(),
        oldWidgets.objectAt(idx).visualization.toJSON(),
        'Widget visualization are same'
      );

      assert.notEqual(clonedWidget.id, oldWidgets.objectAt(idx).id, 'Widget ids are not same');

      assert.equal(
        clonedWidget.dashboard.get('id'),
        cloneDashboardModel.id,
        'Cloned Widgets are set to the correct dashboard'
      );
    });
  });

  test('afterModel', function (assert) {
    assert.expect(1);

    const dashboard = { id: 6 };

    Route.replaceWith = (destinationRoute) => {
      assert.equal(destinationRoute, 'dashboards.dashboard', 'Route redirects to dashboard/:id route ');
    };
    Route.afterModel(dashboard);
  });
});
