/**
 * Copyright 2019, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * Usage:
 *   {{filter-values/null-input
 *       filter=filter
 *       onUpdateFilter=(action 'update')
 *   }}
 */
import Component from '@ember/component';
import { get } from '@ember/object';
import { isEqual } from 'lodash-es';

export default Component.extend({
  tagName: '',

  /**
   * @method didInsertElement
   * @override
   */
  didInsertElement() {
    this._super(...arguments);

    const { isCollapsed, onUpdateFilter } = this;

    /*
     * Since this operator doesn't require values, pass empty string
     * here empty string denoted as "" is the same as 'null' in druid
     */
    if (!isCollapsed && onUpdateFilter && !isEqual(get(this, 'filter.values'), ['""'])) {
      onUpdateFilter({
        values: ['""']
      });
    }
  }
});
