import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Clock,
  Bot,
  Github,
  Linkedin,
  FileText,
  Video,
  RefreshCw,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { getMyApplication } from '../../services/mentorApplicationService';

// ── Animations ─────────────────────────────────────────────────────────────────
const pulse = keyframes`0%,100%{opacity:1} 50%{opacity:0.4}`;
const spin  = keyframes`to { transform: rotate(360deg); }`;

// ── Styled Components ─────────────────────────────────────────────────────────
const Page = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
  padding: 2rem 1.5rem;
  padding-top: 5rem;

  @media (max-width: 640px) { padding: 1rem; padding-top: 4rem; }
`;

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  color: #fff;
`;

const PageTitle = styled.div`
  margin-bottom: 2rem;
  h1 {
    font-size: 2rem;
    font-weight: 700;
    background: linear-gradient(to right, #c4b5fd, #67e8f9);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0 0 0.4rem;
  }
  p { color: rgba(255,255,255,0.4); font-size: 0.9rem; margin: 0; }
`;

const StatusBanner = styled(motion.div)`
  border-radius: 1.25rem;
  padding: 2rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;

  ${({ $status }) => {
    if ($status === 'approved') return `
      background: linear-gradient(135deg,rgba(22,163,74,0.15),rgba(34,197,94,0.08));
      border: 1px solid rgba(34,197,94,0.3);
    `;
    if ($status === 'rejected') return `
      background: linear-gradient(135deg,rgba(220,38,38,0.15),rgba(239,68,68,0.08));
      border: 1px solid rgba(239,68,68,0.3);
    `;
    return `
      background: linear-gradient(135deg,rgba(217,119,6,0.15),rgba(245,158,11,0.08));
      border: 1px solid rgba(234,179,8,0.3);
    `;
  }}
`;

const BannerIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  ${({ $status }) => {
    if ($status === 'approved') return 'background:rgba(34,197,94,0.2);color:#4ade80;';
    if ($status === 'rejected') return 'background:rgba(239,68,68,0.2);color:#f87171;';
    return 'background:rgba(234,179,8,0.2);color:#facc15;';
  }}
`;

const BannerText = styled.div`
  flex: 1;
  h2 { color:#fff; font-size:1.3rem; font-weight:700; margin:0 0 0.25rem; }
  p  { color:rgba(255,255,255,0.55); font-size:0.875rem; margin:0; line-height:1.6; }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 1.5rem;

  @media (max-width: 860px) { grid-template-columns: 1fr; }
`;

const Card = styled(motion.div)`
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.25rem;
`;

const CardTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(255,255,255,0.7);
  margin: 0 0 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
`;

const InfoRow = styled.div`
  margin-bottom: 0.85rem;
  &:last-child { margin-bottom: 0; }
`;

const InfoLabel = styled.p`
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(255,255,255,0.3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.3rem;
`;

const InfoValue = styled.p`
  font-size: 0.875rem;
  color: rgba(255,255,255,0.7);
  margin: 0;
  line-height: 1.6;
`;

const Tag = styled.span`
  display: inline-block;
  background: rgba(139,92,246,0.12);
  color: #c4b5fd;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  font-size: 0.78rem;
  margin: 0.15rem;
`;

const LinkWrap = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #67e8f9;
  font-size: 0.875rem;
  text-decoration: none;
  word-break: break-all;
  &:hover { text-decoration: underline; }
`;

/* AI Score Panel */
const ScoreWrap = styled.div`
  position: sticky;
  top: 1.5rem;
`;

const FinalCircle = styled.div`
  width: 90px;
  height: 90px;
  border-radius: 50%;
  border: 3px solid ${({ $v }) =>
    $v >= 70 ? '#22c55e' : $v >= 40 ? '#f59e0b' : '#ef4444'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  box-shadow: 0 0 24px ${({ $v }) =>
    $v >= 70 ? 'rgba(34,197,94,0.3)' : $v >= 40 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'};

  span:first-child {
    font-size: 1.6rem;
    font-weight: 800;
    color: ${({ $v }) => $v >= 70 ? '#4ade80' : $v >= 40 ? '#facc15' : '#f87171'};
    line-height: 1;
  }
  span:last-child {
    font-size: 0.65rem;
    color: rgba(255,255,255,0.3);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const MetricRow = styled.div`margin-bottom: 0.9rem; &:last-child{margin-bottom:0;}`;

const MetricLabel = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-bottom: 0.4rem;
  span:first-child { color: rgba(255,255,255,0.45); }
  span:last-child  { font-weight: 700;
    color: ${({ $v }) => $v >= 70 ? '#4ade80' : $v >= 40 ? '#facc15' : '#f87171'};
  }
`;

const BarTrack = styled.div`
  height: 7px;
  background: rgba(255,255,255,0.07);
  border-radius: 999px;
  overflow: hidden;
`;

const BarFill = styled(motion.div)`
  height: 100%;
  border-radius: 999px;
  background: ${({ $v }) =>
    $v >= 70 ? 'linear-gradient(90deg,#16a34a,#4ade80)'
    : $v >= 40 ? 'linear-gradient(90deg,#d97706,#fbbf24)'
    :            'linear-gradient(90deg,#dc2626,#f87171)'};
`;

const RecBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 700;
  margin: 1rem 0;
  ${({ $rec }) => {
    if ($rec === 'approve') return 'background:rgba(34,197,94,0.12);color:#4ade80;border:1px solid rgba(34,197,94,0.25);';
    if ($rec === 'reject')  return 'background:rgba(239,68,68,0.12);color:#f87171;border:1px solid rgba(239,68,68,0.25);';
    return 'background:rgba(234,179,8,0.12);color:#facc15;border:1px solid rgba(234,179,8,0.25);';
  }}
`;

const ReasonBox = styled.div`
  background: rgba(0,0,0,0.2);
  border-radius: 0.6rem;
  padding: 0.85rem;
  font-size: 0.8rem;
  color: rgba(255,255,255,0.5);
  line-height: 1.65;
  font-style: italic;
`;

const WeightNote = styled.p`
  font-size: 0.7rem;
  color: rgba(255,255,255,0.2);
  text-align: center;
  margin: 0.75rem 0 0;
`;

const PendingEval = styled.div`
  text-align: center;
  padding: 2.5rem;
  color: rgba(255,255,255,0.25);
`;

const SpinIcon = styled.div`
  width: 36px; height: 36px;
  border: 3px solid rgba(139,92,246,0.3);
  border-top-color: #7c3aed;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin: 0 auto 0.75rem;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 2rem;
`;

const ActionBtn = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.4rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: none;

  ${({ $primary }) => $primary
    ? 'background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;'
    : 'background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);'}
`;

const RefreshBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.4);
  padding: 0.45rem 0.9rem;
  border-radius: 0.6rem;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { border-color: rgba(255,255,255,0.3); color:#fff; }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
`;

const Skeleton = styled.div`
  height: ${({ $h }) => $h || '1rem'};
  border-radius: 0.5rem;
  background: rgba(255,255,255,0.06);
  animation: ${pulse} 1.5s ease-in-out infinite;
  margin-bottom: ${({ $mb }) => $mb || 0};
`;

// ── Component ─────────────────────────────────────────────────────────────────
const ApplicationStatus = () => {
  const navigate = useNavigate();

  const [app, setApp]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadApplication = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      const res = await getMyApplication();

      if (!res.success) {
        if (res.notFound) {
          navigate('/mentor/apply', { replace: true });
          return;
        }
        setError(res.message || 'Failed to load application.');
        return;
      }

      setApp(res.data.application);
    } catch (err) {
      setError('Unexpected error loading application status.');
      console.error('[ApplicationStatus]', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadApplication(); }, []);

  // Auto-refresh while evaluation is pending
  useEffect(() => {
    if (!app) return;
    const needsRefresh = app.mentorStatus === 'pending' && !app.aiEvaluation?.evaluatedAt;
    if (!needsRefresh) return;

    const timer = setInterval(() => {
      loadApplication(true);
    }, 15000); // every 15 seconds

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app]);

  if (loading) {
    return (
      <Page>
        <Container>
          <Skeleton $h="2.5rem" $mb="0.75rem" style={{ width: '50%' }} />
          <Skeleton $h="6rem" $mb="1.5rem" />
          <Grid>
            <div>
              <Skeleton $h="10rem" $mb="1.25rem" />
              <Skeleton $h="10rem" />
            </div>
            <Skeleton $h="20rem" />
          </Grid>
        </Container>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <Container>
          <PageTitle><h1>Application Status</h1></PageTitle>
          <Card>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', color:'#f87171' }}>
              <AlertTriangle size={20} /> {error}
            </div>
          </Card>
        </Container>
      </Page>
    );
  }

  if (!app) return null;

  const ev    = app.aiEvaluation;
  const score = ev?.finalScore ?? null;
  const rec   = ev?.recommendation;

  const BANNER_CONTENT = {
    pending: {
      icon: <Clock size={28} />,
      title: 'Application Under Review',
      desc: 'Your application has been submitted and is being evaluated. The AI model is analysing your GitHub activity, resume, and profile. An admin will review the scores and make a final decision.',
    },
    approved: {
      icon: <CheckCircle size={28} />,
      title: 'Application Approved!',
      desc: 'Congratulations! You have been approved as a mentor. You can now create courses, manage sessions, and start mentoring learners.',
    },
    rejected: {
      icon: <XCircle size={28} />,
      title: 'Application Not Approved',
      desc: 'Unfortunately, your application was not approved at this time. You may re-apply after improving your profile and skill verification scores.',
    },
  };

  const banner = BANNER_CONTENT[app.mentorStatus] || BANNER_CONTENT.pending;

  return (
    <Page>
      <Container>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'2rem', flexWrap:'wrap', gap:'0.75rem' }}>
          <PageTitle style={{ margin:0 }}>
            <h1>Application Status</h1>
          </PageTitle>
          <RefreshBtn onClick={() => loadApplication(true)} disabled={refreshing}>
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </RefreshBtn>
        </div>

        {/* Status Banner */}
        <StatusBanner
          $status={app.mentorStatus}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <BannerIcon $status={app.mentorStatus}>{banner.icon}</BannerIcon>
          <BannerText>
            <h2>{banner.title}</h2>
            <p>{banner.desc}</p>
          </BannerText>
        </StatusBanner>

        <Grid>
          {/* Left — Application Info */}
          <div>
            <Card initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
              <CardTitle><Bot size={16} /> Application Details</CardTitle>
              <InfoRow>
                <InfoLabel>Name</InfoLabel>
                <InfoValue>{app.name}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Submitted</InfoLabel>
                <InfoValue>{new Date(app.submittedAt).toLocaleDateString('en-US',{ month:'long',day:'numeric',year:'numeric' })}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Skills</InfoLabel>
                <div>{(app.skills || []).map((s) => <Tag key={s}>{s}</Tag>)}</div>
              </InfoRow>
              {app.experience && (
                <InfoRow>
                  <InfoLabel>Experience</InfoLabel>
                  <InfoValue style={{ whiteSpace:'pre-wrap' }}>{app.experience}</InfoValue>
                </InfoRow>
              )}
            </Card>

            <Card initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <CardTitle><TrendingUp size={16} /> Submitted Links</CardTitle>
              {app.githubUrl && (
                <InfoRow>
                  <InfoLabel>GitHub</InfoLabel>
                  <LinkWrap href={app.githubUrl} target="_blank" rel="noopener noreferrer">
                    <Github size={14} /> {app.githubUrl}
                  </LinkWrap>
                </InfoRow>
              )}
              {app.linkedinUrl && (
                <InfoRow>
                  <InfoLabel>LinkedIn</InfoLabel>
                  <LinkWrap href={app.linkedinUrl} target="_blank" rel="noopener noreferrer">
                    <Linkedin size={14} /> {app.linkedinUrl}
                  </LinkWrap>
                </InfoRow>
              )}
              {app.resumeUrl && (
                <InfoRow>
                  <InfoLabel>Resume</InfoLabel>
                  <LinkWrap href={app.resumeUrl} target="_blank" rel="noopener noreferrer">
                    <FileText size={14} /> View Resume PDF
                  </LinkWrap>
                </InfoRow>
              )}
              {app.introVideoUrl && (
                <InfoRow>
                  <InfoLabel>Intro Video</InfoLabel>
                  <div style={{ 
                    width: '100%', 
                    marginTop: '0.5rem',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                  }}>
                    <video 
                      controls 
                      style={{ 
                        width: '100%', 
                        maxHeight: '400px',
                        display: 'block',
                        backgroundColor: '#000'
                      }}
                      preload="metadata"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.error('Video load error:', app.introVideoUrl);
                        e.target.style.display = 'none';
                        const errorMsg = document.createElement('div');
                        errorMsg.style.cssText = 'padding: 1rem; color: #ff6b6b; text-align: center; background: rgba(255,107,107,0.1); border-radius: 8px; margin-top: 0.5rem;';
                        errorMsg.innerHTML = `⚠️ Video failed to load. <a href="${app.introVideoUrl}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Try opening directly</a>`;
                        e.target.parentNode.insertBefore(errorMsg, e.target);
                      }}
                    >
                      <source src={app.introVideoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    <LinkWrap 
                      href={app.introVideoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        marginTop: '0.5rem',
                        fontSize: '0.8rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Video size={12} /> Open in new tab
                    </LinkWrap>
                  </div>
                </InfoRow>
              )}
            </Card>

            {/* Action buttons */}
            <ActionRow>
              {app.mentorStatus === 'approved' && (
                <ActionBtn $primary whileTap={{ scale: 0.97 }} onClick={() => navigate('/mentor-home')}>
                  Go to Mentor Dashboard <ArrowRight size={15} />
                </ActionBtn>
              )}

              {app.mentorStatus === 'rejected' && (
                <ActionBtn whileTap={{ scale: 0.97 }} onClick={() => navigate('/mentor/apply')}>
                  Re-Apply as Mentor
                </ActionBtn>
              )}
            </ActionRow>
          </div>

          {/* Right — AI Evaluation */}
          <ScoreWrap>
            <Card initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <CardTitle><Bot size={16} /> AI Evaluation Score</CardTitle>

              {score !== null ? (
                <>
                  <FinalCircle $v={score}>
                    <span>{score}</span>
                    <span>/ 100</span>
                  </FinalCircle>

                  {[
                    { label: 'GitHub',   val: ev.githubScore,   weight: '40%' },
                    { label: 'LinkedIn', val: ev.linkedinScore,  weight: '30%' },
                    { label: 'Resume',   val: ev.resumeScore,    weight: '30%' },
                  ].map(({ label, val, weight }) => (
                    <MetricRow key={label}>
                      <MetricLabel $v={val ?? 0}>
                        <span>{label} <span style={{ opacity:0.4, fontSize:'0.7rem' }}>({weight})</span></span>
                        <span>{val ?? 0}</span>
                      </MetricLabel>
                      <BarTrack>
                        <BarFill
                          $v={val ?? 0}
                          initial={{ width: 0 }}
                          animate={{ width: `${val ?? 0}%` }}
                          transition={{ duration: 0.9, ease: 'easeOut' }}
                        />
                      </BarTrack>
                    </MetricRow>
                  ))}

                  {rec && (
                    <RecBadge $rec={rec}>
                      <TrendingUp size={15} />
                      AI says: {rec === 'approve' ? 'Approve' : rec === 'reject' ? 'Reject' : 'Manual Review'}
                    </RecBadge>
                  )}

                  {ev?.reason && <ReasonBox>"{ev.reason}"</ReasonBox>}
                  <WeightNote>Score = GitHub(40%) + LinkedIn(30%) + Resume(30%)</WeightNote>
                </>
              ) : (
                <PendingEval>
                  <SpinIcon />
                  <p style={{ fontSize:'0.875rem', margin:0 }}>Evaluation in progress…</p>
                  <p style={{ fontSize:'0.78rem', marginTop:'0.5rem', opacity:0.7 }}>
                    This usually takes 1–2 minutes.
                    <br />Page auto-refreshes every 15 seconds.
                  </p>
                </PendingEval>
              )}
            </Card>
          </ScoreWrap>
        </Grid>
      </Container>
    </Page>
  );
};

export default ApplicationStatus;
