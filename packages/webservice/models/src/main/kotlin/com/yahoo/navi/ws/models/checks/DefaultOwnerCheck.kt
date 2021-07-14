/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
package com.yahoo.navi.ws.models.checks

import com.yahoo.elide.core.Path
import com.yahoo.elide.core.filter.Operator
import com.yahoo.elide.core.filter.predicates.FilterPredicate
import com.yahoo.elide.core.security.RequestScope
import com.yahoo.elide.core.security.checks.FilterExpressionCheck
import com.yahoo.elide.core.type.ClassType
import com.yahoo.elide.core.type.ClassType.STRING_TYPE
import com.yahoo.elide.core.type.Type
import com.yahoo.navi.ws.models.beans.HasOwner
import com.yahoo.navi.ws.models.beans.User

open class DefaultOwnerCheck : FilterExpressionCheck<HasOwner>() {
    companion object {
        const val IS_OWNER = "is owner"
    }
    override fun getFilterExpression(entityClass: Type<*>, requestScope: RequestScope): FilterPredicate {
        val userClassType = ClassType.of(User::class.java)
        val hasAuthorPath = Path.PathElement(entityClass, userClassType, "owner")
        val userPath = Path.PathElement(userClassType, STRING_TYPE, "id")
        val path = Path(listOf(hasAuthorPath, userPath))
        val value = listOf(requestScope.user.name)
        return FilterPredicate(path, Operator.IN, value)
    }
}
