import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { render, click, findAll } from '@ember/test-helpers';
import { set } from '@ember/object';
import hbs from 'htmlbars-inline-precompile';

let Store;

module('Integration | Component | dir table', function (hooks) {
  setupRenderingTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(function () {
    Store = this.owner.lookup('service:store');
  });

  test('table populates from items correctly', async function (assert) {
    assert.expect(4);

    const owner = Store.createRecord('user', { id: 'navi_user' });
    const items = [
      Store.createRecord('report', {
        title: 'Report 1',
        owner,
        updatedOn: '2020-01-01 00:00:00',
      }),
      Store.createRecord('dashboard', {
        title: 'Dashboard 1',
        owner,
        updatedOn: '2020-01-02 00:00:00',
      }),
      Store.createRecord('report', {
        title: 'Report 2',
        owner,
        updatedOn: '2020-01-03 00:00:00',
      }),
    ];

    set(this, 'items', items);
    set(this, 'searchQuery', '');

    await render(hbs`<DirTable
      @items={{this.items}}
      @searchQuery={{this.searchQuery}}
    />`);

    assert.dom('.dir-table__row').exists({ count: 3 }, 'There is one row per item passed to the table');

    assert.deepEqual(
      findAll('th').map((elm) => elm.innerText.trim()),
      ['NAME', '', 'OWNER', 'LAST UPDATED DATE'],
      'The correct columns are generated for the table'
    );

    assert.ok(
      findAll('.dir-table__cell--owner').every((elm) => elm.innerText.trim() === 'navi_user'),
      "The owner's name is displayed correctly for each row"
    );

    assert.deepEqual(
      findAll('.dir-table__cell--lastUpdatedDate').map((elm) => elm.innerText.trim()),
      ['01/01/2020 - 12:00:00 am', '01/02/2020 - 12:00:00 am', '01/03/2020 - 12:00:00 am'],
      'The last updated dates are formatted and displayed correctly'
    );
  });

  test('table is sorted correctly', async function (assert) {
    assert.expect(3);

    set(this, 'items', []);
    set(this, 'searchQuery', '');
    set(this, 'sortBy', 'updatedOn');
    set(this, 'sortDir', 'desc');

    await render(hbs`<DirTable
      @items={{this.items}}
      @searchQuery={{this.searchQuery}}
      @sortBy={{this.sortBy}}
      @sortDir={{this.sortDir}}
    />`);

    let th = findAll('th');

    assert.deepEqual(
      th.map((elm) => elm.className.includes('is-sortable')),
      [true, false, true, true],
      'Only title, owner and last update columns are sortable'
    );

    assert.deepEqual(
      th.map((elm) => {
        let i = elm.querySelector('i');
        return i ? i.className.includes('desc') : false;
      }),
      [false, false, false, true],
      'Last update column is sorted'
    );

    set(this, 'sortBy', null);
    await render(hbs`<DirTable
      @items={{this.items}}
      @searchQuery={{this.searchQuery}}
      @sortBy={{this.sortBy}}
    />`);

    assert.equal(
      findAll('th').filter((elm) => {
        let i = elm.querySelector('i');
        return i ? i.className.includes('is-sorted') : false;
      }).length,
      0,
      'No column is sorted if sortBy is null'
    );
  });

  test('onColumnClick action is called on column click', async function (assert) {
    assert.expect(4);

    set(this, 'items', []);
    set(this, 'searchQuery', '');

    // sorting an ascending column

    set(this, 'sortBy', 'owner');
    set(this, 'sortDir', 'asc');
    set(this, 'onColumnClick', (sort) => {
      assert.deepEqual(
        sort,
        { sortBy: 'owner', sortDir: 'desc' },
        'onColumnClick is called with desc when clicking an ascending-sorted column'
      );
    });

    await render(hbs`<DirTable
      @items={{this.items}}
      @searchQuery={{this.searchQuery}}
      @sortBy={{this.sortBy}}
      @sortDir={{this.sortDir}}
      @onColumnClick={{this.onColumnClick}}
    />`);

    await click('th:nth-child(3)');

    // sorting a descending column

    set(this, 'sortDir', 'desc');
    set(this, 'onColumnClick', (sort) => {
      assert.deepEqual(
        sort,
        { sortBy: 'owner', sortDir: 'asc' },
        'onColumnClick is called with asc when clicking a descending-sorted column'
      );
    });

    await render(hbs`<DirTable
      @items={{this.items}}
      @searchQuery={{this.searchQuery}}
      @sortBy={{this.sortBy}}
      @sortDir={{this.sortDir}}
      @onColumnClick={{this.onColumnClick}}
    />`);

    await click('th:nth-child(3)');

    // sorting an unsorted column with sortDescFirst=undefined

    set(this, 'sortBy', 'title');
    set(this, 'onColumnClick', (sort) => {
      assert.deepEqual(
        sort,
        { sortBy: 'owner', sortDir: 'asc' },
        'onColumnClick is called with asc when clicking an unsorted column with sortDescFirst=undefined'
      );
    });

    await render(hbs`<DirTable
      @items={{this.items}}
      @searchQuery={{this.searchQuery}}
      @sortBy={{this.sortBy}}
      @onColumnClick={{this.onColumnClick}}
    />`);

    await click('th:nth-child(3)');

    // sorting an unsorted column with sortDescFirst=true

    set(this, 'onColumnClick', (sort) => {
      assert.deepEqual(
        sort,
        { sortBy: 'updatedOn', sortDir: 'desc' },
        'onColumnClick is called with desc when clicking an unsorted column with sortDescFirst=true'
      );
    });

    await render(hbs`<DirTable
      @items={{this.items}}
      @searchQuery={{this.searchQuery}}
      @sortBy={{this.sortBy}}
      @onColumnClick={{this.onColumnClick}}
    />`);

    await click('th:nth-child(4)');
  });

  test('search results messaging', async function (assert) {
    assert.expect(2);

    set(this, 'items', []);
    set(this, 'searchQuery', '');

    await render(hbs`<DirTable
      @items={{this.items}}
      @searchQuery={{this.searchQuery}}
    />`);

    assert
      .dom('.lt-body')
      .hasText(
        'Nothing Here Yet There currently is not anything in this collection. New Report New Dashboard',
        "Gives the correct message when no items are present and there's no search query"
      );

    set(this, 'searchQuery', 'invalidQuery');

    await render(hbs`<DirTable
      @items={{this.items}}
      @searchQuery={{this.searchQuery}}
    />`);

    assert
      .dom('.dir-empty-search')
      .hasText(
        'No Match Found There are not any files that match invalidQuery.',
        'Gives the correct message when no items are present and there is a search query'
      );
  });

  test('table loader', async function (assert) {
    assert.expect(2);

    set(this, 'isLoading', true);

    await render(hbs`<DirTable
      @items={{this.items}}
      @isLoading={{this.isLoading}}
    />`);

    assert.dom('.loader').exists('The loader is rendered when `isLoading` property is true');

    set(this, 'isLoading', false);

    await render(hbs`<DirTable
      @items={{this.items}}
      @isLoading={{this.isLoading}}
    />`);

    assert.dom('.loader').doesNotExist('The loader is not rendered when `isLoading` property is false');
  });
});
