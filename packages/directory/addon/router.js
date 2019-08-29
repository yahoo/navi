/**
 * Copyright 2019, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
export function directoryRoutes(router, nestedRoutes = () => null) {
  router.route('directory', function() {
    this.route('my-data');
    nestedRoutes.apply(this);
  });
}
