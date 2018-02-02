/**
 * Copyright 2017, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import DS from "ember-data";

export default DS.JSONSerializer.extend({

  /**
   * @property {Object} attrs - deserialized to serialized name transforms & vise versa
   */
  attrs: {
    rawValues: 'values'
  }
});
