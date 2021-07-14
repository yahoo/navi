/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
package com.yahoo.navi.ws.models.checks

import com.yahoo.elide.core.security.ChangeSpec
import com.yahoo.elide.core.security.RequestScope
import com.yahoo.elide.core.security.checks.OperationCheck
import com.yahoo.navi.ws.models.beans.HasOwner
import com.yahoo.navi.ws.models.beans.User
import java.util.Optional

open class DefaultDashboardOwnerCheck : OperationCheck<User>() {
    companion object {
        const val IS_DASHBOARD_OWNER = "is dashboard owner"
    }

    override fun ok(record: User, requestScope: RequestScope, changeSpec: Optional<ChangeSpec>): Boolean {
        val userId = requestScope.user.name

        if (!changeSpec.isPresent) {
            val recordId = record.id
            return recordId == userId
        }

        val modified: Any? = changeSpec.get().modified
        val original: Any? = changeSpec.get().original

        if (modified is Collection<*> && original is Collection<*> &&
            modified.all { it is HasOwner } && original.all { it is HasOwner }
        ) {
            val records: List<HasOwner> = modified.subtract(original).map { it as HasOwner }
            return records.all { asset -> asset.owner!!.id == userId }
        }
        return false
    }
}
