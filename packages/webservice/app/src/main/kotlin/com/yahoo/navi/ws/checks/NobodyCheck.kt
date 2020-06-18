/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
package com.yahoo.navi.ws.checks

import com.yahoo.elide.annotation.SecurityCheck
import com.yahoo.navi.ws.models.checks.DefaultNobodyCheck

@SecurityCheck(DefaultNobodyCheck.NOBODY)
class NobodyCheck : DefaultNobodyCheck()
