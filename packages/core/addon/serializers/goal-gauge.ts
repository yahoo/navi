/**
 * Copyright 2021, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import VisualizationSerializer from 'navi-core/serializers/visualization';
import { assert } from '@ember/debug';
import type { GoalGaugeConfig } from 'navi-core/models/goal-gauge';
import type { RequestV2 } from 'navi-data/adapters/facts/interface';

export type LegacyGoalGaugeConfig = {
  type: 'goal-gauge';
  version: 1;
  metadata: {
    goalValue: string | number;
    baselineValue: string | number;
    metric: unknown;
  };
};

export function normalizeGoalGaugeV2(
  request: RequestV2,
  visualization?: LegacyGoalGaugeConfig | GoalGaugeConfig
): GoalGaugeConfig {
  if (visualization?.version === 2) {
    return visualization;
  }

  // Take the first metric column since there should be exactly one
  const metricColumn = request.columns.find((c) => c.type === 'metric');
  if (metricColumn === undefined || metricColumn.cid === undefined) {
    throw new Error('There should be exactly one metric column in the request with a cid');
  }

  assert('visualization should be defined', visualization);
  return {
    type: 'goal-gauge',
    version: 2,
    metadata: {
      baselineValue: Number(visualization.metadata.baselineValue),
      goalValue: Number(visualization.metadata.goalValue),
      metricCid: metricColumn.cid,
    },
  };
}

export default class GoalGaugeSerializer extends VisualizationSerializer {}

// DO NOT DELETE: this is how TypeScript knows how to look up your models.
declare module 'ember-data/types/registries/serializer' {
  export default interface SerializerRegistry {
    'goal-gauge': GoalGaugeSerializer;
  }
}
