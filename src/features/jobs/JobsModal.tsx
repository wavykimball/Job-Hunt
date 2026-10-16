import React from 'react';
import { Modal } from '@/components/Modal';
import { ArcadeButton } from '@/components/ArcadeButton';
import { Application, Company, Employment } from '@/types/game';
import { SEEDED_COMPANIES } from '@/services/seedData';
import { Briefcase, Building2, CheckCircle2, Clock, XCircle, ArrowRight, Sparkles } from 'lucide-react';

export interface JobsModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: Application[];
  currentEmployment: Employment | null;
  onStartApplying: () => void;
  onViewOffer?: (company: Company) => void;
}

export const JobsModal: React.FC<JobsModalProps> = ({
  isOpen,
  onClose,
  applications,
  currentEmployment,
  onStartApplying,
  onViewOffer,
}) => {
  const isEmployed = currentEmployment?.status === 'active' || currentEmployment?.status === 'paused';

  const offeredCount = applications.filter((a) => a.status === 'offered').length;
  const inReviewCount = applications.filter((a) => a.status === 'under_review' || a.status === 'submitted').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="My Applications & Jobs"
      headerVariant="teal"
      maxWidth={540}
      footer={
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
          <ArcadeButton
            variant="secondary"
            fullWidth
            size="sm"
            onClick={onClose}
            style={{ justifyContent: 'center', height: '42px', minHeight: '42px', fontSize: '0.95rem' }}
          >
            Close
          </ArcadeButton>
          <ArcadeButton
            variant="primary"
            fullWidth
            size="sm"
            onClick={() => {
              onClose();
              onStartApplying();
            }}
            style={{ justifyContent: 'center', height: '42px', minHeight: '42px', fontSize: '0.95rem' }}
          >
            {applications.length === 0 ? 'Start Applying' : 'Apply to More Jobs'}
          </ArcadeButton>
        </div>
      }
    >
      {/* Empty State when no applications submitted yet */}
      {applications.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '24px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'var(--color-cloud)',
              border: '2px dashed var(--color-teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-teal)',
              marginBottom: 4,
            }}
          >
            <Briefcase size={36} />
          </div>

          <div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', margin: '0 0 6px 0' }}>
              No Job Applications Yet
            </h3>
            <p style={{ color: 'var(--color-teal)', fontSize: '0.92rem', lineHeight: 1.5, margin: 0, maxWidth: 380 }}>
              {isEmployed
                ? "You haven't submitted any other applications yet. You can apply for other companies while holding your current job!"
                : "You haven't applied to any jobs yet! Head over to the court, aim your CV at company basketball hoops, and shoot to submit your application."}
            </p>
          </div>

          <div
            style={{
              background: 'var(--color-cloud)',
              border: '1.5px solid var(--color-muted)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              fontSize: '0.85rem',
              color: 'var(--color-ink)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textAlign: 'left',
              width: '100%',
              maxWidth: 400,
            }}
          >
            <Sparkles size={20} color="var(--color-golden-yellow)" style={{ flexShrink: 0 }} />
            <span>
              Tip: Scoring a basket submits your CV! Better shots and Swishes increase your chance of receiving an instant job offer.
            </span>
          </div>

          <ArcadeButton
            variant="primary"
            fullWidth
            onClick={() => {
              onClose();
              onStartApplying();
            }}
            style={{ marginTop: 8 }}
          >
            <ArrowRight size={18} />
            Start Applying Now
          </ArcadeButton>
        </div>
      ) : (
        /* Applications List when player has applied */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Quick Stats Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--color-cloud)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 16px',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--color-ink)',
              border: '1px solid var(--color-muted)',
            }}
          >
            <span>Total Applied: <strong>{applications.length}</strong></span>
            <div style={{ display: 'flex', gap: 10 }}>
              {offeredCount > 0 && (
                <span style={{ color: 'var(--color-green-dark)' }}>
                  ★ {offeredCount} Offer{offeredCount > 1 ? 's' : ''}
                </span>
              )}
              {inReviewCount > 0 && (
                <span style={{ color: 'var(--color-cyan-dark)' }}>
                  ● {inReviewCount} In Review
                </span>
              )}
            </div>
          </div>

          {/* List of Applications */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              maxHeight: '360px',
              overflowY: 'auto',
              paddingRight: 4,
            }}
          >
            {applications.map((app) => {
              const comp = SEEDED_COMPANIES.find((c) => c.id === app.company_id) || {
                name: 'Unknown Company',
                role_title: 'Role',
                accent_color: '#08BFE8',
              };

              const isCurrentEmployer = currentEmployment?.company_id === app.company_id;

              return (
                <div
                  key={app.id}
                  style={{
                    background: '#FFFFFF',
                    border: `2px solid ${app.status === 'offered' ? 'var(--color-golden-yellow)' : 'var(--color-muted)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                    boxShadow: app.status === 'offered' ? '0 2px 8px rgba(255, 198, 41, 0.25)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 'var(--radius-md)',
                        background: comp.accent_color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        flexShrink: 0,
                      }}
                    >
                      <Building2 size={20} />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: '0.98rem',
                          color: 'var(--color-ink)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {comp.name}
                        {isCurrentEmployer && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: '0.72rem',
                              background: 'var(--color-green-light)',
                              color: 'var(--color-green-dark)',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-pill)',
                            }}
                          >
                            Current Job
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--color-teal)',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {comp.role_title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginTop: 2 }}>
                        Applied {new Date(app.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Outcome Status Pill & Action */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    {app.status === 'offered' && (
                      <>
                        <span
                          style={{
                            background: '#E3FBEA',
                            color: '#197A3B',
                            border: '1.5px solid #82E4A1',
                            borderRadius: 'var(--radius-pill)',
                            padding: '3px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <CheckCircle2 size={13} />
                          Offered!
                        </span>
                        {!isCurrentEmployer && onViewOffer && (
                          <button
                            type="button"
                            onClick={() => {
                              const companyObj = SEEDED_COMPANIES.find((c) => c.id === app.company_id);
                              if (companyObj) {
                                onClose();
                                onViewOffer(companyObj);
                              }
                            }}
                            className="arcade-btn arcade-btn-sm arcade-btn-golden"
                            style={{ padding: '2px 8px', fontSize: '0.72rem', height: 26, minHeight: 26 }}
                          >
                            View Offer
                          </button>
                        )}
                      </>
                    )}

                    {(app.status === 'under_review' || app.status === 'submitted') && (
                      <span
                        style={{
                          background: '#E0F7FD',
                          color: '#036B84',
                          border: '1.5px solid #6ED5F0',
                          borderRadius: 'var(--radius-pill)',
                          padding: '3px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Clock size={13} />
                        Under Review
                      </span>
                    )}

                    {app.status === 'rejected' && (
                      <span
                        style={{
                          background: 'var(--color-cloud)',
                          color: 'var(--color-teal)',
                          border: '1.5px solid var(--color-muted)',
                          borderRadius: 'var(--radius-pill)',
                          padding: '3px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <XCircle size={13} />
                        Not Selected
                      </span>
                    )}

                    {app.status === 'accepted' && (
                      <span
                        style={{
                          background: '#E3FBEA',
                          color: '#197A3B',
                          border: '1.5px solid #82E4A1',
                          borderRadius: 'var(--radius-pill)',
                          padding: '3px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <CheckCircle2 size={13} />
                        Accepted
                      </span>
                    )}

                    {app.status === 'declined' && (
                      <span
                        style={{
                          background: 'var(--color-cloud)',
                          color: 'var(--color-teal)',
                          border: '1.5px solid var(--color-muted)',
                          borderRadius: 'var(--radius-pill)',
                          padding: '3px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        Declined
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
};
