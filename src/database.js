import mongoose from "mongoose"
import envset from "dotenv"
envset.config()
 
 mongoose.connect(`mongodb://localhost:${process.env.DB_PORT}/${process.env.DB_NAME}`).then(()=>{
	 console.log("database connected")
 }).catch((error)=>{
	 console.log(error)
 })
 
 //unique records id of task is: combination of username, task name and startDate in ISO format
 //username and task also make unique documents
 const taskSchema = new mongoose.Schema(
 {
	 username:{ type:String, require:true},
	 task:{ type:String, require:true },
	 description:{ type:String, require:true },
	 startDate:{ type:Date, require: true  },
	 finishDate:{ type:Date, require:true },
	 completed:{ type:Boolean, default:false }
 },
 {
	 timestamps: true
 })
 
 //unique id of a user is username
 const userSchema = new mongoose.Schema(
 {
	 username:{ type:String, require:true },
	 password:{ type:String, require:true }
 },
 {
	 timestamps:true
 })

const { users, tasks, userarchives, taskarchives } = {
  users: mongoose.model("user", userSchema),
  tasks: mongoose.model("task", taskSchema),
  taskarchives: mongoose.model("taskarchive",new mongoose.Schema({}, { strict: false })),
  userarchives: mongoose.model("userarchive",new mongoose.Schema({}, { strict: false }))
}

//guide for manupilating data of collections
/*
	guidetable:{field:[DisplayName, type],.......}
	conditionparser:{conditionstring, $$$$$mongodbEquivalentConditionStatement }
	updateparser:{updatename, $$$$$$mongodbeqUpdateStatement}
	
*/
 //check if types are valid
const taskguide = {
	_id:["ID", "text", "object"],
	task:["Task", "text", "string"],
	username:["User Name","text", "string"],
	description:["Description", "text", "string"],
	startDate:["Start Date&Time", "datetime-local", "date"],
	finishDate:["Finish Date&Time", "datetime-local", "date"],
	completed:["Completion Status","boolean", "boolean"],
	createdAt:["Record Creation Date&Time", "datetime-local", "date"],
	updatedAt:["Last Updated Date&Time", "datetime-local", "date"]
}

const userguide = {
	_id:["ID",,"text", "object" ],
	username:["User Name","text", "string" ],
	password:["password Hashed","text", "string"],
	createdAt:["Record Creation Date&Time", "datetime-local", "date"],
	updatedAt:["Last Updated Date&Time", "datetime-local", "date"]
}

//excludes some array filtering and less used conditions
const mongoConditionParser = {
	"equal":["$eq",""],
	"notEqual":["$ne",""],
	"greaterThan":["$gt",""],
	"greaterThanOrEqual":["$gte",""],
	"lessThan":["$lt",""],
	"lessThanOrEqual":["$lte",""],
	"in":["$in","string"],
	"notIn":["$nin","string"],
	"existsTrueOrFalse":["$exists","boolean"],
	"regularExp":["$regex","string"],
	"type":["$type","string"],
	"size":["$size","number"],
	"and":["$and","NA"],
	"or":["$or","NA"],
	"nor":["$nor","NA"],
	"not":["$not","NA"]
}

const mongoUpdateParser = {
	"set":["$set",""],
	"insert":["$set",""],
	"unset":["$unset",""],
	"increment":["$inc","number"],
	"decrement":["$inc","number"],//use negative values to decrement
	"multiply":["$mul","number"],
	"rename":["$rename",""],
	"addTimeIn_ms":["$add","number"]
}

const databaseCollectionMap = {
	"users":users,
	"tasks":tasks,
	"taskarchives":taskarchives,
	"userarchives":userarchives
}

export {users, tasks, userarchives, taskarchives, mongoConditionParser, mongoUpdateParser, databaseCollectionMap,
	userguide, taskguide}