/**
 * Copyright 2021, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import CARDINALITY_SIZES from 'navi-data/utils/enums/cardinality-sizes';
import DimensionMetadataModel, { DimensionMetadataPayload } from '../dimension';

export type ValueSourceType = 'ENUM' | 'TABLE' | 'NONE';

export interface ElideDimensionMetadataPayload extends DimensionMetadataPayload {
  valueSourceType: ValueSourceType;
  values: string[];
}

export default class ElideDimensionMetadataModel extends DimensionMetadataModel {
  constructor(owner: unknown, args: ElideDimensionMetadataPayload) {
    super(owner, args);
    if (this.hasEnumValues && this.cardinality === undefined) {
      this.cardinality = CARDINALITY_SIZES[0];
    }
  }

  declare valueSourceType: ValueSourceType;
  declare values: string[];

  get valueSource(): ElideDimensionMetadataModel {
    if ('TABLE' === this.valueSourceType) {
      const id = this.tableSource?.valueSource || '';
      const column = this.naviMetadata.getById('dimension', id, this.source) as ElideDimensionMetadataModel | undefined;
      return column || this;
    }
    return this;
  }

  get hasEnumValues(): boolean {
    return 'ENUM' === this.valueSourceType;
  }
}
