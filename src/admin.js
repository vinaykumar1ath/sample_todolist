//necessary libraries
import hasher from "crypto" 
import _ from "underscore"

// dotenv library for environment variables like session and admin password
import envset from "dotenv"
envset.config()
const admin_session = process.env.ADMIN_SESSION
const admin_auth = process.env.ADMIN_AUTH_CODE

//path dependancies for serving static files
import path from "path"

const __dirname = process.cwd()

//guides collections and condition parsers to get mongo compaitble queries
//"guide"s are guides for collections for accessing and manipulating its fields
import { databaseCollectionMap as dcm, userguide, taskguide} from "./database.js"
import { filterConditionParser, projectionParser, updateParser } from "./lib.js"


//admin home page
//serves admin authenitcation page
async function adminAuthPage(req,res){
	if(req.session.admin === admin_session){
		return res.redirect("/admin/panel")
	}
	return res.sendFile(path.join(__dirname, "static","admin-auth.html"))
}

async function adminPanel(req, res){
	
	if(! (req.session.admin === admin_session )){
		return res.status(403).json({"message":"ACCESS DENIED"})
	}
	
	return res.send("Building..........")
}

//req => {session:object, body.adminAuthCode:"string"}
//res => {message: stirng, redirect: boolean}
async function adminAuth(req,res){
	let authcode=req.body.adminAuthCode
	
	//check if admin authentication code is valid string nd 
	if(! (_.isString(authcode) && authcode.length > 1)){
		return res.status(400).json({"message":"improper authentication code","redirect":false})
	}
	
	//hashing admin auth code
	const hash = hasher.createHash("sha256")
	await hash.update(authcode)
	authcode = await hash.digest("hex")
	
	//checking admin authentication code, if it same as provided in environment variables
	if(!(authcode === admin_auth)){
		return res.status(400).json({"message":"improper authentication code","redirect":false})
	}
	
	//set the admin session if admin authenticaiton is valid
	req.session.admin = admin_session
	return res.status(200).json({"message":"LOG IN TO THE ADMIN ACCOUNT","redirect":true})
}

/*
 Admin action APIs
*/

// initialisng global vairables outside function for storing previous query values for validating
// cache from prevoius results, to avoid calculating same queries once again 
let resultArray = [] //for previous query result

let previousFilter = null //previous parsed Filter
let previousProjection = null //previous parsed projection
let previousPrimaryFilter = null //previous raw Primary filter before parsing
let previousFields = null //previous raw projection
let previousDistinct = null //previous value of, field whose unique values filtered
let previousSorter = null

//limits and skip for providing cache (may be a bad practise!!)

const distinctAggrGen = (distinct, filter, projection, sorter ) =>{
	let pipeline = []
	pipeline.push({"$match": filter })
	if(Object.keys(projection).length>0) {pipeline.push({"$project": projection })}
	const distinctMAINwithField = {"$group": {"_id": `$${distinct}`,"MAIN":{"$first":"$$ROOT"}}}
	const replaceMAINtoRoot = {"$replaceWith":"$MAIN"}
	pipeline.push(distinctMAINwithField);	pipeline.push(replaceMAINtoRoot)
	if(Object.keys(sorter).length>0) { pipeline.push({"$sort": sorter })} 
	return pipeline
	}

/*
-----------------------------------------------------------------------------------------------------------------------------------------------------------------
//req=> {params:{}, query:{filter:{},projection:[] }}
//res=> text/html , {list:[],offset,count}
req-> collection, fields:[list], sort:[field,ascORdesc], primaryFilter:{field:[condition,value],....}, secondaryFilter(unique:field, skip:number, limit:number)
------------------------------------------------------------------------------------------------------------------------------------------------------------------
*/
//function to retrive data from database
async function adminGetData(req,res){
	
	//checking if actually admin is making the request
	if(! (req.session.admin === admin_session )){
		return res.status(403).json({"message":"ACCESS DENIED"})
	}
	
	console.log("---------query---------\n",req.query,"\n------------query------------")
	
	const data = req.query
	
	let message = ""
	let skip = 0
	let limit = 10
	
	let data_primaryFilter
	let data_fields
	let data_secondaryFilter
	let data_sort
	
	try{
		data_primaryFilter = JSON.parse(data.primaryFilter)
	} catch(error){
		return res.status(400).json({"message":"essential data missing: can't parse primaty filter"})
	}
	try{
		data_fields = JSON.parse(data.fields)
		data_secondaryFilter = JSON.parse(data.secondaryFilter)
		data_sort = JSON.parse(data.sort)
	}catch(error){
		message = `can't parse either fields, secondaryFilter or sort ${error}`
	}
	
	//check if collection exists in database
	let collection = data.collection
	if( !(collection in dcm)){
		return res.status(400).json({"message":"collection doesnt exist in database "+message})
	}
	
	//setting right guide for the collection provides
	let guide = null
	if((collection === "users")||(collection === "userarchives"))
		guide = userguide
	else guide = taskguide
	collection = dcm[collection]
	
	
	//values of previous raw queries and parsed queries are both cached|
	//raw queries because if they are same, we dont have to parse them again
	//parsed results because, even if one only component of filter like projection, primaryFilter,
	//secondaryFilter is changed, we have to query database again, then we need parsed results of 
	//unchanged filter components also 
	
	let reCompute = false
	
	//cheking if projection is same as previous one and validation of new projeciton in query
	let projection = {}
	
	if(data_fields){
	if(previousFields !== data_fields){ 
		projection = await projectionParser(data_fields, guide)
		if(! projection.valid){
			return res.status(400).json({"mesage":`projection error: ${projection.error} , ${message}`})
		}
		reCompute = true
		//setting previousFields to the present value to check it in next api call
		previousFields = data_fields
		projection = projection.object
		//setting previousProjection to the present value to check it in next api call
		previousProjection = projection
		//setting previous parsed projection if the provided raw projection is same
	} else projection = previousProjection
	}
	
	
	let filter = null
	if(previousPrimaryFilter !== data_primaryFilter){
		filter =  await filterConditionParser(data_primaryFilter, guide)
		if(! filter.valid){
			return res.status(400).json({"message":`primary filter error: ${filter.error} , ${message}`})
		}
		reCompute = true
		previousPrimaryFilter = data_primaryFilter
		filter = filter.object
		previousFilter = filter
	} else filter = previousFilter
	
	
	let distinct
	if(data_secondaryFilter){
	if(data_secondaryFilter.unique !== previousDistinct){
		previousDistinct = null
	}
	// field provided for unique filtering is actually pesent in collection
	if ( data_secondaryFilter.unique in guide ){
		previousDistinct = data_secondaryFilter.unique
		reCompute = true
		distinct = data_secondaryFilter.unique
	}
	
	skip = data_secondaryFilter.skip || 0
	limit = data_secondaryFilter.limit || 10
	}
	
	//validating the field provided for sorting
	let sorter = {}
	if(data_sort){
	if(data_sort[0] in guide && (data_sort[1] === 1 || data_sort[1] === -1 )){
		//sorter = {`${data.sort[0]}`: data.sort[1]}
		sorter[data_sort[0]] = data_sort[1]
	}
	}
	
	//checking for sorting field has changed to recompute
	if(sorter !== previousSorter){
		reCompute = true
		previousSorter = sorter
	}
	
	
	console.log("data_sort", data_sort, typeof data_sort)
	console.log("sorter", sorter, typeof sorter)
	
	console.log("distinct ",distinct)
	console.log("projection ",projection, typeof projection)
	console.log("filter ",filter, typeof filter)
	
	
	let returnList = []
	try{
		if(reCompute){
			if(distinct){				
				resultArray = await collection.aggregate(distinctAggrGen(distinct, filter, projection, sorter))
			} else {
				resultArray = await collection.find(filter, projection).sort(sorter).exec()
			}
		}
		returnList = resultArray.slice(skip, skip + limit)
	} catch(error){
		console.log(error)
		return res.status(500).json({"message":`server error:${error}`})
	}
	
	
	return res.status(200).json({"list":returnList, "skip":skip, "count":returnList.length, "message":message})
}


/*
---------------------------------------------------------------------------------------------------------------------------
//req=> {user:{},task:{}}
//res=> {message: ""} consider:redirct to get req
req -> collection:name, multi:true, primaryFilter:{field:[condition,value],....},update:{field:["update operation",value]}
if a single record is selected send its unique identifier data
$add  $set will be available options to manipulate date
---------------------------------------------------------------------------------------------------------------------------
*/

//function to edit data in database
async function adminUpdateData(req,res){
	
	//validating admin
	if(! (req.session.admin === admin_session )){
		res.status(403).json({"message":"ACCESS DENIED"})
	}
	const data = req.body
	
	console.log("---------query---------\n",req.body,"\n------------query------------")
	
	let collection = data.collection
	//check if collection exists in database
	if( !(collection in dcm)){
		return res.status(400).json({"message":"collection doesnt exist in database"})
	}
	
	
	const data_primaryFilter = data.primaryFilter
	const data_update = data.update
	
	//setting guide for collection
	let guide = null
	if((collection === "users") || (collection === "userarchives")) guide = userguide
		else guide = taskguide
	
	collection = dcm[collection]
	
	console.log("--------guide----------\n",guide,"\n-------------guide-----------")
	
	//parsing filter
	
	let filter = await filterConditionParser(data_primaryFilter, guide)
	if(! filter.valid){
		return res.status(400).json({"message":`primary filter error: ${filter.error}`})
	}
	filter = filter.object
	
	//update parsing
	let update = await updateParser(data_update, guide)
	if (! update.valid){
		return res.status(400).json({"message":`update parse error: ${update.error}`})
	}
	update = update.object
	
	console.log("update ",update, typeof update)
	console.log("filter ",filter, typeof filter)
	
	let result = {}
	try{
		if(data.multi === true) //checking if multi update is true
			result = await collection.updateMany(filter,update)
		else result = await collection.updateOne(filter,update)
	} catch(error){
		return res.status(500).json({"message":`server error: ${error}`})
	}
	
	return res.status(200).json({"message":"successfully updated data", "count":result.modifiedCount})
}


/*
--------------------------------------------------------------------------------------------------------
//req {filter:{}}
//res {message: ""}
req -> collection, multi:true, primaryFilter:{field:[condition,value],....}
--------------------------------------------------------------------------------------------------------
*/

//function to move data or user to archive
async function adminMovetoArchive(req,res){
	
	//validting admin
	if(! (req.session.admin === admin_session )){
		res.status(403).json({"message":"ACCESS DENIED"})
	}
	const data = req.body
	
	console.log("---------query---------\n",req.body,"\n------------query------------")
	
	let collection = data.collection
	//check if collection exists in database and not archive
	if( !(["users","tasks"].includes(collection))){
		return res.status(400).json({"message":"collection doesnt exist in database or already in archive"})
	}
	let archive = null
	let guide = null
	if(collection == "users"){
		archive = "userarchives"
		guide = userguide
	} else{
		archive = "taskarchives"
		guide = taskguide
	}
	console.log("--------guide----------\n",guide,"\n-------------guide-----------")
	
	// setting archive and working collections
	collection = dcm[collection]
	archive = dcm[archive]
	
	
		const data_primaryFilter = data.primaryFilter
	
	//pasing filter
	let filter = await filterConditionParser(data_primaryFilter, guide)
	if(! filter.valid){
		return res.status(400).json({"message":`primary filter error: ${filter.error}`})
	}
	filter = filter.object
	
	console.log("filter ",filter, typeof filter)
	
	// moving data from working collection to archives
	let archiveList = []
	let result = {}
	try{
		if(data.multi === true) archiveList = await collection.find(filter).lean()
				else archiveList = await collection.findOne(filter).lean()
		delete archiveList._id;
		delete archiveList.__v;
		
		await archive.create(archiveList)
		if(data.multi === true) result = await collection.deleteMany(filter)
				else result = await collection.deleteOne(filter)
	} catch(error){
		return res.status(500).json({"message":`server error: ${error}`})
	}
	
	return res.status(200).json({"message":"successfully moved to archive", "count":result.deletedCount})
}


/*
---------------------------------------------------------------------------------------------------------
//req {filter:{}}
//res {message: ""}
req -> collection, multi:true, primaryFilter:{field:[condition,value],....}
---------------------------------------------------------------------------------------------------------
*/
//function to delete data in database
async function adminDeleteArchiveData(req,res){
	
	if(! (req.session.admin === admin_session )){
		res.status(403).json({"message":"ACCESS DENIED"})
	}
	const data = req.body
	
	console.log("---------query---------\n",req.body,"\n------------query------------")
	
	let archive = data.collection
	//check if collection exists in database and not archive
	if( !(["userarchives","taskarchives"].includes(archive))){
		return res.status(400).json({"message":"collection doesnt exist in database or not archive collections"})
	}
	
	let guide = null
	if(archive === "userarchives") guide = userguide
	else  guide = taskguide
	
	archive = dcm[archive]
	
	console.log("--------guide----------\n",guide,"\n-------------guide-----------")
	
	
		const data_primaryFilter = data.primaryFilter
	
	
	//parse filter
	let filter = await filterConditionParser(data_primaryFilter, guide)
	if(! filter.valid){
		return res.status(400).json({"message":`primary filter error: ${filter.error}`})
	}
	filter = filter.object
	
	//delete from archive
	let result = {}
	try{ //delete multiple records if multi is set to true
		if(data.multi === true) result = await archive.deleteMany(filter)
			else result = await archive.deleteMany(filter)
	} catch(error){
		return res.status(500).json({"message":`server error:${error}`})
	}
	
	return res.status(200).json({"message":"deleted from archive","count":result.deletedCount})
	
}

export { adminAuth, adminAuthPage, adminPanel, adminGetData, adminUpdateData, adminMovetoArchive, adminDeleteArchiveData}


/*
	guidetable:{field:[DisplayName, type],.......}
	conditionparser:{conditionstring, $$$$$mongodbEquivalentConditionStatement }
	updateparser:{updatename, $$$$$$mongodbeqUpdateStatement}
	
*/

/*
frontend features:
automatic offfset and limits to large datasets: use cache on cursor objects
warning before edit all and delete all """that are according to that filter""" 
remove annoying alerts for frontend instead add warning alerts
cant perform editall or delete all when seondary filters are set(primary: filter1 secondary: filter2)
checkboxes for projection object
make priorities for filters: collection->primaryfilter->secondaryfilter 
if value of higher priority changes, clear all values of lower priorities

alternative:(implemented //)
providing skip(offset value) from frontend is optimal, only query datbase if offset is zero
handle the offset value in frontend, no clear design till who holds control on skip field
*/

/*
swagger impl for admin auths
*/