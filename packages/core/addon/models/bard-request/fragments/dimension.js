/**
 * Copyright 2018, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */

import DS from 'ember-data';
import Fragment from 'ember-data-model-fragments/fragment';
import { validator, buildValidations } from 'ember-cp-validations';
import { Copyable } from 'ember-copy';

const Validations = buildValidations({
  dimension: validator('presence', {
    presence: true,
    message: 'The dimension field cannot be empty'
  })
});

export default Fragment.extend(Validations, Copyable, {
  dimension: DS.attr('dimension'),
  copy() {
    return this.store.createFragment('bard-request/fragments/dimension', {
      dimension: this.dimension
    });
  }
});
