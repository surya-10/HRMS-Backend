require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


exports.inferReason = async (text) => {
    try {
        // console.log("Extracting Reason for Leave Request:", text);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Extract the reason for this leave request: "${text}". Just return the reason in a single word or phrase. If no reason provided just return not found`;

        const result = await model.generateContent(prompt);
        // console.log("Result:", result);
        const response = await result.response;
        const reason = response.text();
        

        // console.log("Extracted Reason:", reason.trim());
        return reason.trim()
    } catch (error) {
        console.error("Error:", error);
    }
}

// Example usage

