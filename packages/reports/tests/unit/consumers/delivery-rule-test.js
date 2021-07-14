import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { settled } from '@ember/test-helpers';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { run } from '@ember/runloop';
import Response from 'ember-cli-mirage/response';

let Store;

module('Unit | Consumer | delivery-rule', function (hooks) {
  setupTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function () {
    Store = this.owner.lookup('service:store');
    await this.owner.lookup('service:navi-metadata').loadMetadata();
  });

  test('delete delivery-rule - success', function (assert) {
    assert.expect(2);

    let Consumer = this.owner.lookup('consumer:delivery-rule'),
      promise = {
        resolve() {
          assert.notOk(Store.hasRecordForId('delivery-rule', 1), 'Delivery Rule is deleted from the store');
        },
        reject() {
          assert.notOk(true, 'Passed in promise is not rejected when delete is successful');
        },
      };

    return run(() => {
      let rule = Store.createRecord('delivery-rule', {
        id: 1,
        deliveryType: 'report',
        deliveredItem: {},
        owner: 'navi_user',
      });
      assert.ok(Store.hasRecordForId('delivery-rule', 1), 'Delivery Rule 1 is available in the store');

      Consumer.send('deleteDeliveryRule', rule, promise);
    });
  });

  test('delete delivery-rule - failure', function (assert) {
    assert.expect(2);

    //Mock Server Endpoint
    this.server.del('/deliveryRules/:id', () => {
      return new Response(500);
    });

    let Consumer = this.owner.lookup('consumer:delivery-rule'),
      promise = {
        resolve() {
          assert.notOk(true, 'Passed in promise is not resolved when delete fails');
        },
        reject() {
          assert.ok(Store.hasRecordForId('delivery-rule', 2), 'Delivery Rule is not deleted from the store');
        },
      };

    return run(() => {
      return Store.findRecord('delivery-rule', 2).then((rule) => {
        assert.ok(Store.hasRecordForId('delivery-rule', 2), 'Delivery Rule 1 is available in the store');

        Consumer.send('deleteDeliveryRule', rule, promise);

        return settled();
      });
    });
  });

  test('save delivery-rule - success', function (assert) {
    assert.expect(3);

    let Consumer = this.owner.lookup('consumer:delivery-rule'),
      promise = {
        resolve() {
          assert.ok(true, 'Passed in promise is resolved when save succeeds');
        },
        reject() {
          assert.notOk(true, 'Passed in promise is not rejected when save succeeds');
        },
      };

    return run(() => {
      return Store.findRecord('report', 1).then((report) => {
        return report.owner.then((owner) => {
          let newRule = Store.createRecord('delivery-rule', {
            deliveryType: 'report',
            format: { type: 'csv' },
            deliveredItem: report,
            owner,
          });

          assert.ok(newRule.hasDirtyAttributes, 'Delivery rule is not saved');

          Consumer.send('saveDeliveryRule', newRule, promise);

          return settled().then(() => {
            assert.notOk(newRule.hasDirtyAttributes, 'saveDeliveryRule action saves the dirty delivery rule');
          });
        });
      });
    });
  });
});
