/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * Usage:
 *   <FilterValues::LookbackInput
 *       @filter={{filter}}
 *       @request={{request}}
 *       @onUpdateFilter={{action "update"}}
 *   />
 */
import BaseIntervalComponent from './base-interval-component';
import { layout as templateLayout, tagName } from '@ember-decorators/component';
import layout from '../../templates/components/filter-values/lookback-input';
import { computed, get, action } from '@ember/object';
import Duration from 'navi-core/utils/classes/duration';
import { isEmpty } from '@ember/utils';

@templateLayout(layout)
@tagName('')
class LookbackInput extends BaseIntervalComponent {
  /**
   * @property {Number} lookback - The number of `dateTimePeriod`s to look back by
   */
  @computed('interval', 'dateTimePeriod')
  get lookback() {
    const duration = get(this.interval, '_start');
    const lookback = duration.getValue();
    if (this.dateTimePeriod === 'quarter') {
      return lookback / 3;
    }
    return lookback;
  }

  /**
   * Build the relative interval string
   * @param {Number} amount - the number to look back
   * @param {String} dateTimePeriod - the time grain size to look back by
   * @returns {Duration}
   */
  lookbackToDuration(amount, dateTimePeriod) {
    if (dateTimePeriod === 'quarter') {
      amount = amount * 3;
      dateTimePeriod = 'month';
    }
    return new Duration(`P${amount}${dateTimePeriod[0].toUpperCase()}`);
  }

  /**
   * @action setInterval
   * @param {Interval} interval - new interval to set in filter
   */
  @action
  setLookback(interval) {
    if (isEmpty(interval) || Number(interval) < 1) {
      return;
    }
    const lookbackDuration = this.lookbackToDuration(interval, this.dateTimePeriod);
    this.setInterval(lookbackDuration, 'current');
  }
}

export default LookbackInput;
