// src/controllers/ai.controller.ts
import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import prisma from '../config/db';


const ai = new GoogleGenAI({});

export const handleAssistantChat = async (req: Request, res: Response): Promise<any> => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // 2. High-integrity academic guardrails
    const systemInstruction = `
      You are an elite, encouraging academic AI Study Assistant built into the Eduflow LMS sidebar.
      Your core mission is to help students learn concepts quickly while they read their lecture materials.
      
      CRITICAL VIEWPORT & TEXT RULES:
      1. Keep your initial responses highly concise, brief, and summarized. Avoid long paragraphs or walls of text.
      2. Do not go into deep details or exhaustive background context unless the student explicitly asks for it.
      3. Never give out direct copy-paste answers to assignment questions. Guide them conceptually step-by-step.
      4. Always format your output beautifully using clean Markdown (such as bullet points, bold keywords, or short code blocks) so it fits perfectly inside a narrow side panel UI.
    `;

    const finalizedPrompt = `
      [SYSTEM LAYOUT]
      ${systemInstruction}
      
      [STUDENT QUESTION]
      ${prompt}
    `;

   console.log("Processing instant minimalist AI response...");
    
    //Call Gemini 3.5 Flash using the ultra-lightweight text instructions
    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-3.5-flash', 
      contents: finalizedPrompt,
    });

    return res.status(200).json({
      answer: geminiResponse.text,
    });

  } catch (error) {
    console.error("Gemini AI Assistant Error:", error);
    return res.status(500).json({ error: "Failed to process AI assistant request" });
  }
};