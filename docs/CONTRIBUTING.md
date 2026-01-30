# 🤝 Contributing to EcoSustain

Thank you for your interest in contributing to EcoSustain! This guide will help you get started.

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Project Setup](#project-setup)
3. [Adding New AI Features](#adding-new-ai-features)
4. [Code Structure](#code-structure)
5. [Pull Request Process](#pull-request-process)
6. [Testing](#testing)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **MongoDB Atlas** (free) - [Sign up](https://cloud.mongodb.com/)
- **Google Cloud** (for Gemini AI) - [Console](https://console.cloud.google.com/)
- **VS Code** (recommended) - [Download](https://code.visualstudio.com/)

### Fork & Clone

```bash
# 1. Fork the repo on GitHub (click Fork button)

# 2. Clone YOUR fork
git clone https://github.com/YOUR_USERNAME/ecosustain.git
cd ecosustain

# 3. Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/ecosustain.git

# 4. Install dependencies
npm install
```

---

## ⚙️ Project Setup

### Step 1: Create Environment File

```bash
cp .env.example .env
```

### Step 2: Get API Keys

#### MongoDB Atlas (Database)
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create free cluster
3. Create database user
4. Get connection string
5. Add to `.env`: `DATABASE=mongodb+srv://...`

#### Google Gemini AI
1. Go to [aistudio.google.com](https://aistudio.google.com/app/apikey)
2. Create API key
3. Add to `.env`: `GEMINI_API_KEY=AIza...`

#### Firebase (Phone Auth) - Optional for dev
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create project
3. Enable Phone Authentication
4. Download service account JSON
5. Add values to `.env`

#### Stripe (Payments) - Optional for dev
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get test keys
3. Add to `.env`

### Step 3: Seed Sample Data

```bash
node seed-data.js
```

### Step 4: Start Development Server

```bash
npm run dev   # With auto-reload
# OR
npm start     # Without auto-reload
```

### Step 5: Open in Browser

```
http://localhost:5000
```

---

## 🤖 Adding New AI Features

This is the most exciting part! Here's how to add your own AI models/features.

### Option 1: Using Existing Gemini Integration

```javascript
// src/controllers/ai.controller.js

const yourNewAIFeature = async (req, res) => {
  try {
    const { input } = req.body;
    
    // Check if Gemini is available
    if (!genAI || !process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: "AI service not configured"
      });
    }
    
    // Get the AI model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Create your prompt
    const prompt = `Your custom prompt here. Input: ${input}
    
    Respond with JSON:
    {
      "result": "...",
      "confidence": 0-100
    }`;
    
    // Get AI response
    const result = await model.generateContent(prompt);
    let responseText = result.response.text().trim();
    
    // Parse JSON from response
    if (responseText.startsWith("```")) {
      responseText = responseText.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    }
    const parsed = JSON.parse(responseText);
    
    res.json({ success: true, data: parsed });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Don't forget to export!
module.exports = { ..., yourNewAIFeature };
```

### Option 2: Using Your Own AI Model/API

```javascript
const axios = require('axios');

const yourCustomModelFeature = async (req, res) => {
  try {
    const { input } = req.body;
    
    // Call your own AI API
    const response = await axios.post('https://your-ai-api.com/predict', {
      data: input,
      api_key: process.env.YOUR_API_KEY
    });
    
    res.json({ success: true, result: response.data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

### Option 3: Using Hugging Face Models

```javascript
const axios = require('axios');

const huggingFaceFeature = async (req, res) => {
  try {
    const { text } = req.body;
    
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/your-model',
      { inputs: text },
      { headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` } }
    );
    
    res.json({ success: true, result: response.data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

### Step 2: Add Route

```javascript
// src/routes/ai.routes.js

const { yourNewAIFeature } = require("../controllers/ai.controller");

// Add your route
router.post("/your-feature", protect, yourNewAIFeature);  // Protected
// OR
router.post("/your-feature", yourNewAIFeature);  // Public
```

### Step 3: Add Frontend Button

```html
<!-- public/your-page.html -->

<button onclick="callYourAI()" class="btn btn-primary">
  🤖 Run AI Analysis
</button>

<div id="result"></div>

<script>
async function callYourAI() {
  try {
    const response = await fetch('/api/ai/your-feature', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`  // If protected
      },
      body: JSON.stringify({ input: 'your data' })
    });
    
    const data = await response.json();
    document.getElementById('result').innerHTML = JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Error:', error);
  }
}
</script>
```

---

## 📁 Code Structure

```
src/
├── controllers/          # Business logic
│   ├── ai.controller.js  # 👈 Add AI features here!
│   ├── authController.js
│   └── ...
├── routes/               # API endpoints
│   ├── ai.routes.js      # 👈 Add AI routes here!
│   └── ...
├── models/               # Database schemas
├── middleware/           # Auth, validation
└── config/               # DB, Firebase config

public/
├── scan.html             # AI Scanner page
├── dashboard.html        # User dashboard
└── ...                   # Add new pages here
```

---

## 🔀 Pull Request Process

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

Follow coding standards:
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused
- Handle errors properly

### 3. Test Your Changes

```bash
# Start server
npm start

# In another terminal, run tests
node test-apis.js

# Manual testing in browser
http://localhost:5000
```

### 4. Commit Changes

```bash
git add .
git commit -m "feat: add AI feature for waste prediction"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code restructuring

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create Pull Request

1. Go to your fork on GitHub
2. Click "Compare & Pull Request"
3. Fill in description:
   - What does this PR do?
   - How to test it?
   - Screenshots if UI changes

---

## 🧪 Testing

### API Testing

```bash
# Run the test script
node test-apis.js
```

### Manual Testing Endpoints

```bash
# Environmental Impact
curl http://localhost:5000/api/ai/environmental-impact

# Safety Tips
curl http://localhost:5000/api/ai/safety-tips

# Recyclability Check
curl -X POST http://localhost:5000/api/ai/check-recyclability \
  -H "Content-Type: application/json" \
  -d '{"itemName": "plastic bottle"}'

# Challenges
curl http://localhost:5000/api/ai/challenges
```

### Test User Accounts

After running `node seed-data.js`:

| Role | Phone | Use For |
|------|-------|---------|
| User | 9876543210 | Testing user features |
| Worker | 9876543211 | Testing worker features |
| Admin | 9999999999 | Testing admin features |

---

## 💡 Ideas for New AI Features

Looking for inspiration? Here are some ideas:

1. **Voice-based waste reporting** - Speech-to-text for reporting incidents
2. **Image comparison** - Before/after cleanup verification
3. **Carbon footprint calculator** - Personal carbon tracking
4. **Composting assistant** - AI guide for home composting
5. **Material detector** - Identify recyclable materials in mixed waste
6. **Price predictor** - Predict scrap prices based on market
7. **Route weather optimizer** - Factor in weather for collection
8. **Fraud detector** - Detect fake recycling claims

---

## 🆘 Need Help?

- **Issues**: [GitHub Issues](https://github.com/OWNER/ecosustain/issues)
- **Discussions**: [GitHub Discussions](https://github.com/OWNER/ecosustain/discussions)
- **Email**: team@ecosustain.com

---

## 📜 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help newcomers get started
- Credit others' work

---

Happy coding! 🌱
