
import _ from "underscore"      //for isString function

import {tasks, taskarchives} from "./database.js"      //import tasks collection from database module

//create task under the username
//req=> {req.session.username:"string",req.body.task:"",_._.description:"",_._.finishDate:Date}
//res=> {message:""}
async function createTask(req,res){
	const  data  = req.body
	
	//check if properly logged in user is making request
	if( !req.session.username)
	{
		return res.status(400).json({"message":"you are not logged in"})
	}
	
	//check if data task name and description are in string format
	if((! _.isString(data.task)) || (! _.isString(data.description)))
	{
		return res.status(400).json({"message":"task or description empty"})
	}
	
	/* check if the dates are proper */
	
	//check if task with that name exists
	try{
		const check = await tasks.findOne({"username":req.session.username,"task":data.task})
		if (check)
		{
			 return res.status(400).json({"message":"task with this name already exists"})
		}
	} catch(error) {
		return res.status(500).json({"message":`server error: ${error} occured`})
	}
	
	//create task under the username
	//console.log(`create task:${data.finishDate}`)
	try{
		await tasks.create({"username":req.session.username,
		"task":data.task,
		"description":data.description,
		"startDate": new Date(),
		"finishDate":new Date(data.finishDate)
		})
	} catch (error){
		return res.status(500).json({"message":`server error: ${error} occured`})
	}
	
	return res.status(200).json({"message":"task created successfully"})
}

//can edit only finish date, description and task name
//req=> {req.session.username:"string",req.body.task:"",_._.description:"",_._.finishDate:Date}
//res=> {message:""}
async function editTask(req,res){
	
	//check if properly logged in user is making request
	if( !req.session.username)
	{
		return res.status(400).json({"message":"you are not logged in"})
	}
	
	const data = req.body
	
	//check if they are not string
	if((! _.isString(data.task)) || (! _.isString(data.description)))
	{
		return res.status(400).json({"message":"task or description improper"})
	}
	
	/* check if startDate finishDate is valid */
	
	//find that one task that has same username task name and start date
	//console.log(`edit task:${data.finishDate}`)
	try{
		const check = await tasks.findOne({"username":req.session.username, "startDate":data.startDate})
		if( !check )
		{
			return res.status(400).json({"message":"could not find the specific task to edit"})
		}
	
		await tasks.updateOne({"username":req.session.username, "startDate":data.startDate},
			{$set:{"task":data.task,"description":data.description,"finishDate":new Date(data.finishDate)}})
	} catch(error){
		return res.status(500).json({"message":`server error: ${error} occured`})
	}
	
	res.status(200).json({"message":"task updated successsfully"})
}

//mark the task status to complete 
//req=> {req.session.username:"", req.body.startDate:Date, _._.task:""}
//res=> {message:""}
async function completeTask(req,res){
	
	//check if properly logged in user is making request
	if( !req.session.username)
	{
		return res.status(400).json({"message":"you are not logged in"})
	}
	
	const data = req.body
	
	//check if they are not string
	if((! _.isString(data.task)) || (! _.isString(data.description)))
	{
		return res.status(400).json({"message":"task or description improper"})
	}
	
	/* check if startDate finishDate is valid */
	
	//find that one task that has same username task name and start date
	try{
		const check = await tasks.findOne({"username":req.session.username, "startDate":data.startDate, "completed":false})
		if( !check)
		{
			return res.status(400).json({"message":"could not find the specific completed task to edit"})
		}
		await tasks.updateOne({"username":req.session.username, "startDate":data.startDate, "completed":false},
			{$set:{"completed":true}})
	} catch(error){
		return res.status(500).json({"message":`server error: ${error} occured`})
	}
	
	return res.status(200).json({"message":"task completion updated successfullly"})
}

//delete user task independent of whether the task is completed or not
//req=> {req.session.username:"", req.body.startDate:Date, _._.task:""}
//res=> {message:""}
async function deleteTask(req,res){
	
	//check if properly logged in user is making request
	if( !req.session.username )
	{
		return res.status(400).json({"message":"you are not logged in"})
	}
	
	const data = req.body
	
	//find that one task that has same username task name and start date
	try{
		let check = await tasks.findOne({"username":req.session.username, "startDate":data.startDate}).lean()
		if( !check )
		{
			return res.status(400).json({"message":"could not find the specific task to delete"})
		}
		
		// check= {username:check.username, task:check.task, 
		// description:check.description, startDate:check.startDate, finishDate:check.finishDate, 
		// completed:check.completed, createdAt:check.createdAt, updatedAt:check.updatedAt}
		delete check._id;
		delete check.__v;
		//await delete check.username;
		await taskarchives.create(check)
		await tasks.deleteOne({"username":req.session.username, "startDate":data.startDate})
	} catch(error){
		return res.status(500).json({"message":`server error: ${error} occured`})
	}
	
	res.status(200).json({"message":"task removed successsfully"})
}

//query both remaining and ocmpleted tasks with this function
//req=> {req.session.username:"",_._.completed:boolean(not compulsary)}
async function queryUserTasks(req,res){
	
	//check if properly logged in user is making request
	if(!req.session.username)
	{
		return res.status(400).json({"message":"you are not logged in"})
	}
	
	const data = req.query
	let alltasks = false
	
	/*return list of alltasks if and only if completed is not specified
	or specified type of complerted is not boolean*/
	if( !data.hasOwnProperty("completed"))
	{
		alltasks=true
	}
	
	//query task according to the specified rule and return result
	let tasklist=[]
	try{
		if(alltasks)
		{
			tasklist = await tasks.find({"username":req.session.username},{"task":1,"description":1,"finishData":1,"startDate":1,"completed":1})
		}
		else {
			tasklist = await tasks.find({"username":req.session.username,"completed":data.completed},{"task":1,"description":1,"finishDate":1,"startDate":1,"completed":1})
		}
		
		return res.status(200).json({"tasklist":tasklist})
		
	}catch(error){
		return res.status(500).json({"message":`server error: ${error.message} occured`})
	}
}

export { createTask, editTask, completeTask, deleteTask, queryUserTasks }