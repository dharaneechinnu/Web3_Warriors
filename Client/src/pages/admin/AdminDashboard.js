import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  XCircle,
  Users,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Bot,
} from 'lucide-react';
import { getMentorApplications } from '../../services/adminService';

// ── Styled Components ─────────────────────────────────────────────────────────
const Page = styled.div`
  color: #fff;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
  h1 {
    font-size: 1.75rem;
    font-weight: 700;
    background: linear-gradient(to right, #c4b5fd, #67e8f9);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0 0 0.25rem;
  }
  p { color: rgba(255,255,255,0.45); font-size: 0.9rem; margin: 0; }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(motion.div)`
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover { border-color: rgba(139, 92, 246, 0.4); }
`;

const IconBox = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  background: ${({ $bg }) => $bg || 'rgba(139,92,246,0.15)'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${({ $color }) => $color || '#c4b5fd'};
`;

const StatInfo = styled.div`
  p:first-child {
    color: rgba(255,255,255,0.45);
    font-size: 0.8rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 0.3rem;
  }
  p:last-child {
    color: #fff;
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0;
    line-height: 1;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
  margin: 0 0 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TableWrap = styled.div`
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 1rem;
  overflow: hidden;
  margin-bottom: 2rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.85rem 1.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255,255,255,0.35);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: rgba(255,255,255,0.02);
  border-bottom: 1px solid rgba(255,255,255,0.06);
`;

const Td = styled.td`
  padding: 0.9rem 1.25rem;
  font-size: 0.875rem;
  color: rgba(255,255,255,0.75);
  border-bottom: 1px solid rgba(255,255,255,0.04);
  vertical-align: middle;

  tr:last-child & { border-bottom: none; }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;

  ${({ $status }) => {
    if ($status === 'approved') return 'background: rgba(34,197,94,0.15); color: #4ade80;';
    if ($status === 'rejected') return 'background: rgba(239,68,68,0.15); color: #f87171;';
    return 'background: rgba(234,179,8,0.15); color: #facc15;';
  }}
`;

const ScoreBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const BarTrack = styled.div`
  flex: 1;
  height: 6px;
  background: rgba(255,255,255,0.08);
  border-radius: 999px;
  overflow: hidden;
`;

const BarFill = styled.div`
  height: 100%;
  border-radius: 999px;
  width: ${({ $pct }) => $pct}%;
  background: ${({ $pct }) =>
    $pct >= 70 ? 'linear-gradient(90deg,#22c55e,#4ade80)'
    : $pct >= 40 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
    :              'linear-gradient(90deg,#ef4444,#f87171)'};
  transition: width 0.6s ease;
`;

const ViewBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: none;
  border: 1px solid rgba(139,92,246,0.4);
  color: #c4b5fd;
  padding: 0.35rem 0.8rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { background: rgba(139,92,246,0.15); }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255,255,255,0.3);
  font-size: 0.9rem;
`;

const ErrorMsg = styled.div`
  color: #f87171;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.25);
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
`;

const RefreshBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.55);
  padding: 0.45rem 0.9rem;
  border-radius: 0.6rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: auto;

  &:hover { border-color: rgba(255,255,255,0.3); color: #fff; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const Skeleton = styled.div`
  height: ${({ $h }) => $h || '1rem'};
  border-radius: 0.5rem;
  background: rgba(255,255,255,0.06);
  animation: pulse 1.5s ease-in-out infinite;
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
`;

const STAT_CARDS = [
  { key: 'pending',  label: 'Pending Review', icon: Clock,        bg: 'rgba(234,179,8,0.12)',  color: '#facc15',  status: 'pending'  },
  { key: 'approved', label: 'Approved',        icon: CheckCircle,  bg: 'rgba(34,197,94,0.12)', color: '#4ade80',  status: 'approved' },
  { key: 'rejected', label: 'Rejected',        icon: XCircle,      bg: 'rgba(239,68,68,0.12)', color: '#f87171',  status: 'rejected' },
  { key: 'total',    label: 'Total',           icon: Users,        bg: 'rgba(139,92,246,0.12)', color: '#c4b5fd', status: null       },
];

// ── Component ─────────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();

  const [counts, setCounts]     = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [recent, setRecent]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        getMentorApplications({ status: 'pending',  limit: 10 }),
        getMentorApplications({ status: 'approved', limit: 1 }),
        getMentorApplications({ status: 'rejected', limit: 1 }),
      ]);

      const pendingTotal  = pendingRes.success  ? pendingRes.data.total  : 0;
      const approvedTotal = approvedRes.success ? approvedRes.data.total : 0;
      const rejectedTotal = rejectedRes.success ? rejectedRes.data.total : 0;

      setCounts({
        pending:  pendingTotal,
        approved: approvedTotal,
        rejected: rejectedTotal,
        total:    pendingTotal + approvedTotal + rejectedTotal,
      });

      setRecent(pendingRes.success ? (pendingRes.data.applications || []).slice(0, 5) : []);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
      console.error('[AdminDashboard] loadData:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <Page>
      <PageHeader>
        <h1>Dashboard</h1>
        <p>Overview of mentor applications and AI evaluations</p>
      </PageHeader>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      {/* Stats */}
      <StatsGrid>
        {STAT_CARDS.map(({ key, label, icon: Icon, bg, color, status }, i) => (
          <StatCard
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            onClick={() => status && navigate(`/admin/mentors?status=${status}`)}
          >
            <IconBox $bg={bg} $color={color}>
              <Icon size={22} />
            </IconBox>
            <StatInfo>
              <p>{label}</p>
              {loading
                ? <Skeleton $h="1.75rem" style={{ width: '60px' }} />
                : <p>{counts[key]}</p>
              }
            </StatInfo>
          </StatCard>
        ))}
      </StatsGrid>

      {/* Recent pending */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <SectionTitle style={{ margin: 0 }}>
          <Clock size={18} />
          Recent Pending Applications
        </SectionTitle>
        <RefreshBtn onClick={() => loadData(true)} disabled={refreshing}>
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </RefreshBtn>
      </div>

      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>Applicant</Th>
              <Th>Skills</Th>
              <Th>AI Score</Th>
              <Th>Recommendation</Th>
              <Th>Submitted</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <Td key={j}><Skeleton /></Td>
                    ))}
                  </tr>
                ))
              : recent.length === 0
              ? (
                  <tr>
                    <Td colSpan={6}>
                      <EmptyState>
                        <Bot size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                        No pending applications found.
                      </EmptyState>
                    </Td>
                  </tr>
                )
              : recent.map((app) => {
                  const score = app.aiEvaluation?.finalScore ?? null;
                  const rec   = app.aiEvaluation?.recommendation;
                  return (
                    <tr key={app._id}>
                      <Td>
                        <div style={{ fontWeight: 600, color: '#fff', marginBottom: '0.15rem' }}>
                          {app.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                          {app.userId?.email || '—'}
                        </div>
                      </Td>
                      <Td>
                        {(app.skills || []).slice(0, 3).map((s) => (
                          <span
                            key={s}
                            style={{
                              display: 'inline-block',
                              background: 'rgba(139,92,246,0.15)',
                              color: '#c4b5fd',
                              borderRadius: '999px',
                              padding: '0.15rem 0.55rem',
                              fontSize: '0.72rem',
                              marginRight: '0.3rem',
                              marginBottom: '0.2rem',
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </Td>
                      <Td>
                        {score !== null ? (
                          <ScoreBar>
                            <span style={{ width: '2.5rem', fontSize: '0.8rem', fontWeight: 700,
                              color: score >= 70 ? '#4ade80' : score >= 40 ? '#facc15' : '#f87171' }}>
                              {score}
                            </span>
                            <BarTrack><BarFill $pct={score} /></BarTrack>
                          </ScoreBar>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem' }}>
                            Evaluating…
                          </span>
                        )}
                      </Td>
                      <Td>
                        {rec ? (
                          <StatusBadge $status={rec === 'approve' ? 'approved' : rec === 'reject' ? 'rejected' : 'pending'}>
                            <TrendingUp size={11} />
                            {rec}
                          </StatusBadge>
                        ) : '—'}
                      </Td>
                      <Td style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                        {new Date(app.submittedAt).toLocaleDateString()}
                      </Td>
                      <Td>
                        <ViewBtn onClick={() => navigate(`/admin/mentors/${app._id}`)}>
                          Review <ArrowRight size={12} />
                        </ViewBtn>
                      </Td>
                    </tr>
                  );
                })
            }
          </tbody>
        </Table>
      </TableWrap>

      {!loading && recent.length > 0 && (
        <ViewBtn
          style={{ marginLeft: 'auto', display: 'flex' }}
          onClick={() => navigate('/admin/mentors?status=pending')}
        >
          View all pending <ArrowRight size={13} />
        </ViewBtn>
      )}
    </Page>
  );
};

export default AdminDashboard;
