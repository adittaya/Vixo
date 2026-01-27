import React, { useState, useEffect } from 'react';
import { User, Transaction, Purchase } from '../types';
import { getStore, saveStore } from '../store';
import { Shield, UserCheck, CreditCard, Wallet, AlertTriangle, CheckCircle, XCircle, Clock, Search, Filter, Download, Eye, Edit, Trash2 } from 'lucide-react';

interface AdminPanelProps {
  user: User;
  isVisible: boolean;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user, isVisible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'transactions' | 'reports'>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from store
  useEffect(() => {
    if (isVisible) {
      loadData();
    }
  }, [isVisible]);

  const loadData = async () => {
    setIsLoading(true);
    const store = getStore();
    setUsers(store.users || []);
    setTransactions(store.transactions || []);
    setIsLoading(false);
  };

  // Filter users based on search term
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.mobile.includes(searchTerm) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(t => 
    t.userId.includes(searchTerm) ||
    String(t.amount).includes(searchTerm) ||
    t.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Admin actions
  const updateUserStatus = async (userId: string, newStatus: string) => {
    const store = getStore();
    const updatedUsers = store.users.map(u => 
      u.id === userId ? { ...u, status: newStatus } : u
    );
    
    await saveStore({ ...store, users: updatedUsers });
    setUsers(updatedUsers);
  };

  const processTransaction = async (transactionId: string, action: 'approve' | 'reject') => {
    const store = getStore();
    const updatedTransactions = store.transactions.map(t => 
      t.id === transactionId ? { ...t, status: action === 'approve' ? 'approved' : 'rejected' } : t
    );
    
    await saveStore({ ...store, transactions: updatedTransactions });
    setTransactions(updatedTransactions);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30">
              <img
                src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=200&auto=format&fit=crop"
                className="w-full h-full object-cover"
                alt="Simran"
              />
            </div>
            <div>
              <h2 className="font-bold text-xl">Admin Support Panel</h2>
              <p className="text-sm opacity-80">Assist users & resolve issues</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            className={`px-6 py-3 font-semibold text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'dashboard' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            <CreditCard size={16} />
            Dashboard
          </button>
          <button
            className={`px-6 py-3 font-semibold text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'users' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('users')}
          >
            <UserCheck size={16} />
            Users
          </button>
          <button
            className={`px-6 py-3 font-semibold text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'transactions' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('transactions')}
          >
            <Wallet size={16} />
            Transactions
          </button>
          <button
            className={`px-6 py-3 font-semibold text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'reports' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('reports')}
          >
            <Download size={16} />
            Reports
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 bg-gray-50">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : activeTab === 'dashboard' ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <UserCheck className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Total Users</p>
                    <p className="font-bold text-xl">{users.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Wallet className="text-green-600" size={24} />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Active Users</p>
                    <p className="font-bold text-xl">{users.filter(u => u.status === 'active').length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <CreditCard className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Total Transactions</p>
                    <p className="font-bold text-xl">{transactions.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <AlertTriangle className="text-yellow-600" size={24} />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Pending Actions</p>
                    <p className="font-bold text-xl">
                      {transactions.filter(t => t.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {transactions.slice(0, 5).map(transaction => (
                    <div key={transaction.id} className="flex justify-between text-sm">
                      <span>{users.find(u => u.id === transaction.userId)?.name || transaction.userId}</span>
                      <span className={`font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type}: ₹{Math.abs(transaction.amount)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        transaction.status === 'approved' ? 'bg-green-100 text-green-800' :
                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="md:col-span-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg mb-3">User Status Overview</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active</span>
                    <span className="font-medium">{users.filter(u => u.status === 'active').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frozen</span>
                    <span className="font-medium">{users.filter(u => u.status === 'frozen').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Banned</span>
                    <span className="font-medium">{users.filter(u => u.status === 'banned').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Inactive</span>
                    <span className="font-medium">{users.filter(u => u.status === 'inactive').length}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'users' ? (
            <div>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  <Filter size={18} />
                  Filter
                </button>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.mobile}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.status === 'active' ? 'bg-green-100 text-green-800' :
                            user.status === 'frozen' ? 'bg-yellow-100 text-yellow-800' :
                            user.status === 'banned' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">₹{user.balance.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setSelectedUser(user)}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-full"
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              onClick={() => updateUserStatus(user.id, user.status === 'active' ? 'frozen' : 'active')}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-full"
                            >
                              {user.status === 'active' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'transactions' ? (
            <div>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  <Filter size={18} />
                  Filter
                </button>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredTransactions.map(transaction => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {users.find(u => u.id === transaction.userId)?.name || transaction.userId}
                        </td>
                        <td className="py-3 px-4 capitalize">{transaction.type}</td>
                        <td className={`py-3 px-4 font-medium ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ₹{Math.abs(transaction.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.status === 'approved' ? 'bg-green-100 text-green-800' :
                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {transaction.status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => processTransaction(transaction.id, 'approve')}
                                  className="p-1.5 text-green-600 hover:bg-green-100 rounded-full"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button 
                                  onClick={() => processTransaction(transaction.id, 'reject')}
                                  className="p-1.5 text-red-600 hover:bg-red-100 rounded-full"
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-bold text-lg mb-4">Reports & Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <h4 className="font-medium mb-2">Daily Activity</h4>
                  <p className="text-2xl font-bold text-blue-600">142</p>
                  <p className="text-sm text-gray-500">users logged in</p>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <h4 className="font-medium mb-2">Revenue</h4>
                  <p className="text-2xl font-bold text-green-600">₹24,567</p>
                  <p className="text-sm text-gray-500">this month</p>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <h4 className="font-medium mb-2">Avg. Response Time</h4>
                  <p className="text-2xl font-bold text-purple-600">2m 14s</p>
                  <p className="text-sm text-gray-500">to customer queries</p>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <h4 className="font-medium mb-2">Satisfaction Rate</h4>
                  <p className="text-2xl font-bold text-yellow-600">94%</p>
                  <p className="text-sm text-gray-500">of customers</p>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <h4 className="font-medium mb-2">Issues Resolved</h4>
                  <p className="text-2xl font-bold text-indigo-600">89%</p>
                  <p className="text-sm text-gray-500">first contact resolution</p>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <h4 className="font-medium mb-2">Active Disputes</h4>
                  <p className="text-2xl font-bold text-red-600">5</p>
                  <p className="text-sm text-gray-500">awaiting resolution</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;