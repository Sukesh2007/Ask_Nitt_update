import express from 'express'
import mongoose from 'mongoose'
import { connectDb } from './config/db.js'
import { Question, User, Vote } from './models/User.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import cors from 'cors';





const app = express()


let Rno = ""
//const PORT = 4004
const PORT = process.env.PORT || 4004;

await connectDb()

app.use(express.json())
app.use(cors());

app.get('/' , (req,res) => {
    res.send("Hello Express!")
})

app.post('/register', async (req, res) => {
    try {
        const { username, password, rollno } = req.body;
        const hashedPassword = await bcrypt.hash(password,10)
        const newUser = new User({
            username,
            password:hashedPassword,
            rollno,
            status: false
        });
        //Rno = rollno;
        await newUser.save();
        console.log(newUser);
        res.json({state: "User Added"});
    } catch (error) {
        console.error("Registration error:", error); 
        if(error.code == 11000){
            res.json({state:"Error: Already registered"});
        }else{
            res.json({state: "Error occured"})
        }
    }
});

app.put("/login" , async(req,res) => {
    const {rollno , password} = req.body
    const userData = await User.findOne({rollno})
    console.log(userData)
    if(!userData){
        return res.json({aunthenticate: "Invalid Credentails"})
    }else if(!await bcrypt.compare(password , userData.password)){
        return res.json({authenticate: "Invalid password"})
    }
    else{

        userData.status = true
        await userData.save()
        const token = jwt.sign({username: userData.username,
            password: userData.password,
            rollno: userData.rollno,
        } , 'secret#token@123')
        res.json({authenticate: token})
    }
    
    
    
})

app.get('/dashboard' , authenticatetoken , (req,res) => {
    res.json({check: true, name: req.user.username})
})



function authenticatetoken(req , res , next){
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).send({check: false,name:""});

    jwt.verify(token , 'secret#token@123' , (err , user) => {
        if(err) return res.status(403).send({check:false , name:""})
        req.user = user
        next()
    })
}

app.put('/logout', async(req,res) => {
    const {rollno} = req.body
    const userData = await User.findOne({rollno})
    userData.status = false
    await userData.save()
    res.json({status: "logout" , rollno})
})

app.get('/check' , async(req,res) => {
    const userData = await User.findOne({status:true})
    if(userData == null){
        res.json({test: ["No user"]})
    }
    else{
        res.json({test: [userData.rollno, userData.username]})
    }
})

app.post('/question' , async(req,res) => {
    try{
        const {quetext , tags , username , rollno} = req.body
        const tag = tags.split(',')
        const newQuestion = new Question({
            QueText: quetext, 
            tags: tag.map(t => t.trim().toLowerCase()),
            postedBy: {username , rollno}
        })
        await newQuestion.save()
        res.json({success: true, message: "Updated"})
    } catch(err){
        console.log(err)
        res.json({success: false, message: "Error in the server"})
    }

})

app.get('/questions/:rollno' , async(req,res) => {
    try{
        const roll = req.params.rollno
        const  questio = await Question.find({"postedBy.rollno":roll},{QueText: 1 , tags: 1, createdAt: 1, _id: 1})
        const formatted  = questio.map(t => {
            const date = t.createdAt.getDate()
            let month = t.createdAt.getMonth()
            const year = t.createdAt.getFullYear()
            let hours = t.createdAt.getHours()
            let minutes = t.createdAt.getMinutes()
            const seconds = t.createdAt.getSeconds()
            month = month + 1
            return {
                    QueText: t.QueText,
                    tags: t.tags,
                    timestamp: [`${date}/${month}/${year}`, `${hours}:${minutes}:${seconds}`],
                    q_id: t._id
                };
        })

        
        res.json({ success: true, questions: formatted })
    }
    catch(err){
        res.json({success: false, questions: []})
    }
})

app.put('/answer/:id' , async(req,res) => {
    try{
        const {text , username , rollno} = req.body
        const id = req.params.id
        const postanswer = await Question.findOneAndUpdate({_id: id})
        postanswer.answers.push({text , username , rollno, upvotes: 0, downvotes: 0})
        await postanswer.save()
        res.json({success: true,answers: postanswer.answers[postanswer.answers.length - 1]})
    }
    catch(err){
        console.log(err)
        res.json({success:false , answers: [err]})
    }
    
})

app.get('/question/answer/:id' , async(req,res) => {
    try{
        const id = req.params.id
        const qansdata = await Question.find({_id:id},{answers: 1})
        
        if (qansdata) {
            res.status(200).json({ success: true, answers: qansdata[0].answers });
        } else {
            res.status(404).json({ success: false, message: "Question not found" });
        }
    }
    catch(err){
        console.log(err)
        res.status(500).json({success: false, answers: []})
    }
})



app.get('/other/question/:rollno' , async(req,res) => {
    try{
        const o_roll = req.params.rollno
        const otherdata = await Question.find({"postedBy.rollno":{$ne:o_roll}},{QueText: 1 , tags: 1, createdAt: 1, _id: 1, postedBy: 1})
        const format = otherdata.map(t => {
            const date = t.createdAt.getDate()
            let month = t.createdAt.getMonth()
            const year = t.createdAt.getFullYear()
            let hours = t.createdAt.getHours()
            let minutes = t.createdAt.getMinutes()
            const seconds = t.createdAt.getSeconds()
            month = month + 1
            return {
                    QueText: t.QueText,
                    tags: t.tags,
                    timestamp: [`${date}/${month}/${year}`, `${hours}:${minutes}:${seconds}`],
                    q_id: t._id,
                    postedUsername: t.postedBy.username,
                    postedrollno: t.postedBy.rollno
                };
        })
        res.json({success: true , Other_data: format})
    }
    catch(err){
        res.json({success: false , Other_data: [err]})
        console.log(err)
    }

})

app.put('/vote/:a_id/:q_id' , async(req,res) => {
    try{
        const answerId = req.params.a_id.toString()
        const questionId = req.params.q_id.toString()
        const { roll , type} = req.body
        const voterData = await Vote.updateOne(
            { answerId },
            { $push: { votes: { roll, type } } },
            { upsert: true }
    )
        
        const answersdata = await Question.findOne({_id: questionId} , {answers: 1})
        answersdata.answers.forEach(t =>{
            if(t._id == answerId && type == 'up'){
                t.upvotes+=1
                console.log(t)
            }
            else if(t._id == answerId && type == 'down'){
                t.downvotes+=1
                console.log(t)
            }
        })
       await answersdata.save()
        res.json({success:true, message: 'voted'})
    }catch(err){
        res.json({success: false, message: `${err}`})
    }
})

app.get('/voted/answer/:id/:roll' , async(req,res) => {
    try{
    const answerid = req.params.id
    let isVoted = 0
    const roll = req.params.roll
    const votedData = await Vote.findOne({answerId: answerid})
    votedData.votes.forEach(t => {
        if(t.roll == roll){
            isVoted = 1
            res.json({type: t.type, message: t.type})
        }
    })
    if(isVoted == 0){
        res.json({type: 'no Votes' , message: 'not voted'})
    }
}
catch(err){
    res.json({type: 'error' , message: `${err}`})
}
})



app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});





