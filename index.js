import express from "express"
import session from "express-session"

import path from "path"
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

import envset from "dotenv"
envset.config()
const port = process.env.PORT || 9000


import { login, signup, logout } from "./src/auth.js"

import { createTask, editTask, completeTask, deleteTask, queryUserTasks } from "./src/task.js"

import { adminAuthPage, adminAuth, adminPanel,
	adminGetData, adminUpdateData, adminMovetoArchive, adminDeleteArchiveData } from "./src/admin.js"

const server = express()
const auth = express.Router()
const taskapi = express.Router()
const admin = express.Router()

server.use(session({
	secret:process.env.SESSION_SECRET,
	resave:false,
	saveUninitialized:true,
	cookies:{secure: false}
}))

auth.use(express.json())
auth.post("/login",login)
auth.post("/signup",signup)
auth.post("/logout",logout)

taskapi.use(express.json())
taskapi.post("/createTask",createTask)
taskapi.put("/editTask",editTask)
taskapi.put("/completeTask",completeTask)
taskapi.get("/queryUserTasks",queryUserTasks)
taskapi.delete("/deleteTask",deleteTask)

admin.use(express.static(path.join(__dirname,"static")))
admin.use(express.urlencoded({ extended: true }))
admin.use(express.json())
admin.get("/", adminAuthPage)
admin.post("/auth", adminAuth)
admin.get("/panel", adminPanel)
admin.get("/panel/:n?", adminPanel)
admin.get("/queryData", adminGetData)
admin.put("/editData", adminUpdateData)
admin.put("/adminArchive", adminMovetoArchive)
admin.delete("/deleteArchive", adminDeleteArchiveData)

server.use("/auth",auth)
server.use("/taskapi",taskapi)
server.use("/admin", admin)
server.use(express.static("static"))
server.use(express.json())


server.get("/home",(req,res)=>{
	if(! req.session.username)
	{
		res.redirect("/login")
	}
	res.sendFile(path.join(__dirname,"static","home.html"))
})

server.get("/",(req,res)=>{
	if(req.session.username)
	{
		return res.status(200).redirect("/home")
	}
	return res.status(200).redirect("/login")
})
server.get("/login",(req,res)=>{
	if(req.session.username)
	{
		return res.status(200).redirect("/home")
	}
	return res.sendFile(path.join(__dirname,"static","login.html"))
})

server.get("/signup",(req,res)=>{
	if(req.session.username)
	{
		return res.status(200).redirect("/home")
	}
	return res.sendFile(path.join(__dirname,"static","signup.html"))
})

//swagger configurable
import {swaggerUi, swaggerSpecs} from "./src/apidoc.js"
server.use("/api-doc",swaggerUi.serve,swaggerUi.setup(swaggerSpecs))

import {adminSpecs} from "./src/admin-doc.js"
server.use("/admin-doc",swaggerUi.serve,swaggerUi.setup(adminSpecs))
server.listen(port,()=>{
	console.log(`listening at port ${port}`)
})