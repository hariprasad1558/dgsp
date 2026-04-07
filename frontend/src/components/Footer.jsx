import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="portal-footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section identity">
            <h4 className="footer-title">DGsP / IGsP Conference Portal</h4>
            <p className="footer-description">
              Secure Management Portal for the Director General of Police /
              Inspector General of Police Annual Conference.
            </p>
          </div>

          <div className="footer-section links">
            <h5 className="section-title">Quick Links</h5>
            <ul className="footer-links">
              <li><a href="/dashboard">User Dashboard</a></li>
              <li><a href="/admin">Admin Control</a></li>
              {/* <li><a href="https://mha.gov.in" target="_blank" rel="noopener noreferrer">MHA Official Site</a></li> */}
              {/* <li><a href="/help">Technical Support</a></li> */}
            </ul>
          </div>

          <div className="footer-section contact">
            <h5 className="section-title">Contact Support</h5>
            <p className="contact-info">
              📧 support.prism@appolice.gov.in<br />
              📞 +91-866-2422114<br />
              📍 AP Police Headquarters, Mangalagiri
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">
            &copy; {new Date().getFullYear()} DGsP / IGsP Conference. All rights reserved.
          </p>
          <p className="credits">
            Developed by <span className="prism-team">AP Police Prism Team</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
