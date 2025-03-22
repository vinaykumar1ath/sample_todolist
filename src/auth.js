import hasher from "crypto"      //module to generate hash of password
import _ from "underscore"     // _ for isString function
import {users} from "./database.js" //import only users table

// dotenv library for environment variables like session and admin password
import envset from "dotenv"
envset.config()
const admin_session = process.env.ADMIN_SESSION

//req=> {session:object,...}
//res=> {message:"detail"}
async function login(req,res){
	const data = req.body
	
	//check if user is already logged in if yess redirct to /home
	if( req.session.username )
	{
	return res.json({"message":"you are already logged in","redirect":true})
	}
	
	//check the below fields are string
	if( (! _.isString(data.username)) ||(! _.isString(data.password)) )
	{
		return res.status(400).json({"message":"username or password is improper"})
	}
	
	if(data.username === admin_session ){
		data.adminAuthCode = data.password
		try{
			const response = await fetch(`http://localhost:${process.env.PORT}/admin/auth`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)  // Send data as JSON in the body
			});
			const responseData = await response.json();
			if(responseData.redirect === true){
				req.session.admin = admin_session
				return res.status(200).json({"message":responseData.message,"redirect": true, "redirectURL":"/admin/panel"})
			} else return res.status(400).json({"message":responseData.message, "redirect": false})
		} catch(error){
			console.error("admin auth error: ", error)
			return res.status(400).json({"message": "error in admin authentication", "redirect": false})
		}
		
	}
	//generate hash of password
	const hash = hasher.createHash("sha256")
	await hash.update(data.password)
	const password = await hash.digest("hex")
	
	//check if user already has an account, if yse log them in
	try{
		const check = await users.findOne({"username":data.username,"password":password})
		if ( !check)
		{
			return res.status(400).json({"message":"matching username and password not found  \n" })
		}
	} catch(error) {
		console.log(error)
		return res.status(500).json({"message":`server error: ${error} occured`})
	}
	
	//log user in by creating session cookie
	req.session.username = data.username
	return res.status(200).json({"message":"successfully logged in","redirect":true})
}

//req=> {session:object,...}
//res=> {message:detail}
async function signup(req,res){
	
	//check if user is already logged in, if yes redirect to /home
	if ( req.session.username )
	{
		return res.status(400).json({"message":"you are already logged in","redirect":true})
	}
	
	//check if enters fields are proper
	const data = req.body
	if( (! _.isString(data.username)) ||(! _.isString(data.password)) || !validateUsername(data.username) || data.username.length < 5 )
	{
		return res.status(400).json({"message":"username or password improper"})
	}
	
	//check if username is already taken 
	try{
		const check = await users.findOne({"username":data.username})
		if(check){
			return res.status(400).json({"message":"User exists with this username\n Choose a new username"})
		}
	} catch (error) {
		res.status(500).json({"message":`${error} occured`})
	}
	
	//generate hash of password
	const hash = hasher.createHash("sha256")
	await hash.update(data.password)
	const password = await hash.digest("hex")
	
	//insert new user and his credentials in database
	try{
		await users.create({ "username": data.username, "password": password})
	} catch(error) {
		return res.status(400).json({"message":`{error} occured`})
	}
	
	//assign sesssion cookie to always keep the user logged in 
	req.session.username = data.username
	return res.status(200).json({"message":"user registered sucessfully","redirect":true})
}

//req=> {session:object,...}
//res=> {message:detail}
async function logout(req,res){
	
	//checking if useris actually logged in to logout
	try{
		if(req.session.username)
		{
			req.session.destroy()
			req.session = null
			res.status(200).json({"message":"successfully logged out"})
		} else {
			res.status(400).json({"message":"You logged out already OR \n Not signed in "})
		}
	} catch(error){
		res.status(500).json({"message":"something went wrong"})
	}
}


function validateUsername(username) {
  // This regular expression allows letters (both uppercase and lowercase), digits, underscores, and hyphens
  const regex = /^[a-zA-Z0-9_-]+$/;

  // Test the username against the regex pattern
  if (!regex.test(username)) {
    return false; // Invalid username
  }
  return true; // Valid username
}

export { login, signup, logout }