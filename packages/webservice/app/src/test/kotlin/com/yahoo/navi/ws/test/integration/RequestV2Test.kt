package com.yahoo.navi.ws.test.integration

import com.jayway.restassured.RestAssured.given
import com.yahoo.navi.ws.test.framework.IntegrationTest
import com.yahoo.navi.ws.test.framework.matchers.JsonMatcher.Companion.matchesJsonMap
import org.apache.http.HttpStatus
import org.hamcrest.CoreMatchers.equalTo
import org.hamcrest.CoreMatchers.not
import org.hamcrest.Matchers.hasItems
import org.hamcrest.Matchers.hasKey
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.hamcrest.CoreMatchers.`is` as Is

class RequestV2Test : IntegrationTest() {
    private val USER = "user"
    private var reqStr = String()
    private var visualStr = String()
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
        reqStr = (
            """{
        |"filters": [
        |   {
        |      "field": "product",
        |      "parameters": { "field": "id" },
        |      "type": "dimension",
        |      "operator": "in",
        |      "values": [
        |        "access_manager"
        |      ]
        |    },
        |    {
        |      "field": "timeSpent",
        |      "parameters": {},
        |      "type": "metric",
        |      "operator": "gt",
        |      "values": [
        |        3
        |      ]
        |    },
        |    { 
        |      "field": "dateTime",
        |      "parameters": { "grain": "day" },
        |      "type": "timeDimension",
        |      "operator": "bet",
        |      "values": [ "P1D", "current" ]
        |    }
        |  ],
        |  "columns": [
        |    {
        |      "cid": "dateTime column id",
        |      "field": "dateTime", 
        |      "parameters": {
        |        "grain": "day"
        |      },
        |      "type": "timeDimension",
        |      "alias": "time"
        |    },
        |    {
        |      "cid": "product column id",
        |      "field": "product",
        |      "parameters": { "field": "id" },
        |      "type": "dimension"
        |    },
        |    {
        |      "cid": "spaceId column id",
        |      "field": "spaceId",
        |      "parameters": { "field": "id" },
        |      "type": "dimension"
        |    },
        |    {
        |      "cid": "timeSpent column id",
        |      "field": "timeSpent",
        |      "parameters": {},
        |      "type": "metric"
        |    }
        |  ],
        |  "table": "certifiedAudience",
        |  "sorts": [
        |    {
        |      "field": "dateTime",
        |      "parameters": { "grain": "day" },
        |      "type": "timeDimension",
        |      "direction": "desc"
        |    }
        |  ],
        |  "dataSource": "audience",
        |  "limit": null, 
        |  "requestVersion": "2.0"
        |}""".trimMargin()
            )

        visualStr = (
            """{
            |"metadata":{
            |    "foo":"bar",
            |    "nestedFoo":{"innerFoo":"innerBar"}
            |},
            |"type":"chart",
            |"version":1
            |}""".trimMargin()
            )

        registerUser(USER)
    }

    @Test
    fun reportWithRequestV2() {
        given()
            .header("User", USER)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "reports",
                        "attributes": {
                            "title": "A Report",
                            "request": $reqStr,
                            "visualization": $visualStr
                        },
                        "relationships": {
                            ${owner(USER)}
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
            .header("User", USER)
            .contentType("application/vnd.api+json")
            .When()
            .get("/reports/1")
            .then()
            .assertThat()

            .body("data.attributes.request.requestVersion", equalTo("2.0"))
            .body("data.attributes.request.table", equalTo("certifiedAudience"))
            .body("data.attributes.request.dataSource", equalTo("audience"))

            .body("data.attributes.request.filters.size()", Is(3))
            .body("data.attributes.request.filters[0].type", equalTo("dimension"))
            .body("data.attributes.request.filters[0].field", equalTo("product"))
            .body("data.attributes.request.filters[0].parameters", matchesJsonMap("{\"field\":\"id\"}"))
            .body("data.attributes.request.filters[0].operator", equalTo("in"))
            .body("data.attributes.request.filters[0].values", hasItems("access_manager"))

            .body("data.attributes.request.filters[1].type", equalTo("metric"))
            .body("data.attributes.request.filters[1].field", equalTo("timeSpent"))
            .body("data.attributes.request.filters[1].parameters", matchesJsonMap("{}"))
            .body("data.attributes.request.filters[1].operator", equalTo("gt"))
            .body("data.attributes.request.filters[1].values", hasItems(3))

            .body("data.attributes.request.filters[2].type", equalTo("timeDimension"))
            .body("data.attributes.request.filters[2].field", equalTo("dateTime"))
            .body("data.attributes.request.filters[2].parameters", matchesJsonMap("{\"grain\":\"day\"}"))
            .body("data.attributes.request.filters[2].operator", equalTo("bet"))
            .body("data.attributes.request.filters[2].values", hasItems("P1D", "current"))

            .body("data.attributes.request.columns.size()", Is(4))
            .body("data.attributes.request.columns[0].cid", equalTo("dateTime column id"))
            .body("data.attributes.request.columns[0].type", equalTo("timeDimension"))
            .body("data.attributes.request.columns[0].field", equalTo("dateTime"))
            .body("data.attributes.request.columns[0].parameters", matchesJsonMap("{\"grain\":\"day\"}"))
            .body("data.attributes.request.columns[0].alias", equalTo("time"))

            .body("data.attributes.request.columns[1].cid", equalTo("product column id"))
            .body("data.attributes.request.columns[1].type", equalTo("dimension"))
            .body("data.attributes.request.columns[1].field", equalTo("product"))
            .body("data.attributes.request.columns[1].parameters", matchesJsonMap("{\"field\": \"id\"}"))
            .body("data.attributes.request.columns[1]", not(hasKey("alias")))

            .body("data.attributes.request.columns[2].cid", equalTo("spaceId column id"))
            .body("data.attributes.request.columns[2].type", equalTo("dimension"))
            .body("data.attributes.request.columns[2].field", equalTo("spaceId"))
            .body("data.attributes.request.columns[2].parameters", matchesJsonMap("{\"field\": \"id\"}"))
            .body("data.attributes.request.columns[2]", not(hasKey("alias")))

            .body("data.attributes.request.columns[3].cid", equalTo("timeSpent column id"))
            .body("data.attributes.request.columns[3].type", equalTo("metric"))
            .body("data.attributes.request.columns[3].field", equalTo("timeSpent"))
            .body("data.attributes.request.columns[3].parameters", matchesJsonMap("{}"))
            .body("data.attributes.request.columns[3]", not(hasKey("alias")))

            .body("data.attributes.request.sorts.size()", Is(1))
            .body("data.attributes.request.sorts[0].type", equalTo("timeDimension"))
            .body("data.attributes.request.sorts[0].field", equalTo("dateTime"))
            .body("data.attributes.request.sorts[0].parameters", matchesJsonMap("{\"grain\": \"day\"}"))
            .body("data.attributes.request.sorts[0].direction", equalTo("desc"))
    }

    @Test
    fun testHaving() {
        given()
            .header("User", USER)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "reports",
                        "attributes": {
                            "title": "A Report",
                            "request": {
                                "filters": [{
                                    "field": "foo",
                                    "type": "metric",
                                    "operator": "gt",
                                    "values": [3, 3.156, -1]
                                }],
                                "requestVersion": "2.0"
                            },
                            "visualization": $visualStr
                        },
                        "relationships": {
                            ${owner(USER)}
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
            .header("User", USER)
            .contentType("application/vnd.api+json")
            .When()
            .get("/reports/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_OK)
            .body("data.attributes.request.filters[0].values", hasItems(3, 3.156f, -1))
            .body("data.attributes.request.filters[0].type", equalTo("metric"))
    }

    @Test
    fun dashboardsWithRequestV2() {
        given()
            .header("User", USER)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboards",
                        "attributes": {
                            "title": "A dashboard",
                            "presentation": {}
                        },
                        "relationships": {
                            ${owner(USER)}
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
            .header("User", USER)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "dashboardWidgets",
                        "attributes": {
                            "title": "A widget 1",
                            "requests": [$reqStr],
                            "visualization": $visualStr
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
            .header("User", USER)
            .contentType("application/vnd.api+json")
            .When()
            .get("/dashboards/1/widgets/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_OK)

            .body("data.attributes.requests[0].requestVersion", equalTo("2.0"))
            .body("data.attributes.requests[0].table", equalTo("certifiedAudience"))
            .body("data.attributes.requests[0].dataSource", equalTo("audience"))

            .body("data.attributes.requests[0].filters.size()", Is(3))
            .body("data.attributes.requests[0].filters[0].type", equalTo("dimension"))
            .body("data.attributes.requests[0].filters[0].field", equalTo("product"))
            .body("data.attributes.requests[0].filters[0].parameters", matchesJsonMap("{\"field\": \"id\"}"))
            .body("data.attributes.requests[0].filters[0].operator", equalTo("in"))
            .body("data.attributes.requests[0].filters[0].values", hasItems("access_manager"))

            .body("data.attributes.requests[0].filters[1].type", equalTo("metric"))
            .body("data.attributes.requests[0].filters[1].field", equalTo("timeSpent"))
            .body("data.attributes.requests[0].filters[1].parameters", matchesJsonMap("{}"))
            .body("data.attributes.requests[0].filters[1].operator", equalTo("gt"))
            .body("data.attributes.requests[0].filters[1].values", hasItems(3))

            .body("data.attributes.requests[0].filters[2].type", equalTo("timeDimension"))
            .body("data.attributes.requests[0].filters[2].field", equalTo("dateTime"))
            .body("data.attributes.requests[0].filters[2].parameters", matchesJsonMap("{\"grain\": \"day\"}"))
            .body("data.attributes.requests[0].filters[2].operator", equalTo("bet"))
            .body("data.attributes.requests[0].filters[2].values", hasItems("P1D", "current"))

            .body("data.attributes.requests[0].columns.size()", Is(4))
            .body("data.attributes.requests[0].columns[0].cid", equalTo("dateTime column id"))
            .body("data.attributes.requests[0].columns[0].type", equalTo("timeDimension"))
            .body("data.attributes.requests[0].columns[0].field", equalTo("dateTime"))
            .body("data.attributes.requests[0].columns[0].parameters", matchesJsonMap("{\"grain\":\"day\"}"))
            .body("data.attributes.requests[0].columns[0].alias", equalTo("time"))

            .body("data.attributes.requests[0].columns[1].cid", equalTo("product column id"))
            .body("data.attributes.requests[0].columns[1].type", equalTo("dimension"))
            .body("data.attributes.requests[0].columns[1].field", equalTo("product"))
            .body("data.attributes.requests[0].columns[1].parameters", matchesJsonMap("{\"field\": \"id\"}"))
            .body("data.attributes.requests[0].columns[1]", not(hasKey("alias")))

            .body("data.attributes.requests[0].columns[2].cid", equalTo("spaceId column id"))
            .body("data.attributes.requests[0].columns[2].type", equalTo("dimension"))
            .body("data.attributes.requests[0].columns[2].field", equalTo("spaceId"))
            .body("data.attributes.requests[0].columns[2].parameters", matchesJsonMap("{\"field\": \"id\"}"))
            .body("data.attributes.requests[0].columns[2]", not(hasKey("alias")))

            .body("data.attributes.requests[0].columns[3].cid", equalTo("timeSpent column id"))
            .body("data.attributes.requests[0].columns[3].type", equalTo("metric"))
            .body("data.attributes.requests[0].columns[3].field", equalTo("timeSpent"))
            .body("data.attributes.requests[0].columns[3].parameters", matchesJsonMap("{}"))
            .body("data.attributes.requests[0].columns[3]", not(hasKey("alias")))

            .body("data.attributes.requests[0].sorts.size()", Is(1))
            .body("data.attributes.requests[0].sorts[0].type", equalTo("timeDimension"))
            .body("data.attributes.requests[0].sorts[0].field", equalTo("dateTime"))
            .body("data.attributes.requests[0].sorts[0].parameters", matchesJsonMap("{\"grain\": \"day\"}"))
            .body("data.attributes.requests[0].sorts[0].direction", equalTo("desc"))
    }
}
