import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useParams } from 'react-router-dom';
import Web3 from 'web3';

function MentorProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchMentorProfile();
  }, []);

  const fetchMentorProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`mentorship/getMentor/${id}`);
      setProfile(response.data);
    } catch (err) {
      console.error('Error fetching mentor profile:', err);
      setError('Failed to load mentor profile');
    } finally {
      setLoading(false);
    }
  };

  const transferForMentorship = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        return;
      }

      const web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await web3.eth.getAccounts();
      const sender = accounts[0];

      const contractAddress = "YOUR_CONTRACT_ADDRESS"; 
      const contractABI = [
        {
          "constant": false,
          "inputs": [
            { "name": "_to", "type": "address" },
            { "name": "_amount", "type": "uint256" }
          ],
          "name": "transferForMentorship",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ];

      const contract = new web3.eth.Contract(contractABI, contractAddress);
      const amountToSend = web3.utils.toWei("0.01", "ether"); 

      await contract.methods.transferForMentorship(profile.mentorship.walletAddress, amountToSend).send({ from: sender });
      setSuccess("Transaction successful!");
    } catch (err) {
      console.error("Transaction failed:", err);
      setError("Transaction failed. Please try again.");
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">Mentor Profile</h1>
            <button
              onClick={transferForMentorship}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Pay for Mentorship
            </button>
          </div>

          {error && <div className="bg-red-500/20 text-red-500 p-4 rounded-lg mb-6">{error}</div>}
          {success && <div className="bg-green-500/20 text-green-500 p-4 rounded-lg mb-6">{success}</div>}

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Name</h2>
              <p className="text-gray-300">{profile?.mentorship?.name}</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {profile?.mentorship?.skills?.map((skill, index) => (
                  <span key={index} className="bg-blue-500 px-2 py-1 rounded text-sm text-white">{skill}</span>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Wallet Address</h2>
              <p className="text-gray-300">{profile?.mentorship?.walletAddress || 'Not available'}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default MentorProfile;
