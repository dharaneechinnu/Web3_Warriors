"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"

export function WalletConnect() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")

  const handleConnect = () => {
    setIsConnecting(true)
    // Simulate wallet connection
    setTimeout(() => {
      const randomAddress = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(
        "",
      )}`
      setWalletAddress(randomAddress)
      setIsConnected(true)
      setIsConnecting(false)
    }, 1500)
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
            <Button variant="ghost" size="sm" onClick={() => setIsConnected(false)}>
              Disconnect
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

