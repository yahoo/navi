/**
 * Copyright 2019, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 */
import Helper from '@ember/component/helper';
import { get } from '@ember/object';
import { inject as service } from '@ember/service';
import { metricFormat } from 'navi-data/helpers/metric-format';
import { mapColumnAttributes } from 'navi-data/utils/metric';
import { formatDimensionName } from 'navi-data/utils/dimension';

/**
 * Get column default display name
 *
 * @method chartToolTipFormat
 * @param {Object} column - table column object
 * @param {Object} bardMetadata - bard metadata service
 * @return {String} - default display name
 */
export function getColumnDefaultName({ type, attributes }, bardMetadata) {
  if (type === 'dateTime') {
    return 'Date';
  }

  if (type === 'threshold') {
    type = 'metric';
  }

  let { name, field } = attributes,
    model = bardMetadata.getById(type, name);

  if (type === 'metric') {
    return metricFormat(mapColumnAttributes(attributes), model.longName);
  }

  if (type === 'dimension' && field) {
    return formatDimensionName({
      name: model.longName,
      field
    });
  }

  return model.longName;
}

export default Helper.extend({
  bardMetadata: service(),

  compute([column]) {
    return getColumnDefaultName(column, get(this, 'bardMetadata'));
  }
});
