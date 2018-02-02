import Ember from 'ember';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { hbsWithModal } from '../../../helpers/hbs-with-modal';
import wait from 'ember-test-helpers/wait';
import { clickTrigger, nativeMouseUp } from '../../../helpers/ember-power-select';

const { getOwner } = Ember;

const DeliveryRule = {
  frequency: 'Week',
  format: '.csv',
  recipients: [ 'test@oath.com', 'rule@oath.com' ]
};
const TestModel = {
  title: 'Test Test',
  deliveryRuleForUser: {
    isFulfilled: true,
    content: DeliveryRule
  }
};
const unscheduledModel = {
  title: 'Test Test',
  deliveryRuleForUser: {
    isFulfilled: true,
    content: null
  }
};

moduleForComponent('common-actions/schedule', 'Integration | Component | common actions/schedule ', {
  integration: true,
  beforeEach() {
    this.set('onSaveAction', () => {});
    this.set('onRevertAction', () => {});
    this.set('onDeleteAction', () => {});
  }
});

test('schedule modal - test disabled', function(assert) {
  assert.expect(1);
  this.set('model', TestModel);

  this.render(hbs`
        {{common-actions/schedule
            model=model
            onSave=(action onSaveAction)
            onRevert=(action onRevertAction)
            onDelete=(action onDeleteAction)
            disabled=isDisabled
        }}
    `);

  this.set('isDisabled', false);

  assert.notOk(this.$('.schedule-action__button').is(":disabled"),
    'Scedule is enabled when the disabled is set to false');
});

test('schedule modal - test enabled', function(assert) {
  assert.expect(1);
  this.set('model', TestModel);

  this.render(hbs`
        {{common-actions/schedule
            model=model
            onSave=(action onSaveAction)
            onRevert=(action onRevertAction)
            onDelete=(action onDeleteAction)
            disabled=isDisabled
        }}
    `);

  this.set('isDisabled', true);

  assert.ok(this.$('.schedule-action__button').is(":disabled"),
    'Schedule is enabled when the disabled is set to false');
});

test('it renders', function(assert) {
  assert.expect(3);

  this.render(hbs`{{common-actions/schedule onSave=(action onSaveAction) onRevert=(action onRevertAction) onDelete=(action onDeleteAction)}}`);

  assert.ok(this.$('.schedule-action__button').is(':visible'),
    'Schedule Modal component is rendered');

  assert.ok(this.$('.schedule-action__icon').is(':visible'),
    'A schedule icon is rendered in the component');

  // Template block usage:
  this.render(hbs`
    {{#common-actions/schedule
        onSave=(action onSaveAction)
        onRevert=(action onRevertAction)
        onDelete=(action onDeleteAction)
    }}
      Schedule
    {{/common-actions/schedule}}
    `);

  assert.equal(this.$('.schedule-action__icon-label').text().trim(),
    'Schedule',
    'When used in block mode, the text `Schedule` is displayed');
});

test('schedule modal', function(assert) {
  assert.expect(10);

  this.set('model', unscheduledModel);

  this.render(hbs`
        {{common-actions/schedule
            model=model
            onSave=(action onSaveAction)
            onRevert=(action onRevertAction)
            onDelete=(action onDeleteAction)
        }}
    `);

  Ember.run(() => {
    this.$('.schedule-action__button').click();
  });

  assert.ok($('.navi-modal').is(':visible'),
    'Schedule Modal component is rendered when the button is clicked');

  assert.equal($('.primary-header').text().trim(),
    'Schedule "Test Test"',
    'The primary header makes use of the modelName appropriately');

  assert.deepEqual($('.schedule-modal__label').toArray().map((el) => $(el).text().trim()), [
    'Recipients', 'Frequency', 'Format'
  ], 'Schedule Modal has all the expected sections');

  assert.ok($('.schedule-modal__input--recipients').is(':visible'),
    'Schedule Modal component renders an text area for recipients');

  assert.ok($('.schedule-modal__dropdown--frequency').is(':visible'),
    'Schedule Modal component renders an dropdown for frequencies');

  assert.ok($('.schedule-modal__dropdown--format').is(':visible'),
    'Schedule Modal component renders an dropdown for formats');

  assert.equal($('.schedule-modal__dropdown--frequency').text().trim(),
    'Week',
    'Week is the default frequency value');

  assert.equal($('.schedule-modal__dropdown--format').text().trim(),
    'csv',
    '`.csv` is the default format value');

  assert.ok($('.schedule-modal__dropdown--format .ember-power-select-trigger').attr('aria-disabled'),
    'The formats dropdown is disabled by default');

  assert.notOk($('.schedule-modal__rejected').is(':visible'),
    'rejected error does not show');
});

test('schedule modal - delivery rule passed in', function(assert) {
  assert.expect(2);
  this.set('model', TestModel);

  this.render(hbs`
        {{common-actions/schedule
            model=model
            onSave=(action onSaveAction)
            onRevert=(action onRevertAction)
            onDelete=(action onDeleteAction)
        }}
    `);

  Ember.run(() => {
    this.$('.schedule-action__button').click();
  });

  assert.equal($('.schedule-modal__input--recipients').val(),
    'test@oath.com,rule@oath.com',
    'The recipients is fetched from the delivery rule');

  assert.equal($('.schedule-modal__dropdown--frequency').text().trim(),
    'Week',
    'The frequency is fetched from the delivery rule');
});

test('onSave Action', function(assert) {
  assert.expect(5);

  this.set('model', unscheduledModel);

  this.render(hbs`
        {{common-actions/schedule
            model=model
            onSave=(action onSaveAction)
            onRevert=(action onRevertAction)
            onDelete=(action onDeleteAction)
        }}
    `);

  //Open modal
  Ember.run(() => {
    this.$('.schedule-action__button').click();
  });

  assert.equal($('.schedule-modal__save-btn').text().trim(),
    'Save',
    'The save button says `Save` when model does not have a delivery rule for the current user');

  assert.equal($('.schedule-modal__delete-btn').length,
    0,
    'The delete button is not available when model does not have a delivery rule for the current user');

  Ember.run(() => {
    $('.schedule-modal__input--recipients').val('test1@navi.io, test2@navi.io');
    $('.schedule-modal__input--recipients').trigger('keyup');

    clickTrigger('.schedule-modal__dropdown--frequency');
    nativeMouseUp($('.ember-power-select-option:contains(Month)')[0]);
  });

  this.set('onSaveAction', (rule) => {
    assert.equal(rule.get('frequency'),
      'month',
      'Selected frequency is updated in the delivery rule');

    assert.deepEqual(rule.get('recipients'),
      [ 'test1@navi.io', 'test2@navi.io' ],
      'Recipients entered in the text area is set in the delivery rule');

    assert.ok(true,
      'OnSave action is called');

    return Ember.RSVP.resolve();
  });

  //Click save after modal is open
  Ember.run(() => {
    $('.schedule-modal__save-btn').click();
  });
});

test('schedule modal - new deliveryRule', function(assert) {
  assert.expect(1);

  this.set('model', TestModel);

  this.render(hbs`
        {{common-actions/schedule
            model=model
            onSave=(action onSaveAction)
            onRevert=(action onRevertAction)
            onDelete=(action onDeleteAction)
        }}
    `);

  Ember.run(() => {
    this.$('.schedule-action__button').click();
  });

  assert.equal($('.schedule-modal__save-btn').text().trim(),
    'Save Changes',
    'The save button says `Save Changes` when deliveryRule is present for current user');
});

test('onRevert Action', function(assert) {
  assert.expect(1);

  this.set('model', TestModel);

  this.render(hbs`
        {{common-actions/schedule
            model=model
            onSave=(action onSaveAction)
            onRevert=(action onRevertAction)
            onDelete=(action onDeleteAction)
        }}
    `);

  //Open modal
  Ember.run(() => {
    this.$('.schedule-action__button').click();
  });

  this.set('onRevertAction', () => {
    assert.ok(true,
      'OnRevert action is called');
  });

  //Click cancel after modal is open
  Ember.run(() => {
    $('.schedule-modal__cancel-btn').click();
  });
});

test('onDelete action', function(assert) {
  assert.expect(2);

  this.set('deliveryRule', DeliveryRule);

  this.set('model', TestModel);

  this.set('onDeleteAction', () => {
    assert.ok(true,
      'OnDelete action is called');
  });

  this.render(hbsWithModal(`
        {{common-actions/schedule
            model=model
            onSave=(action onSaveAction)
            onRevert=(action onRevertAction)
            onDelete=(action onDeleteAction)
        }}
    `, getOwner(this)));

  Ember.run(() => {
    this.$('.schedule-action__button').click();
  });

  assert.equal($('.schedule-modal__delete-btn').length,
    1,
    'Delete button is shown when deliveryRule is present for current user');

  Ember.run(() => {
    $('.btn-container button:contains(Delete)').click();
  });

  return wait().then(() => {
    $('.btn-container button:contains(Confirm)').click();
  });
});
