import { run } from '@ember/runloop';
import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

let Store, MockOwner;

module('Unit | Route | dashboards/dashboard/widgets/widget/clone-to-report', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    Store = this.owner.lookup('service:store');
    MockOwner = Store.createRecord('user', { id: 'Gannon' });

    this.owner.register(
      'service:user',
      Service.extend({
        getUser: () => MockOwner,
      })
    );
  });

  test('model', function (assert) {
    assert.expect(2);

    return run(() => {
      let widget = {
          title: 'Twilight Princess',
          owner: 'Wolf Link',
          request: {
            clone: () => null,
          },
          visualization: {
            type: 'goal-gauge',
          },
          toJSON() {
            return Object.assign({}, this);
          },
        },
        route = this.owner.factoryFor('route:dashboards/dashboard/widgets/widget/clone-to-report').create({
          modelFor() {
            return widget;
          },
        });

      let report = route.model();
      assert.equal(
        report.get('title'),
        `Copy of ${widget.title}`,
        'Created report title is "Copy of" + original title'
      );

      assert.equal(report.get('owner.id'), MockOwner.id, 'Current user is the owner of the created report');
    });
  });

  test('_cloneToReport', function (assert) {
    assert.expect(2);

    return run(() => {
      const route = this.owner.lookup('route:dashboards/dashboard/widgets/widget/clone-to-report'),
        widget = {
          title: 'Twilight Princess',
          owner: 'Wolf Link',
          request: {
            clone: () => null,
          },
          visualization: {
            type: 'goal-gauge',
          },
          toJSON() {
            return Object.assign({}, this);
          },
        };

      let clonedReport = route._cloneToReport(widget);
      assert.equal(
        clonedReport.get('title'),
        `Copy of ${widget.title}`,
        'Created report title is "Copy of" + original title'
      );

      assert.equal(clonedReport.get('owner.id'), MockOwner.id, 'Current user is the owner of the created report');
    });
  });
});
