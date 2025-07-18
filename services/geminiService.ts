
import { GoogleGenAI } from "@google/genai";
import { User } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Motivational messages will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const getMotivationalMessage = async (user: User): Promise<string> => {
    if (!process.env.API_KEY) {
        return "Keep up the great work! Every step you take is a step towards a healthier you. You've got this!";
    }

    const currentWeight = user.weightHistory[user.weightHistory.length - 1]?.weight || user.goalWeight;
    const startWeight = user.weightHistory[0]?.weight || currentWeight;

    const prompt = `You are a kind and motivating wellness coach. My name is ${user.name}. I just logged my weight. My current weight is ${currentWeight}kg, my starting weight was ${startWeight}kg, and my goal is ${user.goalWeight}kg. Please write a short (2-3 sentences), personalized, and encouraging message for me based on my progress. Keep it positive and focus on consistency and well-being, not just the numbers. Address me by my name.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.8,
                topP: 1,
                topK: 32,
            }
        });

        return response.text;
    } catch (error) {
        console.error("Error fetching motivational message:", error);
        return "You're doing an amazing job on your health journey. Stay consistent and be proud of your efforts!";
    }
};
