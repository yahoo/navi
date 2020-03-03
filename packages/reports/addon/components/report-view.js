/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * Usage:
 *  {{report-view
 *    report=report
 *    response=response
 *  }}
 */

import { readOnly } from '@ember/object/computed';
import { scheduleOnce } from '@ember/runloop';
import { capitalize } from '@ember/string';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { set, get, computed, action } from '@ember/object';
import layout from '../templates/components/report-view';
import { layout as templateLayout, classNames } from '@ember-decorators/component';
import { observes } from '@ember-decorators/object';
import move from 'ember-animated/motions/move';
import { easeOut, easeIn } from 'ember-animated/easings/cosine';
import { fadeOut, fadeIn } from 'ember-animated/motions/opacity';

const VISUALIZATION_RESIZE_EVENT = 'resizestop';

@templateLayout(layout)
@classNames('report-view') //Cannot be tagless because of the resize event needing an element value on this component
class ReportView extends Component {
  /**
   * Property representing any data useful for providing additional functionality to a visualization and request
   * Acts a hook to be extended by other navi addons
   * @property {Promise} annotationData
   */
  annotationData = undefined;

  /**
   * @property {Object} request
   */
  @readOnly('report.request')
  request;

  /**
   * @property {Service} naviVisualizations - navi visualizations service
   */
  @service('navi-visualizations')
  naviVisualizations;

  @service('store')
  store;

  /**
   * @property {Array} visualizations - array of available visualizations
   * annotated with a field corresponding to whether the visualization type is valid based on the request
   */
  @computed('response.rows')
  get validVisualizations() {
    return get(this, 'naviVisualizations').validVisualizations(get(this, 'report.request'));
  }

  /**
   * @property {String} visualizationTypeLabel - Display name of the visualization type
   */
  @computed('report.visualization.type')
  get visualizationTypeLabel() {
    return get(this, 'report.visualization.type')
      .split('-')
      .map(capitalize)
      .join(' ');
  }

  /**
   * @property {Boolean} isEditingVisualization - Display visualization config or not
   */
  isEditingVisualization = false;

  /**
   * @property {Boolean} hasMostRecentResponse - whether or not response matches the most recent version of report.request
   */
  hasMostRecentResponse = false;

  /**
   * @property {Boolean} showRequestPreview - true if request preview is selected, false otherwise
   */
  showRequestPreview = false;

  /**
   * @property {String} currentView - request-preview or the visualization type of the report
   */
  @computed('showRequestPreview', 'report.visualization.type')
  get currentView() {
    return this.showRequestPreview ? 'request-preview' : this.report.visualization.type;
  }

  /**
   * @property {Boolean} hasNoData - whether or not there is data to display
   */
  @computed('response.meta.pagination.numberOfResults')
  get hasNoData() {
    return get(this, 'response.meta.pagination.numberOfResults') === 0;
  }

  /**
   * @method didReceiveAttrs
   * @override
   */
  didReceiveAttrs() {
    super.didReceiveAttrs(...arguments);

    // Assume any new response is always the most recent
    set(this, 'hasMostRecentResponse', true);
  }

  /**
   * @method doResizeVisualization
   */
  doResizeVisualization() {
    if (this.element) {
      this.element.dispatchEvent(new Event(VISUALIZATION_RESIZE_EVENT));
    }
  }

  /**
   * Observer that resizes the visualization when the number of filters or collapsed state change
   * since the filter and visualization share the same vertical space
   *
   * @method filterCountOrCollapsedDidChange
   */
  @observes('isFiltersCollapsed', 'report.request.{filters.[],having.[],intervals.[]}')
  filterCountOrCollapsedDidChange() {
    scheduleOnce('afterRender', this, 'resizeVisualization');
  }

  /**
   * @action toggleEditVisualization
   */
  @action
  toggleEditVisualization() {
    this.toggleProperty('isEditingVisualization');
  }

  /**
   * @action resizeVisualization
   */
  @action
  resizeVisualization() {
    scheduleOnce('afterRender', this, 'doResizeVisualization');
  }

  /**
   * @action onVisualizationTypeUpdate
   * @param {String} type
   */
  @action
  onVisualizationTypeUpdate(type) {
    const {
      report,
      report: { request },
      response
    } = this;

    if (type === 'request-preview') {
      this.set('showRequestPreview', true);
      this.set('isEditingVisualization', false);
      return;
    }

    let newVisualization = this.store.createFragment(type, {
      _request: request //Provide request for validation
    });
    newVisualization.rebuildConfig(request, response);
    set(report, 'visualization', newVisualization);
    this.set('showRequestPreview', false);
  }

  /**
   * @property fadeTransition - fade transition
   */
  @action
  *fadeTransition({ removedSprites, insertedSprites }) {
    // fadeIn a little bit longer so we can see the fade after the drawer closes
    yield Promise.all(insertedSprites.map(s => fadeIn(s, { duration: 800 })));
    yield Promise.all(removedSprites.map(fadeOut));
  }

  /**
   * @param drawerTransition - drawer transition
   */
  @action
  *drawerTransition({ insertedSprites, removedSprites }) {
    const x = document.querySelector('.report-view__animation-container').getBoundingClientRect().right;
    yield Promise.all(
      insertedSprites.map(sprite => {
        sprite.startAtPixel({ x });
        sprite.applyStyles({ 'z-index': '1' });
        return move(sprite, { easing: easeOut });
      })
    );

    yield Promise.all(
      removedSprites.map(sprite => {
        sprite.applyStyles({ 'z-index': '1' });
        sprite.endAtPixel({ x });
        return move(sprite, { easing: easeIn });
      })
    );
    this.doResizeVisualization();
  }
}
export default ReportView;
