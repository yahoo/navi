import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { keepLatestTask } from 'ember-concurrency-decorators';

export default class NaviSearchBarComponent extends Component {
  @service('navi-search-provider') searchProviderService;

  @tracked searchQuery = '';
  @tracked searchResults = [];
  @tracked hasFocus = false;

  emptyResult = [
    {
      title: '',
      component: 'navi-search-result/no-result'
    }
  ];

  @action
  search(dd, event) {
    if (this.searchQuery.length == 0 || event.code === 'Escape') {
      dd.actions.close(event);
      return;
    }

    if ((event.code === 'Enter' && this.searchQuery.length != 0) || this.searchQuery.length > 2) {
      this.launchQuery.perform(this.searchQuery, dd);
    }
  }

  @action
  focus(dd, event) {
    if (this.searchQuery != '') {
      dd.actions.open(event);
    }
  }

  @keepLatestTask
  *launchQuery(query, dd) {
    dd.actions.open(event);
    this.searchResults = yield this.searchProviderService.search.perform(query);
    if (this.searchResults.length == 0 && query != '') {
      this.searchResults = this.emptyResult;
    }
  }
}
