import config from 'ember-get-config';

export const Host = config.navi.dataSources[0].uri;

export const MetricOne = {
  category: 'category',
  name: 'metricOne',
  longName: 'Metric One',
  description: 'This is Metric One'
};

export const MetricTwo = {
  category: 'category',
  name: 'metricTwo',
  longName: 'Metric Two',
  description: 'This is Metric Two'
};

export const MetricThree = {
  category: 'category',
  name: 'metricThree',
  longName: 'Metric Three',
  description: 'This is Metric Three'
};

export const MetricFour = {
  category: 'category',
  name: 'metricFour',
  longName: 'Metric Four',
  description: 'This is Metric Four'
};

export const PageViews = {
  category: 'pageMetrics',
  id: 'pageViews',
  name: 'Page Views',
  description: 'Views of a page',
  cardinality: 100
};

export const MetricFive = {
  category: 'currencyMetrics',
  name: 'metricFive',
  longName: 'Metric Five',
  metricFunctionId: 'moneyMetric'
};

export const MetricSix = {
  category: 'currencyMetrics',
  name: 'metricSix',
  longName: 'Metric Six',
  parameters: {
    currency: {
      defaultValue: 'USD',
      type: 'dimension',
      dimensionName: 'displayCurrency'
    }
  }
};

export const DimensionOne = {
  category: 'categoryOne',
  name: 'dimensionOne',
  longName: 'Dimension One',
  description: 'This is Dimension One',
  cardinality: 60
  //No Fields
};

export const DimensionTwo = {
  category: 'categoryTwo',
  name: 'dimensionTwo',
  longName: 'Dimension Two',
  description: 'This is Dimension Two',
  cardinality: 6000000000,
  fields: [
    {
      name: 'key',
      description: 'description',
      tags: ['primaryKey', 'display']
    },
    {
      name: 'description',
      description: 'description',
      tags: ['description', 'display']
    }
  ]
};

export const DimensionThree = {
  category: 'categoryTwo',
  name: 'dimensionThree',
  longName: 'Dimension Three',
  description: 'This is Dimension Three',
  cardinality: 700,
  fields: [
    {
      name: 'id',
      description: 'description',
      tags: ['primaryKey', 'display']
    },
    {
      name: 'description',
      description: 'description',
      tags: ['description', 'display']
    }
  ]
};

export const DimensionFour = {
  category: 'categoryTwo',
  name: 'dimensionFour',
  longName: 'Dimension Four',
  description: 'This is Dimension Four',
  cardinality: 70,
  fields: [
    {
      name: 'id',
      description: 'description',
      tags: ['primaryKey', 'display']
    },
    {
      name: 'description',
      description: 'description',
      tags: ['description', 'display']
    }
  ]
};

export const DimensionFive = {
  category: 'categoryTwo',
  name: 'dimensionFive',
  longName: 'Dimension Five',
  description: 'This is Dimension Five',
  cardinality: 6000000000,
  fields: [
    {
      name: 'id',
      description: 'description',
      tags: ['primaryKey', 'display']
    },
    {
      name: 'description',
      description: 'description',
      tags: ['description', 'display']
    }
  ]
};

export const TableOne = {
  description: 'Table1 Description',
  longName: 'table1LongName',
  name: 'table1',
  category: 'General',
  timeGrains: [
    {
      description: 'The table1 day grain',
      dimensionIds: ['dimensionOne', 'dimensionThree'],
      longName: 'Day',
      metricIds: ['metricOne'],
      name: 'day',
      retention: 'P24M'
    }
  ]
};

export const TableTwo = {
  description: 'Table2 Description',
  longName: 'table2LongName',
  name: 'table2',
  category: 'General',
  timeGrains: [
    {
      description: 'The table2 week grain',
      dimensionIds: ['dimensionTwo'],
      longName: 'Day',
      metricIds: ['metricTwo'],
      name: 'week',
      retention: 'P24M'
    }
  ]
};

export const Tables = [
  {
    name: 'table1',
    description: 'Table1 Description',
    longName: 'table1LongName',
    category: 'General',
    timeGrains: [
      {
        name: 'day',
        description: 'The table1 day grain',
        metrics: [MetricOne],
        retention: 'P24M',
        longName: 'Day',
        dimensions: [DimensionOne, DimensionThree]
      }
    ]
  },
  {
    name: 'table2',
    description: 'Table2 Description',
    longName: 'table2LongName',
    category: 'General',
    timeGrains: [
      {
        name: 'week',
        description: 'The table2 week grain',
        metrics: [MetricTwo],
        retention: 'P24M',
        longName: 'Day',
        dimensions: [DimensionTwo]
      }
    ]
  },
  {
    name: 'smallTable',
    description: 'Small table description',
    longName: 'Small Table',
    category: 'General',
    timeGrains: [
      {
        name: 'day',
        description: 'The table1 day grain',
        metrics: [MetricOne, MetricFive],
        retention: 'P24M',
        longName: 'Day',
        dimensions: [DimensionOne]
      }
    ]
  }
];

export const Tables2 = [
  {
    name: 'table3',
    description: 'Table3 Description',
    longName: 'table3DisplayName',
    category: 'General',
    timeGrains: [
      {
        name: 'day',
        description: 'The table3 day grain',
        metrics: [MetricThree],
        retention: 'P24M',
        longName: 'Day',
        dimensions: [DimensionFour, DimensionFive]
      }
    ]
  },
  {
    name: 'table4',
    description: 'Table4 Description',
    longName: 'table4DisplayName',
    category: 'General',
    timeGrains: [
      {
        name: 'week',
        description: 'The table4 week grain',
        metrics: [MetricFour],
        retention: 'P24M',
        longName: 'Day',
        dimensions: [DimensionFour, DimensionFive]
      }
    ]
  },
  {
    name: 'table5',
    description: 'Table5 Description',
    longName: 'table5DisplayName',
    category: 'General',
    timeGrains: [
      {
        name: 'week',
        description: 'The table4 week grain',
        metrics: [MetricFour],
        retention: 'P24M',
        longName: 'Day',
        dimensions: [DimensionFour]
      }
    ]
  }
];

export const MetricFunctionMoneyMetric = {
  id: 'moneyMetric',
  name: 'Money Metric',
  description: 'Money metric function',
  arguments: {
    currency: {
      defaultValue: 'USD',
      type: 'enum',
      values: [
        {
          description: 'US Dollars',
          id: 'USD'
        },
        {
          description: 'Euros',
          id: 'EUR'
        }
      ]
    }
  }
};

export const MetricFunctionAggTrend = {
  id: 'aggregationTrend',
  name: 'Aggregation Trend',
  description: 'Aggregation and Trend metric function',
  arguments: {
    aggregation: {
      defaultValue: '7DayAvg',
      values: [
        {
          id: '7DayAvg',
          description: '7 Day Average'
        },
        {
          id: '28DayAvg',
          description: '28 Day Average'
        }
      ],
      type: 'enum'
    },
    trend: {
      defaultValue: 'DO_D',
      values: [
        {
          id: 'DO_D',
          description: 'Day over Day'
        },
        {
          id: 'WO_W',
          description: 'Week over Week'
        }
      ]
    }
  }
};

const METRIC_MAP = {
  metricOne: MetricOne,
  metricTwo: MetricTwo,
  metricThree: MetricThree,
  metricFour: MetricFour,
  metricFive: MetricFive,
  metricSix: MetricSix,
  pageViews: PageViews
};

export default function(index = 0) {
  const host = config.navi.dataSources[index].uri;
  this.get(`${host}/v1/tables`, function() {
    return [200, { 'Content-Type': 'application/json' }, JSON.stringify({ tables: index > 0 ? Tables2 : Tables })];
  });

  this.get(`${host}/v1/metrics/:id`, function({ params: { id } }) {
    return [200, { 'Content-Type': 'application/json' }, JSON.stringify(METRIC_MAP[id])];
  });

  this.get(`${host}/v1/dimensions/dimensionOne`, function() {
    return [200, { 'Content-Type': 'application/json' }, JSON.stringify(DimensionOne)];
  });

  this.get(`${host}/v1/metricFunctions/moneyMetric`, function() {
    return [200, { 'Content-Type': 'application/json' }, JSON.stringify(MetricFunctionMoneyMetric)];
  });

  this.get(`${host}/v1/metricFunctions/aggregationTrend`, function() {
    return [200, { 'Content-Type': 'application/json' }, JSON.stringify(MetricFunctionAggTrend)];
  });

  this.get(`${host}/v1/metricFunctions/`, function() {
    return [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({ rows: [MetricFunctionMoneyMetric, MetricFunctionAggTrend] })
    ];
  });
}
