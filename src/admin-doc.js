import envset from "dotenv"
envset.config()

const options = {
    "definition": {
        "openapi": "3.0.0",
        "info": {
            "title": "Admin API Documentation",
            "description": "collection of all Admin usable APIs",
            "version": "0.0.1"
        },
        "server": [{
                "url": `http://localhost:${process.env.PORT}/`,
                "description": "primary port of this server"
            }
        ],
        "components": {
            "schemas": {
                "field": {
                    "type": "string",
                    "enum": ["_id", "username", "password", "description", "startDate",
                        "finishDate", "createdAt", "updatedAt"]
                },
                "updateParameter": {
                    "type": "string",
                    "enum": ["set", "insert", "increment", "decrement",
                        "multiply", "reneme", "addTimeIn_ms"]
                },
                "filterConditionParameter": {
                    "type": "string",
                    "enum": ["equal", "notEqual", "greaterThan", "greaterThanAndEqual",
                        "lessThan", "lessThanAndEqual", "in", "notIn", "existsTrueOrFalse",
                        "regularExp", "type", "size"]
                },
				"message":{
					"type":"string",
					"description":"info about the api call"
				},
                "value": {
                    "type": "object",
                    "oneOf": [{
                            "type": "string"
                        }, {
                            "type": "number"
                        }, {
                            "type": "object"
                        }
                    ]
                },
                "updateAndValue": {
                    "type": "array",
                    "maxItems": 2,
                    "minItems": 2,
                    "items": [{
                            "$ref": "#/components/schemas/updateParameter"
                        }, {
                            "$ref": "#/components/schemas/value"
                        }
                    ]
                },
                "filterAndValue": {
                    "type": "array",
                    "maxItems": 2,
                    "minItems": 2,
                    "items": [{
                            "$ref": "#/components/schemas/filterConditionParameter"
                        }, {
                            "$ref": "#/components/schemas/value"
                        }
                    ]
                },
                "filter": {
                    "type": "object",
                    "additionalProperties": {
                        "$ref": "#/components/schemas/filterAndValue"
                    },
                    "propertyNames": {
                        "$ref": "#/components/schemas/field"
                    }
                },
                "update": {
                    "type": "object",
                    "additionalProperties": {
                        "$ref": "#/components/schemas/updateAndValue"
                    },
                    "propertyNames": {
                        "$ref": "#/components/schemas/field"
                    }
                }
            }
        },
        "paths": {
            "/admin/editDta": {
                "put": {
                    "summary": "edit data in database",
                    "requestBody": {
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
										"collection":{
											"type":"string"
										},
										"multi":{
											"type":"boolean"
										},
                                        "filter": {
                                            "$ref": "#/components/schemas/filter"
                                        },
                                        "update": {
                                            "$ref": "#/components/schemas/update"
                                        }
                                    },
                                    "required": ["collection", "filter", "update"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "successful response",
                            "content": {
                                "application/json": {
                                    "schema": {
										"$ref":"#/components/schemas/message"
                                    }
                                }
                            }
                        },
						"400": {
                            "description": "bad request from user",
                            "content": {
                                "application/json": {
                                    "schema": {
										"$ref":"#/components/schemas/message"
                                    }
                                }
                            }
                        }
                    }
                }
            },
			"/admin/queryData":{
				"get":{
					"summary":"query data from database",
					"parameters":[{
						"name":"collection",
						"in":"query",
						"required":"true",
						"schema":{
							"type":"string"
						}
					},{
						"name":"fields",
						"in":"query",
						"required":"false",
						"schema":{
							"type":"array",
							"items":{
								"$ref":"#/components/schemas/field"
							}
						}
					},{
						"name":"sort",
						"in":"query",
						"required":"false",
						"schema":{
							"type":"array",
							"maxItems":2,
							"minItems":2,
							"items":[{
								"type":"string"
							},{
								"type":"number"
							}]
						}
					},{
						"name":"primaryFilter",
						"in":"query",
						"required":"true",
						"schema":{
							"$ref":"#/components/schemas/filter"
						}
					},{
						"name":"secondaryFilter",
						"in":"query",
						"required":"false",
						"schema":{
							"type":"object",
							"properties":{
								"unique":{
									"$ref":"#/components/schemas/field"
								},
								"offset":{
									"type":"number"
								},
								"limit":{
									"type":"number"
								}
							}
						}
					}],
					"responses":{
						"200":{
							"description":"success",
							"content":{
								"application/json":{
									"schema":{
										"$ref":"#/components/schemas/message"
									}
								}
							}
						},
						"400":{
							"description":"bad request",
							"content":{
								"application/json":{
									"schema":{
										"$ref":"#/components/schemas/message"
									}
								}
							}
						}
					}
				}
			}
        }
    },
    "apis": ["./index.js"]
}

import swaggerUi from "swagger-ui-express"
import swaggerJsdoc from "swagger-jsdoc"

const adminSpecs = swaggerJsdoc(options)

    export {
    swaggerUi,
    adminSpecs
}
