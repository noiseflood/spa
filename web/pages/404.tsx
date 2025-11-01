import Link from 'next/link';
import React from 'react';

export default function Custom404() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#1e1e1e',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px'
    }}>
      <h1 style={{
        fontSize: '8rem',
        margin: '0',
        fontWeight: '700',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        lineHeight: '1'
      }}>
        404
      </h1>
      <h2 style={{
        fontSize: '2rem',
        margin: '1rem 0 1rem 0',
        fontWeight: '500',
        opacity: '0.9'
      }}>
        Page Not Found
      </h2>
      <p style={{
        fontSize: '1.1rem',
        opacity: '0.6',
        marginBottom: '3rem',
        textAlign: 'center',
        maxWidth: '500px',
        lineHeight: '1.6'
      }}>
        Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
      </p>
      <div style={{ display: 'flex', gap: '16px' }}>
        <Link
          href="/"
          style={{
            padding: '14px 28px',
            backgroundColor: '#667eea',
            color: '#ffffff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '500',
            fontSize: '1rem',
            transition: 'background-color 0.2s ease',
            cursor: 'pointer',
            display: 'inline-block'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#764ba2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#667eea';
          }}
        >
          Go to Home
        </Link>
        <Link
          href="/editor"
          style={{
            padding: '14px 28px',
            backgroundColor: 'transparent',
            color: '#667eea',
            border: '2px solid #667eea',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '500',
            fontSize: '1rem',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            display: 'inline-block'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#667eea';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#667eea';
          }}
        >
          Open Editor
        </Link>
      </div>
    </div>
  );
}