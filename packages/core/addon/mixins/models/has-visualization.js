/**
 * Copyright 2017, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */

import Ember from 'ember';
import MF from 'model-fragments';

const { get, set } = Ember;

export default Ember.Mixin.create({
  visualization: MF.fragment('visualization', { polymorphic: true }),

  /**
   * Caches the persisted visualization type
   *
   * @method _cachePersistedVisualization
   * @private
   */
  _cachePersistedVisualization: Ember.on('didCreate', 'didUpdate', 'didLoad', function() {
    set(this, '_persistedVisualization', get(this, 'visualization'));
  }),

  /**
   * Removes any local modifications
   *
   * @method rollbackAttributes
   * @override
   */
  rollbackAttributes() {
    /*
     *Note: Due to issues with rolling back polymorphic fragments,
     *set the persisted visualization, then rollback
     */
    let persistedVisualization = get(this, '_persistedVisualization');
    if (persistedVisualization) {
      set(this, 'visualization', persistedVisualization);
    }

    this._super();
  }
});
