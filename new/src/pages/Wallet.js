import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { user } from '../services/api';

function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transferForm, setTransferForm] = useState({
    amount: '',
    recipientId: '',
    description: ''
  });
  const [showTransferForm, setShowTransferForm] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const response = await user.getWallet();
      setWallet(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    try {
      await user.transferTokens(transferForm);
      setTransferForm({ amount: '', recipientId: '', description: '' });
      setShowTransferForm(false);
      fetchWalletData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTransferForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Wallet Balance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-lg p-8 mb-8"
      >
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">Wallet Balance</h2>
            <p className="text-4xl font-bold text-blue-500">${wallet?.balance || 0}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400">Last updated:</p>
            <p className="text-sm">{new Date().toLocaleString()}</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setShowTransferForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors"
        >
          Send Tokens
        </motion.button>
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => {/* Implement receive tokens logic */}}
          className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors"
        >
          Receive Tokens
        </motion.button>
      </div>

      {/* Transfer Form */}
      {showTransferForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-6 mb-8"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Transfer Tokens</h2>
            <button
              onClick={() => setShowTransferForm(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleTransferSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-2">Amount</label>
              <input
                type="number"
                name="amount"
                value={transferForm.amount}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Recipient ID</label>
              <input
                type="text"
                name="recipientId"
                value={transferForm.recipientId}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Description</label>
              <input
                type="text"
                name="description"
                value={transferForm.description}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Send Transfer
            </button>
          </form>
        </motion.div>
      )}

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800 rounded-lg p-6"
      >
        <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
        <div className="space-y-4">
          {wallet?.transactions?.map((tx, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-700 p-4 rounded-lg flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{tx.description}</p>
                <p className="text-sm text-gray-400">
                  {new Date(tx.date).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className={tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}>
                  {tx.type === 'credit' ? '+' : '-'}${tx.amount}
                </p>
              </div>
            </motion.div>
          ))}
          {(!wallet?.transactions || wallet.transactions.length === 0) && (
            <p className="text-center text-gray-400">No transaction history</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default Wallet;
