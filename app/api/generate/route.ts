import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { input, testType, uploadedFiles } = await request.json();

    if (!input) {
      return NextResponse.json(
        { error: 'Input is required' },
        { status: 400 }
      );
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create a detailed prompt for test case generation
    let prompt = `
You are an expert software testing engineer. Generate comprehensive test cases for the following:

Input: ${input}
Test Type: ${testType || 'General'}`;

    // Add uploaded files content to the prompt if available
    if (uploadedFiles && uploadedFiles.length > 0) {
      prompt += `\n\nReference Files Provided:`;
      uploadedFiles.forEach((file: {name: string, content: string, size: number}) => {
        prompt += `\n\n--- FILE: ${file.name} ---\n${file.content}\n--- END OF FILE ---`;
      });
      prompt += `\n\nPlease use the above reference files to understand the context and generate more accurate and relevant test cases. Consider the code structure, functions, APIs, data models, or requirements described in these files.`;
    }

    prompt += `\n
Please generate test cases in the following JSON format. Make sure the JSON is valid and properly formatted:
{
  "testSuite": {
    "title": "Test Suite Title",
    "description": "Brief description of what we're testing",
    "testCases": [
      {
        "id": "TC001",
        "title": "Test case title",
        "description": "What this test case validates",
        "category": "positive|negative|edge_case|boundary",
        "priority": "high|medium|low",
        "preconditions": "Any setup required",
        "testSteps": [
          "Step 1: Action to take",
          "Step 2: Next action",
          "Step 3: Final action"
        ],
        "inputData": "Test input data (can be string or object)",
        "expectedResult": "Expected outcome (can be string or object)",
        "tags": ["tag1", "tag2"]
      }
    ]
  }
}

Guidelines:
- Include positive test cases (happy path scenarios)
- Include negative test cases (error handling scenarios)
- Include edge cases and boundary conditions
- Include security test cases if applicable
- Include performance considerations if relevant
- Make test cases specific and actionable
- Include at least 5-10 test cases
- Vary the priority levels (high, medium, low)
- Use clear, descriptive titles
- For functions/APIs, include specific input/output examples
- For UI features, include user interaction steps
- If input mentions specific data types, include those in inputData and expectedResult
- If reference files are provided, create test cases that are specific to the code/requirements in those files
- Return ONLY valid JSON, no markdown formatting or additional text

Important: 
- Return ONLY the JSON object, nothing else
- Do not wrap in markdown code blocks
- Do not include any explanatory text before or after
- Start directly with { and end with }
- Ensure all JSON is properly escaped and valid
- Test that the JSON would parse correctly

Your response should start with { and end with } and contain nothing else.
`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up the response to ensure it's valid JSON
    text = text.trim();
    
    // Remove markdown code blocks if present (more comprehensive cleaning)
    text = text.replace(/```json\s*/gi, '').replace(/```\s*$/g, '');
    text = text.replace(/```\s*/g, '');
    
    // Remove any leading/trailing whitespace and newlines
    text = text.trim();
    
    // If the text doesn't start with {, try to find the JSON part
    if (!text.startsWith('{')) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }
    }

    console.log('Cleaned text for parsing:', text.substring(0, 200) + '...');

    try {
      // Try to parse the JSON response
      let testCases;
      
      try {
        testCases = JSON.parse(text);
      } catch (firstParseError) {
        // If first parse fails, try to extract and fix the JSON
        console.log('First parse failed, trying to fix JSON...');
        
        // Try to find JSON object boundaries
        let startIndex = text.indexOf('{');
        let endIndex = text.lastIndexOf('}');
        
        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
          const extractedJson = text.substring(startIndex, endIndex + 1);
          console.log('Extracted JSON:', extractedJson.substring(0, 200) + '...');
          testCases = JSON.parse(extractedJson);
        } else {
          throw firstParseError;
        }
      }
      
      // Validate that we have the expected structure
      if (testCases && testCases.testSuite && testCases.testSuite.testCases) {
        return NextResponse.json({
          success: true,
          data: testCases
        });
      } else {
        // If structure is wrong, return error
        console.log('Invalid structure:', testCases);
        throw new Error('Invalid response structure');
      }
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.log('Raw text that failed to parse:', text);
      
      // If JSON parsing fails, return the raw text with better formatting
      return NextResponse.json({
        success: true,
        data: {
          testSuite: {
            title: "Generated Test Cases",
            description: "AI-generated test cases (parsing failed)",
            rawResponse: text,
            parseError: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
          }
        }
      });
    }

  } catch (error) {
    console.error('Error generating test cases:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate test cases',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Test Case Generator API',
    usage: 'Send POST request with { "input": "your requirement", "testType": "optional type" }'
  });
}
