import Ember from 'ember';
import { moduleForComponent, test } from 'ember-qunit';
import wait from 'ember-test-helpers/wait';
import hbs from 'htmlbars-inline-precompile';

let Template = hbs`
  {{visualization-config/metric-label
    response=response
    request=request
    options=options
    onUpdateConfig=(action onUpdateConfig)
  }}`;

moduleForComponent('visualization-config/metric-label', 'Integration | Component | visualization config/metric-label', {
  integration: true,
  beforeEach() {
    this.set('options', {
      description: 'Glass Bottles of the ranch\'s finest pasteurized whole milk!!!!!!!',
      metric: 'bottles',
      format: '$0,0[.]00'
    });
    this.set('onUpdateConfig', () => null);
  }
});

test('component renders', function(assert) {
  assert.expect(2);

  this.render(Template);

  assert.equal(this.$('.metric-label-config__description-input').val().trim(),
    'Glass Bottles of the ranch\'s finest pasteurized whole milk!!!!!!!',
    'Component correctly displays initial description');

  assert.equal(this.$('.metric-label-config__format-input').val().trim(),
    '$0,0[.]00',
    'Component correctly displays initial format');
});

test('onUpdateConfig format input', function(assert) {
  assert.expect(1);

  this.set('onUpdateConfig', result => {
    assert.equal(result.format,
      'foo',
      'onUpdateConfig action is called by format input');
  });

  this.render(Template);

  Ember.run(() => {
    $('.metric-label-config__format-input').val('foo');
    $('.metric-label-config__format-input').focusout();
  });
});

test('onUpdateConfig description input', function(assert) {
  assert.expect(1);

  this.set('onUpdateConfig', result => {
    assert.equal(result.description,
      'foo',
      'onUpdateConfig action is called by description input');
  });

  this.render(Template);

  Ember.run(() => {
    $('.metric-label-config__description-input').val('foo');
    $('.metric-label-config__description-input').focusout();
  });
});

test('updateFormat from radio button', function(assert) {
  assert.expect(1);

  this.set('onUpdateConfig', result => {
    assert.equal(result.format,
      '0,0.00',
      'onUpdateConfig action is called by radio button');
  });

  this.render(Template);

  Ember.run(() => {
    $('.metric-label-config__radio-number input').click();
  });
});

test('clearFormat', function(assert) {
  assert.expect(1);

  this.set('onUpdateConfig', result => {
    assert.equal(result.format,
      '',
      'onUpdateConfig action is called by custom format radio button');
  });

  this.render(Template);

  Ember.run(() => {
    $('.metric-label-config__radio-custom input').click();
  });
});

test('highlight correct format when customFormat is changed', function(assert) {
  assert.expect(2);

  return wait().then(() => {
    this.render(Template);

    Ember.run(() => {
      $('.metric-label-config__format-input').val('$0,0[.]00a');
      $('.metric-label-config__format-input').focusout();
    });
    return wait().then(() => {
      assert.equal($('.metric-label-config__radio-custom input').prop('checked'),
        true,
        'custom format correctly highlighted when user enters custom format');

      Ember.run(() => {
        $('.metric-label-config__format-input').val('0,0.00');
        $('.metric-label-config__format-input').focusout();
      });

      return wait().then(() => {
        assert.equal($('.metric-label-config__radio-number input').prop('checked'),
          true,
          'number format correctly highlighted when user enters number format');
      });
    });
  });
});
