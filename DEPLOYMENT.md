# 🚀 Quick Deployment Guide for Vercel

## 1. Get Your API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the generated key

## 2. Deploy to Vercel
1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your GitHub repository
4. Add Environment Variable:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your API key from step 1
5. Deploy!

## 3. Test Your Deployment
Try these example inputs:
- "User login with email validation"
- "Calculator add function"
- "File upload with size limits"

## Troubleshooting

### If you see raw JSON instead of a table:
This usually means the AI response couldn't be parsed. The system will now show:
- A warning message explaining the issue
- The raw response for debugging
- Suggestion to try again

### Common fixes:
1. **API Key Issues**: Make sure your `GEMINI_API_KEY` is correctly set in Vercel environment variables
2. **Rate Limits**: Google AI Studio has rate limits - wait a few minutes if you get errors
3. **JSON Parsing**: Try rephrasing your input if parsing fails consistently

## Features Working:
✅ Clean table display for test cases  
✅ Mobile-responsive design  
✅ JSON and CSV download options  
✅ Priority and category color coding  
✅ Quick example buttons  
✅ Error handling and fallbacks  

Your AI Test Case Generator is ready for production! 🎉
