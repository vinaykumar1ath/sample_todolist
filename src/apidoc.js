import envset from "dotenv"
envset.config()

const options = {
    definition: {
        "openapi": "3.0.0",
        "info": {
            "version": "0.0.1",
            "description": "A Single page Application for maintaining ToDoList",
            "title": "ToDoList WebApp"
        },
        "server": [{
                "url": `http://localhost:${process.env.PORT}/`,
                "description": "primary local port"
            }
        ],
        "components": {
            "schemas": {
                "empty": {
                    "type": "object",
                    "properties": {}
                },
                "message": {
                    "type": "object",
                    "properties": {
                        "message" :{
                            "type": "string",
                            "description": "message sent from server about the status of the request",
							"required":"true"
                        }
                    }
                },
				"auth-message": {
                    "type": "object",
                    "properties": {
                        "message" :{
                            "type": "string",
                            "description": "message sent from server about the status of the request",
							"required":"true"
                        },
						"redirect":{
							"type":"boolean",
							"description":"Indicates redirection"
						}
                    }
                },
				"tasklist":{
					"type":"object",
					"properties":{
						"tasklist":{
							"type":"array",
							"items":{
								"$ref":"#/components/schemas/task"
							}
						}
					}
				},
                "user": {
                    "type": "object",
                    "properties": {
                        "username": {
                            "type": "string",
                            "description": "username that uniquely identifies the user"
                        },
                        "password": {
                            "type": "string",
                            "description": "password to authenticate"
                        }
                    }
                },
                "task": {
                    "type": "object",
                    "properties": {
                        "task": {
                            "type": "string",
                            "description": "Task name",
							"required":"true"
                        },
                        "description": {
                            "type": "string",
                            "description": "description for the task",
							"required":"true"
                        },
                        "startDate": {
                            "type": "string",
							"format":"date-time",
                            "description": "start Date of the task not sent whilr creating Task"
                        },
                        "finishDate": {
                            "type": "string",
							"format":"date-time",
                            "description": "finish Date of the task user can edit this",
							"required":"true"
                        },
                        "completed": {
                            "type": "boolean",
                            "description": "Indicate whether the task is completed or not"
                        }
                    }
                }
            }
        },
		"paths": {
            "/auth/login": {
                "post": {
					"tags":["Auth"],
                    "summary": "Login Page",
                    "requestBody": {
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/user"
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Successful request",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/auth-message"
                                    }
                                }
                            }
                        },
                        "400": {
                            "description": "Bad request from the User",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/auth-message"
                                    }
                                }
                            }
                        },
                        "500": {
                            "description": "Something wrong at the server end",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/auth-message"
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/auth/signup": {
                "post": {
					"tags":["Auth"],
                    "summary": "SignUp Page",
                    "requestBody": {
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/user"
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Successful request",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/auth-message"
                                    }
                                }
                            }
                        },
                        "400": {
                            "description": "Bad request from the User",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/auth-message"
                                    }
                                }
                            }
                        },
                        "500": {
                            "description": "Something wrong at the server end",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/auth-message"
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/auth/logout": {
                "post": {
					"tags":["Auth"],
                    "summary": "Logging out the user",
                    "requestBody": {
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/empty"
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Successful request",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/auth-message"
                                    }
                                }
                            }
                        },
                        "400": {
                            "description": "Bad request from the User",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/auth-message"
                                    }
                                }
                            }
                        },
                        "500": {
                            "description": "Something wrong at the server end",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/auth-message"
                                    }
                                }
                            }
                        }
                    }
                }
            },
			"/taskapi/createTask":{
				"post":{
					"tags":["taskAPI"],
					"summary":"Create a new task under the user",
					"requestBody":{
						"content":{
							"application/json":{
								"schema":{
									"$ref":"#/components/schemas/task"
								}
							}
						}
					},
					"responses":{
                        "200": {
                            "description": "Successful request",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/message"
                                    }
                                }
                            }
                        },
                        "400": {
                            "description": "Bad request from the User",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/message"
                                    }
                                }
                            }
                        },
                        "500": {
                            "description": "Something wrong at the server end",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/message"
                                    }
                                }
                            }
                        }
                    }
				}
			},
			"/taskapi/editTask":{
				"put":{
					"tags":["taskAPI"],
					"summary":"edits existing task",
					"requestBody":{
						"content":{
							"application/json":{
								"schema":{
									"$ref":"#/components/schemas/task"
								}
							}
						}
					},
					"responses":{
                        "200": {
                            "description": "Successful request",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/message"
                                    }
                                }
                            }
                        },
                        "400": {
                            "description": "Bad request from the User",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/message"
                                    }
                                }
                            }
                        },
                        "500": {
                            "description": "Something wrong at the server end",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/message"
                                    }
                                }
                            }
                        }
                    }
				}
			},
			"/taskapi/completeTask":{
				"put":{
					"tags":["taskAPI"],
					"summary":"Mark the task as complete",
					"requestBody":{
						"content":{
							"application/json":{
								"schema":{
									"$ref":"#/components/schemas/task"
								}
							}
						}
					},
					"responses":{
                        "200": {
                            "description": "Successful request",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/message"
                                    }
                                }
                            }
                        },
                        "400": {
                            "description": "Bad request from the User",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/message"
                                    }
                                }
                            }
                        },
                        "500": {
                            "description": "Something wrong at the server end",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/message"
                                    }
                                }
                            }
                        }
                    }
				}
			},
			"/taskapi/queryUserTasks":{
				"get":{
					"summary":"fetch tasks from database according to the completion status",
					"tags":["taskAPI"],
					"parameters":[{
						"name":"completed",
						"in":"query",
						"required":"true",
						"schema":{
							"$ref":"#/components/schemas/task/properties/completed"
						}
					}],
					"responses":{
						"200":{
							"content":{
								"application/json":{
									"schema":{
										"$ref":"#/components/schemas/tasklist"
									}
								}
							}
						},
						"400": {
                            "description": "Bad request from the User",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/message"
                                    }
                                }
                            }
                        },
                        "500": {
                            "description": "Something wrong at the server end",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/message"
                                    }
                                }
                            }
                        }
					}
				}
			},
			"/taskapi/deleteTask":{
				"delete":{
					"tags":["taskAPI"],
					"summary":"Deletes Task from database",
					"requestBody":{
						"content":{
							"application/json":{
								"schema":{
									"$ref":"#/components/schemas/task"
								}
							}
						}
					},
					"responses":{
                        "200": {
                            "description": "Successful request",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/message"
                                    }
                                }
                            }
                        },
                        "400": {
                            "description": "Bad request from the User",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/message"
                                    }
                                }
                            }
                        },
                        "500": {
                            "description": "Something wrong at the server end",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/message"
                                    }
                                }
                            }
                        }
                    }
				}
			}
        },
		"tags":["taskAPI","Auth"]
	},
	"apis":["./index.js"]
}

import swaggerJsdoc from "swagger-jsdoc"
import swaggerUi from "swagger-ui-express"

const swaggerSpecs = swaggerJsdoc(options)

export {swaggerUi, swaggerSpecs}