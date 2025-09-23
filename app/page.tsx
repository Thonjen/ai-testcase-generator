               
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

  const generateTestCases = async () => {
    if (!input.trim()) {
      setError('Please enter a requirement or description');
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
          input: input.trim(),
          testType: testType.trim() || undefined,
          uploadedFiles: uploadedFiles.length > 0 ? uploadedFiles : undefined,
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
    <div className="min-h-screen font-mono flex" style={{ backgroundColor: '#1a1a1a', fontFamily: 'monospace', color: '#00ff00' }}>
      {/* Main Content Area */}
      <div 
        className="min-h-screen transition-all duration-300 ease-in-out"
        style={{ 
          width: result && sidebarOpen ? `${100 - sidebarWidth}%` : '100%'
        }}
      >
 {/* Toggle Sidebar Button and Ready Notification */}
        {result && (
          <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
            {/* Ready Notification */}
            {showReadyNotification && (
              <div className="px-4 py-2 border-2 border-black-400 bg-black-900 text-black-400 font-mono text-sm animate-pulse">
                [RESULTS.READY] ✓
              </div>
            )}
            
            {/* Toggle Button */}
            <button
              onClick={() => {
                setSidebarOpen(!sidebarOpen);
                setShowReadyNotification(false);
              }}
              className="px-4 py-2 border-2 border-black-400 bg-black text-black-400 hover:bg-black-900 font-mono text-sm transition-all"
            >
              {sidebarOpen ? '[CLOSE.RESULTS]' : '[OPEN.RESULTS]'}
            </button>
          </div>
        )}



        {/* Generator Section */}
        <section id="generator" className="py-16">
          <div className="max-w-5xl mx-auto px-6">
            <div className="bg-black p-8 md:p-12 border-4 border-black-400 font-mono">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 tracking-wider text-black-400">
                &gt;&gt; GENERATE.TEST.CASES &lt;&lt;
              </h2>
              
              <div className="space-y-8">
                {/* Input Area */}
                <div>
                  <label className="block text-lg font-semibold mb-4 font-mono tracking-wider text-black-400">
                    [INPUT_TEST_DESCRIPTION]
                  </label>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="EXAMPLE: USER.LOGIN.SYSTEM WITH EMAIL.VALIDATION, PASSWORD.ENCRYPTION, AND REMEMBER.ME.FUNCTIONALITY..."
                    className="w-full h-32 p-4 border-4 border-black-400 focus:outline-none focus:border-black-300 text-lg resize-none font-mono bg-black text-black-400"
                    disabled={loading}
                  />
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setInput("User authentication system with email/password login, password reset, and account lockout after failed attempts")}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                    style={{ backgroundColor: '#ffffffff', color: '#000000ff' }}
                    disabled={loading}
                  >
                    🔐 Login System
                  </button>
                  <button
                    type="button"
                    onClick={() => setInput("E-commerce checkout process with cart validation, payment processing, inventory check, and order confirmation")}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                    style={{ backgroundColor: '#00e5ffff', color: '#000000ff' }}
                    disabled={loading}
                  >
                    🛒 Checkout Flow
                  </button>
                  <button
                    type="button"
                    onClick={() => setInput("REST API for user management with CRUD operations, authentication, rate limiting, and data validation")}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                    style={{ backgroundColor: '#006809ff', color: '#ffffffff' }}
                    disabled={loading}
                  >
                    � API Testing
                  </button>
                </div>
              </div>

                {/* File Upload Section */}
                <div>
                  <label className="block text-lg font-semibold mb-4 font-mono tracking-wider text-black-400">
                    [UPLOAD_REFERENCE_FILES] <span className="text-sm text-yellow-400">(OPTIONAL)</span>
                  </label>
                  
                  {/* Free Tier Warning */}
                  <div className="mb-4 p-3 border-2 border-yellow-400 bg-yellow-900 bg-opacity-20">
                    <p className="text-yellow-400 font-mono text-sm">
                      ⚠️ [FREE.TIER.LIMITS] Keep files under 100KB total. Text files only: .txt, .json, .csv, .xml, .md, .js, .ts, etc.
                    </p>
                  </div>
                  
                  {/* Drop Zone */}
                  <div
                    className={`w-full h-32 border-4 border-dashed transition-all font-mono flex items-center justify-center cursor-pointer ${
                      dragActive 
                        ? 'border-black-300 bg-black-900 bg-opacity-20' 
                        : 'border-black-400 hover:border-black-300'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => document.getElementById('fileInput')?.click()}
                  >
                    <div className="text-center text-black-400">
                      <div className="text-2xl mb-2">📁</div>
                      <p className="font-mono">
                        {dragActive ? '[DROP.FILES.HERE]' : '[CLICK.OR.DRAG.FILES.HERE]'}
                      </p>
                      <p className="text-sm text-black-300 font-mono mt-1">
                        TEXT.FILES.ONLY • MAX.100KB.EACH
                      </p>
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
                  
                  {/* File List */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-black-400 font-mono text-sm font-semibold">
                          [UPLOADED.FILES] ({uploadedFiles.length})
                        </span>
                        <span className="text-black-300 font-mono text-xs">
                          TOTAL: {(getTotalFileSize() / 1024).toFixed(1)}KB
                        </span>
                      </div>
                      
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border border-black-400 bg-black">
                          <div className="flex-1">
                            <span className="text-black-400 font-mono text-sm">{file.name}</span>
                            <span className="text-black-300 font-mono text-xs ml-2">
                              ({(file.size / 1024).toFixed(1)}KB)
                            </span>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-red-400 hover:text-red-300 font-mono text-sm px-2 py-1 border border-red-400 hover:bg-red-900 transition-colors"
                            disabled={loading}
                          >
                            [X]
                          </button>
                        </div>
                      ))}
                      
                      {getTotalFileSize() > 80 * 1024 && (
                        <div className="text-yellow-400 font-mono text-xs mt-2">
                          ⚠️ Approaching 100KB limit. Consider removing some files.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Test Type Selection */}
                <div>
                  <label className="block text-lg font-semibold mb-4 font-mono tracking-wider text-black-400">
                    [TEST_TYPE_SELECTION]
                  </label>
                  <select
                    value={testType}
                    onChange={(e) => setTestType(e.target.value)}
                    className="w-full p-4 border-4 border-black-400 focus:outline-none focus:border-black-300 text-lg font-mono bg-black text-black-400"
                    disabled={loading}
                  >
                    <option value="">[ALL_TYPES] COMPREHENSIVE.TESTING</option>
                    <option value="Unit Tests">[UNIT_TESTS]</option>
                    <option value="Integration Tests">[INTEGRATION_TESTS]</option>
                    <option value="API Tests">[API_TESTS]</option>
                    <option value="UI Tests">[UI_TESTS]</option>
                    <option value="Security Tests">[SECURITY_TESTS]</option>
                    <option value="Performance Tests">[PERFORMANCE_TESTS]</option>
                    <option value="Accessibility Tests">[ACCESSIBILITY_TESTS]</option>
                  </select>
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateTestCases}
                  disabled={loading || !input.trim()}
                  className="w-full py-6 px-8 border-4 border-black-400 text-xl font-bold font-mono tracking-wider transition-all hover:bg-black-900 disabled:opacity-50 disabled:cursor-not-allowed bg-black text-black-400"
                >
                  {loading ? (
                    <span className="flex items-center justify-center font-mono">
                      <span className="animate-pulse mr-4">[PROCESSING...]</span>
                      AI.ANALYZING.AND.GENERATING.TEST.CASES
                      {uploadedFiles.length > 0 && (
                        <span className="ml-2 text-sm">+ {uploadedFiles.length} FILES</span>
                      )}
                    </span>
                  ) : (
                    <span>
                      &gt;&gt; GENERATE.PROFESSIONAL.TEST.CASES &lt;&lt;
                      {uploadedFiles.length > 0 && (
                        <span className="block text-sm mt-1 text-black-300">
                          INCLUDING {uploadedFiles.length} UPLOADED FILE{uploadedFiles.length !== 1 ? 'S' : ''}
                        </span>
                      )}
                    </span>
                  )}
                </button>

                    {/* Error Display */}
                    {error && (
                      <div className="p-4 border-4 border-red-400 bg-red-900 font-mono">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3 font-mono text-red-400">[ERROR]</span>
                          <div>
                            <h4 className="font-semibold text-red-400 font-mono tracking-wider">SYSTEM.ERROR</h4>
                            <p className="text-red-300 font-mono">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>


              
            </section>

            

                    <footer className="py-12 border-t-4 border-black-400 font-mono bg-black">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="w-8 h-8 border-2 border-black-400 flex items-center justify-center text-black-400 font-bold bg-black">
                  T
                </div> 
                <h3 className="text-xl font-bold  text-black-400 font-mono tracking-wider">TESTCASE.GEN</h3>
              </div>
              <p className="text-black-400 mb-6 opacity-90 font-mono">
                POWERED.BY.GOOGLE.GEMINI.AI • BUILT.FOR.DEVELOPERS.AND.QA.PROFESSIONALS
              </p>
              <div className="flex justify-center space-x-6">
                <a href="https://github.com/Thonjen/ai-testcase-generator" target="_blank" rel="noopener noreferrer" 
                   className="text-black-400 hover:bg-black-900 px-3 py-1 transition-colors font-mono border border-black-400">
                  [GITHUB.REPOSITORY]
                </a>
                <a href="https://www.youtube.com/shorts/K04ckT7Gq1o" target='_blank' className="text-black-400 hover:bg-black-900 px-3 py-1 transition-colors font-mono border border-black-400">
                  [DOCUMENTATION]
                </a>
                <a href="https://www.youtube.com/watch?v=-g03jC71GBw" target='_blank' className="text-black-400 hover:bg-black-900 px-3 py-1 transition-colors font-mono border border-black-400">
                  [CONTACT.SUPPORT]
                </a>
              </div>
              <div className="mt-6 pt-6 border-t border-black-400 border-opacity-20">
                <p className="text-black-400 opacity-75 text-sm font-mono tracking-wider">
                  (C) 2025 TESTCASE.GEN • MADE.WITH.LOVE.FOR.BETTER.TESTING
                </p>
              </div>
            </div>
          </div>
        </footer>
          </div>

          {/* Right Sidebar - Results */}
          {result && sidebarOpen && (
            <div 
              className="fixed right-0 top-0 min-h-screen border-l-4 border-black-400 bg-gray-900 transition-all duration-300 ease-in-out flex z-40"
              style={{ 
                width: `${sidebarWidth}%`,
                height: '100vh',
                overflow: 'hidden'
              }}
            >
              {/* Resize Handle */}
              <div
                className="w-1 bg-black-400 hover:bg-black-300 cursor-ew-resize flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                onMouseDown={handleMouseDown}
                style={{
                  background: isResizing ? '#00ff00' : '#4ade80'
                }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-0.5 h-8 bg-gray-600"></div>
                </div>
              </div>
              
              {/* Sidebar Content */}
              <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex-shrink-0 bg-gray-900 border-b-4 border-black-400 p-6">
                <h2 className="text-2xl font-bold font-mono tracking-wider text-black-400">
                  [RESULTS.PANEL]
                </h2>
                <p className="text-black-300 font-mono">
                  {result.title?.toUpperCase() || 'TEST.CASES.GENERATED'}
                </p>
                {result.testCases && (
                  <div className="space-y-3 mt-3">
                    {/* Priority Filter */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 font-mono tracking-wider text-black-400">
                        [FILTER.BY.PRIORITY]
                      </label>
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="w-full p-2 border-2 border-black-400 focus:outline-none focus:border-black-300 text-sm font-mono bg-black text-black-400"
                      >
                        <option value="all">[ALL] ({result.testCases.length})</option>
                        <option value="high">[HIGH] ({result.testCases.filter(tc => tc.priority === 'high').length})</option>
                        <option value="medium">[MEDIUM] ({result.testCases.filter(tc => tc.priority === 'medium').length})</option>
                        <option value="low">[LOW] ({result.testCases.filter(tc => tc.priority === 'low').length})</option>
                      </select>
                    </div>
                    
                    {/* Statistics */}
                    <div className="flex flex-wrap gap-2">
                      <div className="px-3 py-1 border-2 border-black-400 font-semibold bg-black text-black-400 font-mono text-sm">
                        SHOWING: {filteredTestCases.length}
                      </div>
                      <div className="px-3 py-1 border-2 border-blue-400 font-semibold bg-black text-blue-400 font-mono text-sm">
                        TOTAL: {result.testCases.length}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 border-2 border-black-400 font-semibold transition-all hover:bg-black-900 flex items-center gap-2 font-mono bg-black text-black-400 text-sm"
                  >
                    📋 [COPY.JSON]
                  </button>
                  <button
                    onClick={downloadTestCases}
                    className="px-4 py-2 border-2 border-black-400 font-semibold transition-all hover:bg-black-800 flex items-center gap-2 font-mono bg-black-700 text-black text-sm"
                  >
                    💾 [DOWNLOAD.JSON]
                  </button>
                  <button
                    onClick={() => {
                      const dataToExport = priorityFilter === 'all' ? result.testCases : filteredTestCases;
                      if (!dataToExport) return;
                      const csv = generateCSV(dataToExport);
                      const filename = priorityFilter === 'all' ? 'test-cases.csv' : `test-cases-${priorityFilter}.csv`;
                      downloadCSV(csv, filename);
                    }}
                    className="px-4 py-2 border-2 border-black-400 font-semibold transition-all hover:bg-black-900 flex items-center gap-2 font-mono bg-black text-black-400 text-sm"
                  >
                    📊 [EXPORT.CSV]
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
                      <div key={testCase.id || index} className="border-2 border-black-400 bg-black font-mono">
                        {/* Accordion Header */}
                        <button
                          onClick={() => setExpandedTestCase(expandedTestCase === index ? null : index)}
                          className="w-full p-4 text-left hover:bg-black-900 transition-colors flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <h3 className="text-lg font-bold font-mono tracking-wider text-black-400">
                              [{testCase.id}] {testCase.title?.toUpperCase() || `TEST.CASE.${index + 1}`}
                            </h3>
                            <p className="text-sm text-black-300 font-mono mt-1">
                              {testCase.category?.toUpperCase()} • {testCase.priority?.toUpperCase()}.PRIORITY
                            </p>
                          </div>
                          <span className="text-black-400 font-mono text-xl ml-4">
                            {expandedTestCase === index ? '[-]' : '[+]'}
                          </span>
                        </button>

                        {/* Accordion Content */}
                        {expandedTestCase === index && (
                          <div className="border-t-2 border-black-400 p-4 space-y-4">
                            {/* Description */}
                            <div>
                              <h4 className="text-sm font-bold mb-2 font-mono tracking-wider text-black-400">
                                [DESCRIPTION]
                              </h4>
                              <p className="text-black-300 font-mono text-sm">
                                {testCase.description?.toUpperCase()}
                              </p>
                            </div>

                            {/* Preconditions */}
                            {testCase.preconditions && (
                              <div>
                                <h4 className="text-sm font-bold mb-2 font-mono tracking-wider text-black-400">
                                  [PREREQUISITES]
                                </h4>
                                <p className="text-black-300 font-mono text-sm">
                                  {testCase.preconditions.toUpperCase()}
                                </p>
                              </div>
                            )}

                            {/* Test Steps */}
                            <div>
                              <h4 className="text-sm font-bold mb-2 font-mono tracking-wider text-black-400">
                                [TEST.STEPS]
                              </h4>
                              <ol className="space-y-1">
                                {testCase.testSteps?.map((step, stepIndex) => (
                                  <li key={stepIndex} className="flex items-start gap-2">
                                    <span className="flex-shrink-0 w-5 h-5 border border-black-400 flex items-center justify-center text-xs font-bold font-mono text-black-400">
                                      {stepIndex + 1}
                                    </span>
                                    <span className="text-black-300 font-mono text-sm">
                                      {step.replace(/^Step \d+:\s*/, '').replace(/^\d+\.\s*/, '').toUpperCase()}
                                    </span>
                                  </li>
                                ))}
                              </ol>
                            </div>

                            {/* Input Data */}
                            <div>
                              <h4 className="text-sm font-bold mb-2 font-mono tracking-wider text-black-400">
                                [INPUT.DATA]
                              </h4>
                              <div className="p-3 border border-black-400 bg-gray-800">
                                {typeof testCase.inputData === 'object' ? (
                                  <pre className="text-xs whitespace-pre-wrap text-black-300 font-mono">
                                    {JSON.stringify(testCase.inputData, null, 2)}
                                  </pre>
                                ) : (
                                  <span className="text-black-300 font-mono text-sm">{testCase.inputData?.toUpperCase()}</span>
                                )}
                              </div>
                            </div>

                            {/* Expected Result */}
                            <div>
                              <h4 className="text-sm font-bold mb-2 font-mono tracking-wider text-black-400">
                                [EXPECTED.RESULT]
                              </h4>
                              <div className="p-3 border border-black-400 bg-gray-800">
                                {typeof testCase.expectedResult === 'object' ? (
                                  <pre className="text-xs whitespace-pre-wrap text-black-300 font-mono">
                                    {JSON.stringify(testCase.expectedResult, null, 2)}
                                  </pre>
                                ) : (
                                  <span className="text-black-300 font-mono text-sm">{testCase.expectedResult?.toUpperCase()}</span>
                                )}
                              </div>
                            </div>

                            {/* Tags */}
                            {testCase.tags && testCase.tags.length > 0 && (
                              <div>
                                <h4 className="text-sm font-bold mb-2 font-mono tracking-wider text-black-400">
                                  [TAGS]
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                  {testCase.tags.map((tag, tagIndex) => (
                                    <span key={tagIndex} className="px-2 py-1 border border-black-400 text-xs font-medium font-mono text-black-400">
                                      {tag.toUpperCase()}
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
                      <div className="text-center py-8 font-mono">
                        <div className="text-2xl mb-3 text-yellow-400">🔍 [NO.MATCHES]</div>
                        <p className="text-lg font-mono tracking-wider text-yellow-300">
                          NO.TEST.CASES.MATCH.PRIORITY: {priorityFilter.toUpperCase()}
                        </p>
                        <button
                          onClick={() => setPriorityFilter('all')}
                          className="mt-4 px-4 py-2 border-2 border-black-400 font-semibold transition-all hover:bg-black-900 font-mono bg-black text-black-400 text-sm"
                        >
                          [SHOW.ALL]
                        </button>
                      </div>
                    )}
                  </div>
                ) : result.rawResponse ? (
                  <div className="border-2 border-red-400 p-4 font-mono">
                    <h3 className="text-lg font-bold mb-3 font-mono tracking-wider text-red-400">
                      [PARSING.ERROR]
                    </h3>
                    <div className="p-3 bg-red-900 border border-red-400 mb-4 font-mono">
                      <p className="text-red-300 font-medium text-sm">
                        THE.AI.RESPONSE.COULD.NOT.BE.PARSED.AS.JSON
                      </p>
                      {result.parseError && (
                        <p className="text-xs text-red-400 mt-2 font-mono">ERROR: {result.parseError}</p>
                      )}
                    </div>
                    <div className="p-3 border border-black-400 max-h-64 overflow-y-auto bg-gray-800">
                      <pre className="whitespace-pre-wrap text-xs font-mono text-black-300">
                        {result.rawResponse}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 font-mono">
                    <div className="text-4xl mb-3 text-black-400">[NO.DATA]</div>
                    <p className="text-lg font-mono tracking-wider text-black-300">NO.TEST.CASES.GENERATED</p>
                  </div>
                )}
              </div>
              </div>
            </div>
          )}
          
        </div>
  );
}
