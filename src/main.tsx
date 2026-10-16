import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import './styles/tokens.css';
import './styles/arcade.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Job Hunt Game Error caught by boundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #193A46 0%, #102F3A 100%)',
            color: '#FFFFFF',
            fontFamily: 'Nunito, sans-serif',
            padding: '24px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              background: '#FFFFFF',
              color: '#102F3A',
              borderRadius: '20px',
              padding: '32px 24px',
              textAlign: 'center',
              boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
              border: '3px solid #FFC629',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏀⚠️</div>
            <h2 style={{ margin: '0 0 12px', color: '#F23855', fontFamily: 'Baloo 2, cursive' }}>
              GAME PAUSED
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: '0.95rem', color: '#174D5C', fontWeight: 700 }}>
              An unexpected error occurred while loading the court.
            </p>
            {this.state.error && (
              <pre
                style={{
                  background: '#F4F7F7',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  color: '#102F3A',
                  textAlign: 'left',
                  overflowX: 'auto',
                  maxHeight: '120px',
                  marginBottom: '20px',
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '999px',
                background: '#08BFE8',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '1rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(8, 191, 232, 0.4)',
              }}
            >
              🔄 Refresh & Play
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
