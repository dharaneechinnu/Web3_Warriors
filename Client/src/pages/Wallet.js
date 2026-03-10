import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import api from "../services/api";

// ============= STYLED COMPONENTS =============

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.98) 100%);
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

// Header
const HeaderSection = styled(motion.div)`
  background: rgba(17, 17, 27, 0.7);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  padding: 2.5rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(124, 58, 237, 0.2);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(to right, #06b6d4, #d946ef, #f97316);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;

  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
`;

const HeaderSubtitle = styled.p`
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1rem;
`;

const WalletAddressBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.2rem;
  background: rgba(124, 58, 237, 0.15);
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: 2rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
  font-family: monospace;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(124, 58, 237, 0.25);
    border-color: rgba(124, 58, 237, 0.5);
  }

  span.label {
    color: #d946ef;
    font-weight: 600;
    font-family: inherit;
  }
`;

// Stats Grid
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(motion.div)`
  background: rgba(17, 17, 27, 0.7);
  backdrop-filter: blur(20px);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(124, 58, 237, 0.2);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(249, 115, 22, 0.3);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => props.accent || 'linear-gradient(to right, #f97316, #06b6d4)'};
    border-radius: 1rem 1rem 0 0;
  }
`;

const StatIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
`;

const StatLabel = styled.div`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  background: ${props => props.gradient || 'linear-gradient(to right, #f97316, #06b6d4, #d946ef)'};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const StatSubtext = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.25rem;
`;

// Sections
const Section = styled(motion.div)`
  background: rgba(17, 17, 27, 0.7);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(124, 58, 237, 0.2);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: '';
    width: 4px;
    height: 1.5rem;
    background: linear-gradient(to bottom, #f97316, #06b6d4);
    border-radius: 2px;
  }
`;

// Content grid (2 columns)
const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

// Earnings Breakdown
const EarningsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
`;

const EarningCard = styled(motion.div)`
  background: rgba(30, 41, 59, 0.6);
  border-radius: 1rem;
  padding: 1.25rem;
  border: 1px solid rgba(124, 58, 237, 0.15);
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(249, 115, 22, 0.5);
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(249, 115, 22, 0.2);
  }
`;

const EarningIcon = styled.div`
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
`;

const EarningAmount = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.25rem;
`;

const EarningLabel = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

// Transaction History
const TransactionItem = styled(motion.div)`
  background: rgba(30, 41, 59, 0.4);
  border-radius: 0.8rem;
  padding: 1rem 1.25rem;
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 4px solid ${props =>
    props.txType === 'earn' ? '#22c55e' :
    props.txType === 'challenge_win' ? '#f59e0b' :
    '#ef4444'
  };
  transition: all 0.3s ease;

  &:hover {
    transform: translateX(5px);
    background: rgba(30, 41, 59, 0.6);
  }
`;

const TransactionInfo = styled.div`
  flex: 1;
`;

const TransactionDescription = styled.p`
  color: white;
  font-weight: 500;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
`;

const TransactionDate = styled.p`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
`;

const TransactionAmount = styled.div`
  font-weight: 700;
  font-size: 1.1rem;
  color: ${props =>
    props.txType === 'earn' ? '#22c55e' :
    props.txType === 'challenge_win' ? '#f59e0b' :
    '#ef4444'
  };
  white-space: nowrap;
  margin-left: 1rem;
`;

const TransactionTxHash = styled.p`
  font-size: 0.7rem;
  color: rgba(124, 58, 237, 0.8);
  font-family: monospace;
  margin-top: 0.2rem;
`;

const ViewAllButton = styled.button`
  width: 100%;
  padding: 0.8rem;
  background: rgba(124, 58, 237, 0.15);
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: 0.75rem;
  color: #d946ef;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;

  &:hover {
    background: rgba(124, 58, 237, 0.25);
    transform: translateY(-2px);
  }
`;

// NFT Section
const NFTGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
`;

const NFTCard = styled(motion.div)`
  background: rgba(30, 41, 59, 0.6);
  border-radius: 1rem;
  padding: 1.25rem;
  border: 1px solid rgba(217, 70, 239, 0.2);
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(to right, #d946ef, #f97316);
  }

  &:hover {
    border-color: rgba(217, 70, 239, 0.5);
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(217, 70, 239, 0.2);
  }
`;

const NFTIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
`;

const NFTName = styled.h4`
  font-size: 0.95rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.25rem;
`;

const NFTTokenId = styled.p`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  font-family: monospace;
`;

const NFTType = styled.span`
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  font-size: 0.7rem;
  font-weight: 600;
  margin-top: 0.5rem;
  background: ${props => props.type === 'course' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(249, 115, 22, 0.2)'};
  color: ${props => props.type === 'course' ? '#06b6d4' : '#f97316'};
  border: 1px solid ${props => props.type === 'course' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(249, 115, 22, 0.3)'};
`;

// Transfer Form
const TransferFormStyled = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const FormLabel = styled.label`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.8rem 1rem;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 0.75rem;
  color: white;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  outline: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }

  &:focus {
    border-color: rgba(124, 58, 237, 0.6);
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.9rem 1.5rem;
  background: linear-gradient(135deg, #f97316, #06b6d4);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(249, 115, 22, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Alert messages
const AlertMessage = styled(motion.div)`
  padding: 0.8rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.9rem;
  font-weight: 500;
  background: ${props => props.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)'};
  color: ${props => props.type === 'error' ? '#ef4444' : '#22c55e'};
  border: 1px solid ${props => props.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'};
`;

// Tabs
const TabContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const Tab = styled.button`
  padding: 0.6rem 1.2rem;
  border-radius: 2rem;
  border: 1px solid ${props => props.active ? 'rgba(249, 115, 22, 0.5)' : 'rgba(124, 58, 237, 0.2)'};
  background: ${props => props.active ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(6, 182, 212, 0.2))' : 'rgba(30, 41, 59, 0.4)'};
  color: ${props => props.active ? '#f97316' : 'rgba(255, 255, 255, 0.6)'};
  font-weight: ${props => props.active ? '600' : '400'};
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(249, 115, 22, 0.4);
    color: white;
  }
`;

// Loading spinner
const LoadingContainer = styled.div`
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid rgba(124, 58, 237, 0.2);
  border-top: 3px solid #d946ef;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1rem;
`;

// ============= ANIMATION VARIANTS =============

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

// ============= MAIN COMPONENT =============

const Wallet = () => {
  const [wallet, setWallet] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [transferData, setTransferData] = useState({ recipientId: "", amount: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [transferLoading, setTransferLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [showAllTx, setShowAllTx] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      const [walletRes, earningsRes, nftsRes] = await Promise.all([
        api.get(`/wallet/${userId}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: {} })),
        api.get(`/wallet/earnings/${userId}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: {} })),
        api.get(`/wallet/nfts/${userId}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { nfts: [] } }))
      ]);

      setWallet(walletRes.data.wallet || walletRes.data);
      setEarnings(earningsRes.data.earnings || null);
      setNfts(nftsRes.data.nfts || []);
    } catch (err) {
      console.error("Error fetching wallet:", err);
      setError("Failed to load wallet data");
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
      const token = localStorage.getItem("token");
      const senderId = localStorage.getItem("userId");

      await api.post("/wallet/transfer", { ...transferData, senderId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Transfer successful!");
      setTransferData({ recipientId: "", amount: "", description: "" });
      fetchAllData();
    } catch (err) {
      console.error("Transfer error:", err);
      setError(err.response?.data?.message || "Transfer failed");
    } finally {
      setTransferLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTransferData(prev => ({ ...prev, [name]: value }));
  };

  const copyAddress = () => {
    if (wallet?.walletAddress) {
      navigator.clipboard.writeText(wallet.walletAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const truncateAddress = (addr) => {
    if (!addr) return "Not linked";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const getFilteredTransactions = () => {
    const txs = wallet?.transactions || [];
    if (activeTab === "all") return txs;
    return txs.filter(t => t.transactionType === activeTab);
  };

  const filteredTx = getFilteredTransactions();
  const displayedTx = showAllTx ? filteredTx : filteredTx.slice(0, 6);

  if (loading) {
    return (
      <PageContainer>
        <Container>
          <LoadingContainer>
            <Spinner />
            <LoadingText>Loading your finance dashboard...</LoadingText>
          </LoadingContainer>
        </Container>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Container>
        <motion.div variants={containerVariants} initial="hidden" animate="visible">

          {/* ===== HEADER ===== */}
          <HeaderSection variants={itemVariants}>
            <PageTitle>Finance Dashboard</PageTitle>
            <HeaderSubtitle>Track your earnings, manage tokens, and view blockchain assets</HeaderSubtitle>
            {wallet?.walletAddress && (
              <WalletAddressBadge onClick={copyAddress} title="Click to copy">
                <span className="label">Wallet:</span>
                {copiedAddress ? "Copied!" : truncateAddress(wallet.walletAddress)}
              </WalletAddressBadge>
            )}
          </HeaderSection>

          {/* ===== STATS OVERVIEW ===== */}
          <StatsGrid>
            <StatCard
              variants={itemVariants}
              accent="linear-gradient(to right, #06b6d4, #22d3ee)"
            >
              <StatIcon>💰</StatIcon>
              <StatLabel>Platform Balance</StatLabel>
              <StatValue gradient="linear-gradient(to right, #06b6d4, #22d3ee)">
                {wallet?.balance || 0}
              </StatValue>
              <StatSubtext>Tokens</StatSubtext>
            </StatCard>

            <StatCard
              variants={itemVariants}
              accent="linear-gradient(to right, #d946ef, #a855f7)"
            >
              <StatIcon>⛓️</StatIcon>
              <StatLabel>On-Chain Balance</StatLabel>
              <StatValue gradient="linear-gradient(to right, #d946ef, #a855f7)">
                {wallet?.onChainBalance ?? "—"}
              </StatValue>
              <StatSubtext>Blockchain Tokens</StatSubtext>
            </StatCard>

            <StatCard
              variants={itemVariants}
              accent="linear-gradient(to right, #22c55e, #10b981)"
            >
              <StatIcon>📈</StatIcon>
              <StatLabel>Total Earned</StatLabel>
              <StatValue gradient="linear-gradient(to right, #22c55e, #10b981)">
                {wallet?.totalEarned || 0}
              </StatValue>
              <StatSubtext>All Time</StatSubtext>
            </StatCard>

            <StatCard
              variants={itemVariants}
              accent="linear-gradient(to right, #f97316, #ef4444)"
            >
              <StatIcon>📊</StatIcon>
              <StatLabel>Total Spent</StatLabel>
              <StatValue gradient="linear-gradient(to right, #f97316, #ef4444)">
                {wallet?.totalSpent || 0}
              </StatValue>
              <StatSubtext>All Time</StatSubtext>
            </StatCard>
          </StatsGrid>

          {/* ===== EARNINGS BREAKDOWN ===== */}
          {earnings && (
            <Section variants={itemVariants}>
              <SectionTitle>Earnings Breakdown</SectionTitle>
              <EarningsGrid>
                <EarningCard whileHover={{ scale: 1.02 }}>
                  <EarningIcon>🎓</EarningIcon>
                  <EarningAmount>{earnings.course || 0}</EarningAmount>
                  <EarningLabel>Courses</EarningLabel>
                </EarningCard>
                <EarningCard whileHover={{ scale: 1.02 }}>
                  <EarningIcon>🤝</EarningIcon>
                  <EarningAmount>{earnings.mentorship || 0}</EarningAmount>
                  <EarningLabel>Mentorship</EarningLabel>
                </EarningCard>
                <EarningCard whileHover={{ scale: 1.02 }}>
                  <EarningIcon>🏆</EarningIcon>
                  <EarningAmount>{earnings.challenge || 0}</EarningAmount>
                  <EarningLabel>Challenges</EarningLabel>
                </EarningCard>
                <EarningCard whileHover={{ scale: 1.02 }}>
                  <EarningIcon>📝</EarningIcon>
                  <EarningAmount>{earnings.quiz || 0}</EarningAmount>
                  <EarningLabel>Quizzes</EarningLabel>
                </EarningCard>
                <EarningCard whileHover={{ scale: 1.02 }}>
                  <EarningIcon>📦</EarningIcon>
                  <EarningAmount>{earnings.other || 0}</EarningAmount>
                  <EarningLabel>Other</EarningLabel>
                </EarningCard>
              </EarningsGrid>
            </Section>
          )}

          {/* ===== NFT COLLECTION ===== */}
          {nfts.length > 0 && (
            <Section variants={itemVariants}>
              <SectionTitle>NFT Collection</SectionTitle>
              <NFTGrid>
                {nfts.map((nft, index) => (
                  <NFTCard
                    key={nft.tokenId || index}
                    whileHover={{ scale: 1.03 }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <NFTIcon>{nft.nftType === 'course' ? '🏅' : '🏆'}</NFTIcon>
                    <NFTName>{nft.name || nft.courseName || nft.challengeName || `NFT #${nft.tokenId}`}</NFTName>
                    <NFTTokenId>Token #{nft.tokenId}</NFTTokenId>
                    <NFTType type={nft.nftType || 'course'}>
                      {nft.nftType === 'course' ? 'Course' : nft.nftType === 'challenge' ? 'Challenge' : 'Achievement'}
                    </NFTType>
                  </NFTCard>
                ))}
              </NFTGrid>
            </Section>
          )}

          {/* ===== TRANSACTIONS + TRANSFER ===== */}
          <ContentGrid>
            {/* Transaction History */}
            <Section variants={itemVariants}>
              <SectionTitle>Transaction History</SectionTitle>

              <TabContainer>
                {[
                  { key: "all", label: "All" },
                  { key: "earn", label: "Earned" },
                  { key: "spend", label: "Spent" },
                  { key: "challenge_win", label: "🏆 Contest Wins" }
                ].map(tab => (
                  <Tab
                    key={tab.key}
                    active={activeTab === tab.key}
                    onClick={() => { setActiveTab(tab.key); setShowAllTx(false); }}
                  >
                    {tab.label}
                  </Tab>
                ))}
              </TabContainer>

              {displayedTx.length > 0 ? (
                <>
                  {displayedTx.map((tx, index) => (
                    <TransactionItem
                      key={index}
                      txType={tx.transactionType}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <TransactionInfo>
                        <TransactionDescription>{tx.description || "Transaction"}</TransactionDescription>
                        <TransactionDate>
                          {new Date(tx.timestamp || tx.date).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </TransactionDate>
                        {tx.txHash && (
                          <TransactionTxHash>Tx: {tx.txHash.substring(0, 16)}...</TransactionTxHash>
                        )}
                      </TransactionInfo>
                      <TransactionAmount txType={tx.transactionType}>
                        {tx.transactionType === 'spend' ? '-' : '+'}{tx.amount}
                      </TransactionAmount>
                    </TransactionItem>
                  ))}

                  {filteredTx.length > 6 && !showAllTx && (
                    <ViewAllButton onClick={() => setShowAllTx(true)}>
                      View All ({filteredTx.length} transactions)
                    </ViewAllButton>
                  )}
                </>
              ) : (
                <EmptyState>No transactions found</EmptyState>
              )}
            </Section>

            {/* Transfer & Token Info Section */}
            <div>
              {/* How Tokens Work */}
              <Section variants={itemVariants} style={{ marginBottom: '2rem' }}>
                <SectionTitle>How Tokens Work</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { icon: '🎁', title: 'Sign Up Bonus', desc: 'Every new user gets 10 tokens on registration' },
                    { icon: '📚', title: 'Course Enrollment', desc: '1 token is deducted when you enroll in a course — it goes to the mentor' },
                    { icon: '🏆', title: 'Challenge Rewards', desc: 'Complete challenges and win tokens based on your rank — 1st, 2nd, 3rd place get token prizes' },
                    { icon: '🔄', title: 'Transfer', desc: 'Send tokens to other users for tips, rewards, or collaboration' },
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                      padding: '0.8rem', background: 'rgba(30, 41, 59, 0.4)',
                      borderRadius: '0.75rem', border: '1px solid rgba(124, 58, 237, 0.1)'
                    }}>
                      <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{item.icon}</span>
                      <div>
                        <p style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{item.title}</p>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', lineHeight: 1.5 }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Transfer Form */}
              <Section variants={itemVariants}>
                <SectionTitle>Transfer Tokens</SectionTitle>

                {error && (
                  <AlertMessage
                    type="error"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: '1rem' }}
                  >
                    {error}
                  </AlertMessage>
                )}

                {success && (
                  <AlertMessage
                    type="success"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: '1rem' }}
                  >
                    {success}
                  </AlertMessage>
                )}

                <TransferFormStyled onSubmit={handleTransfer}>
                  <FormGroup>
                    <FormLabel>Recipient ID</FormLabel>
                    <FormInput
                      type="text"
                      name="recipientId"
                      placeholder="Enter recipient's user ID"
                      value={transferData.recipientId}
                      onChange={handleInputChange}
                      required
                    />
                  </FormGroup>

                  <FormGroup>
                    <FormLabel>Amount</FormLabel>
                    <FormInput
                      type="number"
                      name="amount"
                      placeholder="Enter token amount"
                      value={transferData.amount}
                      onChange={handleInputChange}
                      required
                      min="1"
                    />
                  </FormGroup>

                  <FormGroup>
                    <FormLabel>Description</FormLabel>
                    <FormInput
                      type="text"
                      name="description"
                      placeholder="What is this transfer for?"
                      value={transferData.description}
                      onChange={handleInputChange}
                      required
                    />
                  </FormGroup>

                  <SubmitButton type="submit" disabled={transferLoading}>
                    {transferLoading ? "Processing..." : "Send Tokens"}
                  </SubmitButton>
                </TransferFormStyled>
              </Section>
            </div>
          </ContentGrid>

        </motion.div>
      </Container>
    </PageContainer>
  );
};

export default Wallet;
