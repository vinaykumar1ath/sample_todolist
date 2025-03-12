/**
 * Converts a JSON object into a URL-encoded query string for GET requests.
 * It supports nested objects and arrays.
 * 
 * @param {Object} obj - The JSON object to convert to a query string.
 * @param {string} prefix - The prefix to use for nested objects (default is '').
 * @returns {string} - The URL-encoded query string.
 */
 
 /*
function toQueryString(obj, prefix = '') {
  let queryString = [];

  // Loop through each key in the object
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const encodedKey = encodeURIComponent(prefix + key); // Encode the key

      if (typeof value === 'object' && value !== null) {
        // Handle nested objects or arrays
        if (Array.isArray(value)) {
          // For arrays, use [] to indicate array indexing in query string
          value.forEach((item, index) => {
            queryString.push(toQueryString({ [index]: item }, encodedKey + '[]'));
          });
        } else {
          // For nested objects, recurse with added prefix
          queryString.push(toQueryString(value, encodedKey + '['));
        }
      } else {
        // For primitive values (string, number, etc.), encode and append
        queryString.push(`${encodedKey}=${encodeURIComponent(value)}`);
      }
    }
  }

  return queryString.join('&'); // Join all the parts together as a query string
}
*/

function isISODateString(str) {
  const date = new Date(str);
  return !isNaN(date.getTime()) && str === date.toISOString();
}

//function to render html and ```edit js``` using query{} and data[] 
//async function renderHTML(query, data){}

import {mongoConditionParser as mcp, mongoUpdateParser as mup } from "./database.js"


//return object ,valid(bool) and error 
//primaryFilter:{field:[condition,value],....}
//mongoFilter: {field:{"mongoCond","value"},...}
async function filterConditionParser(rawObj, guide){
	
	let result = {
		object: {},
		valid: true,
		error: ""
	}
	
	// checking if provided object is in json form
	if(! (rawObj instanceof Object )){
		result.valid = false
		result.error = "provided Filterobject is not JSON object"
		return result
	}
	
	//extracting all fields from a input object to a list for making them easy to iterate on
	const fields = Object.keys(rawObj)
	
	console.log("------------------filterParser--------------------")
	console.log("fields",fields, typeof fields)
	
	for(const field of fields){
		
		//checking if field is in the collection (through guide)
		if(! (field in guide)){
			result.valid = false
			result.error = `${field} is not in collection`
			break
		}
		
		console.log("field check over",field, typeof field)
		
		//checking if provided condition is a valid condition
		if(! (rawObj[field][0] in mcp)){
			result.valid = false
			result.error = `In field ${field} :${rawObj[field][0]} is not in a mongo Condition Parser`
			break
		}
		
		console.log("check mongo condition in mcp",rawObj[field][0], typeof rawObj[field][0])
		
		//branching conditions, that have specific "type" of value to have and
		//condition that accept value of type of the "field" 
		if(mcp[rawObj[field][0]][1] === "" ){
			
			console.log("type of value for mongo condition",mcp[rawObj[field][0]][1], typeof mcp[rawObj[field][0]][1])
			
			//check if provided value is same as provided in the collection guide,
			// make sure it is not of type Date
			if(! ((typeof rawObj[field][1] === guide[field][2]) || guide[field][2] === "date" )){
				result.valid = false
				result.error = `In field ${field} provided value: ${rawObj[field][1]} is not instance of ${guide[field][2]} guide field`
				break
			}
			console.log("value ",rawObj[field][1], typeof rawObj[field][1])
			
			// make sure its not date, to skip, if it is ,check if its a valid date
			if(! (guide[field][2] !== "date" || isISODateString(rawObj[field][1]) )){
				result.valid = false
				result.error = `In field ${field} value ${rawObj[field][1]} is not ISO Date String`
				break
			}
			
			console.log("GUIDE FIELD for the field",guide[field][2], typeof guide[field][2])
			
		} else {
			console.log("value ",rawObj[field][1], typeof rawObj[field][1])
			//check if the provided "type" of value matches the type provided in the guide field
			if(! (typeof rawObj[field][1] === mcp[rawObj[field][0]][1])){
				result.valid = false
				result.error = `In field ${field} value ${rawObj[field][1]} provided is not of type ${mcp[rawObj[field][0]][1]}`
				break
			}
		}
		// construct a mongo db compatible json object
		result.object[field]={}
		console.log("mongo condition key",mcp[rawObj[field][0]][0], typeof mcp[rawObj[field][0]][0])
		console.log("value",rawObj[field][1], typeof rawObj[field][1])
		
		result.object[field][mcp[rawObj[field][0]][0]] = rawObj[field][1]
		
		console.log("result",result.object, typeof result.object)
	}
	
	console.log("------------------filterParser--------------------")
	return result
}

//return object valid(bool) and error
//args: fields:[list]
//mongoProjection: {field1:1, field2:1, field3:3}
async function projectionParser(rawList, guide){
	let result = {
		object : {},
		valid : true,
		error : ""
	}
	//check if its a valid list
	if(! (Array.isArray(rawList))){
		result.valid = false
		result.error = "provided projection List is not a List"
		return result
	}
	
	for(const field of rawList){
		//check if the field is in the collection guide
		if (! (field in guide)){
			result.valid = false
			result.error = `field ${field} is not in collection`
			break
		}
		//mark the field for projection as mongo compatible document
		result.object[field] = 1
	}
	return result
}

//return object and valid(bool)
//update:{field:["update operation",value]}
//mongoUpdate:{"mongoUpdate":{field: value}}
async function updateParser(rawObj, guide){
	let result = {
		object : {},
		valid : true,
		error : ""
	}
	// checking if provided object is in json form
	if(! (rawObj instanceof Object)){
		result.valid = false
		result.error = "provided Update Object is not a valid Object"
		return result
	}
	
	//extracting all fields from a input object to a list for making them easy to iterate on
	const fields = Object.keys(rawObj)
	
	console.log("------------------updateParser--------------------")
	console.log("fields",fields, typeof fields)
	
	//checking if field is in the collection (through guide)
	for(const field of fields){
		
		if (! (field in guide)){
			result.valid = false
			result.error = `field ${field} is not in collection`
			break
		}
		console.log("field check over",field, typeof field)
		
		//checking if provided update parameter is a valid update parameter
		if(! (rawObj[field][0] in mup)){
			result.valid = false
			result.error = `In field ${field} update operation ${rawObj[field][0]} is not in mongo Update Parser`
			break
		}
		
		console.log("check mongo update parameter in mup",rawObj[field][0], typeof rawObj[field][0])
		
		//branching conditions, that have specific "type" of value to have and
		//condition that accept value of type of the "field" 
		if(mup[rawObj[field][0]][1] === ""){
			
			console.log("type of value for mongo update parameter",mup[rawObj[field][0]][1], typeof mup[rawObj[field][0]][1])
			
			//check if provided value is same as provided in the collection guide,
			// make sure it is not of type Date
			if(! (typeof rawObj[field][1] === guide[field][2] || guide[field][2] === "date" )){
				result.valid = false
				result.error = `In field ${field} value is not instance of ${guide[field][2]} guide field`
				break
			}
			console.log("value ",rawObj[field][1], typeof rawObj[field][1])
			
			// make sure its not date, to skip, if it is ,check if its a valid date
			if(! (guide[field][2] !== "date" || isISODateString(rawObj[field][1]))){
				result.valid = false
				result.error = `In field ${field} value ${rawObj[field][1]} is not ISO Date string`
				break
			}
			console.log("GUIDE FIELD for the field",guide[field][2], typeof guide[field][2])
			
		} else {
			console.log("value ",rawObj[field][1], typeof rawObj[field][1])
			
			//check if the provided "type" of value matches the type provided in the guide field
			if(! ( typeof rawObj[field][1] === mup[rawObj[field][0]][1])){
				result.valid = false
				result.error = `In field ${field} value ${rawObj[field][1]} provided is not of type ${mup[rawObj[field][0]][1]} `
			}
		}
		// construct a mongo db compatible json object
		
		console.log("mongo update key",mup[rawObj[field][0]][0], typeof mup[rawObj[field][0]][0])
		console.log("value",rawObj[field][1], typeof rawObj[field][1])
		
		result.object[mup[rawObj[field][0]][0]] = {}
		result.object[mup[rawObj[field][0]][0]] [field] = rawObj[field][1]
		
		console.log("result",result.object, typeof result.object)
	}
	console.log("------------------updateParser--------------------")
	return result
}

export {isISODateString, filterConditionParser, projectionParser, updateParser}