import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function askCyberAI(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert cybersecurity tutor for the course ECE5303 (Wireless Hacking and Security). Your goal is to explain concepts clearly using analogies and technical depth. Focus on concepts like 802.11 standards, Encryption (WEP, WPA2, WPA3), Wireless Attack Methodologies (Evil Twin, KRACK, Jamming), and Bluetooth Security. Keep responses structured with bullet points and bold terms. Avoid generic advice; be specific to the course material."
      }
    });
    return response.text || "No response received.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The system is currently offline or busy. Please verify your configuration and try again later.";
  }
}
