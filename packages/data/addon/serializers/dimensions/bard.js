/**
 * Copyright 2017, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * Description: A serializer for the bard dimensions
 */

import EmberObject from '@ember/object';

export default class BardDimensionSerializer extends EmberObject {
  /**
   * @method normalize - normalizes the JSON response
   * @param dimensionName {String} - name of the dimension
   * @param payload {Object} - JSON payload
   * @returns {Object} - normalized JSON object
   */
  normalize(dimensionName, payload = {}) {
    return payload.rows;
  }
}
