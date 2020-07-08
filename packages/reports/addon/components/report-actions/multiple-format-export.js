/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * Usage:
 *   <ReportActions::MultipleFormatExport @report={{report}}>
 *      Inner template
 *   </ReportActions::MultipleFormatExport>
 */

import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { computed, action } from '@ember/object';
import layout from '../../templates/components/report-actions/multiple-format-export';
import { layout as templateLayout, tagName } from '@ember-decorators/component';

@templateLayout(layout)
@tagName('')
export default class MultipleFormatExport extends Component {
  /**
   * @property {Service} facts - instance of navi facts service
   */
  @service('navi-facts') facts;

  /**
   * @property {Service} compression
   */
  @service compression;

  /**
   * @property {Service} store
   */
  @service store;

  /**
   * @property {Service} naviNotifications
   */
  @service naviNotifications;

  /**
   * @property {String} csvHref - CSV download link for the report
   */
  @computed('report.{request,validations.isTruelyValid}')
  get csvHref() {
    let request = this.report.request.serialize();
    return this.facts.getURL(request, { format: 'csv', dataSourceName: request.dataSource });
  }

  /**
   * @property {Promise} pdfHref - Promise resolving to pdf download link
   */
  @computed('report.{request,visualization,validations.isTruelyValid}')
  get pdfHref() {
    const { report, compression, store } = this;
    let modelWithId = report;

    /*
     * Model compression requires an id, so if the report doesn't have one,
     * create a copy using the tempId as the id
     */
    if (!report.id) {
      modelWithId = store.createRecord('report', report.clone());
      modelWithId.set('id', modelWithId.tempId);
    }

    return compression.compressModel(modelWithId).then(serializedModel => `/export?reportModel=${serializedModel}`);
  }

  /**
   * @property {Array} exportFormats - A list of export formats
   */
  @computed('csvHref', 'pdfHref')
  get exportFormats() {
    return [
      {
        type: 'CSV',
        href: this.csvHref,
        icon: 'file-text-o'
      },
      {
        type: 'PDF',
        href: this.pdfHref,
        icon: 'file-pdf-o'
      }
    ];
  }

  /**
   * @action open
   * A hack to make the trigger responding to click
   */
  @action
  open() {
    return true;
  }

  /**
   * @action close
   */
  @action
  close(dropdown) {
    dropdown.actions.close();
  }

  /**
   * Lets the user know to wait for the export download
   * @action notify
   * @param {String} type - user readable name for the selected export option
   */
  @action
  notify(type) {
    this.naviNotifications.add({
      message: `${type}? Got it. The download should begin soon.`,
      type: 'info',
      timeout: 'medium'
    });
  }
}
