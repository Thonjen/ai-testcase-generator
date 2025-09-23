# 🤖 AI Test Case Generator

An intelligent test case generator powered by Google's Gemini AI that creates comprehensive test cases from feature descriptions, requirements, or code snippets.

## ✨ Features

- **AI-Powered Generation**: Uses Google Gemini 1.5 Flash for intelligent test case creation
- **Comprehensive Test Cases**: Generates positive, negative, edge cases, and boundary conditions
- **Structured Output**: Well-formatted test cases with priorities, categories, and detailed steps
- **Export Functionality**: Download test cases as JSON files
- **Beautiful UI**: Clean, responsive interface built with Tailwind CSS
- **Free to Start**: Use Google AI Studio's free tier to get started

## 🚀 Live Demo

Deploy your own instance on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/ai-testcase-generator&env=GEMINI_API_KEY)

## 🛠️ Setup Instructions

### 1. Get Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the key for later use

### 2. Deploy on Vercel

#### Option A: One-Click Deploy
1. Click the "Deploy with Vercel" button above
2. Connect your GitHub account
3. Add your `GEMINI_API_KEY` in the environment variables
4. Deploy!

#### Option B: Manual Deploy
1. Fork this repository
2. Connect to Vercel
3. Add environment variable:
   - `GEMINI_API_KEY`: Your Google Gemini API key
4. Deploy

### 3. Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-testcase-generator.git
cd ai-testcase-generator

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Add your API key to .env.local
GEMINI_API_KEY=your_gemini_api_key_here

# Run development server
npm run dev
```

## 📋 Usage

1. **Enter Description**: Describe the feature, function, or requirement you want to test
2. **Specify Test Type** (Optional): Add context like "Unit Tests", "Integration Tests", etc.
3. **Generate**: Click "Generate Test Cases" and wait for AI magic
4. **Review & Export**: Review the generated test cases and download as JSON

### Example Inputs

- "User login functionality with email and password validation"
- "Shopping cart checkout process with payment integration"
- "File upload feature with size and type restrictions"
- "API endpoint for user registration with validation"

## 🎯 Test Case Structure

Generated test cases include:

- **ID & Title**: Unique identifier and descriptive title
- **Description**: What the test case validates
- **Category**: positive, negative, edge_case, boundary
- **Priority**: high, medium, low
- **Preconditions**: Setup requirements
- **Test Steps**: Detailed step-by-step instructions
- **Input Data**: Test data to use
- **Expected Result**: What should happen
- **Tags**: Categorization tags

## 💰 Cost & Usage

### Free Options
- **Google AI Studio**: Free tier with daily quotas
- **Vercel**: Free hosting for personal projects

### Paid Options
- **Google Cloud Vertex AI**: ~$10/month credits
- **Vercel Pro**: For high-traffic production apps

## 🔧 API Reference

### POST /api/generate

Generate test cases from input description.

**Request Body:**
```json
{
  "input": "User login functionality",
  "testType": "Integration Tests" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "testSuite": {
      "title": "User Login Test Suite",
      "description": "Comprehensive tests for login functionality",
      "testCases": [...]
    }
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for powerful language generation
- **Vercel** for seamless deployment platform
- **Next.js** for the amazing React framework
- **Tailwind CSS** for beautiful styling
