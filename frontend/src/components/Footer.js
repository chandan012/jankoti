import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>Jankoti.com</h4>
          <p className="footer-muted">Skilled Hiring | Fresher | Startup | SME | Enterprises</p>
          <p className="footer-muted">India | Dubai | Europe | USA | LATAM | APAC | EMEA</p>
          <p className="footer-muted">Job News | Freelancing | Classified | Startup Podcast</p>
        </div>
        
        <div className="footer-section">
          <h4>For Job Seekers</h4>
          <a href="https://entrepreneur.jankoti.com/jobs" target="_blank" rel="noreferrer">Job News</a>
          <a href="https://jankoti.com" target="_blank" rel="noreferrer">Free Certification</a>
          <a href="https://whatsapp.com/channel/0029VbC0L1Z8F2pI4oZSFV0z" target="_blank" rel="noreferrer">Fresher Hiring News</a>
          <a href="https://jankoti.com" target="_blank" rel="noreferrer">Interview Prep</a>
        </div>
        
        <div className="footer-section">
          <h4>For Organization</h4>
          <a href="https://entrepreneur.jankoti.com/freelancing-view" target="_blank" rel="noreferrer">Freelancing</a>
          <a href="https://entrepreneur.jankoti.com/classified-view" target="_blank" rel="noreferrer">Classified</a>
          <a href="https://entrepreneur.jankoti.com/startup-view" target="_blank" rel="noreferrer">Startup News</a>
          <a href="https://entrepreneur.jankoti.com/podcast-view" target="_blank" rel="noreferrer">Podcast</a>
        </div>

        <div className="footer-section">
          <h4>Affiliate</h4>
          <a href="https://flexicloud.co/" target="_blank" rel="noreferrer">FlexiCloud</a>
          <a href="https://cloudsavvy.io/" target="_blank" rel="noreferrer">CloudSavvy</a>
          <a href="https://www.jankoti.com/" target="_blank" rel="noreferrer">Jankoti</a>
          <span className="footer-muted">Zoho</span>
        </div>

        <div className="footer-section">
          <h4>Company</h4>
          <a href="https://jankoti.com/about" target="_blank" rel="noreferrer">About Us</a>
          <Link to="/terms-condition">Terms and Condition</Link>
          <a href="https://jankoti.com/cookies" target="_blank" rel="noreferrer">Cookies</a>
          <a href="mailto:support@jankoti.com">Support: support@jankoti.com</a>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Jankoti.com. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
