// src/features/auth/pages/InstructionsPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';

const InstructionsPage = () => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">

      {/* ====== FULL PAGE BLOCKING OVERLAY ====== */}
      {!dismissed && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              animation: 'popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Red header bar */}
            <div
              style={{
                background: 'linear-gradient(135deg, #d9534f, #b02a27)',
                padding: '20px 28px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '2rem' }}>⚠️</span>
              <div>
                <p style={{ color: '#fff', fontWeight: '900', fontSize: '1.1rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  SCOPE Faculty — Read Before Login
                </p>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem', margin: 0 }}>
                  Action required before proceeding
                </p>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '28px' }}>
              <p style={{ fontSize: '1rem', color: '#333', fontWeight: '600', marginBottom: '18px', lineHeight: 1.6 }}>
                If you are a <strong style={{ color: '#d9534f' }}>faculty </strong> 
                 you <strong style={{ color: '#d9534f' }}>MUST</strong> prefix your
                email ID with:
              </p>

              {/* (multi) badge */}
              <div
                style={{
                  background: '#fff3f3',
                  border: '2px solid #d9534f',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  textAlign: 'center',
                  marginBottom: '20px',
                }}
              >
                <code
                  style={{
                    fontSize: '1.7rem',
                    fontWeight: '900',
                    color: '#d9534f',
                    fontFamily: 'monospace',
                    letterSpacing: '0.04em',
                  }}
                >
                  (multi)
                </code>
                <p style={{ margin: '6px 0 0', color: '#888', fontSize: '0.82rem' }}>
                  prefix before your email address
                </p>
              </div>

              {/* Example */}
              <div
                style={{
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  marginBottom: '24px',
                  fontSize: '0.9rem',
                }}
              >
                <p style={{ margin: '0 0 8px', color: '#555', fontWeight: '700' }}>Example:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#d9534f', fontWeight: '800', fontSize: '1rem' }}>✗</span>
                    <code style={{ color: '#999', fontFamily: 'monospace' }}>yourname@vit.ac.in</code>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#2e7d32', fontWeight: '800', fontSize: '1rem' }}>✓</span>
                    <code style={{ color: '#2e7d32', fontFamily: 'monospace', fontWeight: '700' }}>(multi)yourname@vit.ac.in</code>
                  </div>
                </div>
              </div>

              {/* Acknowledge button */}
              <button
                onClick={() => setDismissed(true)}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #d9534f, #b02a27)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                I Understand — Continue to Instructions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== PAGE CONTENT (blurred/blocked behind overlay) ====== */}
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Faculty Evaluation Portal
          </h1>
          <p className="text-gray-600">Complete guide to using the system</p>
        </div>

        <Card className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">For Faculty</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-lg mb-2">1. Login &amp; Select Filters</h3>
              <p>After login, select Year, School, Programme, and your Role (Guide/Panel)</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">2. Active Reviews</h3>
              <p>Click on a review to expand and see your assigned teams. Click "Enter Marks" to evaluate students.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">3. Mark Entry</h3>
              <p>Enter marks for each rubric component. Total must equal 100 for each student. Marks are validated automatically.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">4. Missed Deadlines</h3>
              <p>If you missed a deadline, use "Request Edit Access" to ask admin for extension.</p>
            </div>
          </div>
        </Card>

        <div className="text-center mt-8">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/login')}
          >
            Proceed to Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InstructionsPage;
