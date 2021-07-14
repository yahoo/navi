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
import org.hamcrest.Matchers.hasItems
import org.hamcrest.Matchers.not
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class DashboardWidgetTest : IntegrationTest() {
    private val USER1 = "user1"
    private val USER2 = "user2"

    private var presentation = String()
    private var requests = String()
    private var visual1 = String()
    private var visual2 = String()
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

        requests = (
            """[
            [{
                "logicalTable":{
                    "timeGrain":"day",
                    "table":"base"
                },
                "bardVersion":"1.0",
                "requestVersion":"2.0",
                "intervals":[{
                    "start":"2015-08-20 00:00:00.000",
                    "end":"2015-08-21 00:00:00.000"
                }],
                "filters":[{
                    "field": null,
                    "values":["-1","102","103"],
                    "dimension":"age",
                    "operator":"include"
                }],
                "metrics":[
                    {"metric":"metric1","parameters":{}},
                    {"metric":"metric2","parameters":{}},
                    {"metric":"metric3","parameters":{"param1":"paramVal1","param2":"paramVal2"}}
                ],
                "dimensions":[
                    {"dimension":"dim1"},
                    {"dimension":"dim2"}
                ]
            }],
            [{
                "logicalTable":{
                    "timeGrain":"day",
                    "table":"base"
                },
                "bardVersion":"1.0",
                "requestVersion":"2.0",
                "intervals":[{
                    "start":"2015-08-20 00:00:00.000",
                    "end":"2015-08-21 00:00:00.000"
                }],
                "filters":[{
                    "field": null,
                    "values":["-1","102","103"],
                    "dimension":"age",
                    "operator":"include"
                }],
                "metrics":[
                    {"metric":"metric1","parameters":{}},
                    {"metric":"metric2","parameters":{}},
                    {"metric":"metric3","parameters":{"param1":"paramVal1","param2":"paramVal2"}}
                ],
                "dimensions":[
                    {"dimension":"dim1"},
                    {"dimension":"dim2"}
                ]
            }]
        ]
            """.trimIndent()
            )

        visual1 =
            """
            {
                "metadata":{
                    "foo":"bar",
                    "nestedFoo":{"innerFoo":"innerBar"}
                },
                "type":"chart",
                "version":1
            }
            """.trimIndent()

        visual2 =
            """
            {
               "metadata":{
                    "foo2":"bar2"
                },
                "type":"table",
                "version":1
            }
            """.trimIndent()

        /***
         * Post test users
         */
        registerUser(USER1)
        registerUser(USER2)

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
    }

    @Test
    fun dashboardWidget() {
        // post 2 widgets
        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboardWidgets",
                        "attributes": {
                            "title": "A widget 1",
                            "requests": $requests,
                            "visualization": $visual1
                        },
                        "relationships": {
                            "dashboard": {
                                "data": {
                                    "type": "dashboards",
                                    "id":"1"
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
                            "title": "A widget 2",
                            "requests": $requests,
                            "visualization": $visual2
                        },
                        "relationships": {
                            "dashboard": {
                                "data": {
                                    "type": "dashboards",
                                    "id":"1"
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

        // assert widget 1 and 2 exists
        given()
            .header("User", USER1)
            .When()
            .get("/dashboards/1/widgets")
            .then()
            .assertThat()
            .body("data.id", hasItems("1", "2"))
            .body("data.attributes.title", hasItems("A widget 1"))
            .body("data.attributes.requests.logicalTable.table", hasItems(arrayListOf(arrayListOf("base"), arrayListOf("base")), arrayListOf(arrayListOf("base"), arrayListOf("base"))))
            .body("data.attributes.visualization", containsInAnyOrder(matchesJsonMap(visual1), matchesJsonMap(visual2)))

        // delete a widget
        given()
            .header("User", USER1)
            .When()
            .delete("/dashboards/1/widgets/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NO_CONTENT)

        given()
            .header("User", USER1)
            .When()
            .get("/dashboards/1/widgets")
            .then()
            .assertThat()
            .body("data.id", not(hasItems("1")))
            .body("data.id", hasItems("2"))
            .body("data.relationships.owner.data.id", hasItems("user1"))
    }

    @Test
    fun widgetUserPermission() {
        // User1 posts a widget to dashboard1
        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .body(
                """
              {
                  "data": {
                      "type": "dashboardWidgets",
                      "attributes": {
                          "title": "A widget 1",
                          "requests": $requests,
                          "visualization": $visual1
                      },
                      "relationships": {
                          "dashboard": {
                              "data": {
                                  "type": "dashboards",
                                  "id":"1"
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

        // User 1 edits widget1 of dashboard1
        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .body(
                """
            {
                "data": {
                    "type": "dashboardWidgets",
                    "id": "1",
                    "attributes": {
                        "title": "edited by User 1"
                    },
                    "relationships": {
                        "dashboard": {
                            "data": {
                                "type": "dashboards",
                                "id":"1"
                            }
                        }
                    }
                }
            }
                """.trimIndent()
            )
            .When()
            .patch("/dashboards/1/widgets/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NO_CONTENT)

        // title should be updated
        given()
            .header("User", USER1)
            .When()
            .get("/dashboards/1/widgets")
            .then()
            .assertThat()
            .body("data.attributes.title", hasItems("edited by User 1"))

        // User2 tries to edit widget but isn't an editor
        given()
            .header("User", USER2)
            .contentType("application/vnd.api+json")
            .body(
                """
            {
                "data": {
                    "type": "dashboardWidgets",
                    "id": "1",
                    "attributes": {
                        "title": "edited by User 2"
                    },
                    "relationships": {
                        "dashboard": {
                            "data": {
                                "type": "dashboards",
                                "id":"1"
                            }
                        }
                    }
                }
            }
                """.trimIndent()
            )
            .When()
            .patch("/dashboards/1/widgets/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_FORBIDDEN)

        // User1 gives editing permission to User2 to dashboard1
        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboards",
                        "id": "1",
                        "relationships": {
                            "editors": {
                                "data": [
                                    {
                                        "type": "users",
                                        "id": "$USER2"
                                    }
                                ]
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
            .statusCode(HttpStatus.SC_NO_CONTENT)

        // User2 can edit now
        given()
            .header("User", USER2)
            .contentType("application/vnd.api+json")
            .body(
                """
            {
                "data": {
                    "type": "dashboardWidgets",
                    "id": "1",
                    "attributes": {
                        "title": "edited by User 2"
                    },
                    "relationships": {
                        "dashboard": {
                            "data": {
                                "type": "dashboards",
                                "id":"1"
                            }
                        }
                    }
                }
            }
                """.trimIndent()
            )
            .When()
            .patch("/dashboards/1/widgets/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NO_CONTENT)

        // user2 (editor) deletes widget1 from dashboard1
        given()
            .header("User", USER2)
            .When()
            .delete("/dashboards/1/widgets/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NO_CONTENT)

        // checking if widget was deleted
        given()
            .header("User", USER1)
            .When()
            .get("/dashboards/1/widgets")
            .then()
            .assertThat()
            .body("data.id", empty<Any>())
    }

    @Test
    fun widgetSetOwner() {
        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboardWidgets",
                        "attributes": {
                            "title": "A widget 1",
                            "requests": $requests,
                            "visualization": $visual1
                        },
                        "relationships": {
                            "dashboard": {
                                "data": {
                                    "type": "dashboards",
                                    "id": "1"
                                }
                            },
                            "owner": {
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
            .post("/dashboards/1/widgets")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_BAD_REQUEST)

        // posting with the parent dashboard's owner is OK
        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboardWidgets",
                        "attributes": {
                            "title": "A widget 1",
                            "requests": $requests,
                            "visualization": $visual1
                        },
                        "relationships": {
                            "dashboard": {
                                "data": {
                                    "type": "dashboards",
                                    "id": "1"
                                }
                            },
                            "owner": {
                                "data": {
                                    "type": "users",
                                    "id": "$USER1"
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
    }
}
