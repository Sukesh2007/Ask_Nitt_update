import { hash } from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {type: String, required: true},
    password: { type: String, required: true},
    rollno: {type: String , required: true, unique: true },
    status: Boolean,
})

export const User = mongoose.model('User' , userSchema)

const answerSchema = new mongoose.Schema({
    text: String,
    username: String,
    rollno: String,
    upvotes: {type: Number , default: 0},
    downvotes: {type: Number , default: 0}
} , {_id: true})

const questionSchema = new mongoose.Schema({
    QueText: {type: String , required: true},
    tags: {type: [String] , required: true},
    postedBy: {
        username: String,
        rollno: String
    },
    answers: [answerSchema]
},{timestamps: true})

export const Question = mongoose.model('Question' , questionSchema)

const voteSchema = new mongoose.Schema({
    answerId: String,
    votes: [{
        roll: {type: String, required: true},
        type: {type: String, enum:['up' , 'down'], required: true}
    }]
})

export const Vote = mongoose.model('Vote', voteSchema)
