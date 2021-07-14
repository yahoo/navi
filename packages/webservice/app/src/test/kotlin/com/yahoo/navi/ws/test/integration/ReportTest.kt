package com.yahoo.navi.ws.test.integration

import com.jayway.restassured.RestAssured.given
import com.yahoo.navi.ws.test.framework.IntegrationTest
import com.yahoo.navi.ws.test.framework.matchers.JsonMatcher.Companion.matchesJsonMap
import com.yahoo.navi.ws.test.framework.matchers.RegexMatcher.Companion.matchesRegex
import org.apache.http.HttpStatus
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.hasItems
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class ReportTest : IntegrationTest() {
    private val USER1 = "user1"
    private val USER2 = "user2"

    private var reqStr = String()
    private var testReqStrMF = String()
    private var expectedReqStr = String()
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

        // The test Request string, Order does not matter since
        // our matcher compares JSON Elements
        reqStr = (
            """{
            |"logicalTable":{
            |   "timeGrain":"day",
            |   "table":"base"
            |},
            |"dataSource": "",
            |"bardVersion":"1.0",
            |"requestVersion":"v1",
            |"intervals":[{
            |    "start":"2015-08-20 00:00:00.000",
            |    "end":"2015-08-21 00:00:00.000"
            |}],
            |"filters":[{
            |   "field": "id",
            |   "values":["-1","102","103"],
            |   "dimension":"age",
            |   "operator":"include"
            |}],
            |"metrics":[
            |    {"metric":"metric1","parameters":{}},
            |    {"metric":"metric2","parameters":{}},
            |    {"metric":"metric3","parameters":{"param1":"paramVal1"}}],
            |"dimensions":[
            |   {"dimension":"dim1"},
            |   {"dimension":"dim2"}
            |]
            |}""".trimMargin()
            )

        expectedReqStr = (
            """{
            |"logicalTable":{
            |   "timeGrain":"day",
            |   "table":"base"
            |},
            |"having": [],
            |"sort": [],
            |"dataSource":"",
            |"bardVersion":"1.0",
            |"requestVersion":"v1",
            |"intervals":[{
            |    "start":"2015-08-20 00:00:00.000",
            |    "end":"2015-08-21 00:00:00.000"
            |}],
            |"filters":[{
            |   "field": "id",
            |   "values":["-1","102","103"],
            |   "dimension":"age",
            |   "operator":"include"
            |}],
            |"metrics":[
            |    {"metric":"metric1","parameters":{}},
            |    {"metric":"metric2","parameters":{}},
            |    {"metric":"metric3","parameters":{"param1":"paramVal1"}}],
            |"dimensions":[
            |   {"dimension":"dim1"},
            |   {"dimension":"dim2"}
            |]
            |}""".trimMargin()
            )

        // The test Request string with missing fields,
        testReqStrMF = (
            """[{
            |"logicalTable":{
            |   "timeGrain":"day",
            |   "table":"base"
            |},
            |"bardVersion":"1.0",
            |"requestVersion":"v1",
            |"intervals":[{
            |   "start":"2015-08-20 00:00:00.000",
            |   "end":"2015-08-21 00:00:00.000"
            |}],
            |"metrics":[
            |   {"metric":"metric1","parameters":{}},
            |   {"metric":"metric2","parameters":{}},
            |   {"metric":"metric3","parameters":{"param1":"paramVal1"}}
            |]
            |}]""".trimMargin()
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

        /***
         * Post test users
         */
        registerUser(USER1)
        registerUser(USER2)
    }

    @Test
    fun report() {
        // Post a report
        given()
            .header("User", USER1)
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
                            ${owner(USER1)}
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

        // test that it exists
        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .When()
            .get("/reports")
            .then()
            .assertThat()
            .body("data.id", hasItems("1"))
            .body("data[0].attributes.title", equalTo("A Report"))
            .body("data[0].attributes.request", matchesJsonMap(expectedReqStr))
            .body("data[0].attributes.visualization", matchesJsonMap(visualStr))

        // test patch
        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "reports",
                        "id": 1,
                        "attributes": {
                            "title": "Updated Title"
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .patch("/reports/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NO_CONTENT)

        // test if title is updated
        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .When()
            .get("/reports/1")
            .then()
            .assertThat()
            .body("data.attributes.title", equalTo("Updated Title"))

        // test delete
        given()
            .header("User", USER1)
            .When()
            .delete("/reports/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NO_CONTENT)

        // make sure report doesn't exist
        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .When()
            .get("/reports/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NOT_FOUND)
    }

    @Test
    fun reportSort() {
        val requestStr =
            """{
            |"logicalTable":{
            |   "timeGrain":"day",
            |   "table":"base"
            |},
            |"bardVersion":"1.0",
            |"requestVersion":"v1",
            |"intervals":[{
            |    "start":"2015-08-20 00:00:00.000",
            |    "end":"2015-08-21 00:00:00.000"
            |}],
            |"filters":[{
            |   "field": "id",
            |   "values":["-1","102","103"],
            |   "dimension":"age",
            |   "operator":"include"
            |}],
            |"metrics":[
            |    {"metric":"metric1","parameters":{}},
            |    {"metric":"metric2","parameters":{}},
            |    {"metric":"metric3","parameters":{"param1":"paramVal1"}}],
            |"dimensions":[
            |   {"dimension":"dim1"},
            |   {"dimension":"dim2"}
            |],
            |"sort": [
            |   {"metric": "m1", "direction": "asc"},
            |   {"metric": "m2", "direction": "desc"}
            |]
            |}""".trimMargin()

        // Post a report
        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "reports",
                        "attributes": {
                            "title": "A Report",
                            "request": $requestStr,
                            "visualization": $visualStr
                        },
                        "relationships": {
                            ${owner(USER1)}
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

        // check the sorts
        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .When()
            .get("/reports/1")
            .then()
            .assertThat()
            .body("data.attributes.request.sort.metric", hasItems("m1", "m2"))
            .body("data.attributes.request.sort.find { it.metric == 'm1'}.direction", equalTo("asc"))
            .body("data.attributes.request.sort.find { it.metric == 'm2'}.direction", equalTo("desc"))
    }

    @Test
    fun testHaving() {
        val requestStr =
            """{
            |"logicalTable":{
            |   "timeGrain":"day",
            |   "table":"base"
            |},
            |"bardVersion":"1.0",
            |"requestVersion":"v1",
            |"intervals":[{
            |    "start":"2015-08-20 00:00:00.000",
            |    "end":"2015-08-21 00:00:00.000"
            |}],
            |"filters":[{
            |   "field": "id",
            |   "values":["-1","102","103"],
            |   "dimension":"age",
            |   "operator":"include"
            |}],
            |"metrics":[
            |    {"metric":"metric1","parameters":{}},
            |    {"metric":"metric2","parameters":{}},
            |    {"metric":"metric3","parameters":{"param1":"paramVal1"}}],
            |"dimensions":[
            |   {"dimension":"dim1"},
            |   {"dimension":"dim2"}
            |],
            |"having": [
            |   {"metric": "m1", "operator": "lt", "values": [2.0, 4.0]},
            |   {"metric": "m2", "operator": "notgt", "values": [199.21]}
            |]
            |}""".trimMargin()

        // Post a report
        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "reports",
                        "attributes": {
                            "title": "A Report",
                            "request": $requestStr,
                            "visualization": $visualStr
                        },
                        "relationships": {
                            ${owner(USER1)}
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

        // check the sorts
        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .When()
            .get("/reports/1")
            .then()
            .assertThat()
            .body("data.attributes.request.having.metric", hasItems("m1", "m2"))
            .body("data.attributes.request.having.find { it.metric == 'm1'}.operator", equalTo("lt"))
            .body("data.attributes.request.having.find { it.metric == 'm1'}.values[0]", equalTo(2.0f))
            .body("data.attributes.request.having.find { it.metric == 'm1'}.values[1]", equalTo(4.0f))
            .body("data.attributes.request.having.find { it.metric == 'm2'}.operator", equalTo("notgt"))
            .body("data.attributes.request.having.find { it.metric == 'm2'}.values[0]", equalTo(199.21f))
    }

    @Test
    fun wrongUser() {
        // Post a report with different owner
        given()
            .header("User", USER1)
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
                            ${owner(USER2)}
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .post("/reports")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_FORBIDDEN)

        // make sure report doesn't exist
        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .When()
            .get("/reports/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_NOT_FOUND)
    }

    @Test
    fun differentOwnerPermissions() {
        // Post a report with different owner
        given()
            .header("User", USER1)
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
                            ${owner(USER1)}
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
            .header("User", USER2)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "reports",
                        "id": 1,
                        "attributes": {
                            "title": "Updated Title"
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .patch("/reports/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_FORBIDDEN)

        given()
            .header("User", USER2)
            .When()
            .delete("/reports/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_FORBIDDEN)
    }

    @Test
    fun createDate() {
        // Post a report
        given()
            .header("User", USER1)
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
                            ${owner(USER1)}
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

        // check date fields
        given()
            .header("User", USER1)
            .contentType("application/vnd.api+json")
            .When()
            .get("/reports/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_OK)
            .body("data.attributes.createdOn", matchesRegex("\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}"))
            .body("data.attributes.updatedOn", matchesRegex("\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}"))
    }

    @Test
    fun userPermissions() {
        // Post a report
        given()
            .header("User", USER1)
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
                            ${owner(USER1)}
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

        // non owner should not update a report
        given()
            .header("User", USER2)
            .contentType("application/vnd.api+json")
            .body(
                """
                {
                    "data": {
                        "type": "reports",
                        "id": 1,
                        "attributes": {
                            "title": "Updated Title"
                        }
                    }
                }
                """.trimIndent()
            )
            .When()
            .patch("/reports/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_FORBIDDEN)

        // non owner should not be able to delete report
        given()
            .header("User", USER2)
            .When()
            .delete("/reports/1")
            .then()
            .assertThat()
            .statusCode(HttpStatus.SC_FORBIDDEN)
    }
}
