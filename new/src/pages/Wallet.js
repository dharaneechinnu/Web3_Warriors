import React from 'react';
import { motion } from 'framer-motion';

function Wallet() {
  const transactions = [
    { type: 'Earned', amount: '500', from: 'Teaching Session', date: '2024-03-22' },
    { type: 'Spent', amount: '200', from: 'Course Purchase', date: '2024-03-21' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Wallet Balance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-lg p-8 mb-8"
      >
        <h2 className="text-2xl font-bold mb-2">Wallet Balance</h2>
        <p className="text-4xl font-bold text-blue-500">2,500 SKL</p>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg"
        >
          Send Tokens
        </motion.button>
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg"
        >
          Receive Tokens
        </motion.button>
      </div>

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800 rounded-lg p-6"
      >
        <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
        <div className="space-y-4">
          {transactions.map((tx, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-700 p-4 rounded-lg flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{tx.type}</p>
                <p className="text-sm text-gray-400">{tx.from}</p>
              </div>
              <div className="text-right">
                <p className={tx.type === 'Earned' ? 'text-green-500' : 'text-red-500'}>
                  {tx.type === 'Earned' ? '+' : '-'}{tx.amount} SKL
                </p>
                <p className="text-sm text-gray-400">{tx.date}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default Wallet;
