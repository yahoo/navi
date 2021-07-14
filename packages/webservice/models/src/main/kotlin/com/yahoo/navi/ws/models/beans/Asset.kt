/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
package com.yahoo.navi.ws.models.beans

import com.yahoo.elide.annotation.Exclude
import com.yahoo.elide.annotation.Include
import com.yahoo.elide.annotation.UpdatePermission
import com.yahoo.navi.ws.models.checks.DefaultNobodyCheck.Companion.NOBODY
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import java.util.Date
import javax.persistence.Column
import javax.persistence.DiscriminatorColumn
import javax.persistence.Entity
import javax.persistence.GeneratedValue
import javax.persistence.GenerationType
import javax.persistence.Id
import javax.persistence.Inheritance
import javax.persistence.InheritanceType
import javax.persistence.JoinColumn
import javax.persistence.ManyToOne
import javax.persistence.Temporal
import javax.persistence.TemporalType

@Entity
@Include
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "ASSET_TYPE")
abstract class Asset : HasOwner {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Int = 0

    var title: String? = null

    @JoinColumn(name = "owner")
    @ManyToOne
    override var owner: User? = null

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

    @Exclude
    @Column(name = "ASSET_TYPE", insertable = false, updatable = false)
    var assetType: String? = null
}
