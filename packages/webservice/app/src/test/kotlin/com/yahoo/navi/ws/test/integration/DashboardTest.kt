/**
 * Copyright 2019, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
package com.yahoo.navi.ws.test.integration

import com.jayway.restassured.RestAssured.given
import com.yahoo.navi.ws.test.framework.IntegrationTest
import com.yahoo.navi.ws.test.framework.matchers.JsonMatcher.Companion.matchesJsonMap
import org.apache.http.HttpStatus
import org.hamcrest.Matchers.containsInAnyOrder
import org.hamcrest.Matchers.empty
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.hasItems
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class DashboardTest : IntegrationTest() {
    private val USER1 = "user1"
    private val USER2 = "user2"
    private val USER3 = "user3"

    private var presentation = String()
    private var owner = { user: String ->
        """
        |"owner": {
        |   "data": {
        |        "type": "users",
        |        "id": "$user"
        |    }
        |}
        """.trimMargin()
    }

    @BeforeEach
    fun setup() {
        presentation =
            """
            {
                "version":1,
                "layout": [{
                    "column":1,
                    "row":1,
                    "height":1,
                    "width": 1,
                    "widgetId":2
                }, {
                    "column":2,
                    "row":3,
                    "height":1,
                    "width": 1,
                    "widgetId":5
                }],
                "columns":4
            }
            """.trimIndent()

        /***
         * Post test users
         */
        registerUser(USER1)
        registerUser(USER2)
        registerUser(USER3)
    }

    @Test
    fun dashboard() {
        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboards",
                        "attributes": {
                            "title": "A dashboard",
                            "presentation": $presentation
                        },
                        "relationships": {
                            ${owner(USER1)}
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
            .header("User", USER1)
            .When()
            .get("/dashboards")
            .then()
            .assertThat()
            .body("data.id", hasItems<String>("1"))

        given()
            .header("User", USER1)
            .When()
            .get("/dashboards")
            .then()
            .assertThat()
            .body("data.attributes.title", hasItems("A dashboard"))

        given()
            .header("User", USER1)
            .When()
            .get("/dashboards/1")
            .then()
            .assertThat()
            .body("data.attributes.presentation", matchesJsonMap(presentation))

        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboards",
                        "id": "1",
                        "attributes": {
                            "title": "Updated Title"
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .patch("/dashboards/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NO_CONTENT)

        given()
            .header("User", USER1)
            .When()
            .get("/dashboards")
            .then()
            .assertThat()
            .body("data.attributes.title", hasItems("Updated Title"))

        given()
            .header("User", USER1)
            .When()
            .delete("/dashboards/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NO_CONTENT)

        given()
            .header("User", USER1)
            .When()
            .get("/dashboards/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NOT_FOUND)
    }

    @Test
    fun wrongUser() {
        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboards",
                        "attributes": {
                            "title": "A Dashboard"
                        },
                        "relationships": {
                            ${owner(USER2)}
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .post("/dashboards")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_FORBIDDEN)
    }

    @Test
    fun permissions() {
        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboards",
                        "attributes": {
                            "title": "A dashboard",
                            "presentation": $presentation
                        },
                        "relationships": {
                            ${owner(USER1)},
                            "editors": {
                                "data": {
                                    "type": "users",
                                    "id": "$USER2"
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
            .header("User", USER2)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboards",
                        "id": "1",
                        "attributes": {
                            "title": "Updated Title"
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .patch("/dashboards/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NO_CONTENT)

        given()
            .header("User", USER3)
            .When()
            .get("/dashboards")
            .then()
            .assertThat()
            .body("data.attributes.title", hasItems("Updated Title"))

        given()
            .header("User", USER2)
            .When()
            .delete("/dashboards/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_FORBIDDEN)

        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .When()
            .get("/dashboards/1")
            .then()
            .assertThat()
            .body("data.attributes.title", equalTo("Updated Title"))

        given()
            .header("User", USER2)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboards",
                        "id": "1",
                        "relationships": {
                            "editors": {
                                "data": {
                                    "type": "users",
                                    "id": "$USER3"
                                }
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .patch("/dashboards/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_FORBIDDEN)

        given()
            .header("User", USER3)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboards",
                        "id": "1",
                        "attributes": {
                            "title": "Title By User3"
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .patch("/dashboards/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_FORBIDDEN)

        given()
            .header("User", USER3)
            .When()
            .delete("/dashboards/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_FORBIDDEN)
    }

    @Test
    fun dashboardWithWidgets() {
        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboards",
                        "attributes": {
                            "title": "A dashboard",
                            "presentation": $presentation
                        },
                        "relationships": {
                            ${owner(USER1)}
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
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboardWidgets",
                        "attributes": {
                            "title": "A Widget 1"
                        },
                        "relationships": {
                            "dashboard": {
                                "data": {
                                    "type": "dashboards",
                                    "id": "1"
                                }
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .post("/dashboards/1/widgets")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_CREATED)

        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboardWidgets",
                        "attributes": {
                            "title": "A Widget 2"
                        },
                        "relationships": {
                            "dashboard": {
                                "data": {
                                    "type": "dashboards",
                                    "id": "1"
                                }
                            }
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .post("/dashboards/1/widgets")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_CREATED)

        given()
            .header("User", USER1)
            .When()
            .get("/dashboards/")
            .then()
            .assertThat()
            .body("data.id", hasItems("1"))

        given()
            .header("User", USER1)
            .When()
            .get("/dashboards/1/widgets")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_OK)
            .body("data.id", containsInAnyOrder("1", "2"))
            .body("data.relationships.dashboard.data.id", equalTo(arrayListOf("1", "1")))

        val numberOfWidgetsInDashboard1 = "from DashboardWidget where dashboard.id = 1 "
        assertEquals(2, getCountForSelectQuery(numberOfWidgetsInDashboard1))

        given()
            .header("User", USER1)
            .When()
            .delete("/dashboards/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NO_CONTENT)

        given()
            .header("User", USER2)
            .When()
            .get("/dashboards/")
            .then()
            .assertThat()
            // Custom matcher that takes string and compares to the get request
            .body("data.id", empty<Any>())

        assertEquals(0, getCountForSelectQuery(numberOfWidgetsInDashboard1))
    }

    @Test
    fun globalFilters() {
        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboards",
                        "attributes": {
                            "title": "A dashboard",
                            "presentation": $presentation
                        },
                        "relationships": {
                            ${owner(USER1)}
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
            .header("User", USER1)
            .When()
            .get("/dashboards/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_OK)
            .body("data.attributes.filters", empty<Any>())

        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboards",
                        "id": "1",
                        "attributes": {
                            "filters": [
                                {"dimension": "age", "operator": "in", "field": "id", "values": ["13"]}
                            ]
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .patch("/dashboards/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NO_CONTENT)

        given()
            .header("User", USER1)
            .When()
            .get("/dashboards/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_OK)
            .body("data.attributes.filters.size()", equalTo(1))
            .body("data.attributes.filters[0].dimension", equalTo("age"))
            .body("data.attributes.filters[0].values", equalTo(arrayListOf("13")))
            .body("data.attributes.filters[0].field", equalTo("id"))
            .body("data.attributes.filters[0].operator", equalTo("in"))

        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboards",
                        "id": "1",
                        "attributes": {
                            "filters": [
                                {"dimension": "age", "operator": "in", "field": "id", "values": ["13"]},
                                {"dimension": "platform", "operator": "contains", "field": "desc", "values": ["verizon"]}
                            ]
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .patch("/dashboards/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NO_CONTENT)

        given()
            .header("User", USER1)
            .When()
            .get("/dashboards/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_OK)
            .body("data.attributes.filters.size()", equalTo(2))
            .body("data.attributes.filters[0].dimension", equalTo("age"))
            .body("data.attributes.filters[0].values", equalTo(arrayListOf("13")))
            .body("data.attributes.filters[0].field", equalTo("id"))
            .body("data.attributes.filters[0].operator", equalTo("in"))
            .body("data.attributes.filters[1].dimension", equalTo("platform"))
            .body("data.attributes.filters[1].values", equalTo(arrayListOf("verizon")))
            .body("data.attributes.filters[1].field", equalTo("desc"))
            .body("data.attributes.filters[1].operator", equalTo("contains"))
    }
}
