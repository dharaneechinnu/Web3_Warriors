"use client"

import { useState, useEffect } from "react"
import Web3 from "web3"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"

export function WalletConnect() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [web3, setWeb3] = useState(null)

  useEffect(() => {
    if (window.ethereum) {
      setWeb3(new Web3(window.ethereum))
    } else {
      console.warn("No Ethereum provider found. Install MetaMask!")
    }
  }, [])

  const sendToBackend = async (address) => {
    try {
      const response = await fetch("http://localhost:3500/User/wallet/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address })
      })
      const data = await response.json()
      console.log("Backend response:", data)
    } catch (error) {
      console.error("Failed to send wallet address to backend:", error)
    }
  }

  const handleConnect = async () => {
    if (!web3) {
      alert("Please install MetaMask or another Web3 provider!")
      return
    }

    try {
      setIsConnecting(true)
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      setWalletAddress(accounts[0])
      setIsConnected(true)
      sendToBackend(accounts[0]) // Send to backend after connecting
    } catch (error) {
      console.error("Wallet connection failed:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    setWalletAddress("")
    setIsConnected(false)
  }

  return (
    <div className="space-y-4">
      {!isConnected ? (
        <Button variant="outline" className="w-full" onClick={handleConnect} disabled={isConnecting}>
          {isConnecting ? (
            <div className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-4 w-4 text-primary"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Connecting Wallet...
            </div>
          ) : (
            <div className="flex items-center">
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </div>
          )}
        </Button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 border rounded-lg bg-muted/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium">Wallet Connected</div>
                <div className="text-xs text-muted-foreground">
                  {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
