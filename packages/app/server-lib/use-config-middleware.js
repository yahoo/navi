/**
  * Copyright 2017, Yahoo Holdings Inc.
  * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
  */
/* eslint-env node */
module.exports = function(app) {
  const { loadEnvironmentSettings, getUser } = require('./utils.js');
  const packageJson = require('../package.json');

  app.use('/assets/server-generated-config.js', function (req, res, /*next*/) {
    res.header('Content-Type', 'application/javascript');
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    const settings = loadEnvironmentSettings(req.headers.host, './config/environments.json') || {};

    //override getUser() with your own current user function
    settings.user = getUser();

    const NAVI_APP = {};

    const features = settings.FEATURES;
    delete(settings.FEATURES);

    NAVI_APP.version = packageJson.version;
    NAVI_APP.appSettings = settings || {};
    NAVI_APP.FEATURES = features || {};

    res.send('window.NAVI_APP = ' + JSON.stringify(NAVI_APP) + ';');
  });
};
