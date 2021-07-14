import { module, test } from 'qunit';
import { click, currentURL, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';

module('Acceptance | dir sidebar', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  test('transitions for sidebar link-tos', async function (assert) {
    await visit('/directory');
    assert.equal(currentURL(), '/directory/my-data', 'Directory route redirects to `my-data` child route');
    assert.dom('.dir-sidebar .is-active').hasText('My Data', 'The active sidebar link corresponds to the active route');

    await visit('/directory/my-data');
    assert
      .dom('.dir-sidebar .is-active')
      .hasText(
        'My Data',
        'The active sidebar filter link corresponds to the active route and the active filter query param'
      );

    await click('.dir-sidebar__link[data-title="Other Data"] a');
    assert.equal(currentURL(), '/directory/other-data', 'Currently on a different directory subroute than my-data');

    await click('.dir-sidebar__link[data-title="Favorites"] a');
    assert.equal(
      currentURL(),
      '/directory/my-data?filter=favorites',
      '`favorites` is set as the query param and applied to the my-data route when the favorites filter is clicked on'
    );
    assert
      .dom('.dir-sidebar .is-active')
      .hasText('Favorites', 'The active sidebar filter link now corresponds to `favorites` filter query param');

    await visit('/directory/my-data?filter=favorites&sortBy=owner&sortDir=asc');
    await click('.dir-sidebar__link[data-title="Other Data"] a');
    assert.equal(
      currentURL(),
      '/directory/other-data?sortBy=owner&sortDir=asc',
      'Clicking another directory removes the favorites filter but keeps sorting'
    );
  });
});
