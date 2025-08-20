'use client';

import { Search, Brain, Shield, Zap, Users, BarChart3 } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            About CV Search
          </h1>
          <p className="text-xl text-gray-600">
            Revolutionizing how HR teams find and evaluate candidates
          </p>
        </div>

        {/* Mission Statement */}
        <div className="card mb-12">
          <div className="card-body text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Our Mission
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              CV Search is an AI-powered tool designed to transform the recruitment process. 
              We believe that finding the right candidate shouldn't require hours of manual 
              CV screening. Our intelligent system understands your hiring needs and finds 
              the perfect matches using advanced natural language processing and vector search technology.
            </p>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center mb-4">
                <div className="bg-primary-100 rounded-lg p-3 mr-4">
                  <Search className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Natural Language Search
                </h3>
              </div>
              <p className="text-gray-600">
                Search for candidates using everyday language. No need to learn complex 
                search syntax or boolean operators. Simply describe what you're looking for.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center mb-4">
                <div className="bg-success-100 rounded-lg p-3 mr-4">
                  <Brain className="h-6 w-6 text-success-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  AI-Powered Parsing
                </h3>
              </div>
              <p className="text-gray-600">
                Our AI automatically extracts key information from CVs including skills, 
                experience, education, and contact details, making every CV searchable.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center mb-4">
                <div className="bg-warning-100 rounded-lg p-3 mr-4">
                  <Zap className="h-6 w-6 text-warning-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Lightning Fast Search
                </h3>
              </div>
              <p className="text-gray-600">
                Vector-based search technology provides instant results with high accuracy. 
                Find relevant candidates in seconds, not hours.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center mb-4">
                <div className="bg-error-100 rounded-lg p-3 mr-4">
                  <Shield className="h-6 w-6 text-error-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Privacy & Security
                </h3>
              </div>
              <p className="text-gray-600">
                Your CV data is stored securely with local file storage and encrypted 
                vector embeddings. We prioritize data privacy and security.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="card mb-12">
          <div className="card-header">
            <h2 className="text-2xl font-semibold text-gray-900">
              How It Works
            </h2>
          </div>
          
          <div className="card-body">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Upload CVs
                  </h3>
                  <p className="text-gray-600">
                    Upload PDF CVs through our intuitive drag-and-drop interface. 
                    Support for both single and bulk uploads makes it easy to add 
                    multiple candidates at once.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    AI Processing
                  </h3>
                  <p className="text-gray-600">
                    Our AI extracts text from PDFs, parses candidate information, 
                    and generates vector embeddings. This process happens automatically 
                    and typically takes just a few seconds per CV.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Intelligent Search
                  </h3>
                  <p className="text-gray-600">
                    Search using natural language queries. Our system understands 
                    context, skills, experience requirements, and location preferences 
                    to find the most relevant candidates.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Review & Download
                  </h3>
                  <p className="text-gray-600">
                    Review candidate details, skills, and experience. Download 
                    original CVs and contact information to proceed with your 
                    recruitment process.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="card mb-12">
          <div className="card-header">
            <h2 className="text-2xl font-semibold text-gray-900">
              Technology Stack
            </h2>
          </div>
          
          <div className="card-body">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <h3 className="font-medium text-gray-900 mb-2">Frontend</h3>
                <p className="text-sm text-gray-600">
                  Next.js 14, React 18, TypeScript, Tailwind CSS
                </p>
              </div>
              
              <div className="text-center">
                <h3 className="font-medium text-gray-900 mb-2">Backend</h3>
                <p className="text-sm text-gray-600">
                  NestJS, Node.js, TypeScript, Express
                </p>
              </div>
              
              <div className="text-center">
                <h3 className="font-medium text-gray-900 mb-2">AI & Database</h3>
                <p className="text-sm text-gray-600">
                  OpenAI GPT-4, OpenAI Embeddings, Pinecone Vector DB
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-2xl font-semibold text-gray-900">
              Benefits for HR Teams
            </h2>
          </div>
          
          <div className="card-body">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    Faster Hiring
                  </h3>
                  <p className="text-sm text-gray-600">
                    Reduce time-to-hire by finding qualified candidates in minutes, not hours
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <BarChart3 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    Better Quality Matches
                  </h3>
                  <p className="text-sm text-gray-600">
                    AI-powered matching ensures you find candidates with the right skills and experience
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Zap className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    Improved Efficiency
                  </h3>
                  <p className="text-sm text-gray-600">
                    Automate repetitive CV screening tasks and focus on strategic recruitment
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    Data Security
                  </h3>
                  <p className="text-sm text-gray-600">
                    Keep candidate data secure with local storage and encrypted processing
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 