/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
package com.yahoo.navi.ws.models.beans

import com.yahoo.elide.annotation.CreatePermission
import com.yahoo.elide.annotation.DeletePermission
import com.yahoo.elide.annotation.Include
import com.yahoo.elide.annotation.UpdatePermission
import com.yahoo.navi.ws.models.beans.fragments.DashboardPresentation
import com.yahoo.navi.ws.models.beans.fragments.request.Filter
import com.yahoo.navi.ws.models.checks.DefaultEditorsCheck.Companion.IS_EDITOR
import com.yahoo.navi.ws.models.checks.DefaultOwnerCheck.Companion.IS_OWNER
import org.hibernate.annotations.Parameter
import org.hibernate.annotations.Type
import javax.persistence.CascadeType
import javax.persistence.Column
import javax.persistence.DiscriminatorValue
import javax.persistence.Entity
import javax.persistence.ManyToMany
import javax.persistence.OneToMany

@Entity
@Include(name = "dashboards")
@DiscriminatorValue("dashboard")
@CreatePermission(expression = IS_OWNER)
@UpdatePermission(expression = "$IS_OWNER OR $IS_EDITOR")
@DeletePermission(expression = IS_OWNER)
class Dashboard : Asset(), HasOwner, HasEditors {

    @ManyToMany(mappedBy = "editingDashboards")
    override var editors: MutableSet<User> = mutableSetOf()

    @Column(name = "presentation", columnDefinition = "MEDIUMTEXT")
    @Type(
        type = "com.yahoo.navi.ws.models.types.JsonType",
        parameters = [
            Parameter(name = "class", value = "com.yahoo.navi.ws.models.beans.fragments.DashboardPresentation")
        ]
    )
    var presentation: DashboardPresentation? = null

    @OneToMany(mappedBy = "dashboard", cascade = [CascadeType.REMOVE], orphanRemoval = true)
    var widgets: MutableSet<DashboardWidget> = mutableSetOf()

    @Column(name = "filters", columnDefinition = "MEDIUMTEXT")
    @Type(
        type = "com.yahoo.navi.ws.models.types.JsonType",
        parameters = [
            Parameter(name = "class", value = "java.util.Set")
        ]
    )
    var filters: MutableSet<Filter> = mutableSetOf()
}
