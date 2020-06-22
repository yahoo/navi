/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
package com.yahoo.navi.ws.models.beans

import com.yahoo.elide.annotation.CreatePermission
import com.yahoo.elide.annotation.DeletePermission
import com.yahoo.elide.annotation.Include
import com.yahoo.elide.annotation.UpdatePermission
import com.yahoo.navi.ws.models.checks.DefaultDashboardAuthorCheck.Companion.IS_DASHBOARD_AUTHOR
import com.yahoo.navi.ws.models.checks.DefaultNobodyCheck.Companion.NOBODY
import com.yahoo.navi.ws.models.checks.DefaultSameUserCheck.Companion.IS_SAME_USER
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import org.hibernate.annotations.Where
import java.util.Date
import javax.persistence.Column
import javax.persistence.Entity
import javax.persistence.Id
import javax.persistence.JoinColumn
import javax.persistence.JoinTable
import javax.persistence.ManyToMany
import javax.persistence.OneToMany
import javax.persistence.Temporal
import javax.persistence.TemporalType
import javax.validation.constraints.NotBlank

@Entity
@Include(rootLevel = true, type = "users")
@DeletePermission(expression = NOBODY)
@CreatePermission(expression = IS_SAME_USER)
@UpdatePermission(expression = IS_SAME_USER)
class User : HasRoles {

    @Id
    @NotBlank
    var id: String? = null

    @CreationTimestamp
    @Column(columnDefinition = "timestamp default current_timestamp")
    @Temporal(TemporalType.TIMESTAMP)
    @UpdatePermission(expression = NOBODY)
    var createdOn: Date? = null

    @UpdateTimestamp
    @Column(columnDefinition = "timestamp default current_timestamp")
    @Temporal(TemporalType.TIMESTAMP)
    @UpdatePermission(expression = NOBODY)
    var updatedOn: Date? = null

    @OneToMany(mappedBy = "author", targetEntity = Asset::class)
    @Where(clause = "ASSET_TYPE = 'Report'")
    var reports: MutableSet<Report> = mutableSetOf()

    @ManyToMany
    @JoinTable(
        name = "map_user_to_fav_reports",
        joinColumns = [JoinColumn(name = "user_id", referencedColumnName = "id")],
        inverseJoinColumns = [JoinColumn(name = "report_id", referencedColumnName = "id")]
    )
    var favoriteReports: MutableSet<Report> = mutableSetOf()

    @OneToMany(mappedBy = "author", targetEntity = Asset::class)
    @Where(clause = "ASSET_TYPE = 'Dashboard'")
    var dashboards: MutableSet<Dashboard> = mutableSetOf()

    @UpdatePermission(expression = IS_DASHBOARD_AUTHOR)
    @ManyToMany
    @JoinTable(
        name = "map_editor_to_dashboard_collections",
        joinColumns = [JoinColumn(name = "user_id", referencedColumnName = "id")],
        inverseJoinColumns = [JoinColumn(name = "dashboard_collection_id", referencedColumnName = "id")]
    )
    var editingDashboards: MutableSet<Dashboard> = mutableSetOf()

    @ManyToMany
    @JoinTable(
        name = "map_user_to_fav_dashboards",
        joinColumns = [JoinColumn(name = "user_id", referencedColumnName = "id")],
        inverseJoinColumns = [JoinColumn(name = "dashboard_id", referencedColumnName = "id")]
    )
    var favoriteDashboards: MutableSet<Dashboard> = mutableSetOf()

    @OneToMany
    override var roles: MutableSet<Role> = mutableSetOf()
}
