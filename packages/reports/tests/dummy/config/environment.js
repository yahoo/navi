'use strict';

module.exports = function(environment) {
  let ENV = {
    modulePrefix: 'dummy',
    environment,
    rootURL: '/',
    locationType: 'auto',
    EmberENV: {
      FEATURES: {
        /*
         * Here you can enable experimental features on an ember canary build
         * e.g. 'with-controller': true
         */
      },
      EXTEND_PROTOTYPES: {
        // Prevent Ember Data from overriding Date.parse.
        Date: false
      }
    },

    APP: {
      /*
       * Here you can pass flags/options to your application instance
       * when it is created
       */
    },

    'ember-cli-mirage': {
      enabled: true //Set to false to disable api stub
    },

    navi: {
      user: 'navi_user',
      defaultTimeGrain: 'day',
      defaultDataTable: 'network',
      dataSources: [
        { name: 'bardOne', uri: 'https://data.naviapp.io', type: 'bard' },
        { name: 'bardTwo', uri: 'https://data2.naviapp.io', type: 'bard' },
        { name: 'elideOne', uri: 'https://data.naviapp.io/graphql', type: 'elide' },
        { name: 'elideTwo', uri: 'https://data2.naviapp.com/graphql', type: 'elide' }
      ],
      appPersistence: {
        type: 'webservice',
        uri: 'https://persistence.naviapp.io',
        timeout: 90000
      },
      FEATURES: {
        enableScheduleReports: true,
        exportFileTypes: [],
        enabledNotifyIfData: true,
        enableContains: true,
        enableTableEditing: true,
        enableTotals: true
      }
    }
  };

  if (environment === 'development') {
    /*
     * ENV.APP.LOG_RESOLVER = true;
     * ENV.APP.LOG_ACTIVE_GENERATION = true;
     * ENV.APP.LOG_TRANSITIONS = true;
     * ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
     * ENV.APP.LOG_VIEW_LOOKUPS = true;
     */
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;
  }

  if (environment === 'production') {
    // production settings
  }

  return ENV;
};
