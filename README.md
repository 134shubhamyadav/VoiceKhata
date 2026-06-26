<div align="center">
  
  # 🎙️ VoiceKhata
  
  **AI-Powered Voice Ledger (Khata) App for Indian Merchants**
  
  [![Live Demo](https://img.shields.io/badge/Demo-Live-green.svg?style=for-the-badge&logo=vercel)](https://voicekhata.vercel.app/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

  <p align="center">
    Built for shopkeepers in India to effortlessly record credit (udhaar) and payments using natural voice commands in <b>Hindi, Marathi, and English</b>.
  </p>
</div>

<br />

## 🌟 Overview

For millions of local shopkeepers in India, tracking credit (udhaar) manually in notebooks is tedious and error-prone. **VoiceKhata** brings the ledger into the AI era. Instead of typing, merchants simply tap a button and speak in their native tongue:

> *"Ramesh ne 2000 ka udhar liya hai, 3 din baad vapas karega"*<br>
> *"सतीश को 800 का उधार"*<br>
> *"रमेशने दोन हजार रुपयांचा आधार घेतला आहे"*

The app instantly understands the language, extracts the **Customer Name**, **Amount**, **Transaction Type**, and calculates the exact **Due Date** using Gemini 1.5 AI, with a robust fallback multilingual parser for offline/quota scenarios.

---

## ✨ Key Features

- **🗣️ Multilingual Voice Recognition**: Speak naturally in Hindi, Marathi, Hinglish, or English.
- **🧠 Intelligent AI Parsing**: Powered by Google Gemini 1.5 Flash to accurately extract structured transaction data from messy, conversational speech.
- **🛡️ Bulletproof Rule-Based Fallback**: If the API fails, a custom built regex/dictionary parser takes over. It supports Devnagari, handles complex suffixes (e.g. *रमेशने* → *रमेश*), converts regional word-numbers to digits, and calculates relative dates (*"parso"*, *"next week"*).
- **📱 PWA Ready**: Installable as a native-feeling app on mobile devices for quick access at the shop counter.
- **💸 Smart Transaction Types**: Automatically classifies input as **Give Credit**, **Get Payment**, **Cash Out (Expense)**, or **Cash In (Sales)** based on context.

---

## 🛠️ Tech Stack

**Frontend:**
- Next.js (React)
- Tailwind CSS (for rapid, responsive, and beautiful styling)
- Web Speech API (for native, real-time voice-to-text transcription)

**Backend:**
- Node.js & Express
- Google Gemini API (`gemini-1.5-flash`) for NLP parsing
- Custom NLP rule-based parser (Hindi/Marathi/English dictionaries)

---

## 🚀 How It Works

1. **Tap the Microphone:** The merchant taps the mic button and speaks.
2. **Speech-to-Text:** The browser's native speech recognition transcribes the audio in real-time.
3. **AI Processing:** The raw transcript is sent to the backend where Gemini AI analyzes the intent.
4. **Instant Categorization:** The app extracts the exact amount, determines who the customer is (stripping linguistic suffixes), identifies if it's a payment or credit, and calculates due dates.
5. **Confirmation:** The user confirms the pre-filled form and saves it to the digital ledger.

---

## 💻 Local Setup & Installation

Follow these steps to run the project locally.

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/134shubhamyadav/VoiceKhata.git
cd VoiceKhata
```

### 2. Install dependencies
Install dependencies for both the frontend (`client`) and backend (`server`).

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Environment Variables
Create a `.env` file in the `server` directory and add your Gemini API key:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
```

Create a `.env.local` file in the `client` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 4. Start the Application
You can run both servers simultaneously:

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start using VoiceKhata!

---

## 💡 About the Hackathon Submission
This project was designed and built rapidly with a focus on solving a genuine real-world problem for local Indian businesses using modern Generative AI mixed with highly resilient traditional engineering patterns.
