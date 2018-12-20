/**
 * Copyright 2017, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * Description: Navi Modal Component
 *
 * Usage:
 * {{#navi-modal
 *     isShown=isShown
 *     as |modalContainer|}}
 *         {{element-to-display}}
 * {{/navi-modal}}
 */

import Ember from 'ember';
import layout from '../templates/components/navi-modal';

const { set } = Ember;

export default Ember.Component.extend({
  layout,

  /**
   * @property {Boolean} isShown - if Modal should be shown
   */
  isShown: false,

  actions: {
    /**
     * Set the isShown to false in order to close the modal.
     */
    closeModal() {
      set(this, 'isShown', false);
      if (this.get('onClose')) {
        this.sendAction('onClose');
      }
    }
  }
});
