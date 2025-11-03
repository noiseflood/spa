import { NextPageContext } from 'next';
import React from 'react';

interface ErrorProps {
  statusCode?: number;
  hasGetInitialPropsRun?: boolean;
  err?: Error;
}

function Error({ statusCode, hasGetInitialPropsRun, err }: ErrorProps) {
  if (!hasGetInitialPropsRun && err) {
    // getInitialProps has run but things failed to render on the client
    // This error is being caught by the client-side error boundary
    console.error('Client-side error:', err);
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#1e1e1e',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '20px',
      }}
    >
      <h1
        style={{
          fontSize: '4rem',
          margin: '0 0 1rem 0',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {statusCode || 'Error'}
      </h1>
      <h2
        style={{
          fontSize: '1.5rem',
          margin: '0 0 2rem 0',
          fontWeight: '400',
          opacity: '0.8',
        }}
      >
        {statusCode ? `An error ${statusCode} occurred on server` : 'An error occurred on client'}
      </h2>
      <p
        style={{
          fontSize: '1rem',
          opacity: '0.6',
          marginBottom: '2rem',
          textAlign: 'center',
          maxWidth: '500px',
          lineHeight: '1.5',
        }}
      >
        {statusCode === 404
          ? 'This page could not be found.'
          : 'Something went wrong. Please try refreshing the page.'}
      </p>
      <a
        href="/"
        style={{
          padding: '12px 24px',
          backgroundColor: '#667eea',
          color: '#ffffff',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: '500',
          transition: 'background-color 0.2s ease',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#764ba2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#667eea';
        }}
      >
        Go to Home
      </a>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext): ErrorProps => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode, hasGetInitialPropsRun: true };
};

export default Error;
