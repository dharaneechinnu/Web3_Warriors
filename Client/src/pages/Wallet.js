import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';

function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [transferData, setTransferData] = useState({
    recipientId: '',
    amount: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [transferLoading, setTransferLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await api.get('/wallet', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setWallet(response.data);
    } catch (err) {
      console.error('Error fetching wallet:', err);
      setError('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      setTransferLoading(true);
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem('token');
      await api.post('/wallet/transfer', transferData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSuccess('Transfer successful!');
      
      // Reset form and refresh wallet data
      setTransferData({ recipientId: '', amount: '', description: '' });
      fetchWalletData();
    } catch (err) {
      console.error('Transfer error:', err);
      setError(err.response?.data?.message || 'Transfer failed');
    } finally {
      setTransferLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTransferData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {/* Wallet Info */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6">Your Wallet</h2>
          
          <div className="mb-8">
            <p className="text-gray-400 text-lg mb-2">Current Balance</p>
            <p className="text-3xl font-bold text-white">{wallet?.balance || 0} tokens</p>
          </div>

          {/* Transaction History */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Transaction History</h3>
            <div className="space-y-4">
              {wallet?.transactions?.map((transaction, index) => (
                <div
                  key={index}
                  className="bg-gray-700 p-4 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="text-white font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(transaction.date).toLocaleString()}
                    </p>
                  </div>
                  <p className={`font-bold ${
                    transaction.type === 'credit' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {transaction.type === 'credit' ? '+' : '-'}{transaction.amount}
                  </p>
                </div>
              ))}
              {(!wallet?.transactions || wallet.transactions.length === 0) && (
                <p className="text-gray-400 text-center">No transactions found</p>
              )}
            </div>
          </div>
        </div>

        {/* Transfer Form */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6">Transfer Tokens</h2>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-500/20 text-red-500 p-4 rounded-lg mb-6"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-green-500/20 text-green-500 p-4 rounded-lg mb-6"
            >
              {success}
            </motion.div>
          )}

          <form onSubmit={handleTransfer} className="space-y-6">
            <div>
              <label className="block text-gray-400 mb-2">Recipient ID</label>
              <input
                type="text"
                name="recipientId"
                value={transferData.recipientId}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter recipient's ID"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Amount</label>
              <input
                type="number"
                name="amount"
                value={transferData.amount}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter amount to transfer"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Description</label>
              <input
                type="text"
                name="description"
                value={transferData.description}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter transfer description"
              />
            </div>

            <button
              type="submit"
              disabled={transferLoading}
              className={`w-full py-2 px-4 rounded-lg ${
                transferLoading
                  ? 'bg-blue-500/50 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              } transition-colors text-white font-medium`}
            >
              {transferLoading ? 'Processing...' : 'Transfer Tokens'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default Wallet;
