import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import './LayerModal.scss';

const FACTOR_HUMAN = {
  SAST: { label: 'Code Safety', category: 'code', desc: 'Scans source code for known vulnerability patterns' },
  VirusTotal: { label: 'Malware Scan', category: 'threat', desc: 'Checks against 70+ antivirus engines for malicious code' },
  Obfuscation: { label: 'Hidden Code', category: 'code', desc: 'Detects deliberately obscured or unreadable code' },
  Manifest: { label: 'Extension Config', category: 'code', desc: 'Validates security settings in the extension manifest' },
  ChromeStats: { label: 'Threat Intel', category: 'threat', desc: 'Cross-references known threat databases' },
  Webstore: { label: 'Store Reputation', category: 'trust', desc: 'Chrome Web Store ratings and user reviews' },
  Maintenance: { label: 'Update Freshness', category: 'trust', desc: 'How recently the extension was updated by its developer' },
  PermissionsBaseline: { label: 'Permission Risk', category: 'access', desc: 'Evaluates the sensitivity of requested browser permissions' },
  PermissionCombos: { label: 'Dangerous Combos', category: 'access', desc: 'Flags risky combinations of permissions that enable data theft' },
  NetworkExfil: { label: 'Data Sharing', category: 'data', desc: 'Detects if data is sent to external servers' },
  CaptureSignals: { label: 'Screen Capture', category: 'data', desc: 'Checks for screen or tab recording capabilities' },
  ToSViolations: { label: 'Policy Violations', category: 'policy', desc: 'Checks compliance with Chrome Web Store policies' },
  Consistency: { label: 'Behavior Match', category: 'policy', desc: 'Compares stated purpose vs actual behavior' },
  DisclosureAlignment: { label: 'Disclosure Accuracy', category: 'policy', desc: 'Validates privacy policy against actual data collection' },
};

const PERMISSION_RISKS = {
  tabs: 'Can read browsing activity',
  webRequest: 'Can intercept and modify traffic (high risk)',
  webRequestBlocking: 'Can block and modify network requests (high risk)',
  cookies: 'Can read and modify site cookies',
  history: 'Can read full browsing history',
  clipboardRead: 'Can read copied text from clipboard',
  clipboardWrite: 'Can modify clipboard contents',
  desktopCapture: 'Can record your screen',
  tabCapture: 'Can record browser tabs',
  nativeMessaging: 'Can communicate with desktop apps',
  proxy: 'Can route all traffic through external servers',
  debugger: 'Can bypass security and monitor page internals',
  management: 'Can disable or uninstall other extensions',
  geolocation: 'Can access physical location',
  bookmarks: 'Can read and modify bookmarks',
  '<all_urls>': 'Can access data on all websites you visit',
  '*://*/*': 'Can access data on all websites you visit',
  'http://*/*': 'Can access data on all HTTP websites',
  'https://*/*': 'Can access data on all HTTPS websites',
  activeTab: 'Can access the current active tab',
  storage: 'Can store data locally',
};

const CATEGORY_LABELS = {
  code: 'Code Checks',
  threat: 'Threat Detection',
  trust: 'Trust Signals',
  access: 'Permissions',
  data: 'Data Handling',
  policy: 'Policies',
};

const LAYER_CONFIG = {
  security: {
    title: 'Security',
    icon: '🛡️',
  },
  privacy: {
    title: 'Privacy',
    icon: '🔒',
  },
  governance: {
    title: 'Governance',
    icon: '📋',
  },
};

function humanizeFactor(factor) {
  const info = FACTOR_HUMAN[factor.name] || {
    label: factor.name,
    category: 'other',
    desc: '',
  };
  const severity = factor.severity ?? 0;
  let status, statusType;
  if (severity >= 0.4) {
    status = 'Issue';
    statusType = 'issues';
  } else {
    status = 'Clear';
    statusType = 'clear';
  }
  return { ...info, status, statusType, severity, raw: factor };
}

function groupByCategory(items) {
  const groups = {};
  items.forEach(item => {
    const cat = item.category || 'other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  });
  Object.values(groups).forEach(g => g.sort((a, b) => b.severity - a.severity));
  return Object.entries(groups)
    .sort(([, a], [, b]) => Math.max(...b.map(x => x.severity)) - Math.max(...a.map(x => x.severity)));
}

function bandLabel(band) {
  switch (band) {
    case 'GOOD': return 'Safe';
    case 'WARN': return 'Needs Review';
    case 'BAD': return 'Not Safe';
    default: return '';
  }
}

const InfoTooltip = ({ text }) => {
  return (
    <span
      className="lm-info-trigger"
      role="button"
      aria-label="More info"
      tabIndex={0}
    >
      <Info size={13} strokeWidth={2} />
      <span className="lm-info-tooltip" role="tooltip">{text}</span>
    </span>
  );
};

const LayerModal = ({
  open,
  onClose,
  layer,
  score = null,
  band = 'NA',
  factors = [],
  // eslint-disable-next-line no-unused-vars
  keyFindings = [],
  // eslint-disable-next-line no-unused-vars
  gateResults = [],
  // eslint-disable-next-line no-unused-vars
  layerReasons = [],
  layerDetails = null,
  // eslint-disable-next-line no-unused-vars
  onViewEvidence = null,
}) => {
  const config = LAYER_CONFIG[layer] || LAYER_CONFIG.security;

  const humanised = factors.map(humanizeFactor);
  const grouped = groupByCategory(humanised);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="lm-content lm-dialog-smooth" aria-describedby="lm-checks" aria-label={`${config.title} details`} data-layer={layer}>
        <DialogHeader className="lm-header-wrap">
          <DialogTitle className="lm-header">
            <div className="lm-header-inner">
              <div className="lm-header-left">
                <span className="lm-icon" aria-hidden>{config.icon}</span>
                <span className="lm-title">{config.title}</span>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="lm-body" id="lm-checks">
          {grouped.length > 0 && (
            <div className="lm-checks" role="list" aria-label={`${config.title} checks`}>
              {grouped.map(([cat, items], catIdx) => (
                <div key={cat} className="lm-group" style={{ animationDelay: `${catIdx * 40}ms` }} role="group" aria-label={CATEGORY_LABELS[cat] || cat}>
                  <span className="lm-group-label">{CATEGORY_LABELS[cat] || cat}</span>
                  <div className="lm-group-items">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className={`lm-check-card lm-check-${item.statusType}`}
                        style={{ animationDelay: `${(catIdx * 40 + (idx + 1) * 25)}ms` }}
                        role="listitem"
                      >
                        <div className="lm-check-left" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="lm-check-name">{item.label}</span>
                            {item.desc && <InfoTooltip text={item.desc} />}
                          </div>

                          {/* Permission Risk Explanation Engine */}
                          {item.raw?.name === 'PermissionsBaseline' && item.raw?.details?.high_risk_permissions?.length > 0 && (
                            <div style={{ marginTop: '2px', paddingLeft: '8px', borderLeft: '2px solid var(--risk-warn)', fontSize: '11px', color: 'var(--theme-text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {item.raw.details.high_risk_permissions.map(perm => (
                                <div key={perm} style={{ display: 'flex', gap: '6px', lineHeight: '1.2' }}>
                                  <span style={{ fontWeight: 600, color: 'var(--risk-warn)', flexShrink: 0 }}>{perm}</span>
                                  <span style={{ opacity: 0.6 }}>&rarr;</span>
                                  <span>{PERMISSION_RISKS[perm] || `Has access to ${perm}`}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Dangerous Combos Explanation Engine */}
                          {item.raw?.name === 'PermissionCombos' && item.raw?.details?.triggered_combos?.length > 0 && (
                            <div style={{ marginTop: '2px', paddingLeft: '8px', borderLeft: '2px solid var(--risk-warn)', fontSize: '11px', color: 'var(--theme-text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {item.raw.details.triggered_combos.map(combo => {
                                const isBroad = combo === 'broad_host_access';
                                const comboName = isBroad ? 'Broad Host Access' : combo.split('+').join(' + ');
                                const comboDesc = isBroad
                                  ? 'Can access and modify data on all websites'
                                  : 'High risk when these are used together';
                                return (
                                  <div key={combo} style={{ display: 'flex', gap: '6px', lineHeight: '1.2' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--risk-warn)', flexShrink: 0 }}>{comboName}</span>
                                    <span style={{ opacity: 0.6 }}>&rarr;</span>
                                    <span>{comboDesc}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                        <span className="lm-status-wrap">
                          {item.statusType === 'clear' ? (
                            <CheckCircle className="lm-status-icon" size={14} strokeWidth={2} aria-hidden />
                          ) : (
                            <AlertCircle className="lm-status-icon" size={14} strokeWidth={2} aria-hidden />
                          )}
                          <span className={`lm-status lm-status-${item.statusType}`}>
                            {item.status}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LayerModal;
