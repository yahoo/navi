/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
package com.yahoo.navi.ws.test.integration

import com.jayway.restassured.RestAssured.given
import com.yahoo.navi.ws.test.framework.IntegrationTest
import com.yahoo.navi.ws.test.framework.matchers.RegexMatcher
import org.apache.http.HttpStatus
import org.hamcrest.Matchers.contains
import org.hamcrest.Matchers.empty
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.hasItems
import org.hamcrest.Matchers.not
import org.hamcrest.Matchers.nullValue
import org.junit.jupiter.api.Test

class UserTest : IntegrationTest() {
    private val naviUser1 = "user1"
    private val naviUser2 = "user2"
    private val naviUser3 = "user3"
    private val adminRole = "admin"
    private val userRole = "user"

    @Test
    fun userEndpointTest() {

        /*
         * User endpoint is initially empty
         */
        given()
            .header("User", naviUser1)
            .When()
            .get("/users")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_OK)

            .body("data", empty<Any>())

        /*
         * New user can be added
         */
        registerUser(naviUser1)

        /*
         * Created user is visible in users endpoint
         */
        given()
            .header("User", naviUser1)
            .When()
            .get("/users")
            .then()
            .assertThat()
            .body("data.id", hasItems<String>(naviUser1))
    }

    @Test
    fun securityTest() {
        /*
         * You cannot create a user under a different name
         */
        given()
            .header("User", naviUser1)
            .contentType("application/vnd.api+json")
            .body(
                """
                    {
                        "data": {
                            "type": "users",
                            "id": "$naviUser2"
                        }
                    }
                """.trimIndent()
            )
            .When()
            .post("/users")
            .then()
            .assertThat()
            .body("errors.detail", contains("Forbidden User Identity"))
            .statusCode(HttpStatus.SC_BAD_REQUEST)

        /*
         * Registering User1
         */
        registerUser(naviUser1)
    }

    @Test
    fun createDateTest() {
        val user1 = "test-user"

        /*
         * Add test user
         */
        registerUser(user1)

        /*
         * Check for created date
         */
        given()
            .header("User", user1)
            .When()
            .get("/users/$user1")
            .then()
            .assertThat()
            .body("data.attributes.createDate", nullValue())

            .body(
                "data.attributes.createdOn",
                RegexMatcher.matchesRegex("\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}")
            ) // YYYY-MM-DD HH:MM:ss

        given()
            .header("User", user1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "users",
                        "id": "$user1",
                        "attributes": {
                            "createdOn": "2015-12-10 10:56:23"
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .patch("/users/$user1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_FORBIDDEN)
    }

    @Test
    fun userPermissions() {
        registerUser(naviUser1)
        registerUser(naviUser2)
        // post a report
        given()
            .header("User", naviUser1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "reports",
                        "attributes": {
                            "title": "A Report",
                            "request": {
                                "logicalTable":{
                                   "timeGrain":"day",
                                   "table":"base"
                                },
                                "bardVersion":"1.0",
                                "requestVersion":"v1",
                                "intervals":[{
                                    "start":"2015-08-20 00:00:00.000",
                                    "end":"2015-08-21 00:00:00.000"
                                }],
                                "metrics": [
                                    {"metric": "m1"},
                                    {"metric": "m2", "parameters": {}}
                                ]
                            }
                        },
                        "relationships": {
                            "owner": {
                                "data": {
                                    "type": "users",
                                    "id": "$naviUser1"
                                }
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .post("/reports")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_CREATED)

        // should not be able to patch another user's record
        given()
            .header("User", naviUser2)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "users",
                        "id": "$naviUser1",
                        "relationships": {
                            "reports": {
                                "data": {
                                    "type": "reports",
                                    "id": 1
                                }
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .patch("/users/$naviUser1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_FORBIDDEN)

        // a user cannot claim another users's report
        given()
            .header("User", naviUser2)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "users",
                        "id": "$naviUser2",
                        "relationships": {
                            "reports": {
                                "data": {
                                    "type": "reports",
                                    "id": 1
                                }
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .patch("/users/$naviUser2")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_FORBIDDEN)

        // a user cannot delete themselves
        given()
            .header("User", naviUser1)
            .When()
            .delete("/users/$naviUser1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_FORBIDDEN)
    }

    @Test
    fun favoriteReports() {
        registerUser(naviUser1)
        registerUser(naviUser2)

        // add Report1
        given()
            .header("User", naviUser1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "reports",
                        "attributes": {
                            "title": "User 1's Report"
                        },
                        "relationships": {
                            "owner": {
                                "data":{
                                    "type": "users",
                                    "id": "$naviUser1"
                                }
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .post("/reports")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_CREATED)

        // add Report2
        given()
            .header("User", naviUser2)
            .contentType("application/vnd.api+json")
            .body(
                """
            {
                "data": {
                    "type": "reports",
                    "attributes": {
                        "title": "User 2's Report"
                    },
                    "relationships": {
                        "owner": {
                            "data":{
                                "type": "users",
                                "id": "$naviUser2"
                            }
                        }
                    }
                }
            }
                """.trimIndent()
            )
            .When()
            .post("/reports")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_CREATED)

        // user starts out with no favorite reports
        given()
            .header("User", naviUser2)
            .contentType("application/vnd.api+json")
            .When()
            .get("/users/$naviUser1")
            .then()
            .assertThat()
            .body("data.relationships.favoriteReports.data", empty<Boolean>())

        // user can favorite their own reports and other users reports
        given()
            .header("User", naviUser1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "users",
                        "id": "$naviUser1",
                        "relationships": {
                            "favoriteReports": {
                                "data":[
                                    {
                                        "type": "reports",
                                        "id": "1"
                                    },
                                    {
                                        "type": "reports",
                                        "id": "2"
                                    }
                                ]
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .patch("/users/$naviUser1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NO_CONTENT)

        // favorited reports show up for user
        given()
            .header("User", naviUser1)
            .contentType("application/vnd.api+json")
            .When()
            .get("/users/$naviUser1")
            .then()
            .assertThat()
            .body("data.relationships.favoriteReports.data.id", hasItems("1", "2"))

        // user can remove a favorite report
        given()
            .header("User", naviUser1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "users",
                        "id": "$naviUser1",
                        "relationships": {
                            "favoriteReports": {
                                "data":[
                                    {
                                        "type": "reports",
                                        "id": "1"
                                    }
                                ]
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .patch("/users/$naviUser1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NO_CONTENT)

        // favorited report has been removed
        given()
            .header("User", naviUser1)
            .contentType("application/vnd.api+json")
            .When()
            .get("/users/$naviUser1")
            .then()
            .assertThat()
            .body("data.relationships.favoriteReports.data.id", not(hasItems("2")))

        // multiple users can favorite the same report
        given()
            .header("User", naviUser2)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "users",
                        "id": "$naviUser2",
                        "relationships": {
                            "favoriteReports": {
                                "data":[
                                    {
                                        "type": "reports",
                                        "id": "1"
                                    }
                                ]
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .patch("/users/$naviUser2")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NO_CONTENT)

        // favorite report still shows up for user1
        given()
            .header("User", naviUser1)
            .contentType("application/vnd.api+json")
            .When()
            .get("/users/$naviUser1")
            .then()
            .assertThat()
            .body("data.relationships.favoriteReports.data.id", hasItems("1"))
    }

    @Test
    fun editingDashboards() {
        registerUser(naviUser1)
        registerUser(naviUser2)
        registerUser(naviUser3)

        // User 1 posts a dashboard
        given()
            .header("User", naviUser1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboards",
                        "attributes": {
                            "title": "User 1's Dashboard"
                        },
                        "relationships": {
                            "owner": {
                                "data": {
                                    "type": "users",
                                    "id": "$naviUser1"
                                }
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .post("/dashboards")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_CREATED)

        // User 2 posts a dashboard
        given()
            .header("User", naviUser2)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboards",
                        "attributes": {
                            "title": "User 2's Dashboard"
                        },
                        "relationships": {
                            "owner": {
                                "data": {
                                    "type": "users",
                                    "id": "$naviUser2"
                                }
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .post("/dashboards")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_CREATED)

        // User 2 posts a second dashboard
        given()
            .header("User", naviUser2)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboards",
                        "attributes": {
                            "title": "User 2's Dashboard 2"
                        },
                        "relationships": {
                            "owner": {
                                "data": {
                                    "type": "users",
                                    "id": "$naviUser2"
                                }
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .post("/dashboards")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_CREATED)

        // User 1 has no editor access
        given()
            .header("User", naviUser1)
            .When()
            .get("/users/$naviUser1")
            .then()
            .assertThat()
            .body("data.relationships.editingDashboards.data", empty<Any>())

        // User 1 assigned editor access to dashboard 2
        given()
            .header("User", naviUser2)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboards",
                        "id": "2",
                        "relationships": {
                            "owner": {
                                "data": {
                                    "type": "users",
                                    "id": "$naviUser2"
                                }
                            },
                            "editors": {
                                "data": {
                                    "type": "users",
                                    "id": "$naviUser1"
                                }
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .patch("/dashboards/2")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NO_CONTENT)

        // user 1 and user 3 given access to dashboard 3
        given()
            .header("User", naviUser2)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboards",
                        "id": "3",
                        "relationships": {
                            "owner": {
                                "data": {
                                    "type": "users",
                                    "id": "$naviUser2"
                                }
                            },
                            "editors": {
                                "data": [
                                    {
                                        "type": "users",
                                        "id": "$naviUser1"
                                    },
                                    {
                                        "type": "users",
                                        "id": "$naviUser3"
                                    }
                                ]
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .patch("/dashboards/3")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NO_CONTENT)

        // dashboards that can be edited and ownered are shown for user 1 and user 3
        given()
            .header("User", naviUser1)
            .When()
            .get("/users/$naviUser1")
            .then()
            .assertThat()
            .body("data.relationships.editingDashboards.data.id", hasItems("2", "3"))
            .body("data.relationships.dashboards.data.id", hasItems("1"))

        given()
            .header("User", naviUser3)
            .When()
            .get("/users/$naviUser3")
            .then()
            .assertThat()
            .body("data.relationships.editingDashboards.data.id", hasItems("3"))
            .body("data.relationships.dashboards.data.id", empty<Any>())

        // user 2 , owner of dashboard 3 remove editor access for user 3
        given()
            .header("User", naviUser2)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboards",
                        "id": "3",
                        "relationships": {
                            "owner": {
                                "data": {
                                    "type": "users",
                                    "id": "$naviUser2"
                                }
                            },
                            "editors": {
                                "data": [
                                    {
                                        "type": "users",
                                        "id": "$naviUser1"
                                    }
                                ]
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .patch("/dashboards/3")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NO_CONTENT)

        given()
            .header("User", naviUser3)
            .When()
            .get("/users/$naviUser3")
            .then()
            .assertThat()
            .body("data.relationships.editingDashboards.data.id", empty<Any>())
    }

    @Test
    fun favoriteDashboards() {
        registerUser(naviUser1)
        registerUser(naviUser2)

        // Add a dashboard
        given()
            .header("User", naviUser1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboards",
                        "attributes": {
                            "title": "User 1's Dashboard"
                        },
                        "relationships": {
                            "owner": {
                                "data": {
                                    "type": "users",
                                    "id": "$naviUser1"
                                }
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .post("/dashboards")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_CREATED)

        // add a second dashboard
        given()
            .header("User", naviUser2)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboards",
                        "attributes": {
                            "title": "User 2's Dashboard"
                        },
                        "relationships": {
                            "owner": {
                                "data": {
                                    "type": "users",
                                    "id": "$naviUser2"
                                }
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .post("/dashboards")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_CREATED)

        // user starts with no favorites
        given()
            .header("User", naviUser1)
            .When()
            .get("/users/$naviUser1")
            .then()
            .assertThat()
            .body("data.relationships.favoriteDashboards.data", empty<Any>())

        // user can favorite their own dashboard and other user's dashboard
        given()
            .header("User", naviUser1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "users",
                        "id": "$naviUser1",
                        "relationships": {
                            "favoriteDashboards": {
                                "data": [
                                    {
                                        "type": "dashboards",
                                        "id": "1"
                                    },
                                    {
                                        "type": "dashboards",
                                        "id": "2"
                                    }
                                ]
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .patch("/users/$naviUser1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NO_CONTENT)

        // favorite dashboards still show up for user
        given()
            .header("User", naviUser1)
            .When()
            .get("/users/$naviUser1")
            .then()
            .assertThat()
            .body("data.relationships.favoriteDashboards.data.id", hasItems("1", "2"))

        // user can remove a dashboard
        given()
            .header("User", naviUser1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "users",
                        "id": "$naviUser1",
                        "relationships": {
                            "favoriteDashboards": {
                                "data": [
                                    {
                                        "type": "dashboards",
                                        "id": "1"
                                    }
                                ]
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .patch("/users/$naviUser1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NO_CONTENT)

        given()
            .header("User", naviUser1)
            .When()
            .get("/users/$naviUser1")
            .then()
            .assertThat()
            .body("data.relationships.favoriteDashboards.data.id", not(hasItems("2")))

        // multiple users can favorite the same dashboard
        given()
            .header("User", naviUser2)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "users",
                        "id": "$naviUser2",
                        "relationships": {
                            "favoriteDashboards": {
                                "data": [
                                    {
                                        "type": "dashboards",
                                        "id": "1"
                                    }
                                ]
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .patch("/users/$naviUser2")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NO_CONTENT)

        // favorite dashboard still shows for user1
        given()
            .header("User", naviUser1)
            .When()
            .get("/users/$naviUser1")
            .then()
            .assertThat()
            .body("data.relationships.favoriteDashboards.data.id", hasItems("1"))
    }

    @Test
    fun reverseRelationships() {
        registerUser(naviUser1)

        // post reports and a dashboard
        given()
            .header("User", naviUser1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "reports",
                        "attributes": {
                            "title": "A Report 1"
                        },
                        "relationships": {
                            "owner": {
                                "data": {
                                    "type": "users",
                                    "id": "$naviUser1"
                                }
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .post("/reports")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_CREATED)

        given()
            .header("User", naviUser1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "reports",
                        "attributes": {
                            "title": "A Report 2"
                        },
                        "relationships": {
                            "owner": {
                                "data": {
                                    "type": "users",
                                    "id": "$naviUser1"
                                }
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .post("/reports")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_CREATED)

        given()
            .header("User", naviUser1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboards",
                        "attributes": {
                            "title": "User 1's Dashboard"
                        },
                        "relationships": {
                            "owner": {
                                "data": {
                                    "type": "users",
                                    "id": "$naviUser1"
                                }
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .post("/dashboards")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_CREATED)

        given()
            .header("User", naviUser1)
            .When()
            .get("/users/$naviUser1")
            .then()
            .assertThat()
            .body("data.relationships.reports.data.type", equalTo(arrayListOf("reports", "reports")))
            .body("data.relationships.reports.data.id", hasItems("1", "2"))
            .body("data.relationships.dashboards.data.type", equalTo(arrayListOf("dashboards")))
            .body("data.relationships.dashboards.data.id", equalTo(arrayListOf("3")))
    }

    @Test
    fun roles() {
        // register new user
        registerUser(naviUser1)

        // // user starts out with no roles
        given()
            .header("User", naviUser1)
            .contentType("application/vnd.api+json")
            .When()
            .get("/users/$naviUser1")
            .then()
            .assertThat()
            .body("data.relationships.roles.data", empty<Any>())

        // register admin role
        registerRole(adminRole)
        // register user role
        registerRole(userRole)

        // Add roles to user, user can have multiple roles
        given()
            .header("User", naviUser1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "users",
                        "id": "$naviUser1",
                        "relationships": {
                            "roles": {
                                "data": [
                                    {
                                        "type": "roles",
                                        "id": "$adminRole"
                                    },
                                    {
                                        "type": "roles",
                                        "id": "$userRole"
                                    }
                                ]
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .patch("/users/$naviUser1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NO_CONTENT)

        // roles show up for user
        given()
            .header("User", naviUser1)
            .When()
            .get("/users/$naviUser1")
            .then()
            .assertThat()
            .body("data.relationships.roles.data.id", hasItems("admin", "user"))

        // can remove a role from a user
        given()
            .header("User", naviUser1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "users",
                        "id": "$naviUser1",
                        "relationships": {
                            "roles": {
                                "data": [
                                    {
                                        "type": "roles",
                                        "id": "$adminRole"
                                    }
                                ]
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .patch("/users/$naviUser1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NO_CONTENT)

        // user role has been removed
        given()
            .header("User", naviUser1)
            .contentType("application/vnd.api+json")
            .When()
            .get("/users/$naviUser1")
            .then()
            .assertThat()
            .body("data.relationships.roles.data.id", not(hasItems("user")))
    }
}
