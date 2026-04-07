import React from 'react';

function Header() {
  return (
    <>
      <header style={{ 
        background: 'linear-gradient(135deg, #7100bc 0%, #0030b3 100%)', 
        padding: '10px 30px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <img
            src="/images/emblem-of-india.webp"
            alt="Indian Emblem"
            style={{ height: '100px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
          />
        </div>

        <div style={{ flex: 3, textAlign: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '1px', letterSpacing: '0.5px' }}>
            डीजीएसपी / आईजीएसपी सम्मेलन पोर्टल
          </h2>
          <h1 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '2px' }}>
            DGsP / IGsP Conference Portal
          </h1>
          <p style={{ fontSize: '18px', opacity: 0.9, fontWeight: '400', margin: 0 }}>
            Director General of Police / Inspector General of Police Conference Management
          </p>
        </div>

        <div style={{ flex: 1, textAlign: 'right' }}>
          <img
            src="/images/logo.png"
            alt="Police Logo"
            style={{ height: '100px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
          />
        </div>
      </header>

    </>
  );
}

export default Header;
