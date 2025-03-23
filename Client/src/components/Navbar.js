import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Web3 from 'web3';
import api from '../services/api';
import { contractabi } from '../services/abi';
import {address} from '../services/contractAddress'
const contractABI = contractabi;
const contractAddress = address; // Replace with your token contract address

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const [coin, setCoins] = useState('0');

  useEffect(() => {
    const storedCoins = localStorage.getItem('tokencoin');
    if (storedCoins) setCoins(storedCoins);
  }, []);

  const getTokenBalance = async () => {
    if (window.ethereum) {
      try {
        const web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3.eth.getAccounts();
        const contract = new web3.eth.Contract(contractABI, contractAddress);
        const balance = await contract.methods.balanceOf(accounts[0]).call();
        const formattedBalance = web3.utils.fromWei(balance, 'ether'); // Convert to readable format
        setCoins(formattedBalance);
        localStorage.setItem('tokencoin', formattedBalance);
      } catch (error) {
        console.error("Error fetching token balance:", error);
      }
    } else {
      alert("Please install MetaMask to interact with the contract.");
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      localStorage.removeItem('tokencoin');
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold">Web3 Warriors</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {token ? (
              <>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-300 px-3 py-2 text-sm font-medium">
                    TokenCoins: {coin}
                  </span>
                  <button
                    onClick={getTokenBalance}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-md text-sm"
                  >
                    Refresh
                  </button>
                </div>
                <Link
                  to="/dashboard"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/sessions"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sessions
                </Link>
                <Link
                  to="/wallet"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Wallet
                </Link>
                {userRole === 'mentor' && (
                  <Link
                    to="/mentor/profile"
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Mentor Profile
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
