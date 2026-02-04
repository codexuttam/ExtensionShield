import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import "./MethodologyPage.scss";

const MethodologyPage = () => {
  return (
    <>
      <Helmet>
        <title>Methodology: How ExtensionShield Scores Risk | ExtensionShield</title>
        <meta name="description" content="Learn how ExtensionShield analyzes Chrome extensions: static analysis, permission mapping, threat intelligence, and evidence chain-of-custody." />
        <link rel="canonical" href="https://extensionaudit.com/research/methodology" />
      </Helmet>

      <div className="methodology-page">
        <div className="methodology-bg">
          <div className="bg-gradient" />
        </div>

        <div className="methodology-content">
          {/* Breadcrumb */}
          <nav className="breadcrumb">
            <Link to="/research">Research</Link>
            <span>/</span>
            <span>Methodology</span>
          </nav>

          <header className="methodology-header">
            <h1>How ExtensionShield Scores Risk</h1>
            <p>
              Our multi-dimensional analysis combines static code analysis, permission evaluation, 
              threat intelligence, and behavioral signals to produce an actionable security score.
            </p>
          </header>

          {/* Scan Types */}
          <section className="methodology-section">
            <h2>Scan Types</h2>
            <div className="scan-types-grid">
              <div className="scan-type-card">
                <div className="scan-type-icon lookup">⚡</div>
                <h3>Lookup</h3>
                <p>
                  Instant cached results when we've already analyzed that exact extension build hash. 
                  No compute cost, no daily limit.
                </p>
              </div>
              <div className="scan-type-card">
                <div className="scan-type-icon deep">🔬</div>
                <h3>Deep Scan</h3>
                <p>
                  Full static analysis + threat intelligence when we encounter a new build. 
                  Includes LLM-powered code review and VirusTotal checks.
                </p>
              </div>
              <div className="scan-type-card">
                <div className="scan-type-icon monitor">📡</div>
                <h3>Monitoring</h3>
                <p>
                  Continuous watch for extension updates with automatic re-scanning. 
                  Get alerts when risk level changes. (Enterprise)
                </p>
              </div>
            </div>
          </section>

          {/* Scoring Dimensions */}
          <section className="methodology-section">
            <h2>Scoring Dimensions</h2>
            <div className="dimensions-list">
              <div className="dimension-item">
                <div className="dimension-header">
                  <span className="dimension-icon">🔐</span>
                  <h3>Security Score</h3>
                </div>
                <p>
                  Evaluates code patterns, obfuscation detection, data exfiltration risks, 
                  cryptographic operations, and known malicious signatures.
                </p>
              </div>
              <div className="dimension-item">
                <div className="dimension-header">
                  <span className="dimension-icon">👁️</span>
                  <h3>Privacy Score</h3>
                </div>
                <p>
                  Analyzes data collection patterns, third-party tracking, storage access, 
                  and alignment with Chrome Web Store privacy disclosures.
                </p>
              </div>
              <div className="dimension-item">
                <div className="dimension-header">
                  <span className="dimension-icon">📋</span>
                  <h3>Governance Score</h3>
                </div>
                <p>
                  Assesses permission justification, update patterns, developer reputation, 
                  and compliance with enterprise security policies.
                </p>
              </div>
            </div>
          </section>

          {/* Evidence Chain */}
          <section className="methodology-section">
            <h2>Evidence Chain-of-Custody</h2>
            <p className="section-intro">
              Every finding is backed by traceable evidence. Our reports include:
            </p>
            <ul className="evidence-list">
              <li>
                <strong>File paths & line numbers</strong> — Exact locations of flagged code patterns
              </li>
              <li>
                <strong>Code snippets</strong> — Relevant context around each finding
              </li>
              <li>
                <strong>Rule citations</strong> — Which detection rule triggered and why
              </li>
              <li>
                <strong>Threat intel sources</strong> — VirusTotal, malware databases, community reports
              </li>
              <li>
                <strong>Build hash</strong> — Cryptographic fingerprint of the exact analyzed version
              </li>
            </ul>
          </section>

          {/* CTA */}
          <div className="methodology-cta">
            <h3>Want to dive deeper?</h3>
            <p>Check out our case studies to see the methodology in action.</p>
            <Link to="/research/case-studies" className="cta-button">
              View Case Studies
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default MethodologyPage;

