import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, findAll, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import $ from 'jquery';

module('Integration | Component | dimension bulk import simple', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(async function() {
    this.set('onSelectValues', () => undefined);
    this.set('onCancel', () => undefined);

    await render(hbs`<DimensionBulkImportSimple
      @rawInput={{this.rawInput}}
      @onSelectValues={{action this.onSelectValues}}
      @onCancel={{action this.onCancel}}
    />`);
  });

  function getRawValue() {
    return findAll('.dimension-bulk-import-simple-row--raw-value .item').map(el => el.textContent.trim());
  }

  function getSplitValues() {
    return findAll('.dimension-bulk-import-simple-row--split-values .item').map(el => el.textContent.trim());
  }

  test('Raw inputs are filtered and split up properly', async function(assert) {
    assert.expect(9);

    this.set('rawInput', '1,2,3');
    assert.deepEqual(getRawValue(), ['1,2,3'], 'The raw string is 1,2,3');
    assert.deepEqual(getSplitValues(), ['1', '2', '3'], 'The input values are split on the comma');
    assert.dom($('.btn-primary:contains(split)')[0]).hasText('Use split input (3 values)');

    this.set('rawInput', '');
    assert.deepEqual(getRawValue(), [], 'Raw value does not include empty string');
    assert.deepEqual(getSplitValues(), [], 'Split values do not include empty string');
    assert.dom($('.btn-primary:contains(split)')[0]).hasText('Use split input (0 values)');

    this.set('rawInput', ' some weird,  spacing,going ,on');
    assert.deepEqual(
      getRawValue(),
      ['some weird,  spacing,going ,on'],
      'The raw value string is trimmed, but retains innner spacing'
    );
    assert.deepEqual(
      getSplitValues(),
      ['some weird', 'spacing', 'going', 'on'],
      'The split values will trim away weird inner spacing'
    );
    assert.dom($('.btn-primary:contains(split)')[0]).hasText('Use split input (4 values)');
  });

  test('Selecting the raw value gives the raw array', async function(assert) {
    assert.expect(2);

    const raw = ['some weird,  spacing,going ,on'];
    this.set('rawInput', ' some weird,  spacing,going ,on');
    assert.deepEqual(getRawValue(), raw, 'The raw value string is trimmed, but retains innner spacing');
    this.set('onSelectValues', values =>
      assert.deepEqual(values, raw, 'The selected value is the raw string as an array')
    );
    await click($('.btn-primary:contains(raw)')[0]);
  });

  test('Selecting the split values gives the filtered split array', async function(assert) {
    assert.expect(2);

    const split = ['some weird', 'spacing', 'going', 'on'];
    this.set('rawInput', ' some weird,  spacing,going ,on,,, ,,,');
    assert.deepEqual(getSplitValues(), split, 'The split values will trim away weird inner spacing');
    this.set('onSelectValues', values =>
      assert.deepEqual(values, split, 'The selected values are just the split string array')
    );
    await click($('.btn-primary:contains(split)')[0]);
  });
});
