import { module, test } from 'qunit';
import { visit, findAll } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import setupMirage from 'ember-cli-mirage/test-support/setup-mirage';
import { Response } from 'ember-cli-mirage';
import config from 'ember-get-config';

module('Acceptance | Navi Report | Error Route', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  test('Error data request', async function(assert) {
    const originalFeatureFlag = config.navi.FEATURES.enableRequestPreview;
    config.navi.FEATURES.enableRequestPreview = true;

    server.urlPrefix = `${config.navi.dataSources[0].uri}/v1`;
    server.get(
      '/data/*path',
      () => new Response(400, {}, { description: 'Cannot merge mismatched time grains month and day' })
    );

    await visit('/reports/5/view');

    assert
      .dom('.navi-report-error__info-message')
      .hasText(
        'Oops! There was an error with your request. Cannot merge mismatched time grains month and day',
        'An error message is displayed for an invalid request'
      );

    assert.deepEqual(
      findAll('.navi-column-config-item__name').map(e => e.textContent),
      ['Date Time (Day)', 'Ad Clicks', 'Nav Link Clicks'],
      'The column config is displayed in the error route'
    );

    config.navi.FEATURES.enableRequestPreview = originalFeatureFlag;
  });
});
