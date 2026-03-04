import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Bot,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { getMentorApplications } from '../../services/adminService';

// ── Styled Components ─────────────────────────────────────────────────────────
const Page = styled.div`color: #fff;`;

const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.75rem;

  h1 {
    font-size: 1.75rem;
    font-weight: 700;
    background: linear-gradient(to right, #c4b5fd, #67e8f9);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0 0 0.25rem;
  }
  p { color: rgba(255,255,255,0.4); font-size: 0.875rem; margin: 0; }
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
`;

const SearchWrap = styled.div`
  position: relative;
  flex: 1;
  min-width: 220px;
  max-width: 360px;
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255,255,255,0.3);
  display: flex;
`;

const SearchInput = styled.input`
  width: 100%;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 0.75rem;
  color: #fff;
  padding: 0.65rem 1rem 0.65rem 2.5rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;

  &::placeholder { color: rgba(255,255,255,0.2); }
  &:focus { border-color: rgba(139,92,246,0.5); }
`;

const TabGroup = styled.div`
  display: flex;
  gap: 0.35rem;
  background: rgba(255,255,255,0.04);
  padding: 0.3rem;
  border-radius: 0.85rem;
  border: 1px solid rgba(255,255,255,0.07);
`;

const Tab = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 0.6rem;
  font-size: 0.825rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  ${({ $active }) =>
    $active
      ? 'background: rgba(139,92,246,0.25); color: #c4b5fd;'
      : 'background: transparent; color: rgba(255,255,255,0.4); &:hover{color:rgba(255,255,255,0.7);}'}
`;

const CountBubble = styled.span`
  background: rgba(139,92,246,0.4);
  color: #e9d5ff;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
`;

const RefreshBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.45);
  padding: 0.55rem 0.9rem;
  border-radius: 0.6rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover { border-color: rgba(255,255,255,0.3); color: #fff; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
`;

const AppCard = styled(motion.div)`
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 1rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.2s;

  &:hover {
    border-color: rgba(139,92,246,0.35);
    transform: translateY(-2px);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const CardName = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.25rem;
`;

const CardEmail = styled.div`
  font-size: 0.78rem;
  color: rgba(255,255,255,0.35);
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: capitalize;
  flex-shrink: 0;

  ${({ $status }) => {
    if ($status === 'approved') return 'background:rgba(34,197,94,0.12);color:#4ade80;';
    if ($status === 'rejected') return 'background:rgba(239,68,68,0.12);color:#f87171;';
    return 'background:rgba(234,179,8,0.12);color:#facc15;';
  }}
`;

const SkillTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 1rem;
`;

const Tag = styled.span`
  background: rgba(139,92,246,0.12);
  color: #c4b5fd;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  font-size: 0.72rem;
`;

const ScoreSection = styled.div`
  background: rgba(0,0,0,0.2);
  border-radius: 0.6rem;
  padding: 0.85rem;
  margin-bottom: 1rem;
`;

const ScoreRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.4rem;

  &:last-child { margin-bottom: 0; }

  span:first-child {
    width: 5rem;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.4);
    flex-shrink: 0;
  }
`;

const BarTrack = styled.div`
  flex: 1;
  height: 5px;
  background: rgba(255,255,255,0.07);
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
`;

const ScoreNum = styled.span`
  width: 2rem;
  text-align: right;
  font-size: 0.78rem;
  font-weight: 600;
  color: ${({ $v }) => $v >= 70 ? '#4ade80' : $v >= 40 ? '#facc15' : '#f87171'};
`;

const FinalScore = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.65rem;
  padding-top: 0.65rem;
  border-top: 1px solid rgba(255,255,255,0.06);

  span:first-child { font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.6); }
`;

const FinalNum = styled.span`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${({ $v }) => $v >= 70 ? '#4ade80' : $v >= 40 ? '#facc15' : '#f87171'};
`;

const RecBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: capitalize;
  ${({ $rec }) => {
    if ($rec === 'approve') return 'background:rgba(34,197,94,0.15);color:#4ade80;';
    if ($rec === 'reject')  return 'background:rgba(239,68,68,0.15);color:#f87171;';
    return 'background:rgba(234,179,8,0.15);color:#facc15;';
  }}
`;

const NoEval = styled.div`
  text-align: center;
  padding: 0.75rem;
  font-size: 0.8rem;
  color: rgba(255,255,255,0.25);
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const DateText = styled.span`
  font-size: 0.75rem;
  color: rgba(255,255,255,0.3);
`;

const ReviewBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(139,92,246,0.15);
  border: 1px solid rgba(139,92,246,0.35);
  color: #c4b5fd;
  padding: 0.4rem 0.9rem;
  border-radius: 0.6rem;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { background: rgba(139,92,246,0.25); }
`;

const EmptyState = styled.div`
  grid-column: 1/-1;
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(255,255,255,0.3);
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
`;

const PageBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.6);
  padding: 0.5rem 1rem;
  border-radius: 0.6rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) { border-color: rgba(139,92,246,0.4); color: #c4b5fd; }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
`;

const PageInfo = styled.span`
  font-size: 0.85rem;
  color: rgba(255,255,255,0.4);
`;

const Skeleton = styled.div`
  height: ${({ $h }) => $h || '1rem'};
  border-radius: 0.5rem;
  background: rgba(255,255,255,0.06);
  animation: pulse 1.5s ease-in-out infinite;
  margin-bottom: ${({ $mb }) => $mb || '0'};
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
`;

const TABS = [
  { value: 'pending',  label: 'Pending',  icon: Clock         },
  { value: 'approved', label: 'Approved', icon: CheckCircle   },
  { value: 'rejected', label: 'Rejected', icon: XCircle       },
];

// ── Component ─────────────────────────────────────────────────────────────────
const MentorApplicationsList = () => {
  const navigate                     = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [status, setStatus]       = useState(searchParams.get('status') || 'pending');
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [data, setData]           = useState({ applications: [], total: 0, pages: 1 });
  const [counts, setCounts]       = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState('');

  const LIMIT = 12;

  const loadApplications = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      const [res, pendingCount, approvedCount, rejectedCount] = await Promise.all([
        getMentorApplications({ status, page, limit: LIMIT }),
        getMentorApplications({ status: 'pending',  limit: 1 }),
        getMentorApplications({ status: 'approved', limit: 1 }),
        getMentorApplications({ status: 'rejected', limit: 1 }),
      ]);

      if (!res.success) {
        setError(res.message || 'Failed to load applications.');
        return;
      }

      setData(res.data);
      setCounts({
        pending:  pendingCount.success  ? pendingCount.data.total  : 0,
        approved: approvedCount.success ? approvedCount.data.total : 0,
        rejected: rejectedCount.success ? rejectedCount.data.total : 0,
      });
    } catch (err) {
      setError('Unexpected error loading applications.');
      console.error('[MentorApplicationsList]', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status, page]);

  useEffect(() => { loadApplications(); }, [loadApplications]);

  const handleTabChange = (val) => {
    setStatus(val);
    setPage(1);
    setSearchParams({ status: val });
  };

  const filtered = (data.applications || []).filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.name?.toLowerCase().includes(q) ||
      a.userId?.email?.toLowerCase().includes(q) ||
      (a.skills || []).some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <Page>
      <PageHeader>
        <div>
          <h1>Mentor Applications</h1>
          <p>Review and manage mentor skill verification requests</p>
        </div>
        <RefreshBtn onClick={() => loadApplications(true)} disabled={refreshing}>
          <RefreshCw size={13} />
          Refresh
        </RefreshBtn>
      </PageHeader>

      {error && (
        <div style={{ color:'#f87171', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)',
          borderRadius:'0.75rem', padding:'0.9rem 1.1rem', marginBottom:'1.5rem', fontSize:'0.875rem' }}>
          {error}
        </div>
      )}

      <Toolbar>
        <TabGroup>
          {TABS.map(({ value, label, icon: Icon }) => (
            <Tab key={value} $active={status === value} onClick={() => handleTabChange(value)}>
              <Icon size={14} />
              {label}
              {counts[value] > 0 && <CountBubble>{counts[value]}</CountBubble>}
            </Tab>
          ))}
        </TabGroup>

        <SearchWrap>
          <SearchIcon><Search size={15} /></SearchIcon>
          <SearchInput
            placeholder="Search by name, email or skill…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </SearchWrap>
      </Toolbar>

      <Grid>
        <AnimatePresence mode="popLayout">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <AppCard key={`skel-${i}`} style={{ cursor: 'default' }}>
                  <Skeleton $h="1.2rem" $mb="0.5rem" style={{ width: '60%' }} />
                  <Skeleton $h="0.75rem" $mb="1rem" style={{ width: '80%' }} />
                  <Skeleton $h="3rem" $mb="1rem" />
                  <Skeleton $h="0.75rem" />
                </AppCard>
              ))
            : filtered.length === 0
            ? (
                <EmptyState key="empty">
                  <Bot size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                  <p>No {status} applications found.</p>
                </EmptyState>
              )
            : filtered.map((app, i) => {
                const ev    = app.aiEvaluation;
                const score = ev?.finalScore ?? null;
                const rec   = ev?.recommendation;

                return (
                  <AppCard
                    key={app._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => navigate(`/admin/mentors/${app._id}`)}
                  >
                    <CardHeader>
                      <div>
                        <CardName>{app.name}</CardName>
                        <CardEmail>{app.userId?.email || '—'}</CardEmail>
                      </div>
                      <StatusBadge $status={app.mentorStatus}>
                        {app.mentorStatus === 'approved' && <CheckCircle size={11} />}
                        {app.mentorStatus === 'rejected' && <XCircle size={11} />}
                        {app.mentorStatus === 'pending'  && <Clock size={11} />}
                        {app.mentorStatus}
                      </StatusBadge>
                    </CardHeader>

                    <SkillTags>
                      {(app.skills || []).slice(0, 4).map((s) => (
                        <Tag key={s}>{s}</Tag>
                      ))}
                      {(app.skills || []).length > 4 && (
                        <Tag>+{app.skills.length - 4}</Tag>
                      )}
                    </SkillTags>

                    <ScoreSection>
                      {ev && score !== null ? (
                        <>
                          {[
                            { label: 'GitHub',   val: ev.githubScore   },
                            { label: 'LinkedIn', val: ev.linkedinScore },
                            { label: 'Resume',   val: ev.resumeScore   },
                          ].map(({ label, val }) => (
                            <ScoreRow key={label}>
                              <span>{label}</span>
                              <BarTrack><BarFill $pct={val} /></BarTrack>
                              <ScoreNum $v={val}>{val}</ScoreNum>
                            </ScoreRow>
                          ))}
                          <FinalScore>
                            <span>Final Score</span>
                            <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
                              {rec && <RecBadge $rec={rec}>{rec}</RecBadge>}
                              <FinalNum $v={score}>{score}</FinalNum>
                            </div>
                          </FinalScore>
                        </>
                      ) : (
                        <NoEval>
                          <Bot size={20} style={{ margin: '0 auto 0.4rem', opacity: 0.3 }} />
                          AI evaluation pending…
                        </NoEval>
                      )}
                    </ScoreSection>

                    <CardFooter>
                      <DateText>
                        {new Date(app.submittedAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </DateText>
                      <ReviewBtn onClick={(e) => { e.stopPropagation(); navigate(`/admin/mentors/${app._id}`); }}>
                        Review <ArrowRight size={12} />
                      </ReviewBtn>
                    </CardFooter>
                  </AppCard>
                );
              })
          }
        </AnimatePresence>
      </Grid>

      {/* Pagination */}
      {!loading && data.pages > 1 && (
        <Pagination>
          <PageBtn onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
            <ChevronLeft size={15} /> Prev
          </PageBtn>
          <PageInfo>Page {page} of {data.pages}</PageInfo>
          <PageBtn onClick={() => setPage((p) => p + 1)} disabled={page >= data.pages}>
            Next <ChevronRight size={15} />
          </PageBtn>
        </Pagination>
      )}
    </Page>
  );
};

export default MentorApplicationsList;
