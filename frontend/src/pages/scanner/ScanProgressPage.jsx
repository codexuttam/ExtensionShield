import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import RocketGame from "../../components/RocketGame";
import { useScan } from "../../context/ScanContext";
import { EXTENSION_ICON_PLACEHOLDER } from "../../utils/constants";
import "./ScanProgressPage.scss";

const ScanProgressPage = () => {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const {
    isScanning,
    scanStage,
    error,
    setError,
    scanResults,
    currentExtensionId,
  } = useScan();
  
  const [extensionLogo, setExtensionLogo] = useState(EXTENSION_ICON_PLACEHOLDER);
  
  // Fetch extension logo
  useEffect(() => {
    if (!scanId) return;
    
    const API_BASE_URL = import.meta.env.VITE_API_URL || "";
    const iconUrl = `${API_BASE_URL}/api/scan/icon/${scanId}`;
    
    // Try to load the icon
    const img = new Image();
    img.onload = () => {
      setExtensionLogo(iconUrl);
    };
    img.onerror = () => {
      setExtensionLogo(EXTENSION_ICON_PLACEHOLDER);
    };
    img.src = iconUrl;
  }, [scanId]);

  // If we have results and the scan is complete, redirect to canonical URL
  useEffect(() => {
    if (scanResults && !isScanning && currentExtensionId === scanId) {
      // If we have both extensionId and buildHash, use canonical URL
      if (scanResults.extension_id && scanResults.build_hash) {
        navigate(`/extension/${scanResults.extension_id}/version/${scanResults.build_hash}`, { replace: true });
      } else {
        // Fallback to scan results URL (will then redirect to canonical if possible)
        navigate(`/scan/results/${scanId}`, { replace: true });
      }
    }
  }, [scanResults, isScanning, scanId, currentExtensionId, navigate]);

  // If user navigates directly here without an active scan, show appropriate message
  const hasActiveScan = isScanning && currentExtensionId === scanId;

  return (
    <div className="scan-progress-page">
      <div className="progress-container">
        {/* Header */}
        <div className="progress-header">
          <Link to="/scan" className="back-link">
            ← Back to Scanner
          </Link>
          <div className="extension-header">
            <img 
              src={extensionLogo} 
              alt="Extension icon" 
              className="extension-logo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = EXTENSION_ICON_PLACEHOLDER;
              }}
            />
            <div className="extension-header-text">
              <h1 className="progress-title">
                {hasActiveScan ? "Analyzing Extension" : "Scan Status"}
              </h1>
              <p className="progress-subtitle">
                Extension ID: <code>{scanId}</code>
              </p>
            </div>
          </div>
        </div>

        {/* Active Scan Progress - Rocket Game */}
        {hasActiveScan && (
          <div className="game-container">
            <RocketGame 
              isActive={hasActiveScan} 
              statusLabel="Running the scan... Play a game till then!"
            />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-state">
            <div className="error-icon">❌</div>
            <h2>Scan Failed</h2>
            <p className="error-message">{error}</p>
            <div className="error-actions">
              <Button onClick={() => setError(null)} variant="outline">
                Dismiss
              </Button>
              <Button onClick={() => navigate("/scan")}>
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* No Active Scan State */}
        {!hasActiveScan && !error && (
          <div className="no-scan-state">
            <div className="no-scan-icon">🔍</div>
            <h2>No Active Scan</h2>
            <p>
              There's no active scan for this extension ID. 
              You can start a new scan or check the scan history.
            </p>
            <div className="no-scan-actions">
              <Button onClick={() => navigate("/scan")} variant="default">
                Start New Scan
              </Button>
              <Button onClick={() => navigate("/scan/history")} variant="outline">
                View History
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanProgressPage;

