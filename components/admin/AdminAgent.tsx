import React, { useState, useRef, useEffect } from 'react';
import { User, Transaction, Purchase, AdminSettings } from '../../types';
import { getStore, saveStore } from '../../store';
import { codeGeneratorAI } from '../../services/codeGeneratorAI';
import { Send, X, Bot, User as UserIcon, Code, Wrench, FileText, Settings, Zap, Cpu, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

interface AdminAgentProps {
  isOpen: boolean;
  onClose: () => void;
  admin: AdminSettings;
}

const AdminAgent: React.FC<AdminAgentProps> = ({ isOpen, onClose, admin }) => {
  const [messages, setMessages] = useState<Array<{role: 'user' | 'agent', content: string, timestamp: Date}>>([
    {
      role: 'agent',
      content: "Hello! I'm your AI Development Assistant. I can help you create new features, modify the application, or provide insights about users. What would you like to do?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'user-details'>('chat');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage = {
      role: 'user' as const,
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // Check if this is a user details request
      if (input.toLowerCase().includes('user details') || input.toLowerCase().includes('user info')) {
        if (selectedUser) {
          const details = await codeGeneratorAI.getUserDetails(selectedUser);
          setUserDetails(details);
          setActiveTab('user-details');
          
          const agentMessage = {
            role: 'agent' as const,
            content: `I've retrieved the details for the selected user. You can view them in the User Details tab.`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, agentMessage]);
        } else {
          const agentMessage = {
            role: 'agent' as const,
            content: "Please select a user first to get their details.",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, agentMessage]);
        }
      }
      // Check if this is a code generation request
      else if (input.toLowerCase().includes('create') || 
               input.toLowerCase().includes('add') || 
               input.toLowerCase().includes('new') || 
               input.toLowerCase().includes('generate')) {
        // Generate code based on request
        const generated = await codeGeneratorAI.generateCode(input);
        
        // Apply the generated code
        const success = await codeGeneratorAI.applyCode(generated.code, generated.fileName);
        
        const agentMessage = {
          role: 'agent' as const,
          content: success 
            ? `I've created a new ${generated.description}. The code has been applied to ${generated.fileName}. You may need to restart the application to see changes.` 
            : "I attempted to create the requested feature, but encountered an issue applying the code.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, agentMessage]);
      }
      // Default response
      else {
        // For now, provide a simulated response
        // In a real implementation, this would connect to an AI service
        const responses = [
          "I understand your request. Let me analyze what needs to be done...",
          "I can help with that. What specific functionality are you looking for?",
          "That's an interesting request. I can create that for you.",
          "I've processed your request and prepared the necessary implementations.",
          "Based on your request, I recommend the following approach..."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const agentMessage = {
          role: 'agent' as const,
          content: randomResponse,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, agentMessage]);
      }
    } catch (error) {
      console.error('Error processing request:', error);
      const errorMessage = {
        role: 'agent' as const,
        content: "I encountered an error while processing your request. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  const users = getStore().users;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-6xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <Cpu className="text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">AI Development Assistant</h2>
              <p className="text-gray-400 text-sm">Create features, modify code, and manage users</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'chat' ? 'user-details' : 'chat')}
              className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              {activeTab === 'chat' ? 'User Details' : 'Chat'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - User Selection */}
          <div className="w-64 bg-gray-800/50 border-r border-gray-700 p-4 overflow-y-auto">
            <h3 className="text-gray-300 font-semibold mb-3">Users</h3>
            <div className="space-y-2">
              {users.map(user => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedUser === user.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="font-medium truncate">{user.name}</div>
                  <div className="text-xs opacity-70 truncate">{user.mobile}</div>
                  <div className="text-xs mt-1">Balance: ₹{user.balance}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-700">
              <h3 className="text-gray-300 font-semibold mb-3">Capabilities</h3>
              <div className="space-y-2 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <Code size={14} className="text-green-400" />
                  <span>Create new pages/features</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wrench size={14} className="text-blue-400" />
                  <span>Modify existing functionality</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserIcon size={14} className="text-purple-400" />
                  <span>User management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings size={14} className="text-yellow-400" />
                  <span>Admin panel enhancements</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {activeTab === 'chat' ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <AnimatePresence>
                    {messages.map((msg, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] rounded-2xl p-4 ${
                          msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-gray-700 text-gray-100 rounded-bl-none'
                        }`}>
                          <div className="flex items-start gap-2">
                            {msg.role === 'agent' && (
                              <Bot size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
                            )}
                            <div>
                              <div className="font-medium text-sm">
                                {msg.role === 'user' ? 'You' : 'AI Assistant'}
                              </div>
                              <div className="mt-1 text-sm whitespace-pre-wrap">
                                {msg.content}
                              </div>
                              <div className="text-xs opacity-60 mt-2">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            {msg.role === 'user' && (
                              <UserIcon size={18} className="text-blue-300 mt-0.5 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                  </AnimatePresence>
                  
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-2xl p-4 bg-gray-700 text-gray-100 rounded-bl-none">
                        <div className="flex items-center gap-2">
                          <Bot size={18} className="text-blue-400" />
                          <div>
                            <div className="font-medium text-sm">AI Assistant</div>
                            <div className="flex items-center gap-1 mt-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                              <span className="ml-2 text-sm">Thinking...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-700">
                  <div className="flex gap-2">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask me to create a new feature, modify functionality, or get user details..."
                      className="flex-1 bg-gray-700 text-white rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!input.trim() || isProcessing}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white p-3 rounded-xl transition-colors"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Examples: "Create a new admin dashboard", "Show details for user 123", "Add a referral bonus system"
                  </div>
                </div>
              </>
            ) : (
              // User Details Tab
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-white font-semibold text-lg mb-4">User Details</h3>
                
                {userDetails ? (
                  <div className="space-y-4">
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                      <h4 className="text-blue-400 font-semibold mb-2">User Information</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-gray-400">Name:</span> <span className="text-white">{userDetails.user.name}</span></div>
                        <div><span className="text-gray-400">Mobile:</span> <span className="text-white">{userDetails.user.mobile}</span></div>
                        <div><span className="text-gray-400">Balance:</span> <span className="text-green-400">₹{userDetails.user.balance}</span></div>
                        <div><span className="text-gray-400">Status:</span> <span className={`${
                          userDetails.user.status === 'active' ? 'text-green-400' : 
                          userDetails.user.status === 'frozen' ? 'text-yellow-400' : 'text-red-400'
                        }`}>{userDetails.user.status}</span></div>
                        <div><span className="text-gray-400">VIP Level:</span> <span className="text-purple-400">{userDetails.user.vipLevel}</span></div>
                        <div><span className="text-gray-400">Registration:</span> <span className="text-white">{userDetails.user.registrationDate}</span></div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                      <h4 className="text-blue-400 font-semibold mb-2">Statistics</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-gray-400">Total Deposits:</span> <span className="text-green-400">₹{userDetails.statistics.totalDeposits}</span></div>
                        <div><span className="text-gray-400">Total Withdrawals:</span> <span className="text-red-400">₹{userDetails.statistics.totalWithdrawals}</span></div>
                        <div><span className="text-gray-400">Net Value:</span> <span className={`${
                          userDetails.statistics.netValue >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>₹{userDetails.statistics.netValue}</span></div>
                        <div><span className="text-gray-400">Transactions:</span> <span className="text-white">{userDetails.statistics.transactionCount}</span></div>
                        <div><span className="text-gray-400">Active Investments:</span> <span className="text-white">{userDetails.statistics.activePurchases}</span></div>
                        <div><span className="text-gray-400">Completed Investments:</span> <span className="text-white">{userDetails.statistics.completedPurchases}</span></div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                      <h4 className="text-blue-400 font-semibold mb-2">Recommendations</h4>
                      <ul className="space-y-2">
                        {userDetails.recommendations.map((rec: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-300">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <UserIcon size={48} className="mb-4" />
                    <p>Select a user and ask for details</p>
                    <p className="text-sm mt-2">Use the sidebar to select a user, then type "get user details"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAgent;