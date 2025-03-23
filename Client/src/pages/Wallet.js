"use client"

import { useState, useEffect } from "react"
import styled, { keyframes, css } from "styled-components"
import { motion } from "framer-motion"
import api from "../services/api"
import Button from "../components/ui/Button"
import Card from "../components/ui/Card"
import Input from "../components/ui/Input"
import { Heading2, Heading3, Paragraph } from "../components/ui/Typography"

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`

const WalletContainer = styled.div`
  padding: 2rem;
  margin-top: 4rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`

const WalletGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`

const WalletCard = styled(Card)`
  animation: ${css`${fadeIn}`} 0.5s ease-out;
`

const BalanceContainer = styled.div`
  margin-bottom: 2rem;
`

const BalanceLabel = styled.p`
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.5rem;
`

const BalanceAmount = styled.p`
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  
  span {
    background: linear-gradient(135deg, #7c3aed, #4f46e5);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`

const TransactionsList = styled.div`
  margin-top: 2rem;
`

const TransactionItem = styled.div`
  background: rgba(30, 30, 46, 0.5);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
`

const TransactionInfo = styled.div``

const TransactionDescription = styled.p`
  color: white;
  font-weight: 500;
  margin-bottom: 0.25rem;
`

const TransactionDate = styled.p`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
`

const TransactionAmount = styled.p`
  font-weight: 700;
  color: ${(props) => (props.type === "credit" ? "#10b981" : "#ef4444")};
`

const TransferForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
`

const SuccessMessage = styled.div`
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
`

const Wallet = () => {
  const [wallet, setWallet] = useState(null)
  const [transferData, setTransferData] = useState({
    recipientId: "",
    amount: "",
    description: "",
  })
  const [loading, setLoading] = useState(true)
  const [transferLoading, setTransferLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    fetchWalletData()
  }, [])

  const fetchWalletData = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("token")
      const response = await api.get("/wallet", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setWallet(response.data)
    } catch (err) {
      console.error("Error fetching wallet:", err)
      setError("Failed to load wallet data")
    } finally {
      setLoading(false)
    }
  }

  const handleTransfer = async (e) => {
    e.preventDefault()
    try {
      setTransferLoading(true)
      setError(null)
      setSuccess(null)

      const token = localStorage.getItem("token")
      await api.post("/wallet/transfer", transferData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setSuccess("Transfer successful!")

      // Reset form and refresh wallet data
      setTransferData({ recipientId: "", amount: "", description: "" })
      fetchWalletData()
    } catch (err) {
      console.error("Transfer error:", err)
      setError(err.response?.data?.message || "Transfer failed")
    } finally {
      setTransferLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setTransferData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  if (loading) {
    return (
      <WalletContainer>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-2xl text-white">Loading...</div>
        </div>
      </WalletContainer>
    )
  }

  return (
    <WalletContainer>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <WalletGrid>
          {/* Wallet Info */}
          <WalletCard>
            <Heading2>Your Wallet</Heading2>

            <BalanceContainer>
              <BalanceLabel>Current Balance</BalanceLabel>
              <BalanceAmount>
                <span>{wallet?.balance || 0}</span> tokens
              </BalanceAmount>
            </BalanceContainer>

            {/* Transaction History */}
            <TransactionsList>
              <Heading3>Transaction History</Heading3>

              {wallet?.transactions?.map((transaction, index) => (
                <TransactionItem key={index}>
                  <TransactionInfo>
                    <TransactionDescription>{transaction.description}</TransactionDescription>
                    <TransactionDate>{new Date(transaction.date).toLocaleString()}</TransactionDate>
                  </TransactionInfo>
                  <TransactionAmount type={transaction.type}>
                    {transaction.type === "credit" ? "+" : "-"}
                    {transaction.amount}
                  </TransactionAmount>
                </TransactionItem>
              ))}

              {(!wallet?.transactions || wallet.transactions.length === 0) && (
                <Paragraph style={{ textAlign: "center", marginTop: "2rem" }}>No transactions found</Paragraph>
              )}
            </TransactionsList>
          </WalletCard>

          {/* Transfer Form */}
          <WalletCard>
            <Heading2>Transfer Tokens</Heading2>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ErrorMessage>{error}</ErrorMessage>
              </motion.div>
            )}

            {success && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <SuccessMessage>{success}</SuccessMessage>
              </motion.div>
            )}

            <TransferForm onSubmit={handleTransfer}>
              <FormGroup>
                <Input
                  type="text"
                  name="recipientId"
                  label="Recipient ID"
                  placeholder="Enter recipient's ID"
                  value={transferData.recipientId}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Input
                  type="number"
                  name="amount"
                  label="Amount"
                  placeholder="Enter amount to transfer"
                  value={transferData.amount}
                  onChange={handleInputChange}
                  required
                  min="1"
                />
              </FormGroup>

              <FormGroup>
                <Input
                  type="text"
                  name="description"
                  label="Description"
                  placeholder="Enter transfer description"
                  value={transferData.description}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>

              <Button type="submit" disabled={transferLoading}>
                {transferLoading ? "Processing..." : "Transfer Tokens"}
              </Button>
            </TransferForm>
          </WalletCard>
        </WalletGrid>
      </motion.div>
    </WalletContainer>
  )
}

export default Wallet
