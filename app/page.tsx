               
'use client';

import { useState, useEffect } from 'react';
import * as React from 'react';

interface TestCase {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  preconditions: string;
  testSteps: string[];
  inputData: string;
  expectedResult: string;
  tags: string[];
}

interface TestSuite {
  title: string;
  description: string;
  testCases?: TestCase[];
  rawResponse?: string;
  parseError?: string;
}

export default function Home() {
  const [input, setInput] = useState('');
  const [testType, setTestType] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestSuite | null>(null);
  const [error, setError] = useState('');
  const [expandedTestCase, setExpandedTestCase] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(40); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const [resultsReady, setResultsReady] = useState(false);
  const [showReadyNotification, setShowReadyNotification] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name: string, content: string, size: number}>>([]);
  const [dragActive, setDragActive] = useState(false);
  const [inputMode, setInputMode] = useState<'description' | 'files'>('description');

  const generateTestCases = async () => {
    // Check if user has provided either input description or uploaded files
    if (inputMode === 'description' && !input.trim()) {
      setError('Please enter a requirement or description');
      return;
    }
    
    if (inputMode === 'files' && uploadedFiles.length === 0) {
      setError('Please upload at least one reference file');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: inputMode === 'description' ? input.trim() : 'Analyze the uploaded files and generate comprehensive test cases',
          testType: testType.trim() || undefined,
          uploadedFiles: inputMode === 'files' ? uploadedFiles : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate test cases');
      }

      if (data.success) {
        console.log('Received data:', data.data);
        setResult(data.data.testSuite);
        setResultsReady(true);
        setShowReadyNotification(true);
        // Auto-hide notification after 3 seconds
        setTimeout(() => setShowReadyNotification(false), 3000);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const downloadTestCases = () => {
    if (!result) return;

    const dataStr = JSON.stringify(result, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'test-cases.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const generateCSV = (testCases: TestCase[]) => {
    const headers = ['ID', 'Title', 'Description', 'Category', 'Priority', 'Preconditions', 'Test Steps', 'Input Data', 'Expected Result', 'Tags'];
    
    const csvContent = [
      headers.join(','),
      ...testCases.map(tc => [
        `"${tc.id || ''}"`,
        `"${tc.title || ''}"`,
        `"${tc.description || ''}"`,
        `"${tc.category || ''}"`,
        `"${tc.priority || ''}"`,
        `"${tc.preconditions || ''}"`,
        `"${tc.testSteps?.join('; ') || ''}"`,
        `"${typeof tc.inputData === 'object' ? JSON.stringify(tc.inputData) : tc.inputData || ''}"`,
        `"${typeof tc.expectedResult === 'object' ? JSON.stringify(tc.expectedResult) : tc.expectedResult || ''}"`,
        `"${tc.tags?.join('; ') || ''}"`
      ].join(','))
    ].join('\n');
    
    return csvContent;
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    const jsonString = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(jsonString);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = ((window.innerWidth - e.clientX) / window.innerWidth) * 100;
    if (newWidth >= 25 && newWidth <= 70) {
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Add event listeners for mouse events
  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Filter test cases based on priority
  const filteredTestCases = result?.testCases?.filter(testCase => {
    if (priorityFilter === 'all') return true;
    return testCase.priority?.toLowerCase() === priorityFilter.toLowerCase();
  }) || [];

  // File upload handlers
  const handleFileUpload = async (files: FileList) => {
    const newFiles: Array<{name: string, content: string, size: number}> = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file type - only allow text-based files
      const allowedTypes = [
        'text/plain',
        'application/json',
        'text/csv',
        'text/xml',
        'application/xml',
        'text/html',
        'text/css',
        'text/javascript',
        'application/javascript',
        'text/typescript',
        'application/typescript'
      ];
      
      const allowedExtensions = ['.txt', '.json', '.csv', '.xml', '.html', '.css', '.js', '.ts', '.md', '.yml', '.yaml', '.log', '.sql'];
      
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        setError(`File "${file.name}" is not supported. Only text-based files are allowed.`);
        continue;
      }
      
      // Check file size (limit to 100KB for free tier)
      if (file.size > 100 * 1024) {
        setError(`File "${file.name}" is too large. Please keep files under 100KB for Gemini free tier.`);
        continue;
      }
      
      try {
        const content = await file.text();
        newFiles.push({
          name: file.name,
          content: content,
          size: file.size
        });
      } catch (err) {
        setError(`Failed to read file "${file.name}".`);
      }
    }
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    setError(''); // Clear any previous errors if successful
  };
  
  // Clear uploaded files when switching to description mode
  const handleModeChange = (mode: 'description' | 'files') => {
    setInputMode(mode);
    setError(''); // Clear any errors when switching modes
    if (mode === 'description') {
      setUploadedFiles([]); // Clear uploaded files when switching to description mode
    } else {
      setInput(''); // Clear description when switching to files mode
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };
  
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const getTotalFileSize = () => {
    return uploadedFiles.reduce((total, file) => total + file.size, 0);
  };

  return (
<div
  className="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-gray-100"
  style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#5d4e37' }}
>

      {/* Main Content Area */}
      <div 
        className="min-h-screen transition-all duration-300 ease-in-out"
        style={{ 
          width: result && sidebarOpen ? `${100 - sidebarWidth}%` : '100%'
        }}
      >
        
<header className="py-6 border-t border-gray-200 bg-gray-50">
  <div className="max-w-5xl mx-auto px-4">
    <div className="text-center">
      <div className="flex items-center justify-center space-x-2 mb-4">
        <div className="w-7 h-7 border border-gray-600 flex items-center justify-center text-gray-800 font-bold bg-white rounded">
          T
        </div> 
        <h3 className="text-lg font-semibold text-gray-800">TestCase Generator</h3>
      </div>
      <p className="text-gray-600 mb-4 text-sm">
        Powered by Google Gemini AI Free Tier
      </p>
      <div className="flex justify-center space-x-4 text-sm">
        <a href="https://github.com/Thonjen/ai-testcase-generator" target="_blank" rel="noopener noreferrer" 
           className="text-gray-700 hover:bg-gray-100 px-3 py-1 transition-colors border border-gray-300 rounded">
          GitHub Repository
        </a>
        <a href="https://www.youtube.com/shorts/K04ckT7Gq1o" target='_blank' 
           className="text-gray-700 hover:bg-gray-100 px-3 py-1 transition-colors border border-gray-300 rounded">
          Documentation
        </a>
        <a href="https://www.youtube.com/watch?v=-g03jC71GBw" target='_blank' 
           className="text-gray-700 hover:bg-gray-100 px-3 py-1 transition-colors border border-gray-300 rounded">
          Contact Support
        </a>
      </div>
    </div>
  </div>
</header>

 {/* Toggle Sidebar Button and Ready Notification */}
        {result && (
          <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
            {/* Ready Notification */}
            {showReadyNotification && (
              <div className="px-4 py-2 border-2 border-gray-700 bg-gray-50 text-gray-800 text-sm animate-pulse rounded-lg shadow-lg">
                Results Ready ✓
              </div>
            )}
            
            {/* Toggle Button */}
            <button
              onClick={() => {
                setSidebarOpen(!sidebarOpen);
                setShowReadyNotification(false);
              }}
              className="px-4 py-2 border-2 border-gray-700 bg-white text-gray-800 hover:bg-gray-50 text-sm transition-all rounded-lg shadow-md"
            >
              {sidebarOpen ? 'Close Results' : 'View Results'}
            </button>
          </div>
        )}



{/* Generator Section */}
<section id="generator" className="py-8">
  <div className="max-w-3xl mx-auto px-4">
    <div className="bg-white p-6 md:p-8 border border-gray-200 rounded-lg shadow">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 text-gray-900">
        Generate Test Cases
      </h2>
      
      <div className="space-y-6">
        {/* Input Mode Toggle */}
        <div>
          <label className="block text-base font-semibold mb-3 text-gray-800">
            Choose Input Method
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleModeChange('description')}
              className={`flex-1 py-2 px-4 rounded-md border transition-all text-sm font-medium ${
                inputMode === 'description'
                  ? 'bg-gray-600 text-white border-gray-600 shadow'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:border-gray-500'
              }`}
              disabled={loading}
            >
              📝 Text
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('files')}
              className={`flex-1 py-2 px-4 rounded-md border transition-all text-sm font-medium ${
                inputMode === 'files'
                  ? 'bg-gray-600 text-white border-gray-600 shadow'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
              }`}
              disabled={loading}
            >
              📁 Files
            </button>
          </div>
        </div>

        {/* Conditional Input Areas */}
        {inputMode === 'description' ? (
          <div>
            <label className="block text-base font-semibold mb-3 text-gray-800">
              Test Description
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Example: User login system with email validation..."
              className="w-full h-24 p-3 border border-gray-300 focus:outline-none focus:border-gray-500 text-sm resize-none bg-white text-gray-800 rounded-md"
              disabled={loading}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setInput("User authentication system with email/password login")}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:scale-105"
                style={{ backgroundColor: '#ece6bfff', color: '#000000ff' }}
                disabled={loading}
              >
                🔐 Login
              </button>
              <button
                type="button"
                onClick={() => setInput("E-commerce checkout process with cart validation")}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:scale-105"
                style={{ backgroundColor: '#00e5ffff', color: '#000000ff' }}
                disabled={loading}
              >
                🛒 Checkout
              </button>
              <button
                type="button"
                onClick={() => setInput("REST API for user management with CRUD operations")}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:scale-105"
                style={{ backgroundColor: '#006809ff', color: '#ffffffff' }}
                disabled={loading}
              >
                🔧 API
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-base font-semibold mb-3 text-gray-800">
              Upload Files
            </label>
<div className="mb-4 p-3 border-2 border-orange-300 bg-orange-50 rounded-lg"> <p className="text-orange-700 text-sm"> 📋 <strong>Supported files:</strong> JSON schemas, OpenAPI specs, database schemas, form definitions, React components, API documentation, requirements docs (.json, .yaml, .ts, .jsx, .md, .sql, etc.) </p> <p className="text-orange-600 text-xs mt-1"> ⚠️ Keep files under 100KB total for optimal processing </p> </div>
            <div
              className={`w-full h-24 border-2 border-dashed transition-all flex items-center justify-center cursor-pointer rounded-md ${
                dragActive 
                  ? 'border-gray-500 bg-gray-50' 
                  : 'border-gray-300 hover:border-gray-500 bg-gray-50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <div className="text-center text-gray-700 text-sm">
                <div className="text-xl mb-1">📁</div>
                {dragActive ? 'Drop files here' : 'Click or drag files here'}
              </div>
            </div>

            <input
              id="fileInput"
              type="file"
              multiple
              accept=".txt,.json,.csv,.xml,.html,.css,.js,.ts,.md,.yml,.yaml,.log,.sql"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
              disabled={loading}
            />
            
          </div>

        )}

        {/* Test Type Selection */}
        <div>
          <label className="block text-base font-semibold mb-3 text-gray-800">
            Test Type
          </label>
          <select
            value={testType}
            onChange={(e) => setTestType(e.target.value)}
            className="w-full p-3 border border-gray-300 focus:outline-none focus:border-gray-500 text-sm bg-white text-gray-800 rounded-md"
            disabled={loading}
          >
            <option value="">All Types</option>
            <option value="Unit Tests">Unit Tests</option>
            <option value="Integration Tests">Integration Tests</option>
            <option value="API Tests">API Tests</option>
            <option value="UI Tests">UI Tests</option>
          </select>
        </div>

        {/* Generate Button */}
        <button
          onClick={generateTestCases}
          disabled={loading || (inputMode === 'description' && !input.trim()) || (inputMode === 'files' && uploadedFiles.length === 0)}
          className="w-full py-3 px-6 border border-gray-600 text-base font-bold transition-all hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed bg-gray-600 text-white rounded-md shadow"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <span className="animate-pulse mr-2">Processing...</span>
              AI Generating...
            </span>
          ) : (
            "Generate Test Cases"
          )}
        </button>

        {/* Error Display */}
        {error && (
          <div className="p-3 border border-red-300 bg-red-50 rounded-md text-sm text-red-600">
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  </div>
</section>


            

          </div>

          {/* Right Sidebar - Results */}
          {result && sidebarOpen && (
            <div 
              className="fixed right-0 top-0 min-h-screen border-l-2 border-gray-200 bg-white transition-all duration-300 ease-in-out flex z-40"
              style={{ 
                width: `${sidebarWidth}%`,
                height: '100vh',
                overflow: 'hidden'
              }}
            >
              {/* Resize Handle */}
              <div
                className="w-1 bg-gray-300 hover:bg-gray-400 cursor-ew-resize flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                onMouseDown={handleMouseDown}
                style={{
                  background: isResizing ? '#cabdaeff' : '#f7f1e3ff'
                }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-0.5 h-8 bg-gray-600"></div>
                </div>
              </div>
              
              {/* Sidebar Content */}
              <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex-shrink-0 bg-white border-b-2 border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Results Panel
                </h2>
                <p className="text-gray-700">
                  {result.title || 'Test Cases Generated'}
                </p>
                {result.testCases && (
                  <div className="space-y-3 mt-3">
                    {/* Priority Filter */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-800">
                        Filter by Priority
                      </label>
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="w-full p-2 border-2 border-gray-300 focus:outline-none focus:border-gray-500 text-sm bg-white text-gray-800 rounded"
                      >
                        <option value="all">All ({result.testCases.length})</option>
                        <option value="high">High ({result.testCases.filter(tc => tc.priority === 'high').length})</option>
                        <option value="medium">Medium ({result.testCases.filter(tc => tc.priority === 'medium').length})</option>
                        <option value="low">Low ({result.testCases.filter(tc => tc.priority === 'low').length})</option>
                      </select>
                    </div>
                    
                    {/* Statistics */}
                    <div className="flex flex-wrap gap-2">
                      <div className="px-3 py-1 border-2 border-gray-600 font-semibold bg-gray-100 text-gray-800 text-sm rounded">
                        Showing: {filteredTestCases.length}
                      </div>
                      <div className="px-3 py-1 border-2 border-blue-500 font-semibold bg-blue-100 text-blue-800 text-sm rounded">
                        Total: {result.testCases.length}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 border-2 border-gray-600 font-semibold transition-all hover:bg-gray-100 flex items-center gap-2 bg-white text-gray-800 text-sm rounded"
                  >
                    📋 Copy JSON
                  </button>
                  <button
                    onClick={downloadTestCases}
                    className="px-4 py-2 border-2 border-gray-600 font-semibold transition-all hover:bg-gray-200 flex items-center gap-2 bg-gray-100 text-gray-800 text-sm rounded"
                  >
                    💾 Download JSON
                  </button>
                  <button
                    onClick={() => {
                      const dataToExport = priorityFilter === 'all' ? result.testCases : filteredTestCases;
                      if (!dataToExport) return;
                      const csv = generateCSV(dataToExport);
                      const filename = priorityFilter === 'all' ? 'test-cases.csv' : `test-cases-${priorityFilter}.csv`;
                      downloadCSV(csv, filename);
                    }}
                    className="px-4 py-2 border-2 border-gray-600 font-semibold transition-all hover:bg-gray-100 flex items-center gap-2 bg-white text-gray-800 text-sm rounded"
                  >
                    📊 Export CSV
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div 
                className="flex-1 overflow-y-auto p-6"
                style={{
                  maxHeight: 'calc(100vh - 200px)', // Adjust based on header height
                  scrollBehavior: 'smooth'
                }}
                onWheel={(e) => {
                  // Prevent event bubbling to parent elements
                  e.stopPropagation();
                }}
              >
                {result.testCases ? (
                  <div className="space-y-4">
                    {filteredTestCases.length > 0 ? (
                      filteredTestCases.map((testCase, index) => (
                      <div key={testCase.id || index} className="border-2 border-gray-200 bg-white rounded-lg shadow-sm">
                        {/* Accordion Header */}
                        <button
                          onClick={() => setExpandedTestCase(expandedTestCase === index ? null : index)}
                          className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between rounded-t-lg"
                        >
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900">
                              [{testCase.id}] {testCase.title || `Test Case ${index + 1}`}
                            </h3>
                            <p className="text-sm text-gray-700 mt-1">
                              {testCase.category} • {testCase.priority} Priority
                            </p>
                          </div>
                          <span className="text-gray-700 text-xl ml-4">
                            {expandedTestCase === index ? '[-]' : '[+]'}
                          </span>
                        </button>

                        {/* Accordion Content */}
                        {expandedTestCase === index && (
                          <div className="border-t-2 border-gray-200 p-4 space-y-4">
                            {/* Description */}
                            <div>
                              <h4 className="text-sm font-bold mb-2 text-gray-800">
                                Description
                              </h4>
                              <p className="text-gray-700 text-sm">
                                {testCase.description}
                              </p>
                            </div>

                            {/* Preconditions */}
                            {testCase.preconditions && (
                              <div>
                                <h4 className="text-sm font-bold mb-2 text-gray-800">
                                  Prerequisites
                                </h4>
                                <p className="text-gray-700 text-sm">
                                  {testCase.preconditions}
                                </p>
                              </div>
                            )}

                            {/* Test Steps */}
                            <div>
                              <h4 className="text-sm font-bold mb-2 text-gray-800">
                                Test Steps
                              </h4>
                              <ol className="space-y-1">
                                {testCase.testSteps?.map((step, stepIndex) => (
                                  <li key={stepIndex} className="flex items-start gap-2">
                                    <span className="flex-shrink-0 w-5 h-5 border border-gray-600 flex items-center justify-center text-xs font-bold text-gray-800 bg-gray-100 rounded-full">
                                      {stepIndex + 1}
                                    </span>
                                    <span className="text-gray-700 text-sm">
                                      {step.replace(/^Step \d+:\s*/, '').replace(/^\d+\.\s*/, '')}
                                    </span>
                                  </li>
                                ))}
                              </ol>
                            </div>

                            {/* Input Data */}
                            <div>
                              <h4 className="text-sm font-bold mb-2 text-gray-800">
                                Input Data
                              </h4>
                              <div className="p-3 border border-gray-300 bg-gray-50 rounded">
                                {typeof testCase.inputData === 'object' ? (
                                  <pre className="text-xs whitespace-pre-wrap text-gray-700">
                                    {JSON.stringify(testCase.inputData, null, 2)}
                                  </pre>
                                ) : (
                                  <span className="text-gray-700 text-sm">{testCase.inputData}</span>
                                )}
                              </div>
                            </div>

                            {/* Expected Result */}
                            <div>
                              <h4 className="text-sm font-bold mb-2 text-gray-800">
                                Expected Result
                              </h4>
                              <div className="p-3 border border-gray-300 bg-gray-50 rounded">
                                {typeof testCase.expectedResult === 'object' ? (
                                  <pre className="text-xs whitespace-pre-wrap text-gray-700">
                                    {JSON.stringify(testCase.expectedResult, null, 2)}
                                  </pre>
                                ) : (
                                  <span className="text-gray-700 text-sm">{testCase.expectedResult}</span>
                                )}
                              </div>
                            </div>

                            {/* Tags */}
                            {testCase.tags && testCase.tags.length > 0 && (
                              <div>
                                <h4 className="text-sm font-bold mb-2 text-gray-800">
                                  Tags
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                  {testCase.tags.map((tag, tagIndex) => (
                                    <span key={tagIndex} className="px-2 py-1 border border-gray-400 text-xs font-medium text-gray-800 bg-gray-100 rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-2xl mb-3 text-orange-600">🔍 No Matches</div>
                        <p className="text-lg text-orange-700">
                          No test cases match priority: {priorityFilter}
                        </p>
                        <button
                          onClick={() => setPriorityFilter('all')}
                          className="mt-4 px-4 py-2 border-2 border-gray-600 font-semibold transition-all hover:bg-gray-100 bg-white text-gray-800 text-sm rounded"
                        >
                          Show All
                        </button>
                      </div>
                    )}
                  </div>
                ) : result.rawResponse ? (
                  <div className="border-2 border-red-300 p-4 rounded-lg">
                    <h3 className="text-lg font-bold mb-3 text-red-700">
                      Parsing Error
                    </h3>
                    <div className="p-3 bg-red-50 border border-red-300 mb-4 rounded">
                      <p className="text-red-600 font-medium text-sm">
                        The AI response could not be parsed as JSON
                      </p>
                      {result.parseError && (
                        <p className="text-xs text-red-500 mt-2">Error: {result.parseError}</p>
                      )}
                    </div>
                    <div className="p-3 border border-gray-300 max-h-64 overflow-y-auto bg-gray-50 rounded">
                      <pre className="whitespace-pre-wrap text-xs text-gray-700">
                        {result.rawResponse}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3 text-gray-600">No Data</div>
                    <p className="text-lg text-gray-700">No test cases generated</p>
                  </div>
                )}
              </div>
              </div>
            </div>
          )}
          
        </div>
  );
}
