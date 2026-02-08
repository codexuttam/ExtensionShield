import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Database, Eye, Users, Lock, Shield, Cookie, Baby, RefreshCw, Mail } from "lucide-react";
import { Button } from "../components/ui/button";
import "./PrivacyPolicyPage.scss";

const PrivacyPolicyPage = () => {
  return (
    <div className="privacy-policy-page">
      <div className="page-container">
        <div className="page-header">
          <Link to="/settings" className="back-link">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Settings</span>
          </Link>
          <h1 className="page-title">
            <FileText className="w-6 h-6" />
            Privacy Policy
          </h1>
          <p className="page-subtitle">
            Last updated: February 7, 2026
          </p>
        </div>

        <div className="privacy-content">
          {/* Introduction */}
          <div className="glass-card">
            <h2 className="section-title">Introduction</h2>
            <p className="section-text">
              ExtensionShield ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard information when you use our extension security scanning service (the "Service").
            </p>
          </div>

          {/* Information We Collect */}
          <div className="glass-card">
            <div className="section-header">
              <Database className="section-icon" />
              <h2 className="section-title">Information We Collect</h2>
            </div>
            
            <div className="section-content">
              <div className="subsection">
                <h3 className="subsection-title">1) Information You Provide</h3>
                <ul className="section-list">
                  <li>Extension URLs or IDs you submit for scanning</li>
                  <li>Account information (such as name and email) when you sign in</li>
                  <li>Feedback, support requests, or other communications you send us</li>
                </ul>
              </div>

              <div className="subsection">
                <h3 className="subsection-title">2) Information Collected Automatically</h3>
                <ul className="section-list">
                  <li>Scan results and analysis data for extensions you scan</li>
                  <li>Usage analytics (such as page views and feature usage) to improve the Service</li>
                  <li>Technical information (such as browser type, IP address, device information, and log data)</li>
                  <li>Cookies and similar technologies used for authentication, security, and analytics</li>
                </ul>
              </div>

              <div className="subsection">
                <h3 className="subsection-title">3) Extension Data We Analyze</h3>
                <p className="section-text">
                  When you scan a Chrome extension, we analyze information that is publicly available (for example, Chrome Web Store listings, manifests, permissions, and related metadata).
                </p>
                <p className="section-text">
                  We do not intentionally collect personal data from an extension's end users.
                </p>
                <p className="section-text">
                  If you use an Enterprise feature that involves uploading extension packages or files (if applicable), we process those files only to provide the requested analysis and protect the Service.
                </p>
              </div>
            </div>
          </div>

          {/* How We Use Your Information */}
          <div className="glass-card">
            <div className="section-header">
              <Eye className="section-icon" />
              <h2 className="section-title">How We Use Your Information</h2>
            </div>
            
            <p className="section-text mb-4">We use information to:</p>
            <ul className="section-list">
              <li>Provide, operate, maintain, and improve the Service</li>
              <li>Process scan requests and generate reports</li>
              <li>Authenticate users and manage preferences</li>
              <li>Send notifications you enable (e.g., scan completion alerts)</li>
              <li>Understand usage and improve performance and user experience</li>
              <li>Comply with legal obligations and protect our rights and safety</li>
              <li>Communicate with you about updates, support, and Service-related messages</li>
            </ul>
          </div>

          {/* Data Sharing and Disclosure */}
          <div className="glass-card">
            <div className="section-header">
              <Users className="section-icon" />
              <h2 className="section-title">Data Sharing and Disclosure</h2>
            </div>
            
            <div className="section-content">
              <p className="section-text">
                We do not sell your personal information.
              </p>
              <p className="section-text">
                We may share information in limited circumstances:
              </p>
              <ul className="section-list">
                <li><strong>Service Providers:</strong> vendors who help us run the Service (e.g., hosting, authentication, analytics, email delivery, error monitoring)</li>
                <li><strong>Legal Requirements:</strong> if required by law, regulation, or legal process, or to protect rights and safety</li>
                <li><strong>Business Transfers:</strong> in connection with a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> when you ask or explicitly agree</li>
              </ul>
            </div>
          </div>

          {/* Data Retention */}
          <div className="glass-card">
            <div className="section-header">
              <Database className="section-icon" />
              <h2 className="section-title">Data Retention</h2>
            </div>
            
            <p className="section-text">
              We retain personal information only as long as necessary for the purposes described in this policy, including to provide the Service, comply with legal obligations, resolve disputes, and enforce agreements.
            </p>
            <p className="section-text mt-4">
              Typical examples:
            </p>
            <ul className="section-list">
              <li>Account data is kept until you delete your account (subject to legal requirements).</li>
              <li>Scan history and logs may be retained for a limited period for security, debugging, and abuse prevention.</li>
            </ul>
          </div>

          {/* Data Security */}
          <div className="glass-card">
            <div className="section-header">
              <Lock className="section-icon" />
              <h2 className="section-title">Data Security</h2>
            </div>
            
            <p className="section-text">
              We use reasonable technical and organizational measures designed to protect information. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </div>

          {/* Your Rights and Choices */}
          <div className="glass-card">
            <div className="section-header">
              <Shield className="section-icon" />
              <h2 className="section-title">Your Rights and Choices</h2>
            </div>
            
            <p className="section-text mb-4">
              Depending on your location, you may have rights regarding your personal information, such as:
            </p>
            
            <ul className="section-list">
              <li>Access, correction, deletion</li>
              <li>Portability</li>
              <li>Objection or restriction of certain processing</li>
              <li>Withdrawal of consent (where applicable)</li>
            </ul>
            
            <p className="section-text mt-4">
              You can also opt out of non-essential marketing emails by using the unsubscribe link (if provided) or contacting us.
            </p>
            <p className="section-text mt-4">
              To exercise rights, contact us using the details below.
            </p>
          </div>

          {/* Cookies and Similar Technologies */}
          <div className="glass-card">
            <div className="section-header">
              <Cookie className="section-icon" />
              <h2 className="section-title">Cookies and Similar Technologies</h2>
            </div>
            
            <p className="section-text">
              We use cookies and similar technologies to operate the Service, keep you signed in, enhance security, and understand usage. You can control cookies through your browser settings, but some features may not function properly if cookies are disabled.
            </p>
          </div>

          {/* Children's Privacy */}
          <div className="glass-card">
            <div className="section-header">
              <Baby className="section-icon" />
              <h2 className="section-title">Children's Privacy</h2>
            </div>
            
            <p className="section-text">
              The Service is not intended for children under 13, and we do not knowingly collect personal information from children under 13. If you believe a child has provided personal information, contact us and we will take appropriate steps to delete it.
            </p>
          </div>

          {/* Changes to This Privacy Policy */}
          <div className="glass-card">
            <div className="section-header">
              <RefreshCw className="section-icon" />
              <h2 className="section-title">Changes to This Privacy Policy</h2>
            </div>
            
            <p className="section-text">
              We may update this Privacy Policy from time to time. We will post the updated version on this page and update the "Last updated" date.
            </p>
          </div>

          {/* Contact Us */}
          <div className="glass-card contact-card">
            <div className="section-header">
              <Mail className="section-icon" />
              <h2 className="section-title">Contact Us</h2>
            </div>
            
            <div className="contact-info">
              <p className="section-text">
                <strong>For privacy questions or data requests:</strong>{" "}
                <a href="mailto:privacy@extensionshield.com" className="contact-link">
                  privacy@extensionshield.com
                </a>
              </p>
              <p className="section-text">
                <strong>For general support:</strong>{" "}
                <a href="mailto:support@extensionshield.com" className="contact-link">
                  support@extensionshield.com
                </a>
              </p>
            </div>
          </div>

          {/* Back to Settings */}
          <div className="back-button-container">
            <Link to="/settings">
              <Button variant="outline" className="back-button">
                <ArrowLeft className="w-4 h-4" />
                Back to Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;

