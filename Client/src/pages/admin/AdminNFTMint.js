import React, { useState, useCallback } from 'react';
import { Award, Search, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { mintCertificate } from '../../web3/services/certificateNFTService';
import { useWalletOwner } from '../../hooks/useWalletOwner';
import api from '../../services/api';
import { BLOCK_EXPLORER } from '../../web3/config';

const S = {
  page: { color: '#fff' },
  title: { fontSize: '1.6rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '0.35rem' },
  sub:   { color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' },
  card: {
    background: 'rgba(15,23,42,0.8)',
    border: '1px solid rgba(139,92,246,0.2)',
    borderRadius: '1rem',
    padding: '1.5rem',
    marginBottom: '1rem',
  },
  label: { color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' },
  input: {
    width: '100%',
    padding: '0.65rem 1rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0.6rem',
    color: '#f1f5f9',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  btn: (v) => ({
    padding: '0.55rem 1.1rem',
    borderRadius: '0.6rem',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.85rem',
    transition: 'opacity 0.2s',
    ...(v === 'primary'
      ? { background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff' }
      : v === 'green'
      ? { background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }
      : { background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }),
  }),
  certCard: {
    background: 'rgba(30,27,75,0.5)',
    border: '1px solid rgba(124,58,237,0.2)',
    borderRadius: '0.75rem',
    padding: '1rem 1.25rem',
    marginBottom: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  info: { flex: 1 },
  courseName: { fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9', marginBottom: '0.2rem' },
  meta: { color: '#64748b', fontSize: '0.8rem' },
  badge: (minted) => ({
    padding: '0.2rem 0.6rem',
    borderRadius: '999px',
    fontSize: '0.72rem',
    fontWeight: 700,
    background: minted ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
    color: minted ? '#4ade80' : '#fbbf24',
    border: `1px solid ${minted ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
    whiteSpace: 'nowrap',
  }),
  ownerBox: {
    background: 'rgba(124,58,237,0.1)',
    border: '1px solid rgba(124,58,237,0.3)',
    borderRadius: '0.75rem',
    padding: '0.85rem 1.1rem',
    marginBottom: '1.5rem',
    fontSize: '0.85rem',
    color: '#a78bfa',
  },
  warn: {
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: '0.75rem',
    padding: '0.85rem 1.1rem',
    marginBottom: '1.5rem',
    color: '#fca5a5',
    fontSize: '0.85rem',
  },
  toast: {
    position: 'fixed', bottom: '2rem', right: '2rem',
    background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)',
    borderRadius: '0.75rem', padding: '0.75rem 1.25rem',
    color: '#4ade80', fontWeight: 600, fontSize: '0.9rem', zIndex: 2000,
  },
};

export default function AdminNFTMint() {
  const { isOwner, ownerAddress, connectedAddress, checking } = useWalletOwner();

  const [userId,   setUserId]   = useState('');
  const [certs,    setCerts]    = useState(null);   // null = not searched yet
  const [fetching, setFetching] = useState(false);
  const [fetchErr, setFetchErr] = useState('');

  // Per-cert minting state: { [certId]: 'minting' | 'done' | 'error' }
  const [mintState,   setMintState]   = useState({});
  const [mintResults, setMintResults] = useState({}); // { [certId]: { tokenId, txHash } }
  const [toast,       setToast]       = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleSearch = useCallback(async () => {
    if (!userId.trim()) return;
    setFetching(true);
    setFetchErr('');
    setCerts(null);
    try {
      const token = localStorage.getItem('token');
      const [certsRes, userRes] = await Promise.all([
        api.get(`/courses/certificate/user/${userId.trim()}`, { headers: { Authorization: `Bearer ${token}` } }),
        api.get(`/User/${userId.trim()}`,                     { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const learnerWallet = userRes.data?.user?.UserWalletAddress || userRes.data?.UserWalletAddress || null;
      const certificates = (certsRes.data.certificates || []).map(c => ({ ...c, learnerWallet }));
      setCerts(certificates);
    } catch (err) {
      setFetchErr(err.response?.data?.message || 'Failed to load certificates for this user.');
    } finally {
      setFetching(false);
    }
  }, [userId]);

  const handleMint = useCallback(async (cert, learnerWallet) => {
    if (!learnerWallet) {
      showToast('Learner has no wallet address on file.');
      return;
    }
    const certUrl = `${window.location.origin}/certificate/${cert.certificateId}`;
    const certId  = cert.certificateId;

    setMintState(prev => ({ ...prev, [certId]: 'minting' }));
    try {
      const { tokenId, tx } = await mintCertificate(learnerWallet, certUrl);
      const txHash = tx?.transactionHash || '';

      // Persist tokenId + txHash to the DB
      const token = localStorage.getItem('token');
      await api.patch(
        `/courses/certificate/${certId}/nft`,
        { nftTokenId: tokenId, txHash },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMintState(prev => ({ ...prev, [certId]: 'done' }));
      setMintResults(prev => ({ ...prev, [certId]: { tokenId, txHash } }));
      // Update the local cert list so the badge changes
      setCerts(prev => prev.map(c =>
        c.certificateId === certId ? { ...c, nftTokenId: tokenId, txHash } : c
      ));
      showToast(`NFT #${tokenId} minted for ${cert.courseName}!`);
    } catch (err) {
      console.log('[AdminNFTMint] mint failed:', err.message);
      setMintState(prev => ({ ...prev, [certId]: 'error' }));
      showToast(`Mint failed: ${err.message}`);
    }
  }, []);

  return (
    <div style={S.page}>
      <div style={S.title}>NFT Certificate Minting</div>
      <div style={S.sub}>
        Mint on-chain NFT certificates for learners who have completed courses.
        Your admin MetaMask wallet must be connected as the contract owner.
      </div>

      {/* Wallet owner status */}
      {checking ? (
        <div style={S.ownerBox}>🔄 Checking wallet owner status…</div>
      ) : isOwner ? (
        <div style={S.ownerBox}>
          ✅ <strong>Owner wallet connected</strong>{' '}
          <span style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
            {connectedAddress?.slice(0, 8)}…{connectedAddress?.slice(-6)}
          </span>
          {' '}— You can mint NFTs.
        </div>
      ) : (
        <div style={S.warn}>
          ⚠️ <strong>Not the contract owner.</strong>{' '}
          {connectedAddress
            ? `Connected: ${connectedAddress.slice(0, 8)}…${connectedAddress.slice(-6)}. Switch to the owner wallet to mint.`
            : 'Connect MetaMask with the owner wallet to mint NFTs.'}
          {ownerAddress && (
            <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', opacity: 0.8 }}>
              Owner address: <span style={{ fontFamily: 'monospace' }}>{ownerAddress}</span>
            </div>
          )}
        </div>
      )}

      {/* Search by user ID */}
      <div style={S.card}>
        <div style={S.label}>Learner User ID</div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem' }}>
          <input
            style={S.input}
            placeholder="Paste learner's MongoDB _id…"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
          />
          <button
            style={{ ...S.btn('primary'), display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
            onClick={handleSearch}
            disabled={fetching || !userId.trim()}
          >
            <Search size={15} />
            {fetching ? 'Loading…' : 'Load Certs'}
          </button>
        </div>
        {fetchErr && <div style={{ color: '#f87171', fontSize: '0.82rem', marginTop: '0.5rem' }}>{fetchErr}</div>}
      </div>

      {/* Certificate list */}
      {certs !== null && (
        <div>
          {certs.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem' }}>
              No certificates found for this user.
            </div>
          ) : (
            <>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                {certs.length} certificate{certs.length !== 1 ? 's' : ''} found
              </div>
              {certs.map(cert => {
                const alreadyMinted = cert.nftTokenId != null;
                const state = mintState[cert.certificateId];
                const result = mintResults[cert.certificateId];
                const learnerWallet = cert.learnerWallet || cert.userWallet || null;

                return (
                  <div key={cert._id || cert.certificateId} style={S.certCard}>
                    <div style={S.info}>
                      <div style={S.courseName}>{cert.courseName}</div>
                      <div style={S.meta}>
                        Learner: {cert.learnerName || 'Unknown'} ·{' '}
                        {new Date(cert.completedDate).toLocaleDateString()}
                      </div>
                      {cert.txHash && (
                        <div style={{ marginTop: '0.3rem', fontSize: '0.75rem' }}>
                          <a
                            href={`${BLOCK_EXPLORER}/tx/${cert.txHash}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ color: '#06b6d4', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            Tx: {cert.txHash.slice(0, 10)}…{cert.txHash.slice(-6)}
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      )}
                      {result && (
                        <div style={{ marginTop: '0.3rem', fontSize: '0.75rem', color: '#4ade80' }}>
                          NFT #{result.tokenId} minted ·{' '}
                          {result.txHash && (
                            <a
                              href={`${BLOCK_EXPLORER}/tx/${result.txHash}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ color: '#4ade80' }}
                            >
                              View tx
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={S.badge(alreadyMinted)}>
                        {alreadyMinted ? `NFT #${cert.nftTokenId}` : 'No NFT'}
                      </span>

                      {!alreadyMinted && isOwner && (
                        <button
                          style={S.btn(state === 'done' ? 'green' : 'primary')}
                          onClick={() => handleMint(cert, learnerWallet)}
                          disabled={state === 'minting' || state === 'done' || !isOwner}
                        >
                          {state === 'minting' ? '⏳ Minting…' :
                           state === 'done'    ? <><CheckCircle size={13} style={{ marginRight: 4 }} />Minted</> :
                           state === 'error'   ? <><AlertCircle size={13} style={{ marginRight: 4 }} />Retry</> :
                           <><Award size={13} style={{ marginRight: 4 }} />Mint NFT</>}
                        </button>
                      )}

                      {!alreadyMinted && !isOwner && (
                        <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
                          Connect owner wallet to mint
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {toast && (
        <div style={S.toast}>{toast}</div>
      )}
    </div>
  );
}
