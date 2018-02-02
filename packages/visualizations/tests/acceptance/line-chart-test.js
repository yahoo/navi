import { test } from 'qunit';
import moduleForAcceptance from '../../tests/helpers/module-for-acceptance';

moduleForAcceptance('Acceptance | line chart');

test('tooltip updates', function(assert) {
  assert.expect(2);

  visit('/lineChart');
  let container = this.application.__container__;

  andThen(function() {
    showTooltip(container);

    //check text of the tooltip container
    assert.equal(find('.sub-title').text(),
      'clicks',
      'The tooltip contains the default metric name.');
  });

  //Select a different metric
  selectChoose('.dimension-line-chart-config__metric-selector', 'Unique Identifier');

  andThen(function() {
    showTooltip(container);

    //check text of the tooltip container
    assert.equal(find('.sub-title').text(),
      'uniqueIdentifier',
      'The tooltip contains the correct metric name after a new metric is selected');
  });
});

/**
 * @function showTooltip
 * @param {Object} container - app container
 * This will show the chart tooltip so that we can fetch its contents.
 */
function showTooltip(container) {
  let emberId = find('.chart-container .navi-vis-c3-chart:eq(1)').attr('id'),
      component = container.lookup('-view-registry:main')[emberId],
      c3 = component.get('chart');
  c3.tooltip.show({x:1});
}
