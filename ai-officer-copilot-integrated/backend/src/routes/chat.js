import { Router } from 'express';
import { answer } from '../services/assistant.js';
const r=Router();
r.post('/',async(req,res)=>{const message=req.body?.message;const chatId=req.body?.chatId;if(!message)return res.status(400).json({message:'message is required'});try{res.json(await answer(message,{chatId,userId:req.user.id,userName:req.user.name}))}catch(e){console.error(e);res.status(500).json({message:'Could not generate response'})}});
export default r;
