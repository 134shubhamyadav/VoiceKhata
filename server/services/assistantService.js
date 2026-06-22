"use strict";

const appConfig = require("../config/appConfig");
let geminiModel = null;

(async () => {
  try {
    if (appConfig.geminiApiKey) {
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(appConfig.geminiApiKey);
      geminiModel = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: `You are a helpful, conversational financial assistant for Indian merchants. 
Your goal is to help them record their daily credit (udhaar) and payments (vasuli), and answer basic questions.

When recording a transaction, you MUST gather the following:
1. Customer Name (do not use pronouns)
2. Amount in rupees
3. Transaction Type (credit, payment, cashbook_out, cashbook_in)
4. Due Date (When will they pay/return it? Default to today if it's a payment, but for credit, YOU MUST ASK IF NOT PROVIDED).

If the merchant says "I gave Ramesh 500 rupees", you must notice that the due date is missing. You should reply: "When will Ramesh return the money?"
If they answer "tomorrow", then you call the record_transaction tool.

IMPORTANT: You can speak and understand Hinglish, Hindi, English, and other regional Indian languages. Always reply in a friendly, concise manner in the language the merchant is using.
Do not output markdown, just plain text conversational responses unless calling a tool.
`,
        tools: [{
          functionDeclarations: [
            {
              name: "record_transaction",
              description: "Records a financial transaction (credit or payment) once all details are gathered.",
              parameters: {
                type: "OBJECT",
                properties: {
                  customerName: {
                    type: "STRING",
                    description: "The name of the customer (e.g. Ramesh). Use null if not applicable."
                  },
                  amount: {
                    type: "NUMBER",
                    description: "The transaction amount in rupees."
                  },
                  type: {
                    type: "STRING",
                    description: "Must be one of: credit, payment, cashbook_out, cashbook_in."
                  },
                  dueDate: {
                    type: "STRING",
                    description: "The due date in YYYY-MM-DD format."
                  },
                  note: {
                    type: "STRING",
                    description: "Any extra note or description of items."
                  }
                },
                required: ["amount", "type", "dueDate"]
              }
            }
          ]
        }]
      });
      console.log("[AssistantService] Conversational AI initialized successfully.");
    } else {
      console.warn("[AssistantService] GEMINI_API_KEY not set. Conversational assistant unavailable.");
    }
  } catch (err) {
    console.warn("[AssistantService] Gemini initialization failed:", err.message);
  }
})();

const handleChat = async (history, newMessage) => {
  if (!geminiModel) {
    return { type: "chat", text: "Sorry, the AI assistant is currently unavailable." };
  }

  try {
    // Format history for Gemini SDK
    // Gemini expects history in the format: [{role: "user" | "model", parts: [{text: "..."}]}]
    const formattedHistory = history.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.text }]
    }));

    const chat = geminiModel.startChat({
      history: formattedHistory
    });

    const result = await chat.sendMessage(newMessage);
    const response = result.response;

    // Check if the model called a function
    const calls = response.functionCalls();
    if (calls && calls.length > 0) {
      const call = calls[0];
      if (call.name === "record_transaction") {
        return {
          type: "action",
          intent: {
            customerName: call.args.customerName || null,
            amount: call.args.amount,
            type: call.args.type,
            dueDate: call.args.dueDate || null,
            note: call.args.note || null,
            confidence: 95
          },
          text: "I have prepared the transaction for you. Please confirm to save it."
        };
      }
    }

    // Normal chat response
    return {
      type: "chat",
      text: response.text()
    };
  } catch (err) {
    console.error("[AssistantService] Chat error:", err.message);
    return { type: "chat", text: "I'm having trouble processing that right now. Please try again." };
  }
};

module.exports = { handleChat };
