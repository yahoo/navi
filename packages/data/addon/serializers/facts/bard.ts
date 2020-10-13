/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * Description: A serializer for the bard response
 */

import EmberObject from '@ember/object';
import NaviFactSerializer, { ResponseV1 } from './interface';
import { RequestV2, Column } from 'navi-data/adapters/facts/interface';
import { canonicalizeMetric } from 'navi-data/utils/metric';
import NaviFactResponse from 'navi-data/models/navi-fact-response';

export default class BardFactsSerializer extends EmberObject implements NaviFactSerializer {
  /**
   * Converts a column to the expected webservice name (e.g. `dimensionName(field=desc)` -> `dimensionName|desc`)
   * @param column - the requested column whose webservice name we need to find
   */
  private getFiliField(column: Column): string {
    switch (column.type) {
      case 'metric':
        return canonicalizeMetric({ metric: column.field, parameters: column.parameters });
      case 'timeDimension':
        if (column.field.endsWith('.dateTime')) {
          return 'dateTime';
        }
        return `${column.field}|${column.parameters.field}`;
      case 'dimension':
        return `${column.field}|${column.parameters.field}`;
    }
  }

  /**
   * @param payload - raw payload string
   * @param request - request v2 object
   */
  private processResponse(payload: ResponseV1, request: RequestV2): NaviFactResponse {
    const filiFields = request.columns.map(column => this.getFiliField(column));
    const normalizedFields = request.columns.map(({ field: metric, parameters }) =>
      // TODO rename with generic canonicalizeColumn
      canonicalizeMetric({ metric, parameters })
    );

    const { rows: rawRows, meta } = payload;
    const totalRows = rawRows.length;
    const totalFields = normalizedFields.length;
    const rows = new Array(totalRows);

    let r = totalRows;
    while (r--) {
      const rawRow = rawRows[r];
      const newRow: Record<string, unknown> = (rows[r] = {});
      let f = totalFields;
      while (f--) {
        newRow[normalizedFields[f]] = rawRow[filiFields[f]];
      }
    }

    return NaviFactResponse.create({ rows, meta });
  }

  normalize(payload: ResponseV1, request: RequestV2): NaviFactResponse | undefined {
    return payload ? this.processResponse(payload, request) : undefined;
  }
}
