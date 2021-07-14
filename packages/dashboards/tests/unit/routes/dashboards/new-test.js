import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';

let Route;

const NEW_MODEL = {
  owner: 'navi_user',
  createdOn: null,
  filters: [],
  presentation: {
    columns: 12,
    layout: [],
    version: 1,
  },
  updatedOn: null,
};
const NEW_MODEL_WITH_DEFAULT_TITLE = Object.assign({}, NEW_MODEL, {
  title: 'Untitled Dashboard',
});

const NEW_MODEL_WITH_GIVEN_TITLE = Object.assign({}, NEW_MODEL, {
  title: 'Dashing Dashboard',
});

module('Unit | Route | dashboards/new', function (hooks) {
  setupTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(function () {
    Route = this.owner.factoryFor('route:dashboards/new').create({
      router: {
        currentRoute: {
          queryParams: {},
        },
      },
    });
  });

  test('model - new with default title', async function (assert) {
    assert.expect(1);

    await run(async () => {
      const modelPromise = Route.model({}, { to: { queryParams: {} } });

      const routeModel = await modelPromise;

      //We don't need to match on the createdOn and updatedOn timestamps so just set them to null
      assert.deepEqual(
        Object.assign({}, routeModel.toJSON(), { createdOn: null, updatedOn: null }),
        NEW_MODEL_WITH_DEFAULT_TITLE,
        'The model hook returns a new model when the title query param is not defined'
      );
    });
  });

  test('model - new with given title', async function (assert) {
    assert.expect(1);

    await run(async () => {
      const routeModel = await Route.model({}, { to: { queryParams: { title: 'Dashing Dashboard' } } });
      //We don't need to match on the createdOn and updatedOn timestamps so just set them to null
      assert.deepEqual(
        Object.assign({}, routeModel.toJSON(), { createdOn: null, updatedOn: null }),
        NEW_MODEL_WITH_GIVEN_TITLE,
        'The model hook returns a new model when the title query param is defined'
      );
    });
  });

  test('afterModel', function (assert) {
    assert.expect(2);

    const dashboard = { id: 3 };

    /* == Without unsavedWidgetId == */
    Route.replaceWith = (destinationRoute) => {
      assert.equal(
        destinationRoute,
        'dashboards.dashboard',
        'Route redirects to dashboard/:id route when unsavedWidgetId is not given'
      );
    };
    Route.afterModel(dashboard, { to: { queryParams: {} } });

    /* == With unsavedWidgetId == */
    Route.replaceWith = (destinationRoute) => {
      assert.equal(
        destinationRoute,
        'dashboards.dashboard.widgets.add',
        'Route redirects to dashboard/:id/widgets/new route when unsavedWidgetId is given'
      );
    };
    Route.afterModel(dashboard, { to: { queryParams: { unsavedWidgetId: 10 } } });
  });
});
