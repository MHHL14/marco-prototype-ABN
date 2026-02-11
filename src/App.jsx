import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ChevronDown, ChevronRight, ChevronLeft, Check, X, AlertTriangle, Info, Search, Filter,
  FileText, Shield, Database, ArrowRight, ArrowRightLeft, BarChart3, ClipboardList,
  User, Building2, BookOpen, Layers, GitBranch, ExternalLink, Download, Bell, CheckCircle2,
  Circle, Clock, Lock, Eye, Zap, Upload, Sparkles, Package, Server, Plus, Pencil, Trash2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import * as XLSX from 'xlsx';
import {
  COLORS, PERSONAS, USE_CASE_LIST, REGULATIONS, POLICIES, REF_MODELS, UC_PRESELECTIONS, USE_CASES,
  REQUIREMENTS, BIRD_ENTITY_MAPPING, SOURCE_MAPPINGS, ACTION_ITEMS, getStats,
  LEGAL_ENTITIES, ENTITY_PRESELECTIONS, BUSINESS_NEED_EXAMPLES, DERIVED_REQUIREMENTS,
  DDS_AVAILABILITY, DDS_DATA_PRODUCTS, CHANGE_INITIATIVE, CHANGE_PRESELECTIONS,
  GOVERNANCE_STATUSES, DQ_DIMENSIONS, DQ_AI_SUGGESTIONS, USE_CASE_MATRIX,
  STEP_TOOLTIPS, ELEMENT_EXPRESSIONS, FRIM_MAPPING_RATIONALES, PDM_MAPPING
} from './data.js';

// ============================================================
// Styles — Modernised
// ============================================================
const styles = {
  fontSerif: { fontFamily: 'Georgia, "Times New Roman", serif' },
  fontSans: { fontFamily: 'system-ui, -apple-system, sans-serif' },
  fontMono: { fontFamily: 'ui-monospace, "SF Mono", "Cascadia Code", monospace' },
  frimTerm: { fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', color: COLORS.darkGreen, borderLeft: `3px solid ${COLORS.green}`, paddingLeft: 8 },
  bldmBadge: { fontFamily: 'ui-monospace, monospace', fontSize: 12, background: 'rgba(168,190,181,0.2)', padding: '2px 8px', borderRadius: 4, color: COLORS.darkGrey },
  birdBadge: { fontFamily: 'ui-monospace, monospace', fontSize: 11, background: 'rgba(0,96,128,0.1)', padding: '2px 8px', borderRadius: 4, color: COLORS.petrol, border: `1px solid ${COLORS.petrol}30` },
  card: { background: '#fff', borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)', padding: 'clamp(14px, 3vw, 28px)', marginBottom: 16, transition: 'box-shadow 0.2s, transform 0.2s', boxSizing: 'border-box' },
  cardSmall: { background: '#fff', borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)', padding: 'clamp(12px, 2.5vw, 18px)', marginBottom: 12, transition: 'box-shadow 0.2s, transform 0.2s', boxSizing: 'border-box' },
  btnPrimary: { background: `linear-gradient(135deg, ${COLORS.green}, #00a876)`, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,144,103,0.25)' },
  btnSecondary: { background: '#fff', color: COLORS.darkGreen, border: `1px solid ${COLORS.lightGrey}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' },
  input: { border: `1px solid ${COLORS.lightGrey}80`, borderRadius: 8, padding: '10px 14px', fontSize: 14, width: '100%', outline: 'none', fontFamily: 'system-ui, sans-serif', color: COLORS.darkGreen, height: 40, boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s' },
  badge: (bg, color) => ({ background: bg, color, padding: '3px 12px', borderRadius: 16, fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }),
  th: { padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: COLORS.darkGrey, borderBottom: `2px solid ${COLORS.lightGrey}40`, position: 'sticky', top: 0, background: '#fff', zIndex: 1, fontFamily: 'system-ui, sans-serif', textTransform: 'uppercase', letterSpacing: 0.5 },
  td: { padding: '12px 14px', fontSize: 13, color: COLORS.darkGreen, borderBottom: `1px solid ${COLORS.lightGrey}18`, fontFamily: 'system-ui, sans-serif', verticalAlign: 'top' },
};

// ============================================================
// Responsive Hook
// ============================================================
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < breakpoint);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}

// Responsive style helpers — call with isMobile flag
const r = {
  card: (m) => ({ ...styles.card, padding: m ? 16 : 28 }),
  cardSmall: (m) => ({ ...styles.cardSmall, padding: m ? 12 : 18 }),
  grid: (m, cols, gap = 14) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : cols, gap }),
  grid2: (m, gap = 16) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap }),
  contentPad: (m) => m ? 12 : 32,
};

// ============================================================
// Export Utility
// ============================================================
function exportToExcel(data, sheetName, fileName) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
  XLSX.writeFile(wb, fileName);
}

// ============================================================
// Reusable Components: KpiCard, CreateItemModal
// ============================================================
function KpiCard({ label, value, color, active, onClick, suffix }) {
  return (
    <div onClick={onClick} style={{
      ...styles.cardSmall, textAlign: 'center', borderTop: `3px solid ${color}`,
      cursor: onClick ? 'pointer' : 'default',
      outline: active ? `2px solid ${color}` : 'none', outlineOffset: -2,
      transform: active ? 'translateY(-2px)' : 'none',
      boxShadow: active ? `0 4px 12px ${color}30` : undefined,
      transition: 'all 0.2s',
    }}>
      <div style={{ fontSize: 24, fontWeight: 700, color, ...styles.fontSerif }}>{value}{suffix}</div>
      <div style={{ fontSize: 11, color: COLORS.darkGrey, ...styles.fontSans }}>{label}</div>
    </div>
  );
}

function CreateItemModal({ title, fields, onSave, onClose }) {
  const [values, setValues] = useState({});
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 'clamp(16px, 4vw, 32px)', width: '92%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ ...styles.fontSerif, fontSize: 20, color: COLORS.darkGreen, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color={COLORS.mediumGrey} /></button>
        </div>
        <div style={{ display: 'grid', gap: 16 }}>
          {fields.map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 12, color: COLORS.mediumGrey, fontWeight: 600, display: 'block', marginBottom: 6 }}>{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea style={{ ...styles.input, minHeight: 80, height: 'auto', resize: 'vertical' }} value={values[f.key] || ''} onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder} />
              ) : f.type === 'select' ? (
                <select style={{ ...styles.input, cursor: 'pointer' }} value={values[f.key] || f.options?.[0] || ''} onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}>
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === 'toggle' ? (
                <div onClick={() => setValues(prev => ({ ...prev, [f.key]: !prev[f.key] }))} style={{ width: 42, height: 22, borderRadius: 11, cursor: 'pointer', background: values[f.key] ? COLORS.green : `${COLORS.lightGrey}60`, position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: values[f.key] ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              ) : (
                <input style={styles.input} value={values[f.key] || ''} onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder} />
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: `1px solid ${COLORS.lightGrey}30` }}>
          <button style={styles.btnSecondary} onClick={onClose}>Cancel</button>
          <button style={styles.btnPrimary} onClick={() => { onSave(values); onClose(); }}>Create</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Helper Components
// ============================================================
function MatchBadge({ match }) {
  if (match === 'exact') return <span style={styles.badge(`${COLORS.green}18`, COLORS.green)}>✅ Matched</span>;
  if (match === 'review') return <span style={styles.badge(`${COLORS.yellow}30`, '#92750a')}>🟡 Review</span>;
  if (match === 'new') return <span style={styles.badge(`${COLORS.red}18`, COLORS.red)}>🔴 New</span>;
  return null;
}

function CdeBadge({ cde }) {
  return cde
    ? <span style={styles.badge(`${COLORS.yellow}25`, '#92750a')}>🔶 CDE</span>
    : <span style={styles.badge(`${COLORS.mediumGrey}18`, COLORS.mediumGrey)}>⬜ Non-CDE</span>;
}

function DomainBadge({ domain }) {
  const colors = { Credits: COLORS.green, Consumer: COLORS.petrol, Markets: COLORS.blue };
  return <span style={styles.badge(`${colors[domain] || COLORS.mediumGrey}18`, colors[domain] || COLORS.mediumGrey)}>{domain}</span>;
}

function BirdAlignBadge({ align }) {
  if (!align) return <span style={{ color: COLORS.mediumGrey, fontSize: 12 }}>—</span>;
  if (align === 'aligned') return <span style={styles.badge(`${COLORS.green}15`, COLORS.green)}>✅ Aligned</span>;
  if (align === 'partial') return <span style={styles.badge(`${COLORS.yellow}25`, '#92750a')}>🟡 Partial</span>;
  if (align === 'notInBird') return <span style={styles.badge(`${COLORS.red}15`, COLORS.red)}>🔴 Not in BIRD</span>;
  return null;
}

function StatusDot({ status }) {
  const c = status === 'exact' ? COLORS.green : status === 'review' ? COLORS.yellow : COLORS.red;
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: c, marginRight: 6, flexShrink: 0 }} />;
}

function SectionHeader({ children, sub, tip }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <h2 style={{ ...styles.fontSerif, fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 700, color: COLORS.darkGreen, margin: 0, lineHeight: 1.3 }}>{children}</h2>
        {tip && <InfoTooltip text={tip} />}
      </div>
      {sub && <p style={{ ...styles.fontSans, fontSize: 'clamp(13px, 3.5vw, 15px)', color: COLORS.darkGrey, marginTop: 6, lineHeight: 1.6 }}>{sub}</p>}
    </div>
  );
}

function InfoTooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', cursor: 'pointer' }} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <Info size={14} color={COLORS.petrol} />
      {show && (
        <div style={{ position: 'absolute', bottom: 20, left: -100, width: 300, background: '#fff', border: `1px solid ${COLORS.lightGrey}`, borderRadius: 10, padding: 14, fontSize: 12, color: COLORS.darkGrey, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, lineHeight: 1.5, ...styles.fontSans }}>
          {text}
        </div>
      )}
    </span>
  );
}

function Checkbox({ checked, onChange, label, detail }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', padding: '6px 0', fontSize: 13, color: COLORS.darkGreen, ...styles.fontSans }}>
      <div style={{ width: 18, height: 18, borderRadius: 4, border: checked ? `2px solid ${COLORS.green}` : `2px solid ${COLORS.lightGrey}`, background: checked ? `${COLORS.green}15` : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.15s' }} onClick={(e) => { e.preventDefault(); onChange(!checked); }}>
        {checked && <Check size={12} color={COLORS.green} strokeWidth={3} />}
      </div>
      <div onClick={(e) => { e.preventDefault(); onChange(!checked); }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        {detail && <span style={{ color: COLORS.mediumGrey, fontSize: 12, marginLeft: 4 }}>{detail}</span>}
      </div>
    </label>
  );
}

function FrimCompliancePanel({ def, term }) {
  const startsWithNoun = /^[A-Z][a-z]/.test(def);
  const isBritish = !def.includes('organization') && !def.includes('recognize');
  const isSingular = true;
  const isSingleSentence = (def.match(/\./g) || []).length <= 1;
  const noRules = !def.includes('must') && !def.includes('shall') && !def.includes('required');
  const noCircular = !def.toLowerCase().includes(term.toLowerCase());

  const checks = [
    { label: 'Starts with noun', pass: startsWithNoun },
    { label: 'British English', pass: isBritish },
    { label: 'Singular form', pass: isSingular },
    { label: 'Single sentence', pass: isSingleSentence },
    { label: 'No technical/business rules', pass: noRules },
    { label: 'No circularity', pass: noCircular },
  ];

  return (
    <div style={{ background: `${COLORS.green}08`, border: `1px solid ${COLORS.green}30`, borderRadius: 10, padding: 16, marginTop: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.darkGreen, marginBottom: 8, ...styles.fontSans }}>FRIM Compliance Check</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {checks.map((c, i) => (
          <div key={i} style={{ fontSize: 12, color: c.pass ? COLORS.green : COLORS.red, display: 'flex', alignItems: 'center', gap: 4, ...styles.fontSans }}>
            {c.pass ? '✅' : '❌'} {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function DQPanel({ cde, domain, reqId, dimensions }) {
  const activeDims = dimensions || DQ_DIMENSIONS;
  const dimIcons = { Completeness: '📊', Accuracy: '🎯', Timeliness: '⏱️', Consistency: '🔗', Validity: '✓', Uniqueness: '🔑', Integrity: '🏛️' };
  const key = `${cde ? 'cde' : 'noncde'}_${(domain || 'credits').toLowerCase()}`;
  const aiSuggestions = DQ_AI_SUGGESTIONS[key] || DQ_AI_SUGGESTIONS.noncde_credits;

  const defaultVals = {};
  activeDims.forEach(d => { defaultVals[d] = cde
    ? (d === 'Completeness' ? '≥ 99.5%' : d === 'Accuracy' ? 'Reconcile GL ± 0.1%' : d === 'Timeliness' ? 'T+1' : d === 'Consistency' ? 'Cross-domain identical' : 'Domain rules apply')
    : (d === 'Completeness' ? '≥ 95%' : d === 'Accuracy' ? 'Reconcile GL ± 0.1%' : d === 'Timeliness' ? 'T+1' : d === 'Consistency' ? 'Cross-domain identical' : 'Domain rules apply'); });

  const [values, setValues] = useState(defaultVals);
  const [editing, setEditing] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [aiApplied, setAiApplied] = useState(false);
  const [showRationale, setShowRationale] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const applyAiSuggestion = () => {
    setAiLoading(true);
    setTimeout(() => {
      const newVals = {};
      activeDims.forEach(d => { newVals[d] = aiSuggestions[d]?.value || values[d]; });
      setValues(newVals);
      setAiApplied(true);
      setAiLoading(false);
    }, 800);
  };

  const startEdit = (dim) => {
    setEditing(dim);
    setEditVal(values[dim]);
  };

  const saveEdit = () => {
    if (editing && editVal.trim()) {
      setValues(prev => ({ ...prev, [editing]: editVal.trim() }));
      setEditing(null);
      setEditVal('');
    }
  };

  const cols = activeDims.length <= 5 ? `repeat(${activeDims.length}, 1fr)` : `repeat(${Math.min(activeDims.length, 6)}, 1fr)`;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: COLORS.mediumGrey, ...styles.fontSans }}>
          {aiApplied && <span style={styles.badge(`${COLORS.petrol}15`, COLORS.petrol)}>🤖 AI-suggested thresholds applied</span>}
        </div>
        <button
          onClick={applyAiSuggestion}
          disabled={aiLoading}
          style={{ ...styles.btnSecondary, padding: '4px 12px', fontSize: 11, gap: 4, background: aiLoading ? `${COLORS.lightGrey}30` : '#fff' }}
        >
          {aiLoading ? <span style={{ display: 'inline-flex', animation: 'spin 1s linear infinite' }}>⏳</span> : <Sparkles size={12} />}
          {aiLoading ? 'Analysing…' : 'AI Suggest DQ'}
        </button>
      </div>
      <div className="r-kpi" style={{ display: 'grid', gridTemplateColumns: cols, gap: 8 }}>
        {activeDims.map((d) => (
          <div key={d} style={{ background: aiApplied && aiSuggestions[d] ? `${COLORS.petrol}08` : `${COLORS.lightGrey}20`, borderRadius: 8, padding: 10, textAlign: 'center', border: aiApplied && aiSuggestions[d] ? `1px solid ${COLORS.petrol}20` : '1px solid transparent', position: 'relative', cursor: 'pointer', transition: 'all 0.15s' }}>
            <div style={{ fontSize: 16 }}>{dimIcons[d] || '📋'}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.darkGreen, marginTop: 2 }}>{d}</div>
            {editing === d ? (
              <div style={{ marginTop: 4 }}>
                <input
                  autoFocus
                  style={{ ...styles.input, height: 26, fontSize: 10, padding: '2px 6px', textAlign: 'center' }}
                  value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(null); }}
                  onBlur={saveEdit}
                />
              </div>
            ) : (
              <div
                onClick={() => startEdit(d)}
                style={{ fontSize: 11, color: COLORS.darkGrey, marginTop: 2, cursor: 'text', padding: '2px 4px', borderRadius: 4, border: `1px dashed transparent`, transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${COLORS.lightGrey}`}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                title="Click to edit threshold"
              >
                {values[d] || 'Set threshold'}
              </div>
            )}
            {aiApplied && aiSuggestions[d] && (
              <div
                onClick={(e) => { e.stopPropagation(); setShowRationale(showRationale === d ? null : d); }}
                style={{ position: 'absolute', top: 4, right: 4, cursor: 'pointer', fontSize: 10, color: COLORS.petrol }}
                title="View AI rationale"
              >
                <Info size={10} />
              </div>
            )}
            {showRationale === d && aiSuggestions[d] && (
              <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', width: 220, background: '#fff', border: `1px solid ${COLORS.lightGrey}`, borderRadius: 8, padding: 10, fontSize: 10, color: COLORS.darkGrey, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 50, textAlign: 'left', lineHeight: 1.5, marginBottom: 4 }}>
                <div style={{ fontWeight: 700, color: COLORS.petrol, marginBottom: 4 }}>🤖 AI Rationale</div>
                {aiSuggestions[d].rationale}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfidenceBadge({ confidence }) {
  if (confidence === 'high') return <span style={styles.badge(`${COLORS.green}15`, COLORS.green)}>High</span>;
  if (confidence === 'medium') return <span style={styles.badge(`${COLORS.yellow}25`, '#92750a')}>Medium</span>;
  return <span style={styles.badge(`${COLORS.red}15`, COLORS.red)}>Low</span>;
}

// --- RACI Ownership Bar ---
const STEP_RACI = {
  1: { responsible: 'Use Case Owner', accountable: 'Use Case Owner', reviewer: 'Grid Lead', phase: 'Intake' },
  2: { responsible: 'Use Case Owner', accountable: 'Use Case Owner', reviewer: 'Data Product Owner', phase: 'Intake' },
  3: { responsible: 'Requirements & Modelling Team', accountable: 'Data Product Owner', reviewer: 'FRIM Lexicon Expert', phase: 'Execution' },
  4: { responsible: 'Requirements & Modelling Team', accountable: 'Data Product Owner', reviewer: 'BLDM Modeller', phase: 'Execution' },
  5: { responsible: 'Requirements & Modelling Team', accountable: 'Data Product Owner', reviewer: 'Domain Data Steward', phase: 'Execution' },
  6: { responsible: 'Requirements & Modelling Team', accountable: 'Data Product Owner', reviewer: 'Domain Contact', phase: 'Execution' },
  7: { responsible: 'Requirements & Modelling Team', accountable: 'Data Product Owner', reviewer: 'Data Governance Lead', phase: 'Execution' },
  8: { responsible: 'Data Product Owner', accountable: 'Data Product Owner', reviewer: 'Grid Lead', phase: 'Handoff' },
};

function OwnershipBar({ step, editable, values, onChange }) {
  const raci = values || STEP_RACI[step] || STEP_RACI[1];
  const roles = [
    { key: 'responsible', label: 'Responsible', icon: <User size={12} />, bg: `${COLORS.green}08` },
    { key: 'accountable', label: 'Accountable', icon: <Shield size={12} />, bg: `${COLORS.petrol}06` },
    { key: 'reviewer', label: 'Reviewer', icon: <Eye size={12} />, bg: `${COLORS.yellow}08` },
  ];
  return (
    <div className="r-flex-col" style={{ display: 'flex', gap: 0, marginBottom: 20, borderRadius: 10, overflow: 'hidden', border: `1px solid ${COLORS.lightGrey}30`, fontSize: 12, boxSizing: 'border-box', maxWidth: '100%', ...styles.fontSans }}>
      {roles.map((r, i) => (
        <div key={r.key} style={{ flex: 1, padding: '10px 16px', background: r.bg, borderRight: i < 2 ? `1px solid ${COLORS.lightGrey}20` : 'none' }}>
          <div style={{ color: COLORS.mediumGrey, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>{r.label}</div>
          {editable ? (
            <input value={raci[r.key]} onChange={e => onChange({ ...raci, [r.key]: e.target.value })} style={{ border: 'none', borderBottom: `1px dashed ${COLORS.green}60`, background: 'transparent', color: COLORS.darkGreen, fontWeight: 600, fontSize: 12, fontFamily: 'system-ui, sans-serif', padding: '2px 0', width: '100%', outline: 'none' }} />
          ) : (
            <div style={{ color: COLORS.darkGreen, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>{r.icon} {raci[r.key]}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// --- Review / Sign-off Panel ---
function ReviewPanel({ step }) {
  const [status, setStatus] = useState('draft'); // draft | pending | approved | rejected
  const raci = STEP_RACI[step] || STEP_RACI[1];

  return (
    <div style={{ ...styles.card, marginTop: 20, border: status === 'approved' ? `1px solid ${COLORS.green}40` : status === 'rejected' ? `1px solid ${COLORS.red}40` : `1px solid ${COLORS.lightGrey}20`, background: status === 'approved' ? `${COLORS.green}04` : status === 'rejected' ? `${COLORS.red}04` : '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: status === 'approved' ? `${COLORS.green}15` : status === 'rejected' ? `${COLORS.red}15` : status === 'pending' ? `${COLORS.yellow}20` : `${COLORS.lightGrey}20` }}>
            {status === 'approved' ? <CheckCircle2 size={16} color={COLORS.green} /> : status === 'rejected' ? <X size={16} color={COLORS.red} /> : status === 'pending' ? <Clock size={16} color="#92750a" /> : <Circle size={16} color={COLORS.mediumGrey} />}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans }}>
              Step {step} Review — {status === 'draft' ? 'Not yet submitted' : status === 'pending' ? 'Pending review' : status === 'approved' ? 'Approved' : 'Rejected'}
            </div>
            <div style={{ fontSize: 11, color: COLORS.mediumGrey, marginTop: 2 }}>
              Reviewer: <strong>{raci.reviewer}</strong>
              {status === 'approved' && ' — Approved on 10 Feb 2026'}
              {status === 'rejected' && ' — Feedback: Please revise definition of new terms'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {status === 'draft' && (
            <button style={styles.btnPrimary} onClick={() => setStatus('pending')}>
              <Eye size={14} /> Request Review
            </button>
          )}
          {status === 'pending' && (
            <>
              <button style={{ ...styles.btnSecondary, borderColor: `${COLORS.red}40`, color: COLORS.red }} onClick={() => setStatus('rejected')}>
                <X size={14} /> Reject
              </button>
              <button style={styles.btnPrimary} onClick={() => setStatus('approved')}>
                <Check size={14} /> Approve
              </button>
            </>
          )}
          {(status === 'approved' || status === 'rejected') && (
            <button style={styles.btnSecondary} onClick={() => setStatus('draft')}>
              <ArrowRight size={14} /> Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- FRIM / BLDM Governance Workflow Panel ---
function GovernancePanel({ items, type, exportMode }) {
  // type = 'frim' or 'bldm', exportMode = true hides governance workflow and uses export buttons
  const [statuses, setStatuses] = useState(() => {
    const init = {};
    items.forEach(item => { init[item.id] = 'draft'; });
    return init;
  });
  const [expandedItem, setExpandedItem] = useState(null);
  const [submittingAll, setSubmittingAll] = useState(false);

  const govLabel = type === 'frim' ? 'FRIM Lexicon' : 'BLDM';
  const approver = type === 'frim' ? 'FRIM Lexicon Expert' : 'BLDM Modeller';

  const advanceStatus = (id) => {
    setStatuses(prev => {
      const curr = prev[id];
      const next = curr === 'draft' ? 'submitted' : curr === 'submitted' ? 'under_review' : curr === 'under_review' ? 'approved' : curr === 'approved' ? 'published' : curr;
      return { ...prev, [id]: next };
    });
  };

  const rejectItem = (id) => {
    setStatuses(prev => ({ ...prev, [id]: 'rejected' }));
  };

  const resetItem = (id) => {
    setStatuses(prev => ({ ...prev, [id]: 'draft' }));
  };

  const submitAll = () => {
    setSubmittingAll(true);
    setTimeout(() => {
      setStatuses(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(id => { if (updated[id] === 'draft') updated[id] = 'submitted'; });
        return updated;
      });
      setSubmittingAll(false);
    }, 600);
  };

  const counts = {};
  GOVERNANCE_STATUSES.forEach(s => { counts[s.id] = 0; });
  Object.values(statuses).forEach(s => { counts[s] = (counts[s] || 0) + 1; });

  if (items.length === 0) return null;

  return (
    <div style={{ ...styles.card, marginTop: 16, border: `1px solid ${COLORS.petrol}20`, background: `${COLORS.petrol}03` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans, display: 'flex', alignItems: 'center', gap: 8 }}>
            🏛️ {govLabel} Governance Queue
            <span style={styles.badge(`${COLORS.red}15`, COLORS.red)}>{items.length} new {type === 'frim' ? 'terms' : 'attributes'}</span>
          </div>
          <div style={{ fontSize: 12, color: COLORS.mediumGrey, marginTop: 4, ...styles.fontSans }}>
            New {type === 'frim' ? 'terms' : 'attributes'} require governance approval before being published to the {govLabel}. Approver: <strong>{approver}</strong>
          </div>
        </div>
        {exportMode ? (
          <button onClick={() => exportToExcel(items.map(it => ({ Term: it.frim || it.attr, Entity: it.entity, Definition: it.def, Domain: it.domain, CDE: it.cde ? 'Yes' : 'No' })), type === 'frim' ? 'New FRIM Terms' : 'New BLDM Attrs', `new_${type}_terms.xlsx`)} style={{ ...styles.btnPrimary, padding: '8px 18px', fontSize: 12 }}>
            <Download size={14} /> Export All ({items.length})
          </button>
        ) : (
          <button onClick={submitAll} disabled={submittingAll || counts.draft === 0} style={{ ...styles.btnPrimary, padding: '8px 18px', fontSize: 12, opacity: counts.draft === 0 ? 0.5 : 1 }}>
            {submittingAll ? '⏳ Submitting…' : `📤 Submit All (${counts.draft})`}
          </button>
        )}
      </div>

      {!exportMode && <>
        {/* Status summary pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {GOVERNANCE_STATUSES.map(gs => (
            counts[gs.id] > 0 && (
              <span key={gs.id} style={styles.badge(`${gs.color}15`, gs.color)}>
                {gs.icon} {gs.label}: {counts[gs.id]}
              </span>
            )
          ))}
        </div>

        {/* Progress pipeline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 20, padding: '12px 16px', background: '#fff', borderRadius: 10, border: `1px solid ${COLORS.lightGrey}20` }}>
          {GOVERNANCE_STATUSES.filter(s => s.id !== 'rejected').map((gs, i, arr) => (
            <React.Fragment key={gs.id}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 18 }}>{gs.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: gs.color, marginTop: 2 }}>{gs.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: gs.color, marginTop: 2 }}>{counts[gs.id]}</div>
              </div>
              {i < arr.length - 1 && <ArrowRight size={14} color={COLORS.lightGrey} />}
            </React.Fragment>
          ))}
        </div>
      </>}

      {/* Items table */}
      <div style={{ borderRadius: 10, overflow: 'hidden', overflowX: 'auto', border: `1px solid ${COLORS.lightGrey}20` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>{type === 'frim' ? 'FRIM Term' : 'BLDM Attribute'}</th>
              <th style={styles.th}>{type === 'frim' ? 'Definition' : 'Entity → Attribute'}</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const st = statuses[item.id];
              const gsObj = GOVERNANCE_STATUSES.find(g => g.id === st);
              return (
                <React.Fragment key={item.id}>
                  <tr style={{ transition: 'background 0.15s', background: expandedItem === item.id ? `${COLORS.petrol}06` : 'transparent' }}>
                    <td style={styles.td}>{idx + 1}</td>
                    <td style={styles.td}><span style={styles.frimTerm}>{item.frim}</span></td>
                    <td style={{ ...styles.td, fontSize: 12, color: COLORS.darkGrey, maxWidth: 300 }}>
                      {type === 'frim' ? (item.def?.substring(0, 80) + (item.def?.length > 80 ? '…' : '')) : <span style={styles.bldmBadge}>{item.entity} → {item.attr}</span>}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.badge(`${gsObj.color}15`, gsObj.color)}>{gsObj.icon} {gsObj.label}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {st === 'draft' && (
                          <button style={{ ...styles.btnSecondary, padding: '3px 10px', fontSize: 11 }} onClick={() => advanceStatus(item.id)}>📤 Submit</button>
                        )}
                        {st === 'submitted' && (
                          <button style={{ ...styles.btnSecondary, padding: '3px 10px', fontSize: 11, borderColor: `${COLORS.petrol}40`, color: COLORS.petrol }} onClick={() => advanceStatus(item.id)}>🔍 Start Review</button>
                        )}
                        {st === 'under_review' && (
                          <>
                            <button style={{ ...styles.btnPrimary, padding: '3px 10px', fontSize: 11 }} onClick={() => advanceStatus(item.id)}>✅ Approve</button>
                            <button style={{ ...styles.btnSecondary, padding: '3px 10px', fontSize: 11, color: COLORS.red, borderColor: `${COLORS.red}40` }} onClick={() => rejectItem(item.id)}>❌ Reject</button>
                          </>
                        )}
                        {st === 'approved' && (
                          <button style={{ ...styles.btnPrimary, padding: '3px 10px', fontSize: 11, background: COLORS.darkGreen }} onClick={() => advanceStatus(item.id)}>📚 Publish</button>
                        )}
                        {st === 'rejected' && (
                          <button style={{ ...styles.btnSecondary, padding: '3px 10px', fontSize: 11 }} onClick={() => resetItem(item.id)}>↩️ Revise</button>
                        )}
                        {st === 'published' && (
                          <span style={{ fontSize: 11, color: COLORS.green, fontWeight: 600 }}>✅ In {govLabel}</span>
                        )}
                        <button style={{ ...styles.btnSecondary, padding: '3px 8px', fontSize: 11 }} onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}>
                          {expandedItem === item.id ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedItem === item.id && (
                    <tr>
                      <td colSpan={5} style={{ padding: '0 16px 16px', background: `${COLORS.petrol}04` }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 8 }}>
                          <div style={{ background: '#fff', borderRadius: 10, padding: 14, border: `1px solid ${COLORS.lightGrey}30` }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.darkGreen, marginBottom: 6 }}>Full Definition</div>
                            <div style={{ ...styles.fontSerif, fontStyle: 'italic', fontSize: 13, color: COLORS.darkGreen, lineHeight: 1.6, padding: 10, background: `${COLORS.lightGrey}0a`, borderRadius: 8, borderLeft: `3px solid ${COLORS.green}` }}>
                              "{item.def}"
                            </div>
                            <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                              <span style={styles.bldmBadge}>Entity: {item.entity}</span>
                              <span style={styles.bldmBadge}>Attr: {item.attr}</span>
                              <DomainBadge domain={item.domain} />
                              <CdeBadge cde={item.cde} />
                            </div>
                          </div>
                          <div style={{ background: '#fff', borderRadius: 10, padding: 14, border: `1px solid ${COLORS.lightGrey}30` }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.darkGreen, marginBottom: 6 }}>Governance Audit Trail</div>
                            <div style={{ fontSize: 12, color: COLORS.darkGrey, lineHeight: 1.8 }}>
                              <div>📝 <strong>Created:</strong> 10 Feb 2026 by Use Case Owner</div>
                              {(st !== 'draft') && <div>📤 <strong>Submitted:</strong> 10 Feb 2026 at 14:30</div>}
                              {(st === 'under_review' || st === 'approved' || st === 'published') && <div>🔍 <strong>Review started:</strong> 11 Feb 2026 by {approver}</div>}
                              {(st === 'approved' || st === 'published') && <div>✅ <strong>Approved:</strong> 12 Feb 2026 by {approver}</div>}
                              {st === 'published' && <div>📚 <strong>Published:</strong> 13 Feb 2026 to {govLabel}</div>}
                              {st === 'rejected' && <div>❌ <strong>Rejected:</strong> 11 Feb 2026 — Feedback: Definition needs clarification</div>}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ABN AMRO Shield Icon — matches the official pentagon shield with yellow arrow
function AbnShield({ size = 40 }) {
  const h = size * 1.18;
  return (
    <svg width={size} height={h} viewBox="0 0 86 102" fill="none">
      <path d="M0 0H86V68.8L43 102L0 68.8V0Z" fill="#009067" />
      <path d="M22 34L22 68L56 51L22 34Z" fill="#F3C000" />
    </svg>
  );
}

// ABN AMRO Full Logo (shield + text, for login on white background)
function AbnFullLogo({ width = 240 }) {
  const h = width * 0.28;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: width * 0.05 }}>
      <AbnShield size={h * 0.75} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        <span style={{ fontSize: h * 0.58, fontWeight: 700, color: '#808183', fontFamily: 'Arial, Helvetica, sans-serif', letterSpacing: -1 }}>ABN</span>
        <span style={{ fontSize: h * 0.28, color: '#808183', margin: '0 3px', fontFamily: 'Arial, Helvetica, sans-serif', lineHeight: 1 }}>·</span>
        <span style={{ fontSize: h * 0.58, fontWeight: 700, color: '#808183', fontFamily: 'Arial, Helvetica, sans-serif', letterSpacing: -1 }}>AMRO</span>
      </div>
    </div>
  );
}

// ABN AMRO Sidebar Logo (white text only, no shield, for dark background)
function AbnSidebarLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: 'Arial, Helvetica, sans-serif', letterSpacing: -0.5 }}>ABN</span>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '0 4px', fontFamily: 'Arial, Helvetica, sans-serif' }}>·</span>
      <span style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: 'Arial, Helvetica, sans-serif', letterSpacing: -0.5 }}>AMRO</span>
    </div>
  );
}

// ============================================================
// Login Page
// ============================================================
function LoginPage({ onLogin }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pw === 'abn') { onLogin(); }
    else { setError(true); }
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${COLORS.darkGreen}, #003a3c)`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, boxSizing: 'border-box', ...styles.fontSans }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 16, padding: 'clamp(24px, 6vw, 44px)', width: '100%', maxWidth: 420, boxShadow: '0 12px 48px rgba(0,0,0,0.25)', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 36, fontWeight: 700, color: '#808183', fontFamily: 'Arial, Helvetica, sans-serif', letterSpacing: -1 }}>ABN</span>
          <span style={{ fontSize: 18, color: '#808183', margin: '0 5px', fontFamily: 'Arial, Helvetica, sans-serif' }}>·</span>
          <span style={{ fontSize: 36, fontWeight: 700, color: '#808183', fontFamily: 'Arial, Helvetica, sans-serif', letterSpacing: -1 }}>AMRO</span>
        </div>
        <div style={{ fontSize: 15, color: COLORS.darkGrey, marginBottom: 36, textAlign: 'center', lineHeight: 1.5 }}>F&R Data Requirements Intelligence</div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: COLORS.darkGrey, fontWeight: 600, display: 'block', marginBottom: 8 }}>Password</label>
          <input type="password" value={pw} onChange={e => { setPw(e.target.value); setError(false); }} placeholder="Enter password" style={{ ...styles.input, height: 44, borderColor: error ? COLORS.red : `${COLORS.lightGrey}80` }} autoFocus />
          {error && <div style={{ color: COLORS.red, fontSize: 12, marginTop: 8 }}>Invalid password</div>}
        </div>
        <button type="submit" style={{ ...styles.btnPrimary, width: '100%', justifyContent: 'center', padding: '14px 24px', fontSize: 15, borderRadius: 10 }}>
          <Lock size={16} /> Sign In
        </button>
      </form>
    </div>
  );
}

// ============================================================
// Sidebar — 8 Steps, SVG Logo, Modern Spacing
// ============================================================
function Sidebar({ activeStep, setActiveStep, selectedPersona, setSelectedPersona, selectedUC, setSelectedUC, isMobile, sidebarOpen, setSidebarOpen }) {
  const steps = [
    { n: 1, label: 'Use Case Intake', icon: <ClipboardList size={16} /> },
    { n: 2, label: 'Business Need & AI', icon: <Sparkles size={16} /> },
    { n: 3, label: 'FRIM Mapping', icon: <BookOpen size={16} /> },
    { n: 4, label: 'BLDM Mapping', icon: <Layers size={16} /> },
    { n: 5, label: 'DDS Availability', icon: <Database size={16} /> },
    { n: 6, label: 'Data Origination', icon: <GitBranch size={16} /> },
    { n: 7, label: 'Gap Analysis', icon: <BarChart3 size={16} /> },
    { n: 8, label: 'Handoff & Actions', icon: <ArrowRightLeft size={16} /> },
  ];

  const persona = PERSONAS.find(p => p.id === selectedPersona);
  const ucOptions = USE_CASE_LIST.filter(uc => uc.personaId === selectedPersona);

  const handleNav = (step) => {
    setActiveStep(step);
    if (isMobile) setSidebarOpen(false);
  };

  // On mobile: overlay sidebar; On desktop: fixed sidebar
  const sidebarStyle = isMobile
    ? { width: 280, background: `linear-gradient(180deg, ${COLORS.darkGreen}, #003a3c)`, color: '#fff', position: 'fixed', top: 0, left: sidebarOpen ? 0 : -280, bottom: 0, display: 'flex', flexDirection: 'column', zIndex: 200, transition: 'left 0.3s ease', ...styles.fontSans, boxShadow: sidebarOpen ? '4px 0 20px rgba(0,0,0,0.3)' : 'none' }
    : { width: 300, background: `linear-gradient(180deg, ${COLORS.darkGreen}, #003a3c)`, color: '#fff', position: 'fixed', top: 0, left: 0, bottom: 0, display: 'flex', flexDirection: 'column', zIndex: 50, ...styles.fontSans };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 199 }} />
      )}
      <div className={`r-sidebar${sidebarOpen ? ' open' : ''}`} style={sidebarStyle}>
        {/* Close button on mobile */}
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 12px 0' }}>
            <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 4 }}><X size={20} /></button>
          </div>
        )}
        <div style={{ padding: isMobile ? '8px 24px 16px' : '20px 24px 16px' }}>
          <AbnSidebarLogo />
          <div style={{ fontSize: 11, color: COLORS.lightGrey, marginTop: 6, textAlign: 'center', letterSpacing: 0.5 }}>Finance & Risk Data Domain</div>
        </div>

        <div style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
          {/* Portfolio View button */}
          <div onClick={() => handleNav(0)} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 12,
            background: activeStep === 0 ? `${COLORS.yellow}30` : `${COLORS.mediumGreen}30`,
            borderLeft: activeStep === 0 ? `3px solid ${COLORS.yellow}` : '3px solid transparent',
            transition: 'all 0.15s',
          }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: activeStep === 0 ? COLORS.yellow : `${COLORS.mediumGreen}60`, color: '#fff', flexShrink: 0 }}>
              <Eye size={14} />
            </div>
            <div style={{ fontSize: 13, fontWeight: activeStep === 0 ? 700 : 600, color: activeStep === 0 ? '#fff' : `${COLORS.lightGrey}dd` }}>Portfolio View</div>
          </div>

          <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.lightGrey, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, paddingLeft: 8 }}>Process Steps</div>
          {steps.map((s) => (
            <div key={s.n} onClick={() => handleNav(s.n)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 2, background: activeStep === s.n ? `${COLORS.green}30` : 'transparent', borderLeft: activeStep === s.n ? `3px solid ${COLORS.green}` : '3px solid transparent', transition: 'all 0.15s' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: activeStep === s.n ? COLORS.green : activeStep > s.n ? `${COLORS.green}60` : `${COLORS.mediumGreen}50`, color: '#fff', flexShrink: 0, transition: 'all 0.2s' }}>
                {activeStep > s.n ? <Check size={14} /> : s.n}
              </div>
              <div style={{ fontSize: 13, fontWeight: activeStep === s.n ? 700 : 400, color: activeStep === s.n ? '#fff' : `${COLORS.lightGrey}cc` }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px 16px', borderTop: `1px solid ${COLORS.mediumGreen}60` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.lightGrey, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Persona / Grid</div>
          {persona && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>{persona.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{persona.label}</span>
            </div>
          )}
          <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.lightGrey, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Use Case</div>
          <select value={selectedUC} onChange={e => setSelectedUC(Number(e.target.value))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${COLORS.mediumGreen}60`, background: `${COLORS.mediumGreen}80`, color: '#fff', fontSize: 12, cursor: 'pointer', outline: 'none' }}>
            {ucOptions.map(uc => <option key={uc.id} value={uc.id}>{uc.icon} {uc.label}</option>)}
          </select>
        </div>
      </div>
    </>
  );
}

// ============================================================
// Top Bar
// ============================================================
function TopBar({ personaLabel, ucLabel, isMobile, onMenuToggle }) {
  return (
    <div style={{ background: '#fff', borderBottom: `1px solid ${COLORS.lightGrey}20`, padding: isMobile ? '10px 14px' : '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...styles.fontSans, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', gap: 8, position: 'sticky', top: 0, zIndex: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {isMobile && (
          <button onClick={onMenuToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', flexShrink: 0, marginLeft: -4 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.darkGreen} strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        )}
        <h1 style={{ ...styles.fontSerif, fontSize: isMobile ? 15 : 18, color: COLORS.darkGreen, margin: 0, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isMobile ? 'F&R Intelligence' : 'F&R Data Requirements Intelligence'}</h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 10, fontSize: isMobile ? 10 : 13, color: COLORS.darkGrey, flexShrink: 1, minWidth: 0, overflow: 'hidden' }}>
        <User size={isMobile ? 13 : 16} color={COLORS.mediumGrey} style={{ flexShrink: 0 }} />
        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{personaLabel}</span>
        {!isMobile && ucLabel && <><span style={{ color: COLORS.lightGrey }}>›</span><span>{ucLabel}</span></>}
      </div>
    </div>
  );
}

// ============================================================
// Step 1 — Use Case Intake (with Entity Scope)
// ============================================================
function Step1({ selectedPersona, setSelectedPersona, selectedUC, setSelectedUC, onNext, selectedRegs, setSelectedRegs, selectedPolicies, setSelectedPolicies, selectedRefs, setSelectedRefs, selectedEntities, setSelectedEntities }) {
  const uc = USE_CASES[selectedUC];
  const ucOptions = USE_CASE_LIST.filter(u => u.personaId === selectedPersona);
  const [showAddUC, setShowAddUC] = useState(false);
  const [newUC, setNewUC] = useState({ name: '', driver: '', description: '', frequency: 'Quarterly', priority: 'Medium' });
  const [raciValues, setRaciValues] = useState({ responsible: STEP_RACI[1].responsible, accountable: STEP_RACI[1].accountable, reviewer: STEP_RACI[1].reviewer });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = React.useRef(null);
  const changePre = CHANGE_PRESELECTIONS[selectedUC] || CHANGE_PRESELECTIONS[1];
  const [selSaga, setSelSaga] = useState(changePre.saga);
  const [selEpisode, setSelEpisode] = useState(changePre.episode);
  const [selEpic, setSelEpic] = useState(changePre.epic);
  const saga = CHANGE_INITIATIVE.sagas.find(s => s.id === selSaga);
  const episodes = saga ? saga.episodes : [];
  const episode = episodes.find(e => e.id === selEpisode);
  const epics = episode ? episode.epics : [];

  return (
    <div>
      <SectionHeader sub="Register your data need. Select your grid (persona), use case, entity scope, and applicable regulatory and policy context." tip={STEP_TOOLTIPS[1].main}>
        Step 1 — Use Case Registration
      </SectionHeader>
      <OwnershipBar step={1} editable values={raciValues} onChange={setRaciValues} />

      {/* Persona / Grid Selection */}
      <div style={{ ...styles.card }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans }}>Select Persona / Grid</span>
          <InfoTooltip text="A Persona represents your organisational grid or team (e.g. Financial Risk Grid, Reporting Grid). Select the grid you belong to — this determines which use cases are available." />
        </div>
        <div className="r-kpi" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {PERSONAS.map(p => {
            const sel = selectedPersona === p.id;
            const ucCount = USE_CASE_LIST.filter(u => u.personaId === p.id).length;
            return (
              <div key={p.id} onClick={() => setSelectedPersona(p.id)} style={{
                padding: '20px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                border: sel ? `2.5px solid ${p.color}` : `1px solid ${COLORS.lightGrey}40`,
                background: sel ? `${p.color}08` : '#fff',
                transition: 'all 0.2s',
                transform: sel ? 'translateY(-2px)' : 'none',
                boxShadow: sel ? `0 4px 16px ${p.color}25` : 'none',
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{p.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans, marginBottom: 4 }}>{p.label}</div>
                <div style={{ fontSize: 11, color: COLORS.mediumGrey, ...styles.fontSans }}>{ucCount} use case{ucCount !== 1 ? 's' : ''}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Use Case Selection within Grid */}
      <div style={{ ...styles.card }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Zap size={18} color={COLORS.green} />
          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans }}>Select Use Case</span>
          <span style={{ fontSize: 12, color: COLORS.mediumGrey }}>— within {PERSONAS.find(p => p.id === selectedPersona)?.label}</span>
          <InfoTooltip text="Choose an existing use case or create a new one. Each use case represents a specific data need (e.g. a regulatory calculation, a report, or a model) within your grid." />
        </div>
        <div className="r-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(ucOptions.length + 1, 3)}, 1fr)`, gap: 12 }}>
          {ucOptions.map(u => {
            const sel = selectedUC === u.id;
            return (
              <div key={u.id} onClick={() => setSelectedUC(u.id)} style={{
                padding: '16px 14px', borderRadius: 12, cursor: 'pointer',
                border: sel ? `2px solid ${COLORS.green}` : `1px solid ${COLORS.lightGrey}40`,
                background: sel ? `${COLORS.green}08` : '#fff',
                transition: 'all 0.2s',
                transform: sel ? 'translateY(-1px)' : 'none',
                boxShadow: sel ? '0 4px 12px rgba(0,144,103,0.15)' : 'none',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ fontSize: 26, flexShrink: 0 }}>{u.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.darkGreen, ...styles.fontSans }}>{u.label}</div>
                  <div style={{ fontSize: 11, color: COLORS.mediumGrey, marginTop: 2, ...styles.fontSans }}>{u.short}</div>
                </div>
                {sel && <Check size={16} color={COLORS.green} style={{ marginLeft: 'auto', flexShrink: 0 }} />}
              </div>
            );
          })}
          {/* Add Use Case Card */}
          <div onClick={() => setShowAddUC(true)} style={{
            padding: '16px 14px', borderRadius: 12, cursor: 'pointer',
            border: `2px dashed ${COLORS.lightGrey}80`,
            background: `${COLORS.lightGrey}08`,
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            minHeight: 72,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${COLORS.green}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 22, color: COLORS.green, fontWeight: 300, lineHeight: 1 }}>+</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.green, ...styles.fontSans }}>Add Use Case</div>
              <div style={{ fontSize: 11, color: COLORS.mediumGrey, marginTop: 2 }}>Create a new data request</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Use Case Modal */}
      {showAddUC && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAddUC(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 'clamp(16px, 4vw, 32px)', width: '92%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ ...styles.fontSerif, fontSize: 20, color: COLORS.darkGreen, margin: 0 }}>New Use Case — {PERSONAS.find(p => p.id === selectedPersona)?.label}</h3>
              <button onClick={() => setShowAddUC(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={20} color={COLORS.mediumGrey} /></button>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: COLORS.mediumGrey, fontWeight: 600, display: 'block', marginBottom: 6 }}>Use Case Name *</label>
                <input style={styles.input} placeholder="e.g. Market Risk VaR Calculation" value={newUC.name} onChange={e => setNewUC({ ...newUC, name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: COLORS.mediumGrey, fontWeight: 600, display: 'block', marginBottom: 6 }}>Regulatory Driver *</label>
                <input style={styles.input} placeholder="e.g. CRR2 / FRTB" value={newUC.driver} onChange={e => setNewUC({ ...newUC, driver: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: COLORS.mediumGrey, fontWeight: 600, display: 'block', marginBottom: 6 }}>Description *</label>
                <textarea style={{ ...styles.input, minHeight: 90, resize: 'vertical', height: 'auto' }} placeholder="Describe the data need, what calculation or report it supports, and which data elements are required..." value={newUC.description} onChange={e => setNewUC({ ...newUC, description: e.target.value })} />
              </div>
              <div className="r-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: COLORS.mediumGrey, fontWeight: 600, display: 'block', marginBottom: 6 }}>Frequency</label>
                  <select style={{ ...styles.input, cursor: 'pointer' }} value={newUC.frequency} onChange={e => setNewUC({ ...newUC, frequency: e.target.value })}>
                    <option>Daily</option><option>Weekly</option><option>Monthly</option><option>Quarterly</option><option>Annual</option><option>Ad-hoc</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: COLORS.mediumGrey, fontWeight: 600, display: 'block', marginBottom: 6 }}>Priority</label>
                  <select style={{ ...styles.input, cursor: 'pointer' }} value={newUC.priority} onChange={e => setNewUC({ ...newUC, priority: e.target.value })}>
                    <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: `1px solid ${COLORS.lightGrey}30` }}>
              <button style={styles.btnSecondary} onClick={() => setShowAddUC(false)}>Cancel</button>
              <button style={{ ...styles.btnPrimary, opacity: newUC.name && newUC.driver ? 1 : 0.5 }} onClick={() => { if (newUC.name && newUC.driver) { setShowAddUC(false); setNewUC({ name: '', driver: '', description: '', frequency: 'Quarterly', priority: 'Medium' }); } }}>
                <Sparkles size={14} /> Create Use Case
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Use Case Details */}
      <div style={{ ...styles.card }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans }}>Use Case Details</span>
          <InfoTooltip text="These details are pre-populated based on the selected use case. They define the scope, frequency, priority, and regulatory deadline for this data request." />
        </div>
        <div className="r-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: COLORS.mediumGrey, fontWeight: 600, display: 'block', marginBottom: 6 }}>Use Case Name</label>
            <input style={styles.input} value={uc.name} readOnly />
          </div>
          <div>
            <label style={{ fontSize: 12, color: COLORS.mediumGrey, fontWeight: 600, display: 'block', marginBottom: 6 }}>Regulatory Driver</label>
            <input style={styles.input} value={uc.driver} readOnly />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 12, color: COLORS.mediumGrey, fontWeight: 600, display: 'block', marginBottom: 6 }}>Description</label>
            <textarea style={{ ...styles.input, minHeight: 70, resize: 'vertical', height: 'auto' }} value={uc.description} readOnly />
          </div>
          <div>
            <label style={{ fontSize: 12, color: COLORS.mediumGrey, fontWeight: 600, display: 'block', marginBottom: 6 }}>Reporting Frequency</label>
            <input style={styles.input} value={uc.frequency} readOnly />
          </div>
          <div>
            <label style={{ fontSize: 12, color: COLORS.mediumGrey, fontWeight: 600, display: 'block', marginBottom: 6 }}>Priority</label>
            <input style={styles.input} value={uc.priority} readOnly />
          </div>
          <div>
            <label style={{ fontSize: 12, color: COLORS.mediumGrey, fontWeight: 600, display: 'block', marginBottom: 6 }}>Regulatory Deadline</label>
            <input style={styles.input} value={uc.deadline} readOnly />
          </div>
          <div>
            <label style={{ fontSize: 12, color: COLORS.mediumGrey, fontWeight: 600, display: 'block', marginBottom: 6 }}>Target Report / Calculation</label>
            <input style={styles.input} value={uc.target} readOnly />
          </div>
        </div>
      </div>

      {/* Change Initiative Hierarchy */}
      <div style={{ ...styles.card }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <GitBranch size={18} color={COLORS.petrol} />
          <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans }}>Change Initiative — Compass</span>
          <InfoTooltip text="Link this use case to the change initiative hierarchy. This ensures traceability from data requirements back to the strategic programme (Compass), saga, episode, and epic." />
        </div>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: `${COLORS.petrol}06`, borderRadius: 10, marginBottom: 16, fontSize: 12, color: COLORS.darkGrey, ...styles.fontSans, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, color: COLORS.petrol }}>🧭 Compass</span>
          <ChevronRight size={12} color={COLORS.lightGrey} />
          <span style={{ fontWeight: 600 }}>{saga?.label || '—'}</span>
          <ChevronRight size={12} color={COLORS.lightGrey} />
          <span>{episode?.label || '—'}</span>
          <ChevronRight size={12} color={COLORS.lightGrey} />
          <span style={{ color: COLORS.green, fontWeight: 600 }}>{epics.find(e => e.id === selEpic)?.label || '—'}</span>
        </div>

        <div className="r-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: COLORS.mediumGrey, fontWeight: 600, display: 'block', marginBottom: 6 }}>Saga</label>
            <select style={{ ...styles.input, cursor: 'pointer' }} value={selSaga} onChange={e => {
              const sid = e.target.value;
              setSelSaga(sid);
              const s = CHANGE_INITIATIVE.sagas.find(x => x.id === sid);
              if (s && s.episodes.length > 0) { setSelEpisode(s.episodes[0].id); if (s.episodes[0].epics.length > 0) setSelEpic(s.episodes[0].epics[0].id); else setSelEpic(''); } else { setSelEpisode(''); setSelEpic(''); }
            }}>
              {CHANGE_INITIATIVE.sagas.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: COLORS.mediumGrey, fontWeight: 600, display: 'block', marginBottom: 6 }}>Episode</label>
            <select style={{ ...styles.input, cursor: 'pointer' }} value={selEpisode} onChange={e => {
              const eid = e.target.value;
              setSelEpisode(eid);
              const ep = episodes.find(x => x.id === eid);
              if (ep && ep.epics.length > 0) setSelEpic(ep.epics[0].id); else setSelEpic('');
            }}>
              {episodes.map(ep => <option key={ep.id} value={ep.id}>{ep.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: COLORS.mediumGrey, fontWeight: 600, display: 'block', marginBottom: 6 }}>Epic</label>
            <select style={{ ...styles.input, cursor: 'pointer' }} value={selEpic} onChange={e => setSelEpic(e.target.value)}>
              {epics.map(ep => <option key={ep.id} value={ep.id}>{ep.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Entity Scope */}
      <div style={{ ...styles.card }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Building2 size={18} color={COLORS.green} />
          <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans }}>Entity Scope — Select applicable legal entities</span>
          <InfoTooltip text="Select the legal entities for which this data request applies. The entity scope determines DDS data availability and sourcing requirements per entity." />
        </div>
        <div className="r-kpi" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {LEGAL_ENTITIES.map(le => {
            const sel = selectedEntities.includes(le.id);
            return (
              <div key={le.id} onClick={() => setSelectedEntities(prev => prev.includes(le.id) ? prev.filter(x => x !== le.id) : [...prev, le.id])} style={{
                padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                border: sel ? `2px solid ${COLORS.green}` : `1px solid ${COLORS.lightGrey}40`,
                background: sel ? `${COLORS.green}06` : '#fff',
                transition: 'all 0.2s',
                transform: sel ? 'translateY(-1px)' : 'none',
                boxShadow: sel ? '0 2px 8px rgba(0,144,103,0.12)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 20 }}>{le.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGreen }}>{le.label}</span>
                  {sel && <Check size={14} color={COLORS.green} style={{ marginLeft: 'auto' }} />}
                </div>
                <div style={{ fontSize: 11, color: COLORS.mediumGrey, lineHeight: 1.4 }}>{le.full}</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: COLORS.mediumGrey, ...styles.fontSans }}>
          {selectedEntities.length} of {LEGAL_ENTITIES.length} entities selected
        </div>
      </div>

      {/* Knowledge Scope */}
      <div style={{ ...styles.card }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 16 }}>📚</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans }}>Knowledge Scope — Select applicable context</span>
          <InfoTooltip text="The selected regulations and policies determine which documents the system uses to derive data requirements, generate FRIM-compliant definitions, and establish regulatory traceability." />
        </div>

        <div className="r-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div style={{ background: `${COLORS.lightGrey}10`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.darkGreen, marginBottom: 8, display: 'flex', justifyContent: 'space-between', ...styles.fontSans }}>
              <span>Regulations & Frameworks</span>
              <span style={{ color: COLORS.mediumGrey, fontWeight: 400 }}>{selectedRegs.length} of {REGULATIONS.length}</span>
            </div>
            {REGULATIONS.map(r => (
              <Checkbox key={r.id} checked={selectedRegs.includes(r.id)} onChange={() => {
                setSelectedRegs(prev => prev.includes(r.id) ? prev.filter(x => x !== r.id) : [...prev, r.id]);
              }} label={r.label} detail={r.detail} />
            ))}
          </div>

          <div style={{ background: `${COLORS.lightGrey}10`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.darkGreen, marginBottom: 8, display: 'flex', justifyContent: 'space-between', ...styles.fontSans }}>
              <span>Internal Policies</span>
              <span style={{ color: COLORS.mediumGrey, fontWeight: 400 }}>{selectedPolicies.length} of {POLICIES.length}</span>
            </div>
            {POLICIES.map(p => (
              <Checkbox key={p.id} checked={selectedPolicies.includes(p.id)} onChange={() => {
                setSelectedPolicies(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id]);
              }} label={p.label} detail={p.detail} />
            ))}
          </div>

          <div style={{ background: `${COLORS.lightGrey}10`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.darkGreen, marginBottom: 8, display: 'flex', justifyContent: 'space-between', ...styles.fontSans }}>
              <span>Reference Models & Standards</span>
              <span style={{ color: COLORS.mediumGrey, fontWeight: 400 }}>{selectedRefs.length} of {REF_MODELS.length}</span>
            </div>
            {REF_MODELS.map(r => (
              <Checkbox key={r.id} checked={selectedRefs.includes(r.id)} onChange={() => {
                setSelectedRefs(prev => prev.includes(r.id) ? prev.filter(x => x !== r.id) : [...prev, r.id]);
              }} label={r.label} detail={r.detail} />
            ))}
          </div>
        </div>

        {/* File Upload for Additional Guidance */}
        <div style={{ marginTop: 16, border: `2px dashed ${COLORS.lightGrey}80`, borderRadius: 12, padding: 20, textAlign: 'center', background: `${COLORS.lightGrey}06`, cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.xlsx,.csv" style={{ display: 'none' }} onChange={e => { const files = Array.from(e.target.files || []); setUploadedFiles(prev => [...prev, ...files.map(f => ({ name: f.name, size: (f.size / 1024).toFixed(1) + ' KB' }))]); e.target.value = ''; }} />
          <Upload size={24} color={COLORS.mediumGrey} />
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.darkGreen, marginTop: 6 }}>Upload Additional Regulatory Guidance</div>
          <div style={{ fontSize: 11, color: COLORS.mediumGrey, marginTop: 4 }}>PDF, DOCX, XLSX — accessible to all team members</div>
        </div>
        {uploadedFiles.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {uploadedFiles.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: `${COLORS.green}06`, borderRadius: 8, marginTop: 4, border: `1px solid ${COLORS.green}20` }}>
                <FileText size={14} color={COLORS.green} />
                <span style={{ fontSize: 12, color: COLORS.darkGreen, fontWeight: 600 }}>{f.name}</span>
                <span style={{ fontSize: 11, color: COLORS.mediumGrey, marginLeft: 'auto' }}>{f.size}</span>
                <button onClick={(e) => { e.stopPropagation(); setUploadedFiles(prev => prev.filter((_, j) => j !== i)); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><X size={12} color={COLORS.mediumGrey} /></button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 16, padding: 12, background: `${COLORS.green}06`, borderRadius: 10, fontSize: 12, color: COLORS.darkGrey, ...styles.fontSans }}>
          📎 <strong>Context:</strong>{' '}
          {selectedRegs.map(id => REGULATIONS.find(r => r.id === id)?.label).join(', ')}
          {selectedPolicies.length > 0 && <> + {selectedPolicies.map(id => POLICIES.find(p => p.id === id)?.label).join(', ')}</>}
          {selectedRefs.length > 0 && <> + {selectedRefs.map(id => REF_MODELS.find(r => r.id === id)?.label).join(', ')}</>}
        </div>
      </div>

      <ReviewPanel step={1} />

      <div className="r-btn-row" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
        <button style={{ ...styles.btnSecondary, display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => exportToExcel([{ 'Use Case': uc.name, 'Driver': uc.driver, 'Frequency': uc.frequency, 'Priority': uc.priority, 'Deadline': uc.deadline, 'Target Report': uc.target, 'Entities': selectedEntities.join(', '), 'Regulations': selectedRegs.join(', ') }], 'UC Intake', `step1_intake.xlsx`)}>
          <Download size={14} /> Export to Excel
        </button>
        <button style={styles.btnPrimary} onClick={onNext}>
          Register Use Case <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Step 2 — Business Need & Data Requirements
// ============================================================
function Step2BusinessNeed({ selectedUC, onNext }) {
  const [businessNeed, setBusinessNeed] = useState(BUSINESS_NEED_EXAMPLES[selectedUC] || '');
  const [showImport, setShowImport] = useState(false);
  const [aiPhase, setAiPhase] = useState(0); // 0=idle, 1-3=processing, 4=done
  const [showDerived, setShowDerived] = useState(false);
  const [checkedReqs, setCheckedReqs] = useState({});
  const derived = DERIVED_REQUIREMENTS[selectedUC] || [];

  // --- New state for user-added requirements, inline editing, modal, CDE flags ---
  const [userReqs, setUserReqs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showAddReq, setShowAddReq] = useState(false);
  const [cdeFlags, setCdeFlags] = useState({});

  const allReqs = [...derived, ...userReqs];

  const startAI = () => {
    setAiPhase(1);
    setTimeout(() => setAiPhase(2), 1200);
    setTimeout(() => setAiPhase(3), 2400);
    setTimeout(() => { setAiPhase(4); setShowDerived(true); const all = {}; derived.forEach(d => { all[d.id] = true; }); setCheckedReqs(all); }, 3600);
  };

  const phases = [
    { label: 'Analysing business context...', icon: '📖' },
    { label: 'Extracting data elements...', icon: '🔍' },
    { label: 'Generating definitions...', icon: '✍️' },
  ];

  const selectedCount = Object.values(checkedReqs).filter(Boolean).length;

  // --- Inline editing helpers ---
  const [editElement, setEditElement] = useState('');
  const [editDef, setEditDef] = useState('');

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditElement(item.element);
    setEditDef(item.def);
  };

  const saveEditing = (item) => {
    if (item._isUser) {
      setUserReqs(prev => prev.map(r => r.id === item.id ? { ...r, element: editElement, def: editDef } : r));
    }
    // For derived items we allow inline edit by storing overrides
    // We'll mutate derived display via a local override map
    setEditingId(null);
  };

  // Override map for editing derived items inline
  const [derivedOverrides, setDerivedOverrides] = useState({});

  const saveDerivedEditing = (item) => {
    setDerivedOverrides(prev => ({ ...prev, [item.id]: { element: editElement, def: editDef } }));
    setEditingId(null);
  };

  const getDisplayElement = (item) => derivedOverrides[item.id]?.element || item.element;
  const getDisplayDef = (item) => derivedOverrides[item.id]?.def || item.def;

  // --- Add requirement handler ---
  const handleAddReq = (values) => {
    const nextId = allReqs.length > 0 ? Math.max(...allReqs.map(r => r.id)) + 1 : 1;
    const newReq = {
      id: nextId,
      element: values.element || 'New Requirement',
      def: values.definition || '',
      category: values.category || 'Exposure',
      confidence: 'high',
      _isUser: true,
    };
    setUserReqs(prev => [...prev, newReq]);
    setCheckedReqs(prev => ({ ...prev, [nextId]: true }));
    if (values.cde) {
      setCdeFlags(prev => ({ ...prev, [nextId]: true }));
    }
  };

  // --- Delete user requirement ---
  const deleteUserReq = (id) => {
    setUserReqs(prev => prev.filter(r => r.id !== id));
    setCheckedReqs(prev => { const next = { ...prev }; delete next[id]; return next; });
    setCdeFlags(prev => { const next = { ...prev }; delete next[id]; return next; });
  };

  // --- Export handler ---
  const handleExport = () => {
    const exportData = allReqs.filter(r => checkedReqs[r.id]).map(r => ({
      'ID': r.id,
      'Data Element': r._isUser ? r.element : getDisplayElement(r),
      'Definition': r._isUser ? r.def : getDisplayDef(r),
      'Category': r.category,
      'CDE': cdeFlags[r.id] ? 'Yes' : 'No',
      'Source': r._isUser ? 'User-added' : 'AI-derived',
    }));
    exportToExcel(exportData, 'Requirements', 'step2_requirements.xlsx');
  };

  // --- AI Suggest DQ for All ---
  const [dqSuggestAll, setDqSuggestAll] = useState(false);

  // --- DQ Dimensions management ---
  const [dqDimensions, setDqDimensions] = useState([...DQ_DIMENSIONS]);
  const [showAddDim, setShowAddDim] = useState(false);
  const [newDimName, setNewDimName] = useState('');
  const [editingDim, setEditingDim] = useState(null);
  const [editDimName, setEditDimName] = useState('');

  const addDimension = () => {
    if (newDimName.trim() && !dqDimensions.includes(newDimName.trim())) {
      setDqDimensions(prev => [...prev, newDimName.trim()]);
      setNewDimName('');
      setShowAddDim(false);
    }
  };

  const removeDimension = (dim) => {
    setDqDimensions(prev => prev.filter(d => d !== dim));
  };

  const renameDimension = (oldName) => {
    if (editDimName.trim() && editDimName.trim() !== oldName) {
      setDqDimensions(prev => prev.map(d => d === oldName ? editDimName.trim() : d));
    }
    setEditingDim(null);
    setEditDimName('');
  };

  // --- Checked derived items for DQ section ---
  const checkedItems = allReqs.filter(r => checkedReqs[r.id]);

  return (
    <div>
      <SectionHeader sub="Describe your data need in business terms or import existing requirements. AI will derive structured data requirements with definitions." tip={STEP_TOOLTIPS[2].main}>
        Step 2 — Business Need & Data Requirements
      </SectionHeader>
      <OwnershipBar step={2} />

      {/* Section A: Describe Need */}
      <div style={{ ...styles.card }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <FileText size={18} color={COLORS.green} />
          <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans }}>Describe Your Data Need</span>
        </div>
        <p style={{ fontSize: 13, color: COLORS.mediumGrey, marginBottom: 12, lineHeight: 1.5, ...styles.fontSans }}>
          Express what data you need in your own words. The AI will analyse your description and derive structured data requirements.
        </p>
        <textarea
          value={businessNeed}
          onChange={e => setBusinessNeed(e.target.value)}
          style={{ ...styles.input, height: 'auto', minHeight: 160, resize: 'vertical', lineHeight: 1.6, fontSize: 14 }}
          placeholder="Describe the data you need for your use case..."
        />
      </div>

      {/* Section B: Import */}
      <div style={{ ...styles.card }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Upload size={18} color={COLORS.petrol} />
            <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans }}>Import Existing Requirements</span>
            <span style={styles.badge(`${COLORS.petrol}15`, COLORS.petrol)}>Optional</span>
          </div>
          <span style={styles.badge(`${COLORS.lightGrey}30`, COLORS.darkGrey)}>Supports .csv, .xlsx</span>
        </div>

        {!showImport ? (
          <div onClick={() => setShowImport(true)} style={{
            border: `2px dashed ${COLORS.lightGrey}80`, borderRadius: 12, padding: '32px 24px',
            textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: `${COLORS.lightGrey}06`,
          }}>
            <Upload size={32} color={COLORS.mediumGrey} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.darkGreen, ...styles.fontSans }}>Drop file here or click to browse</div>
            <div style={{ fontSize: 12, color: COLORS.mediumGrey, marginTop: 4, ...styles.fontSans }}>Import a requirements list to supplement or replace the free-text description</div>
          </div>
        ) : (
          <div>
            <div style={{ padding: 12, background: `${COLORS.green}06`, borderRadius: 10, border: `1px solid ${COLORS.green}20`, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} color={COLORS.green} />
              <span style={{ fontSize: 13, color: COLORS.green, fontWeight: 600 }}>requirements_import.xlsx</span>
              <span style={{ fontSize: 12, color: COLORS.mediumGrey, marginLeft: 'auto' }}>6 rows imported</span>
            </div>
            <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${COLORS.lightGrey}30` }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, background: `${COLORS.lightGrey}08` }}>#</th>
                    <th style={{ ...styles.th, background: `${COLORS.lightGrey}08` }}>Data Element</th>
                    <th style={{ ...styles.th, background: `${COLORS.lightGrey}08` }}>Description</th>
                    <th style={{ ...styles.th, background: `${COLORS.lightGrey}08` }}>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { el: 'Exposure Amount', desc: 'Original credit exposure', src: 'Regulator template' },
                    { el: 'Counterparty Type', desc: 'Regulatory classification', src: 'CRR2 Art. 112' },
                    { el: 'Risk Weight', desc: 'SA-CR risk weight', src: 'CRR2 Art. 114-134' },
                    { el: 'Collateral Value', desc: 'Eligible collateral', src: 'Internal policy' },
                    { el: 'Default Indicator', desc: 'Default status flag', src: 'CRR2 Art. 178' },
                    { el: 'Maturity Date', desc: 'Contractual maturity', src: 'CRR2 Art. 162' },
                  ].map((r, i) => (
                    <tr key={i} style={{ transition: 'background 0.1s' }}>
                      <td style={styles.td}>{i + 1}</td>
                      <td style={{ ...styles.td, fontWeight: 600 }}>{r.el}</td>
                      <td style={{ ...styles.td, color: COLORS.mediumGrey }}>{r.desc}</td>
                      <td style={{ ...styles.td, fontSize: 12, color: COLORS.mediumGrey }}>{r.src}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Section C: AI Processing */}
      {aiPhase === 0 && (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <button style={{ ...styles.btnPrimary, padding: '14px 32px', fontSize: 15 }} onClick={startAI}>
            <Sparkles size={18} /> Derive Data Requirements
          </button>
        </div>
      )}

      {aiPhase > 0 && aiPhase < 4 && (
        <div style={{ ...styles.card, textAlign: 'center', padding: '36px 28px' }}>
          <div style={{ marginBottom: 20 }}>
            <Sparkles size={36} color={COLORS.green} style={{ animation: 'spin 2s linear infinite' }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.darkGreen, marginBottom: 16, ...styles.fontSans }}>AI Processing</div>
          <div style={{ maxWidth: 400, margin: '0 auto' }}>
            {/* Progress bar */}
            <div style={{ background: `${COLORS.lightGrey}30`, borderRadius: 8, height: 6, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ height: '100%', background: `linear-gradient(90deg, ${COLORS.green}, #00a876)`, borderRadius: 8, transition: 'width 0.8s ease', width: `${(aiPhase / 3) * 100}%` }} />
            </div>
            {phases.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', opacity: aiPhase > i ? 1 : 0.3, transition: 'opacity 0.4s', ...styles.fontSans }}>
                <span style={{ fontSize: 18 }}>{aiPhase > i + 1 ? '✅' : p.icon}</span>
                <span style={{ fontSize: 14, color: aiPhase === i + 1 ? COLORS.darkGreen : COLORS.mediumGrey, fontWeight: aiPhase === i + 1 ? 600 : 400 }}>{p.label}</span>
                {aiPhase === i + 1 && <span style={{ marginLeft: 'auto', width: 16, height: 16, border: `2px solid ${COLORS.green}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
              </div>
            ))}
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Section D: Derived Requirements Table */}
      {showDerived && (
        <>
          <div style={{ ...styles.badge(`${COLORS.green}12`, COLORS.green), marginBottom: 16, padding: '8px 16px', fontSize: 14 }}>
            ✅ AI derived {derived.length} data requirements from your business need description
          </div>

          <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${COLORS.lightGrey}18` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans }}>Derived Data Requirements</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 12, color: COLORS.mediumGrey }}>{selectedCount} of {allReqs.length} selected</div>
                <button onClick={() => setShowAddReq(true)} style={{ ...styles.btnSecondary, padding: '6px 14px', fontSize: 12 }}>
                  <Plus size={14} /> Add Requirement
                </button>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={styles.th}>☑</th>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Data Element</th>
                    <th style={styles.th}>Preliminary Definition</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>CDE</th>
                    <th style={styles.th}>Confidence</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allReqs.map(d => {
                    const isEditing = editingId === d.id;
                    const displayElement = d._isUser ? d.element : getDisplayElement(d);
                    const displayDef = d._isUser ? d.def : getDisplayDef(d);
                    return (
                      <tr key={d.id} style={{ background: checkedReqs[d.id] ? '#fff' : `${COLORS.lightGrey}08`, transition: 'background 0.1s' }}>
                        <td style={styles.td}>
                          <div onClick={() => setCheckedReqs(prev => ({ ...prev, [d.id]: !prev[d.id] }))} style={{ width: 18, height: 18, borderRadius: 4, border: checkedReqs[d.id] ? `2px solid ${COLORS.green}` : `2px solid ${COLORS.lightGrey}`, background: checkedReqs[d.id] ? `${COLORS.green}15` : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            {checkedReqs[d.id] && <Check size={12} color={COLORS.green} strokeWidth={3} />}
                          </div>
                        </td>
                        <td style={styles.td}>{d.id}</td>
                        <td style={{ ...styles.td, fontWeight: 600, color: COLORS.darkGreen }}>
                          {isEditing ? (
                            <input
                              autoFocus
                              value={editElement}
                              onChange={e => setEditElement(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') { d._isUser ? saveEditing(d) : saveDerivedEditing(d); } if (e.key === 'Escape') setEditingId(null); }}
                              style={{ ...styles.input, height: 30, fontSize: 13, padding: '4px 8px' }}
                            />
                          ) : displayElement}
                        </td>
                        <td style={{ ...styles.td, fontSize: 12, color: COLORS.darkGrey, lineHeight: 1.5 }}>
                          {isEditing ? (
                            <input
                              value={editDef}
                              onChange={e => setEditDef(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') { d._isUser ? saveEditing(d) : saveDerivedEditing(d); } if (e.key === 'Escape') setEditingId(null); }}
                              style={{ ...styles.input, height: 30, fontSize: 12, padding: '4px 8px' }}
                            />
                          ) : displayDef}
                        </td>
                        <td style={styles.td}><span style={styles.badge(`${COLORS.lightGrey}20`, COLORS.darkGrey)}>{d.category}</span></td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                              onClick={() => setCdeFlags(prev => ({ ...prev, [d.id]: !prev[d.id] }))}
                              style={{ width: 36, height: 20, borderRadius: 10, cursor: 'pointer', background: cdeFlags[d.id] ? COLORS.yellow : `${COLORS.lightGrey}60`, position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
                            >
                              <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: cdeFlags[d.id] ? 18 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                            </div>
                            {cdeFlags[d.id] && <span style={styles.badge(`${COLORS.yellow}25`, '#92750a')}>CDE</span>}
                          </div>
                        </td>
                        <td style={styles.td}><ConfidenceBadge confidence={d.confidence} /></td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {isEditing ? (
                              <button onClick={() => { d._isUser ? saveEditing(d) : saveDerivedEditing(d); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }} title="Save">
                                <Check size={14} color={COLORS.green} />
                              </button>
                            ) : (
                              <button onClick={() => startEditing({ ...d, element: displayElement, def: displayDef })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }} title="Edit">
                                <Pencil size={14} color={COLORS.mediumGrey} />
                              </button>
                            )}
                            {d._isUser && (
                              <button onClick={() => deleteUserReq(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }} title="Delete">
                                <Trash2 size={14} color={COLORS.red} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section E: Data Quality Definition */}
          {checkedItems.length > 0 && (
            <div style={{ ...styles.card, marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChart3 size={18} color={COLORS.green} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans }}>Data Quality Definition</span>
                  <InfoTooltip text={STEP_TOOLTIPS[2].dqDefinition} />
                </div>
                <button
                  onClick={() => setDqSuggestAll(true)}
                  style={{ ...styles.btnSecondary, padding: '6px 14px', fontSize: 12 }}
                >
                  <Sparkles size={14} /> AI Suggest DQ for All
                </button>
              </div>

              {/* DQ Dimensions Manager */}
              <div style={{ marginBottom: 16, padding: 14, background: `${COLORS.petrol}06`, borderRadius: 10, border: `1px solid ${COLORS.petrol}15` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans }}>
                    DQ Dimensions ({dqDimensions.length})
                  </div>
                  <button onClick={() => setShowAddDim(true)} style={{ ...styles.btnSecondary, padding: '4px 10px', fontSize: 11, gap: 4 }}>
                    <Plus size={12} /> Add Dimension
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {dqDimensions.map(dim => (
                    <div key={dim} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8,
                      background: '#fff', border: `1px solid ${COLORS.lightGrey}40`, fontSize: 12, color: COLORS.darkGreen,
                    }}>
                      {editingDim === dim ? (
                        <input
                          autoFocus
                          value={editDimName}
                          onChange={e => setEditDimName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') renameDimension(dim); if (e.key === 'Escape') { setEditingDim(null); setEditDimName(''); } }}
                          onBlur={() => renameDimension(dim)}
                          style={{ ...styles.input, height: 22, fontSize: 11, padding: '2px 6px', width: 100 }}
                        />
                      ) : (
                        <>
                          <span style={{ fontWeight: 600 }}>{dim}</span>
                          <button onClick={() => { setEditingDim(dim); setEditDimName(dim); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }} title="Rename dimension">
                            <Pencil size={10} color={COLORS.mediumGrey} />
                          </button>
                          <button onClick={() => removeDimension(dim)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }} title="Remove dimension">
                            <X size={12} color={COLORS.red} />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                {showAddDim && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                    <input
                      autoFocus
                      value={newDimName}
                      onChange={e => setNewDimName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addDimension(); if (e.key === 'Escape') { setShowAddDim(false); setNewDimName(''); } }}
                      placeholder="e.g. Uniqueness, Integrity..."
                      style={{ ...styles.input, height: 32, fontSize: 12, padding: '4px 10px', flex: 1 }}
                    />
                    <button onClick={addDimension} style={{ ...styles.btnPrimary, padding: '6px 12px', fontSize: 11 }}>Add</button>
                    <button onClick={() => { setShowAddDim(false); setNewDimName(''); }} style={{ ...styles.btnSecondary, padding: '6px 12px', fontSize: 11 }}>Cancel</button>
                  </div>
                )}
              </div>

              <p style={{ fontSize: 13, color: COLORS.mediumGrey, marginBottom: 16, lineHeight: 1.5, ...styles.fontSans }}>
                Set data quality thresholds for each selected requirement. CDE requirements typically need stricter thresholds.
              </p>
              {checkedItems.map(r => {
                const displayEl = r._isUser ? r.element : getDisplayElement(r);
                return (
                  <div key={r.id} style={{ marginBottom: 16, padding: 16, background: `${COLORS.lightGrey}08`, borderRadius: 10, border: `1px solid ${COLORS.lightGrey}18` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans }}>{displayEl}</span>
                      {cdeFlags[r.id] && <span style={styles.badge(`${COLORS.yellow}25`, '#92750a')}>CDE</span>}
                    </div>
                    <DQPanel cde={!!cdeFlags[r.id]} domain="Credits" reqId={r.id} dimensions={dqDimensions} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Export + Proceed buttons */}
          <div className="r-btn-row" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
            <button style={{ ...styles.btnSecondary, display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={handleExport}>
              <Download size={14} /> Export to Excel
            </button>
            <button style={styles.btnPrimary} onClick={onNext}>
              Proceed to FRIM Matching <ArrowRight size={16} />
            </button>
          </div>
        </>
      )}

      {/* Add Requirement Modal */}
      {showAddReq && (
        <CreateItemModal
          title="Add Data Requirement"
          fields={[
            { key: 'element', label: 'Element Name', type: 'text', placeholder: 'e.g. Exposure at Default' },
            { key: 'definition', label: 'Definition', type: 'textarea', placeholder: 'Describe the data element...' },
            { key: 'category', label: 'Category', type: 'select', options: ['Exposure', 'Counterparty', 'Collateral', 'Risk Parameter', 'Product', 'Time & Reporting'] },
            { key: 'cde', label: 'Critical Data Element (CDE)', type: 'toggle' },
          ]}
          onSave={handleAddReq}
          onClose={() => setShowAddReq(false)}
        />
      )}

      <ReviewPanel step={2} />
    </div>
  );
}

// ============================================================
// Step 3 — Requirements & FRIM Matching (was Step 2)
// ============================================================
function Step3FRIM({ selectedUC, birdEnabled, birdTransformationsEnabled, onNext }) {
  const reqs = REQUIREMENTS[selectedUC] || [];
  const stats = useMemo(() => getStats(reqs), [reqs]);
  const expressions = ELEMENT_EXPRESSIONS[selectedUC] || [];
  const rationales = FRIM_MAPPING_RATIONALES[selectedUC] || {};
  const [search, setSearch] = useState('');
  const [filterMatch, setFilterMatch] = useState('all');
  const [filterCde, setFilterCde] = useState('all');
  const [expandedRow, setExpandedRow] = useState(null);
  const [page, setPage] = useState(0);
  const [kpiFilter, setKpiFilter] = useState(null);
  const [editingFrim, setEditingFrim] = useState(null);
  const [frimOverrides, setFrimOverrides] = useState({});
  const [expandedExpr, setExpandedExpr] = useState(null);
  const pageSize = 15;

  const filtered = useMemo(() => {
    return reqs.filter(r => {
      if (search && !r.frim.toLowerCase().includes(search.toLowerCase()) && !r.entity.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterMatch !== 'all' && r.match !== filterMatch) return false;
      if (filterCde === 'cde' && !r.cde) return false;
      if (filterCde === 'non-cde' && r.cde) return false;
      if (kpiFilter === 'exact' && r.match !== 'exact') return false;
      if (kpiFilter === 'review' && r.match !== 'review') return false;
      if (kpiFilter === 'new' && r.match !== 'new') return false;
      if (kpiFilter === 'cde' && !r.cde) return false;
      return true;
    });
  }, [reqs, search, filterMatch, filterCde, kpiFilter]);

  // Build lookup: reqId -> expression it belongs to
  const reqExpressionMap = useMemo(() => {
    const map = {};
    expressions.forEach(expr => {
      expr.frimTermIds.forEach(tid => { map[tid] = expr; });
    });
    return map;
  }, [expressions]);

  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const handleKpiClick = (type) => {
    setKpiFilter(kpiFilter === type ? null : type);
    setPage(0);
  };

  const handleFrimEdit = (id, value) => {
    setFrimOverrides(prev => ({ ...prev, [id]: value }));
    setEditingFrim(null);
  };

  const getFrimTerm = (r) => frimOverrides[r.id] || r.frim;

  const handleExport = () => {
    const data = reqs.map(r => ({
      'ID': r.id,
      'FRIM Term': getFrimTerm(r),
      'Business Req': r.regRef,
      'Match Status': r.match,
      'CDE': r.cde ? 'Yes' : 'No',
      'Definition': r.def,
      'Rationale': rationales[r.id] || ''
    }));
    exportToExcel(data, 'FRIM Mapping', `FRIM_Mapping_UC${selectedUC}.xlsx`);
  };

  return (
    <div>
      <SectionHeader sub={STEP_TOOLTIPS[3]?.main || "Map business requirements to FRIM Lexicon terms."} tip={STEP_TOOLTIPS[3]?.frim || "Each data requirement is matched against the FRIM Lexicon. Green = exact match, Yellow = needs review, Red = new term needed."}>
        Step 3 — FRIM Lexicon Mapping
      </SectionHeader>
      <OwnershipBar step={3} />

      <div style={{ ...styles.badge(`${COLORS.petrol}15`, COLORS.petrol), marginBottom: 16, padding: '8px 16px', fontSize: 13 }}>
        🤖 AI-assisted — {stats.total} requirements mapped to FRIM terms
      </div>

      {/* Clickable KPI Cards */}
      <div className="r-kpi" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
        <KpiCard label="Exact Match" value={stats.exact} color={COLORS.green} active={kpiFilter === 'exact'} onClick={() => handleKpiClick('exact')} />
        <KpiCard label="Review" value={stats.review} color={COLORS.yellow} active={kpiFilter === 'review'} onClick={() => handleKpiClick('review')} />
        <KpiCard label="New Terms" value={stats.newR} color={COLORS.red} active={kpiFilter === 'new'} onClick={() => handleKpiClick('new')} />
        <KpiCard label="CDEs" value={stats.cdes} color={COLORS.yellow} active={kpiFilter === 'cde'} onClick={() => handleKpiClick('cde')} />
        <KpiCard label="Coverage" value={`${stats.coverage}%`} color={COLORS.green} />
      </div>

      {/* Search & Filters */}
      <div style={{ ...styles.card, padding: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} color={COLORS.mediumGrey} style={{ position: 'absolute', left: 12, top: 13 }} />
          <input style={{ ...styles.input, paddingLeft: 34 }} placeholder="Search FRIM terms..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <select style={{ ...styles.input, width: 'auto', minWidth: 130 }} value={filterMatch} onChange={e => { setFilterMatch(e.target.value); setPage(0); }}>
          <option value="all">All Statuses</option>
          <option value="exact">Matched</option>
          <option value="review">Review</option>
          <option value="new">New</option>
        </select>
        <select style={{ ...styles.input, width: 'auto', minWidth: 120 }} value={filterCde} onChange={e => { setFilterCde(e.target.value); setPage(0); }}>
          <option value="all">All CDE</option>
          <option value="cde">CDE Only</option>
          <option value="non-cde">Non-CDE</option>
        </select>
        {kpiFilter && (
          <button style={{ ...styles.btnSecondary, padding: '6px 12px', fontSize: 11, color: COLORS.red, borderColor: `${COLORS.red}30` }} onClick={() => { setKpiFilter(null); setPage(0); }}>
            <X size={12} /> Clear KPI Filter
          </button>
        )}
      </div>

      {/* FRIM Mapping Table — no BLDM, no Source, no DQ */}
      <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>FRIM Lexicon Term</th>
                <th style={styles.th}>Business Requirement</th>
                <th style={styles.th}>Match</th>
                <th style={styles.th}>CDE</th>
                {birdEnabled && <th style={styles.th}>BIRD LDM</th>}
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {paged.map(r => {
                const expr = reqExpressionMap[r.id];
                return (
                <React.Fragment key={r.id}>
                  <tr style={{ background: expandedRow === r.id ? `${COLORS.green}06` : 'transparent', cursor: 'pointer', transition: 'background 0.15s' }} onClick={() => setExpandedRow(expandedRow === r.id ? null : r.id)}>
                    <td style={styles.td}>{r.id}</td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {editingFrim === r.id ? (
                          <input
                            autoFocus
                            defaultValue={getFrimTerm(r)}
                            style={{ ...styles.input, padding: '4px 8px', fontSize: 13, width: '100%' }}
                            onClick={e => e.stopPropagation()}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleFrimEdit(r.id, e.target.value);
                              if (e.key === 'Escape') setEditingFrim(null);
                            }}
                            onBlur={e => handleFrimEdit(r.id, e.target.value)}
                          />
                        ) : (
                          <>
                            <span style={{ ...styles.frimTerm, cursor: 'text' }} onDoubleClick={(e) => { e.stopPropagation(); setEditingFrim(r.id); }} title="Double-click to edit">
                              {getFrimTerm(r)} {frimOverrides[r.id] && <Pencil size={10} style={{ marginLeft: 4, opacity: 0.5 }} />}
                            </span>
                            {expr && (
                              <span
                                title={`Part of Element Expression: ${expr.label}\n${expr.formula}`}
                                style={{ ...styles.badge(`${COLORS.petrol}15`, COLORS.petrol), fontSize: 9, padding: '2px 6px', cursor: 'help', whiteSpace: 'nowrap' }}
                              >
                                📐 {expr.label}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td style={{ ...styles.td, fontSize: 12, color: COLORS.mediumGrey }}>{r.regRef}</td>
                    <td style={styles.td}><MatchBadge match={r.match} /></td>
                    <td style={styles.td}><CdeBadge cde={r.cde} /></td>
                    {birdEnabled && (
                      <td style={styles.td}>
                        {r.birdEntity ? <span style={styles.birdBadge}>{r.birdEntity} → {r.birdAttr}</span> : <span style={{ color: COLORS.mediumGrey, fontSize: 12 }}>—</span>}
                      </td>
                    )}
                    <td style={styles.td}>{expandedRow === r.id ? <ChevronDown size={16} color={COLORS.mediumGrey} /> : <ChevronRight size={16} color={COLORS.mediumGrey} />}</td>
                  </tr>
                  {expandedRow === r.id && (
                    <tr>
                      <td colSpan={birdEnabled ? 7 : 6} style={{ padding: '0 16px 16px', background: `${COLORS.green}04` }}>
                        <div style={{ display: 'grid', gridTemplateColumns: birdEnabled && r.birdEntity ? '1fr 1fr' : '1fr', gap: 16, paddingTop: 8 }}>
                          {/* FRIM Definition */}
                          <div style={{ background: '#fff', borderRadius: 10, padding: 16, border: `1px solid ${COLORS.lightGrey}30` }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.darkGreen, marginBottom: 8, ...styles.fontSans }}>
                              {r.isNew ? '🤖 AI-Suggested' : '📖'} FRIM Lexicon Definition
                            </div>
                            <div style={{ ...styles.fontSerif, fontStyle: 'italic', fontSize: 14, color: COLORS.darkGreen, lineHeight: 1.6, padding: 12, background: `${COLORS.lightGrey}0a`, borderRadius: 8, borderLeft: `3px solid ${COLORS.green}` }}>
                              "{r.def}"
                            </div>
                            {r.isNew && <FrimCompliancePanel def={r.def} term={r.frim} />}
                            {r.isNew && (
                              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                <button style={{ ...styles.btnPrimary, padding: '6px 16px', fontSize: 12 }}>Accept Definition</button>
                                <button style={{ ...styles.btnSecondary, padding: '6px 16px', fontSize: 12 }}>Edit</button>
                                <button style={{ ...styles.btnSecondary, padding: '6px 16px', fontSize: 12, color: COLORS.red, borderColor: `${COLORS.red}40` }}>Reject</button>
                              </div>
                            )}
                          </div>

                          {birdEnabled && r.birdEntity && (
                            <div style={{ background: '#fff', borderRadius: 10, padding: 16, border: `1px solid ${COLORS.petrol}20` }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.petrol, marginBottom: 12, ...styles.fontSans }}>🐦 BIRD LDM Alignment</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px', fontSize: 12, ...styles.fontSans }}>
                                <span style={{ color: COLORS.mediumGrey }}>BIRD Entity:</span>
                                <span style={{ color: COLORS.darkGreen, fontWeight: 600 }}>{r.birdEntity}</span>
                                <span style={{ color: COLORS.mediumGrey }}>BIRD Attribute:</span>
                                <span style={styles.birdBadge}>{r.birdAttr}</span>
                                <span style={{ color: COLORS.mediumGrey }}>Alignment:</span>
                                <span><BirdAlignBadge align={r.birdAlign} /></span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Element Expression (if this term is part of one) */}
                        {expr && (
                          <div style={{ background: `${COLORS.petrol}06`, borderRadius: 10, padding: 16, border: `1px solid ${COLORS.petrol}20`, marginTop: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.petrol, marginBottom: 8, ...styles.fontSans }}>📐 Element Expression: {expr.label}</div>
                            <div style={{ ...styles.fontSerif, fontSize: 14, color: COLORS.darkGreen, fontWeight: 600, padding: '8px 12px', background: '#fff', borderRadius: 6, borderLeft: `3px solid ${COLORS.petrol}`, marginBottom: 8 }}>
                              {expr.formula}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                              {expr.frimTermIds.map(tid => {
                                const term = reqs.find(rr => rr.id === tid);
                                return term ? (
                                  <span key={tid} style={{ ...styles.frimTerm, fontSize: 10, padding: '2px 8px', background: tid === r.id ? `${COLORS.petrol}15` : `${COLORS.green}10`, borderColor: tid === r.id ? COLORS.petrol : undefined }}>
                                    {tid === r.id ? '→ ' : ''}{getFrimTerm(term)}
                                  </span>
                                ) : null;
                              })}
                            </div>
                            <div style={{ fontSize: 11, color: COLORS.darkGrey, lineHeight: 1.5 }}>{expr.rationale}</div>
                          </div>
                        )}

                        {/* Mapping Rationale */}
                        {rationales[r.id] && (
                          <div style={{ background: '#fff', borderRadius: 10, padding: 16, border: `1px solid ${COLORS.lightGrey}30`, marginTop: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.darkGreen, marginBottom: 8, ...styles.fontSans }}>💡 Mapping Rationale</div>
                            <div style={{ fontSize: 13, color: COLORS.darkGrey, lineHeight: 1.6 }}>
                              {rationales[r.id]}
                            </div>
                          </div>
                        )}

                        {/* Regulatory Source */}
                        <div style={{ background: '#fff', borderRadius: 10, padding: 16, border: `1px solid ${COLORS.lightGrey}30`, marginTop: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.darkGreen, marginBottom: 8, ...styles.fontSans }}>📜 Regulatory Reference</div>
                          {r.regSource ? (
                            <div>
                              <div style={{ fontSize: 11, color: COLORS.mediumGrey, marginBottom: 4 }}>
                                <strong>Regulation:</strong> {r.regSource.reg} | <strong>Article:</strong> {r.regSource.art}
                              </div>
                              <div style={{ padding: 10, background: `${COLORS.lightGrey}0c`, borderRadius: 8, borderLeft: `3px solid ${COLORS.blue}`, fontSize: 12, color: COLORS.darkGrey, fontStyle: 'italic', lineHeight: 1.5 }}>
                                "{r.regSource.extract}"
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: 12, color: COLORS.mediumGrey }}>Ref: {r.regRef}</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ); })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: 16, borderTop: `1px solid ${COLORS.lightGrey}18` }}>
            <button style={{ ...styles.btnSecondary, padding: '6px 12px' }} onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>
              <ChevronLeft size={14} /> Prev
            </button>
            <span style={{ fontSize: 13, color: COLORS.darkGrey }}>Page {page + 1} of {totalPages}</span>
            <button style={{ ...styles.btnSecondary, padding: '6px 12px' }} onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}>
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* FRIM Governance Queue — Export mode for new terms */}
      {(() => {
        const newTerms = reqs.filter(r => r.match === 'new');
        return newTerms.length > 0 ? <GovernancePanel items={newTerms} type="frim" exportMode={true} /> : null;
      })()}

      {/* Export & Next buttons */}
      <div className="r-btn-row" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <button style={{ ...styles.btnSecondary, display: 'flex', alignItems: 'center', gap: 6 }} onClick={handleExport}>
          <Download size={14} /> Export FRIM Mapping
        </button>
        <button style={styles.btnPrimary} onClick={onNext}>
          Next: BLDM Mapping <ArrowRight size={16} />
        </button>
      </div>

      <ReviewPanel step={3} />
    </div>
  );
}

// ============================================================
// Step 5 — DDS Availability (reordered from Step 4)
// ============================================================
function Step4DDS({ selectedUC, selectedEntities, onNext }) {
  const reqs = REQUIREMENTS[selectedUC] || [];
  const ddsData = DDS_AVAILABILITY[selectedUC] || {};
  const activeEntities = LEGAL_ENTITIES.filter(le => selectedEntities.includes(le.id));
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [expandedEntity, setExpandedEntity] = useState(null);
  const [kpiFilter, setKpiFilter] = useState(null);

  const totals = useMemo(() => {
    let avail = 0, partial = 0, unavail = 0;
    activeEntities.forEach(le => {
      const d = ddsData[le.id];
      if (d) { avail += d.available; partial += d.partial; unavail += d.unavailable; }
    });
    const total = avail + partial + unavail;
    return { avail, partial, unavail, total, coverage: total > 0 ? Math.round(((avail + partial * 0.5) / total) * 100) : 0 };
  }, [ddsData, activeEntities]);

  // Simulated FRIM term availability per entity
  const entityFrimAvailability = useMemo(() => {
    const result = {};
    const uniqueEntities = [...new Set(reqs.map(r => r.entity))];
    uniqueEntities.forEach(ent => {
      const entReqs = reqs.filter(r => r.entity === ent);
      result[ent] = {
        available: entReqs.filter(r => r.match === 'exact').map(r => r.frim),
        partial: entReqs.filter(r => r.match === 'review').map(r => r.frim),
        unavailable: entReqs.filter(r => r.match === 'new').map(r => r.frim),
      };
    });
    return result;
  }, [reqs]);

  const handleExport = () => {
    const rows = [];
    activeEntities.forEach(le => {
      const d = ddsData[le.id] || { available: 0, partial: 0, unavailable: 0 };
      rows.push({ 'Entity': le.label, 'Full Name': le.full, 'Available': d.available, 'Partial': d.partial, 'Unavailable': d.unavailable });
    });
    exportToExcel(rows, 'DDS Availability', `DDS_Availability_UC${selectedUC}.xlsx`);
  };

  return (
    <div>
      <SectionHeader sub={STEP_TOOLTIPS[5]?.main || "Overview of data available in the DDS per legal entity."} tip={STEP_TOOLTIPS[5]?.dds || "Shows which data elements are already available in the DDS."}>
        Step 5 — DDS Data Availability
      </SectionHeader>
      <OwnershipBar step={5} />

      {/* Clickable KPI Cards */}
      <div className="r-kpi" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Available in DDS" value={totals.avail} color={COLORS.green} active={kpiFilter === 'avail'} onClick={() => setKpiFilter(kpiFilter === 'avail' ? null : 'avail')} />
        <KpiCard label="Partially Available" value={totals.partial} color={COLORS.yellow} active={kpiFilter === 'partial'} onClick={() => setKpiFilter(kpiFilter === 'partial' ? null : 'partial')} />
        <KpiCard label="Not in DDS" value={totals.unavail} color={COLORS.red} active={kpiFilter === 'unavail'} onClick={() => setKpiFilter(kpiFilter === 'unavail' ? null : 'unavail')} />
        <KpiCard label="DDS Coverage" value={`${totals.coverage}%`} color={COLORS.petrol} />
      </div>

      {/* Entity Availability Matrix — Expandable */}
      <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${COLORS.lightGrey}18` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans }}>Entity-Level DDS Availability</div>
          <div style={{ fontSize: 12, color: COLORS.mediumGrey, marginTop: 4 }}>Click a row to see FRIM term availability breakdown</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={styles.th}>Legal Entity</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Available</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Partial</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Unavailable</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Coverage</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {activeEntities.map((le) => {
                const d = ddsData[le.id] || { available: 0, partial: 0, unavailable: 0 };
                const total = d.available + d.partial + d.unavailable;
                const cov = total > 0 ? Math.round(((d.available + d.partial * 0.5) / total) * 100) : 0;
                const isExpanded = expandedEntity === le.id;
                return (
                  <React.Fragment key={le.id}>
                    <tr style={{ transition: 'background 0.15s', cursor: 'pointer', background: isExpanded ? `${COLORS.green}06` : 'transparent' }} onClick={() => setExpandedEntity(isExpanded ? null : le.id)}>
                      <td style={{ ...styles.td, fontWeight: 600 }}>
                        <span style={{ marginRight: 8 }}>{le.icon}</span>{le.label}
                        <span style={{ fontSize: 11, color: COLORS.mediumGrey, marginLeft: 8 }}>{le.full}</span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span style={styles.badge(`${COLORS.green}15`, COLORS.green)}>{d.available}</span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span style={styles.badge(`${COLORS.yellow}20`, '#92750a')}>{d.partial}</span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span style={styles.badge(`${COLORS.red}15`, COLORS.red)}>{d.unavailable}</span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                          <div style={{ width: 80, height: 6, background: `${COLORS.lightGrey}30`, borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${cov}%`, background: cov > 70 ? COLORS.green : cov > 40 ? COLORS.yellow : COLORS.red, borderRadius: 4, transition: 'width 0.3s' }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: cov > 70 ? COLORS.green : cov > 40 ? '#92750a' : COLORS.red }}>{cov}%</span>
                        </div>
                      </td>
                      <td style={styles.td}>{isExpanded ? <ChevronDown size={16} color={COLORS.mediumGrey} /> : <ChevronRight size={16} color={COLORS.mediumGrey} />}</td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} style={{ padding: '0 20px 16px', background: `${COLORS.green}04` }}>
                          <div className="r-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, paddingTop: 12 }}>
                            <div style={{ background: '#fff', borderRadius: 10, padding: 14, border: `1px solid ${COLORS.green}25` }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.green, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Available ({Object.values(entityFrimAvailability).reduce((s, e) => s + e.available.length, 0)})</div>
                              {Object.entries(entityFrimAvailability).map(([ent, data]) => data.available.map(term => (
                                <div key={`${ent}-${term}`} style={{ fontSize: 11, padding: '3px 0', display: 'flex', alignItems: 'center', gap: 6, color: COLORS.darkGreen }}>
                                  <Check size={10} color={COLORS.green} /> {term}
                                </div>
                              )))}
                            </div>
                            <div style={{ background: '#fff', borderRadius: 10, padding: 14, border: `1px solid ${COLORS.yellow}30` }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#92750a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Partial ({Object.values(entityFrimAvailability).reduce((s, e) => s + e.partial.length, 0)})</div>
                              {Object.entries(entityFrimAvailability).map(([ent, data]) => data.partial.map(term => (
                                <div key={`${ent}-${term}`} style={{ fontSize: 11, padding: '3px 0', display: 'flex', alignItems: 'center', gap: 6, color: COLORS.darkGrey }}>
                                  <AlertTriangle size={10} color={COLORS.yellow} /> {term}
                                </div>
                              )))}
                            </div>
                            <div style={{ background: '#fff', borderRadius: 10, padding: 14, border: `1px solid ${COLORS.red}20` }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.red, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Unavailable ({Object.values(entityFrimAvailability).reduce((s, e) => s + e.unavailable.length, 0)})</div>
                              {Object.entries(entityFrimAvailability).map(([ent, data]) => data.unavailable.map(term => (
                                <div key={`${ent}-${term}`} style={{ fontSize: 11, padding: '3px 0', display: 'flex', alignItems: 'center', gap: 6, color: COLORS.red }}>
                                  <X size={10} color={COLORS.red} /> {term}
                                </div>
                              )))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* BLDM to PDM Connection */}
      <div style={{ ...styles.card }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.darkGreen, marginBottom: 4, ...styles.fontSans }}>
          <Database size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          BLDM → PDM Connection
        </div>
        <div style={{ fontSize: 12, color: COLORS.mediumGrey, marginBottom: 16 }}>Physical Data Model mapping — where data lives in Databricks Unity Catalog</div>
        <div className="r-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 0, alignItems: 'start' }}>
          {/* Left: BLDM Entities */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.mediumGrey, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, paddingLeft: 8 }}>BLDM (Logical)</div>
            {PDM_MAPPING.map((pm, i) => (
              <div key={i} style={{ padding: '8px 12px', marginBottom: 4, borderRadius: 8, border: `1px solid ${COLORS.green}25`, background: `${COLORS.green}06`, fontSize: 12, fontWeight: 600, color: COLORS.darkGreen }}>
                {pm.bldmEntity}
              </div>
            ))}
          </div>
          {/* Middle: Arrows */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 30 }}>
            {PDM_MAPPING.map((_, i) => (
              <div key={i} style={{ height: 36, display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 40, height: 2, background: `${COLORS.petrol}40` }} />
                <ArrowRight size={14} color={COLORS.petrol} />
              </div>
            ))}
          </div>
          {/* Right: PDM Tables */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.mediumGrey, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, paddingLeft: 8 }}>PDM (Databricks)</div>
            {PDM_MAPPING.map((pm, i) => (
              <div key={i} style={{ padding: '6px 12px', marginBottom: 4, borderRadius: 8, border: `1px solid ${COLORS.petrol}25`, background: `${COLORS.petrol}06` }}>
                <div style={{ ...styles.fontMono, fontSize: 11, color: COLORS.petrol, fontWeight: 600 }}>{pm.table}</div>
                <div style={{ fontSize: 10, color: COLORS.mediumGrey, marginTop: 2 }}>
                  {pm.refreshFreq} | {pm.rowCount} rows | <span style={{ ...styles.fontMono }}>{pm.databricksPath}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DDS Data Products */}
      <div style={{ ...styles.card }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.darkGreen, marginBottom: 16, ...styles.fontSans }}>
          <Package size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          DDS Data Products
        </div>
        <div className="r-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {DDS_DATA_PRODUCTS.map((dp, i) => (
            <div key={i} style={{ borderRadius: 12, border: `1px solid ${COLORS.lightGrey}30`, overflow: 'hidden', transition: 'box-shadow 0.2s', cursor: 'pointer' }} onClick={() => setExpandedProduct(expandedProduct === i ? null : i)}>
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: expandedProduct === i ? `${COLORS.green}06` : '#fff' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans }}>{dp.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.mediumGrey, marginTop: 2 }}>{dp.owner}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={styles.badge(dp.quality >= 99 ? `${COLORS.green}15` : `${COLORS.yellow}20`, dp.quality >= 99 ? COLORS.green : '#92750a')}>
                    {dp.quality}% DQ
                  </span>
                  {expandedProduct === i ? <ChevronDown size={16} color={COLORS.mediumGrey} /> : <ChevronRight size={16} color={COLORS.mediumGrey} />}
                </div>
              </div>
              {expandedProduct === i && (
                <div style={{ padding: '12px 16px', borderTop: `1px solid ${COLORS.lightGrey}18`, background: `${COLORS.lightGrey}06` }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: 12, ...styles.fontSans }}>
                    <div><span style={{ color: COLORS.mediumGrey }}>SLA:</span> <span style={{ color: COLORS.darkGreen, fontWeight: 600 }}>{dp.sla}</span></div>
                    <div><span style={{ color: COLORS.mediumGrey }}>Quality:</span> <span style={{ color: COLORS.darkGreen, fontWeight: 600 }}>{dp.quality}%</span></div>
                    <div><span style={{ color: COLORS.mediumGrey }}>Last Refresh:</span> <span style={{ color: COLORS.darkGreen, fontWeight: 600 }}>{dp.lastRefresh}</span></div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: COLORS.mediumGrey }}>Databricks Path:</span>
                      <span style={{ ...styles.fontMono, fontSize: 11, color: COLORS.petrol, marginLeft: 4, background: `${COLORS.petrol}08`, padding: '2px 6px', borderRadius: 4 }}>{dp.path}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary + Export */}
      <div style={{ ...styles.cardSmall, background: `${COLORS.green}06`, border: `1px solid ${COLORS.green}18` }}>
        <div style={{ fontSize: 13, color: COLORS.darkGreen, ...styles.fontSans, lineHeight: 1.6 }}>
          <strong>Summary:</strong> {totals.avail} data points available immediately via DDS across {activeEntities.length} entities. {totals.partial} require enrichment. {totals.unavail} require new sourcing routes.
        </div>
      </div>

      <div className="r-btn-row" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <button style={{ ...styles.btnSecondary, display: 'flex', alignItems: 'center', gap: 6 }} onClick={handleExport}>
          <Download size={14} /> Export DDS Availability
        </button>
        <button style={styles.btnPrimary} onClick={onNext}>
          Next: Data Origination <ArrowRight size={16} />
        </button>
      </div>

      <ReviewPanel step={5} />
    </div>
  );
}

// ============================================================
// Step 4 — BLDM Mapping (reordered from Step 5)
// ============================================================
function Step5BLDM({ selectedUC, birdEnabled, onNext }) {
  const reqs = REQUIREMENTS[selectedUC] || [];
  const [editingMapping, setEditingMapping] = useState(null);
  const [mappingOverrides, setMappingOverrides] = useState({});
  const [showAddMapping, setShowAddMapping] = useState(false);
  const [userMappings, setUserMappings] = useState([]);

  const getEntity = (r) => mappingOverrides[r.id]?.entity || r.entity;
  const getAttr = (r) => mappingOverrides[r.id]?.attr || r.attr;

  const entities = useMemo(() => {
    const all = [
      { name: 'Involved Party', icon: '👤', attrs: ['party identifier', 'party name', 'party type', 'country of incorporation', 'economic sector', 'legal entity identifier', 'industry classification', 'geographic region', 'internal credit rating', 'external credit rating', 'rating agency', 'client segment'] },
      { name: 'Credit Facility', icon: '📦', attrs: ['facility identifier', 'original exposure amount', 'exposure at default', 'credit conversion factor', 'off-balance sheet item type', 'off-balance sheet nominal amount', 'exposure class', 'risk weight percentage', 'risk-weighted exposure amount', 'default flag', 'past due days', 'specific credit risk adjustment amount', 'general credit risk adjustment amount', 'residual maturity', 'original maturity date', 'reporting date', 'consolidation scope'] },
      { name: 'Financing Product', icon: '🏷️', attrs: ['product identifier', 'product type', 'product currency', 'product category'] },
      { name: 'Credit Agreement', icon: '📄', attrs: ['agreement identifier', 'agreement type', 'start date', 'end date', 'portfolio segment'] },
      { name: 'Interest Condition', icon: '💰', attrs: ['condition identifier', 'effective interest rate', 'offer rate', 'rate type'] },
      { name: 'Collateral', icon: '🛡️', attrs: ['collateral identifier', 'collateral market value', 'eligible collateral value', 'collateral type classification', 'credit risk mitigation type', 'haircut percentage', 'volatility adjustment factor', 'netting set identifier', 'netting agreement type', 'guarantee amount', 'guarantor identifier', 'guarantor credit quality step'] },
      { name: 'Financial Instrument', icon: '📈', attrs: ['instrument identifier', 'instrument type', 'fair value amount', 'carrying amount', 'securitisation exposure amount', 'securitisation tranche type', 'counterparty credit risk amount', 'settlement risk amount', 'CVA risk charge amount'] },
      { name: 'Risk Assessment', icon: '📊', attrs: ['assessment identifier', 'probability of default', 'loss given default', 'lifetime probability of default', 'twelve-month probability of default', 'IFRS9 stage classification', 'stage transition date', 'significant increase in credit risk flag', 'SICR trigger type', 'expected credit loss amount', 'impairment allowance amount', 'write-off amount', 'recovery amount', 'forbearance flag', 'forbearance type', 'non-performing flag', 'discount factor', 'collateral recovery rate', 'forward-looking adjustment factor', 'macroeconomic scenario identifier', 'scenario probability weight', 'cure rate', 'ECL coverage ratio', 'stressed probability of default', 'stressed loss given default', 'stressed exposure at default', 'stressed expected credit loss amount', 'stressed risk-weighted exposure amount', 'stressed CET1 ratio', 'stressed leverage ratio', 'cumulative impact amount', 'migration matrix identifier'] },
    ];
    const usedEntities = new Set(reqs.map(r => getEntity(r)));
    const attrStatus = {};
    reqs.forEach(r => { attrStatus[`${getEntity(r)}.${getAttr(r)}`] = r.match; });
    return all.map(e => ({
      ...e, active: usedEntities.has(e.name),
      attrStatus, birdInfo: birdEnabled ? BIRD_ENTITY_MAPPING.find(b => b.frEntity === e.name) : null,
    }));
  }, [reqs, birdEnabled, mappingOverrides]);

  const entityNames = entities.map(e => e.name);
  const activeEntities = entities.filter(e => e.active);
  const inactiveEntities = entities.filter(e => !e.active);
  const newAttrs = reqs.filter(r => r.match === 'new').length;
  const reviewAttrs = reqs.filter(r => r.match === 'review').length;
  const entitiesAffected = new Set(reqs.map(r => getEntity(r))).size;

  const handleExport = () => {
    const data = reqs.map(r => ({
      'ID': r.id, 'FRIM Term': r.frim, 'BLDM Entity': getEntity(r), 'BLDM Attribute': getAttr(r),
      'Status': r.match, 'Gap': r.match === 'new' ? 'New attribute' : r.match === 'review' ? 'Review needed' : 'Mapped',
    }));
    exportToExcel(data, 'BLDM Mapping', `BLDM_Mapping_UC${selectedUC}.xlsx`);
  };

  return (
    <div>
      <SectionHeader sub={STEP_TOOLTIPS[4]?.main || "Map FRIM terms to F&R BLDM entities and attributes."} tip={STEP_TOOLTIPS[4]?.bldm || "Each requirement is mapped to the Business Logical Data Model (BLDM)."}>
        Step 4 — F&R Business Logical Data Model Mapping
      </SectionHeader>
      <OwnershipBar step={4} />

      <div className="r-kpi" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Entities Affected" value={`${entitiesAffected}/8`} color={COLORS.green} />
        <KpiCard label="Attributes Mapped" value={reqs.length} color={COLORS.green} />
        <KpiCard label="New Attributes" value={newAttrs} color={COLORS.red} />
        <KpiCard label="Under Review" value={reviewAttrs} color={COLORS.yellow} />
      </div>

      <div style={{ ...styles.card }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGreen, marginBottom: 16, ...styles.fontSans }}>Entity-Relationship Overview</div>
        <div className="r-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {activeEntities.map(e => (
            <div key={e.name} style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${COLORS.lightGrey}30`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ background: COLORS.darkGreen, color: '#fff', padding: '10px 14px', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, ...styles.fontSans }}>
                <span>{e.icon}</span> {e.name}
                {e.birdInfo && <span style={{ marginLeft: 'auto', fontSize: 10, background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 4 }}>🐦 {e.birdInfo.birdEntity}</span>}
              </div>
              <div style={{ padding: 10, fontSize: 12, ...styles.fontSans, maxHeight: 200, overflowY: 'auto' }}>
                {reqs.filter(r => getEntity(r) === e.name).map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', padding: '3px 0', color: COLORS.darkGreen }}>
                    <StatusDot status={r.match} />
                    <span style={{ ...styles.fontMono, fontSize: 11, color: r.isNew ? COLORS.red : COLORS.darkGrey }}>{getAttr(r)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {inactiveEntities.map(e => (
            <div key={e.name} style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${COLORS.lightGrey}15`, opacity: 0.4 }}>
              <div style={{ background: COLORS.mediumGrey, color: '#fff', padding: '10px 14px', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, ...styles.fontSans }}>
                <span>{e.icon}</span> {e.name}
              </div>
              <div style={{ padding: 10, fontSize: 11, color: COLORS.mediumGrey, fontStyle: 'italic' }}>Not required for this use case</div>
            </div>
          ))}
        </div>
      </div>

      {birdEnabled && (
        <div style={{ ...styles.card }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.petrol, marginBottom: 12, ...styles.fontSans }}>🐦 BIRD LDM Entity Alignment</div>
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={styles.th}>F&R BLDM Entity</th>
                <th style={styles.th}>BIRD LDM Entity</th>
                <th style={styles.th}>BIRD Subtypes</th>
                <th style={styles.th}>Alignment</th>
                <th style={styles.th}>Note</th>
              </tr>
            </thead>
            <tbody>
              {BIRD_ENTITY_MAPPING.map((b, i) => (
                <tr key={i} style={{ transition: 'background 0.15s' }}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{b.frEntity}</td>
                  <td style={styles.td}><span style={styles.birdBadge}>{b.birdEntity}</span></td>
                  <td style={{ ...styles.td, fontSize: 12, color: COLORS.mediumGrey }}>{b.birdSubtypes}</td>
                  <td style={styles.td}><BirdAlignBadge align={b.align} /></td>
                  <td style={{ ...styles.td, fontSize: 12, color: COLORS.darkGrey }}>{b.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${COLORS.lightGrey}18` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans }}>Detailed Mapping <span style={{ fontSize: 11, fontWeight: 400, color: COLORS.mediumGrey, marginLeft: 8 }}>Click entity/attribute to edit</span></div>
          <button style={{ ...styles.btnSecondary, padding: '6px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setShowAddMapping(true)}>
            <Plus size={12} /> Add Mapping
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>FRIM Lexicon Term</th>
                <th style={styles.th}>BLDM Entity</th>
                <th style={styles.th}>BLDM Attribute</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Gap Detail</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reqs.slice(0, 20).map((r) => (
                <tr key={r.id} style={{ transition: 'background 0.15s', background: editingMapping === r.id ? `${COLORS.green}06` : 'transparent' }}>
                  <td style={styles.td}>{r.id}</td>
                  <td style={styles.td}><span style={styles.frimTerm}>{r.frim}</span></td>
                  <td style={styles.td}>
                    {editingMapping === r.id ? (
                      <select style={{ ...styles.input, padding: '4px 8px', fontSize: 12 }} value={getEntity(r)} onChange={e => setMappingOverrides(prev => ({ ...prev, [r.id]: { ...prev[r.id], entity: e.target.value, attr: getAttr(r) } }))}>
                        {entityNames.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    ) : getEntity(r)}
                  </td>
                  <td style={styles.td}>
                    {editingMapping === r.id ? (
                      <input style={{ ...styles.input, padding: '4px 8px', fontSize: 12 }} value={getAttr(r)} onChange={e => setMappingOverrides(prev => ({ ...prev, [r.id]: { entity: getEntity(r), attr: e.target.value } }))} />
                    ) : <span style={styles.bldmBadge}>{getAttr(r)}</span>}
                  </td>
                  <td style={styles.td}><MatchBadge match={r.match} /></td>
                  <td style={{ ...styles.td, fontSize: 12, color: COLORS.mediumGrey }}>
                    {r.match === 'new' ? 'Attribute does not exist' : r.match === 'review' ? 'Definition alignment needed' : '—'}
                  </td>
                  <td style={styles.td}>
                    {editingMapping === r.id ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button style={{ ...styles.btnPrimary, padding: '4px 10px', fontSize: 11 }} onClick={() => setEditingMapping(null)}>Save</button>
                        <button style={{ ...styles.btnSecondary, padding: '4px 10px', fontSize: 11 }} onClick={() => { setMappingOverrides(prev => { const n = { ...prev }; delete n[r.id]; return n; }); setEditingMapping(null); }}>Cancel</button>
                      </div>
                    ) : (
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} onClick={() => setEditingMapping(r.id)} title="Edit mapping">
                        <Pencil size={14} color={COLORS.mediumGrey} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {userMappings.map((m, i) => (
                <tr key={`user-${i}`} style={{ background: `${COLORS.green}04` }}>
                  <td style={styles.td}>{reqs.length + i + 1}</td>
                  <td style={styles.td}><span style={styles.frimTerm}>{m.frim}</span></td>
                  <td style={styles.td}>{m.entity}</td>
                  <td style={styles.td}><span style={styles.bldmBadge}>{m.attr}</span></td>
                  <td style={styles.td}><MatchBadge match="new" /></td>
                  <td style={{ ...styles.td, fontSize: 12, color: COLORS.mediumGrey }}>User-added</td>
                  <td style={styles.td}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} onClick={() => setUserMappings(prev => prev.filter((_, j) => j !== i))}>
                      <Trash2 size={14} color={COLORS.red} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddMapping && (
        <CreateItemModal
          title="Add BLDM Mapping"
          fields={[
            { key: 'frim', label: 'FRIM Term', type: 'text' },
            { key: 'entity', label: 'BLDM Entity', type: 'select', options: entityNames },
            { key: 'attr', label: 'BLDM Attribute', type: 'text' },
          ]}
          onSave={(vals) => { setUserMappings(prev => [...prev, vals]); setShowAddMapping(false); }}
          onClose={() => setShowAddMapping(false)}
        />
      )}

      {/* BLDM Governance Queue for new attributes — Export mode */}
      {(() => {
        const newAttrsItems = reqs.filter(r => r.match === 'new');
        return newAttrsItems.length > 0 ? <GovernancePanel items={newAttrsItems} type="bldm" exportMode /> : null;
      })()}

      {/* Export & Next buttons */}
      <div className="r-btn-row" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <button style={{ ...styles.btnSecondary, display: 'flex', alignItems: 'center', gap: 6 }} onClick={handleExport}>
          <Download size={14} /> Export BLDM Mapping
        </button>
        <button style={styles.btnPrimary} onClick={onNext}>
          Next: DDS Availability <ArrowRight size={16} />
        </button>
      </div>

      <ReviewPanel step={4} />
    </div>
  );
}

// ============================================================
// Step 6 — Data Origination (was Step 4)
// ============================================================
function Step6Origination({ selectedUC, onNext }) {
  const reqs = REQUIREMENTS[selectedUC] || [];
  const [activeTab, setActiveTab] = useState('Credits');
  const mappings = SOURCE_MAPPINGS[selectedUC] || SOURCE_MAPPINGS[1];

  const domainStats = useMemo(() => {
    return ['Credits', 'Consumer', 'Markets'].map(d => {
      const count = reqs.filter(r => r.domain === d).length;
      const newCount = reqs.filter(r => r.domain === d && r.match === 'new').length;
      return { domain: d, count, newCount };
    });
  }, [reqs]);

  const sourceInfo = {
    Credits: { systems: 'Credit Risk Engine, Risk Model Engine, GL', sla: 'T+1 by 07:00 CET' },
    Consumer: { systems: 'Customer Master Data', sla: 'Near real-time + daily snapshot by 06:00 CET' },
    Markets: { systems: 'Collateral Mgmt, Rating System, Market Risk Engine', sla: 'T+1 by 08:00 CET' },
  };

  const tabMappings = mappings?.[activeTab] || [];

  return (
    <div>
      <SectionHeader sub="Dual-BLDM mapping: source domain model → F&R data model. Where does each data element come from?" tip="This step traces each data requirement back to its source system. It maps the source domain attributes (Credits, Consumer, Markets) to the F&R data model, identifying exact matches, items needing review, and new sourcing routes.">
        Step 6 — Data Origination & Cross-Domain Sourcing
      </SectionHeader>
      <OwnershipBar step={6} />

      <div style={{ ...styles.card }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40, padding: '16px 0' }}>
          {domainStats.map((d, i) => (
            <React.Fragment key={d.domain}>
              <div style={{ textAlign: 'center', padding: '16px 24px', borderRadius: 12, border: `1px solid ${COLORS.lightGrey}30`, minWidth: 140 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans }}>{d.domain}</div>
                <div style={{ fontSize: 11, color: COLORS.mediumGrey, marginTop: 2 }}>{d.count} attributes</div>
                {d.newCount > 0 && <div style={{ fontSize: 11, color: COLORS.red, marginTop: 2 }}>{d.newCount} new routes</div>}
              </div>
              {i < domainStats.length - 1 && <span />}
            </React.Fragment>
          ))}
          <ArrowRight size={24} color={COLORS.green} />
          <div style={{ textAlign: 'center', padding: '16px 24px', borderRadius: 12, border: `2px solid ${COLORS.green}`, background: `${COLORS.green}06`, minWidth: 160 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.green, ...styles.fontSans }}>F&R Data Domain</div>
            <div style={{ fontSize: 11, color: COLORS.mediumGrey, marginTop: 2 }}>{reqs.length} total requirements</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {domainStats.map(d => (
          <button key={d.domain} onClick={() => setActiveTab(d.domain)} style={{
            ...styles.btnSecondary, borderRadius: 10,
            background: activeTab === d.domain ? `${COLORS.green}10` : '#fff',
            borderColor: activeTab === d.domain ? COLORS.green : COLORS.lightGrey,
            fontWeight: activeTab === d.domain ? 700 : 400,
          }}>
            {d.domain} Domain <span style={{ ...styles.badge(`${COLORS.lightGrey}25`, COLORS.darkGrey), marginLeft: 4 }}>{d.count}</span>
          </button>
        ))}
      </div>

      <div style={{ ...styles.card }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGreen, marginBottom: 16, ...styles.fontSans }}>{activeTab} Domain → F&R BLDM</div>
        <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', padding: '0 16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.mediumGrey, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Source: {activeTab} Domain</div>
            {(() => {
              const groups = {};
              tabMappings.forEach(m => { if (!groups[m.src]) groups[m.src] = []; groups[m.src].push(m); });
              return Object.entries(groups).map(([src, items]) => (
                <div key={src} style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${COLORS.lightGrey}30`, marginBottom: 12 }}>
                  <div style={{ background: `${COLORS.petrol}0c`, padding: '8px 12px', fontSize: 12, fontWeight: 700, color: COLORS.petrol }}>{src}</div>
                  {items.map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 12px', borderTop: `1px solid ${COLORS.lightGrey}10`, fontSize: 12 }}>
                      <span style={{ ...styles.fontMono, fontSize: 11, color: COLORS.darkGrey }}>{m.srcAttr}</span>
                      <span>{m.status === 'exact' ? '✅' : m.status === 'review' ? '🟡' : <span style={{ color: COLORS.red, fontSize: 10, fontWeight: 600 }}>🔴 new</span>}</span>
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 4 }}>
            {tabMappings.slice(0, 8).map((_, i) => (
              <div key={i} style={{ width: 40, height: 2, background: `${COLORS.green}40`, position: 'relative' }}>
                <ArrowRight size={10} color={COLORS.green} style={{ position: 'absolute', right: -6, top: -4 }} />
              </div>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.mediumGrey, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Target: F&R BLDM</div>
            {(() => {
              const groups = {};
              tabMappings.forEach(m => { if (!groups[m.frEntity]) groups[m.frEntity] = []; groups[m.frEntity].push(m); });
              return Object.entries(groups).map(([ent, items]) => (
                <div key={ent} style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${COLORS.green}25`, marginBottom: 12 }}>
                  <div style={{ background: `${COLORS.green}0c`, padding: '8px 12px', fontSize: 12, fontWeight: 700, color: COLORS.green }}>{ent}</div>
                  {items.map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 12px', borderTop: `1px solid ${COLORS.lightGrey}10`, fontSize: 12 }}>
                      <span style={{ ...styles.fontMono, fontSize: 11, color: m.status === 'new' ? COLORS.red : COLORS.darkGrey }}>{m.frAttr}{m.status === 'new' ? ' (NEW)' : ''}</span>
                      <StatusDot status={m.status} />
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        </div>
        <div style={{ marginTop: 16, padding: 12, background: `${COLORS.lightGrey}0a`, borderRadius: 10, fontSize: 12, color: COLORS.darkGrey, ...styles.fontSans }}>
          <strong>{activeTab} Domain</strong> | Systems: {sourceInfo[activeTab]?.systems} | SLA: {sourceInfo[activeTab]?.sla}
        </div>
        {tabMappings.filter(m => m.note).length > 0 && (
          <div style={{ marginTop: 12, padding: 12, background: `${COLORS.yellow}08`, borderRadius: 10, border: `1px solid ${COLORS.yellow}30` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#92750a', marginBottom: 4, ...styles.fontSans }}>⚠️ Mapping Notes</div>
            {tabMappings.filter(m => m.note).map((m, i) => (
              <div key={i} style={{ fontSize: 12, color: COLORS.darkGrey, marginTop: 4 }}><strong>{m.srcAttr} → {m.frAttr}:</strong> {m.note}</div>
            ))}
          </div>
        )}
      </div>

      <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 0', fontSize: 13, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans }}>Cross-Domain Mapping Table</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>FRIM Lexicon Term</th>
                <th style={styles.th}>Source Domain</th>
                <th style={styles.th}>Source Entity</th>
                <th style={styles.th}>Source Attribute</th>
                <th style={styles.th}></th>
                <th style={styles.th}>F&R Entity</th>
                <th style={styles.th}>F&R Attribute</th>
                <th style={styles.th}>Route</th>
              </tr>
            </thead>
            <tbody>
              {tabMappings.slice(0, 15).map((m, i) => (
                <tr key={i} style={{ transition: 'background 0.15s' }}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}><span style={{ ...styles.frimTerm, fontSize: 12 }}>{reqs.find(r => r.attr === m.frAttr || r.entity === m.frEntity)?.frim || m.frAttr}</span></td>
                  <td style={styles.td}><DomainBadge domain={activeTab} /></td>
                  <td style={styles.td}>{m.src}</td>
                  <td style={styles.td}><span style={styles.bldmBadge}>{m.srcAttr}</span></td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>→</td>
                  <td style={styles.td}>{m.frEntity}</td>
                  <td style={styles.td}><span style={styles.bldmBadge}>{m.frAttr}</span></td>
                  <td style={styles.td}><MatchBadge match={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ ...styles.cardSmall, background: `${COLORS.green}06`, border: `1px solid ${COLORS.green}18` }}>
        <div style={{ fontSize: 13, color: COLORS.darkGreen, ...styles.fontSans }}>
          <strong>Sourcing Summary:</strong> Source domains: 3 | Active routes: {reqs.filter(r => r.match === 'exact').length} ({Math.round(reqs.filter(r => r.match === 'exact').length / reqs.length * 100)}%) | Review: {reqs.filter(r => r.match === 'review').length} | New: {reqs.filter(r => r.match === 'new').length} | Primary coordination: Markets domain
        </div>
      </div>

      {/* Export, Create & Next buttons */}
      <div className="r-btn-row" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <button style={{ ...styles.btnSecondary, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => alert('Add Source Mapping modal — coming soon')}>
          <Plus size={14} /> Add Source Mapping
        </button>
        <button style={{ ...styles.btnSecondary, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => {
          const data = tabMappings.map(m => ({ 'Source': m.src, 'Source Attr': m.srcAttr, 'F&R Entity': m.frEntity, 'F&R Attr': m.frAttr, 'Status': m.status, 'Note': m.note || '' }));
          exportToExcel(data, 'Source Mapping', `Source_Mapping_UC${selectedUC}.xlsx`);
        }}>
          <Download size={14} /> Export Source Mapping
        </button>
        <button style={styles.btnPrimary} onClick={onNext}>
          Next: Gap Analysis <ArrowRight size={16} />
        </button>
      </div>

      <ReviewPanel step={6} />
    </div>
  );
}

// ============================================================
// Step 7 — Gap Analysis (was Step 5)
// ============================================================
function Step7Gap({ selectedUC, birdEnabled, onNext }) {
  const reqs = REQUIREMENTS[selectedUC] || [];
  const stats = useMemo(() => getStats(reqs), [reqs]);
  const [kpiFilter, setKpiFilter] = useState(null);

  const chartData = useMemo(() => {
    return ['Credits', 'Consumer', 'Markets'].map(d => ({
      domain: d,
      Available: reqs.filter(r => r.domain === d && r.match === 'exact').length,
      Review: reqs.filter(r => r.domain === d && r.match === 'review').length,
      Gap: reqs.filter(r => r.domain === d && r.match === 'new').length,
    }));
  }, [reqs]);

  const pieData = [
    { name: 'Available', value: stats.exact, fill: COLORS.green },
    { name: 'Review', value: stats.review, fill: COLORS.yellow },
    { name: 'New/Gap', value: stats.newR, fill: COLORS.red },
  ];

  const filteredGapReqs = useMemo(() => {
    let filtered = reqs;
    if (kpiFilter === 'available') filtered = reqs.filter(r => r.match === 'exact');
    else if (kpiFilter === 'review') filtered = reqs.filter(r => r.match === 'review');
    else if (kpiFilter === 'new') filtered = reqs.filter(r => r.match === 'new');
    else if (kpiFilter === 'cde') filtered = reqs.filter(r => r.cde && r.match === 'new');
    else filtered = reqs.filter(r => r.match !== 'exact');
    return filtered;
  }, [reqs, kpiFilter]);

  return (
    <div>
      <SectionHeader sub={STEP_TOOLTIPS[7]?.main || "Executive overview: what do we have, what's missing, and what needs to happen?"} tip={STEP_TOOLTIPS[7]?.gap || "Gap analysis dashboard showing coverage and effort required."}>
        Step 7 — Gap Analysis & Data Availability
      </SectionHeader>
      <OwnershipBar step={7} />

      {/* Clickable KPI Cards */}
      <div className="r-kpi" style={{ display: 'grid', gridTemplateColumns: birdEnabled ? 'repeat(6, 1fr)' : 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Available in F&R DDS" value={stats.exact} color={COLORS.green} active={kpiFilter === 'available'} onClick={() => setKpiFilter(kpiFilter === 'available' ? null : 'available')} />
        <KpiCard label="Review Needed" value={stats.review} color={COLORS.yellow} active={kpiFilter === 'review'} onClick={() => setKpiFilter(kpiFilter === 'review' ? null : 'review')} />
        <KpiCard label="New Sourcing Required" value={stats.newR} color={COLORS.red} active={kpiFilter === 'new'} onClick={() => setKpiFilter(kpiFilter === 'new' ? null : 'new')} />
        <KpiCard label="Requirements Coverage" value={`${stats.coverage}%`} color={COLORS.green} />
        <KpiCard label="New CDEs to Register" value={stats.newCdes} color={COLORS.yellow} active={kpiFilter === 'cde'} onClick={() => setKpiFilter(kpiFilter === 'cde' ? null : 'cde')} />
        {birdEnabled && <KpiCard label="BIRD Alignment" value={stats.birdTotal > 0 ? `${Math.round(stats.birdAligned / stats.birdTotal * 100)}%` : '0%'} color={COLORS.petrol} />}
      </div>

      <div className="r-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ ...styles.card }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGreen, marginBottom: 16, ...styles.fontSans }}>Breakdown by Source Domain</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={`${COLORS.lightGrey}30`} />
              <XAxis dataKey="domain" fontSize={12} tick={{ fill: COLORS.darkGrey }} />
              <YAxis fontSize={12} tick={{ fill: COLORS.darkGrey }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Available" fill={COLORS.green} radius={[6, 6, 0, 0]} />
              <Bar dataKey="Review" fill={COLORS.yellow} radius={[6, 6, 0, 0]} />
              <Bar dataKey="Gap" fill={COLORS.red} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ ...styles.card }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGreen, marginBottom: 16, ...styles.fontSans }}>Coverage Overview</div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} fontSize={11}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ ...styles.card }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGreen, marginBottom: 12, ...styles.fontSans }}>🔶 CDE Impact Panel</div>
        <div className="r-kpi" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Total CDE Candidates', value: stats.cdes, bg: `${COLORS.yellow}0c` },
            { label: 'Already Registered', value: stats.cdes - stats.newCdes, bg: `${COLORS.green}08` },
            { label: 'New Registrations', value: stats.newCdes, bg: `${COLORS.red}08` },
            { label: 'Approval Required', value: stats.newCdes, bg: `${COLORS.yellow}0c` },
          ].map((d, i) => (
            <div key={i} style={{ background: d.bg, borderRadius: 10, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: i === 0 || i === 3 ? '#92750a' : i === 1 ? COLORS.green : COLORS.red, ...styles.fontSerif }}>{d.value}</div>
              <div style={{ fontSize: 11, color: COLORS.darkGrey }}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...styles.card }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGreen, marginBottom: 12, ...styles.fontSans }}>📊 DQ Readiness Panel</div>
        <div className="r-kpi" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Meeting Thresholds', value: `${stats.exact}/${stats.total}`, color: COLORS.green },
            { label: 'Completeness Risks', value: stats.newR, color: COLORS.red },
            { label: 'Timeliness Gaps', value: 0, color: COLORS.green },
            { label: 'Cross-Domain Checks', value: stats.review, color: COLORS.yellow },
          ].map((d, i) => (
            <div key={i} style={{ background: `${d.color}08`, borderRadius: 10, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: d.color, ...styles.fontSerif }}>{d.value}</div>
              <div style={{ fontSize: 11, color: COLORS.darkGrey }}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 0', fontSize: 13, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans }}>Detailed Gap Table</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>FRIM Lexicon Term</th>
                <th style={styles.th}>F&R DDS Status</th>
                <th style={styles.th}>Source Available?</th>
                <th style={styles.th}>Gap Type</th>
                <th style={styles.th}>CDE</th>
                <th style={styles.th}>DQ Risk</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredGapReqs.map((r, i) => (
                <tr key={r.id} style={{ transition: 'background 0.15s' }}>
                  <td style={styles.td}>{r.id}</td>
                  <td style={styles.td}><span style={styles.frimTerm}>{r.frim}</span></td>
                  <td style={styles.td}><MatchBadge match={r.match} /></td>
                  <td style={styles.td}>{r.match === 'exact' ? <span style={{ color: COLORS.green }}>Yes</span> : r.match === 'review' ? <span style={{ color: COLORS.yellow }}>Partial</span> : <span style={{ color: COLORS.red }}>No</span>}</td>
                  <td style={{ ...styles.td, fontSize: 12, color: COLORS.darkGrey }}>{r.match === 'new' ? 'New attribute + sourcing route' : r.match === 'review' ? 'Definition alignment' : 'Available'}</td>
                  <td style={styles.td}><CdeBadge cde={r.cde} /></td>
                  <td style={styles.td}>{r.cde && r.match === 'new' ? <span style={{ color: COLORS.red, fontSize: 12, fontWeight: 600 }}>High</span> : r.match === 'exact' ? <span style={{ color: COLORS.green, fontSize: 12 }}>Low</span> : <span style={{ color: COLORS.yellow, fontSize: 12 }}>Medium</span>}</td>
                  <td style={{ ...styles.td, fontSize: 12, color: COLORS.darkGrey }}>{r.match === 'new' ? 'Add + source + register CDE' : r.match === 'review' ? 'Review definition' : 'None'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Use Case Matrix — Cross-UC dependency detection */}
      <div style={{ ...styles.card }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={16} color={COLORS.petrol} /> Use Case Matrix
              <InfoTooltip text="Shows which FRIM terms are shared across multiple use cases. Shared terms mean one change impacts multiple deliverables — coordinate with other UC owners." />
            </div>
            <div style={{ fontSize: 12, color: COLORS.mediumGrey, marginTop: 4, ...styles.fontSans }}>
              Cross-use-case data element dependencies — shared FRIM terms that appear in this use case and others
            </div>
          </div>
          <span style={styles.badge(`${COLORS.petrol}15`, COLORS.petrol)}>
            {Object.entries(USE_CASE_MATRIX || {}).filter(([, ucs]) => ucs.includes(selectedUC) && ucs.length > 1).length} shared terms
          </span>
        </div>
        {(() => {
          const sharedTerms = Object.entries(USE_CASE_MATRIX || {})
            .filter(([, ucs]) => ucs.includes(selectedUC) && ucs.length > 1)
            .sort((a, b) => b[1].length - a[1].length);
          if (sharedTerms.length === 0) return <div style={{ fontSize: 13, color: COLORS.mediumGrey, fontStyle: 'italic', padding: 20, textAlign: 'center' }}>No shared terms with other use cases</div>;
          return (
            <div style={{ borderRadius: 10, overflow: 'hidden', overflowX: 'auto', border: `1px solid ${COLORS.lightGrey}20` }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={styles.th}>FRIM Term</th>
                    <th style={styles.th}>Shared With</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>UCs</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {sharedTerms.slice(0, 15).map(([term, ucs]) => (
                    <tr key={term} style={{ transition: 'background 0.15s' }}>
                      <td style={styles.td}><span style={styles.frimTerm}>{term}</span></td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {ucs.filter(id => id !== selectedUC).map(id => {
                            const uc = USE_CASE_LIST.find(u => u.id === id);
                            return uc ? (
                              <span key={id} style={{ ...styles.badge(`${COLORS.petrol}10`, COLORS.petrol), fontSize: 10, padding: '2px 8px' }}>
                                {uc.icon} {uc.label}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: ucs.length > 4 ? COLORS.red : ucs.length > 2 ? '#92750a' : COLORS.green }}>{ucs.length}</span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        {ucs.length > 4 ? <span style={styles.badge(`${COLORS.red}15`, COLORS.red)}>High</span>
                          : ucs.length > 2 ? <span style={styles.badge(`${COLORS.yellow}25`, '#92750a')}>Medium</span>
                          : <span style={styles.badge(`${COLORS.green}15`, COLORS.green)}>Low</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sharedTerms.length > 15 && (
                <div style={{ padding: 12, textAlign: 'center', fontSize: 12, color: COLORS.mediumGrey, borderTop: `1px solid ${COLORS.lightGrey}18` }}>
                  Showing 15 of {sharedTerms.length} shared terms
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Export, Create & Next buttons */}
      <div className="r-btn-row" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <button style={{ ...styles.btnSecondary, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => alert('Add Gap Item modal — coming soon')}>
          <Plus size={14} /> Add Gap Item
        </button>
        <button style={{ ...styles.btnSecondary, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => {
          const data = reqs.filter(r => r.match !== 'exact').map(r => ({
            'ID': r.id, 'FRIM Term': r.frim, 'Status': r.match, 'CDE': r.cde ? 'Yes' : 'No',
            'Gap Type': r.match === 'new' ? 'New attribute + sourcing' : 'Definition alignment',
            'DQ Risk': r.cde && r.match === 'new' ? 'High' : 'Medium',
          }));
          exportToExcel(data, 'Gap Analysis', `Gap_Analysis_UC${selectedUC}.xlsx`);
        }}>
          <Download size={14} /> Export Gap Analysis
        </button>
        <button style={styles.btnPrimary} onClick={onNext}>
          Next: Handoff & Actions <ArrowRight size={16} />
        </button>
      </div>

      <ReviewPanel step={7} />
    </div>
  );
}

// ============================================================
// Step 8 — Handoff & Actions (was Step 6)
// ============================================================
function Step8Handoff({ selectedUC }) {
  const reqs = REQUIREMENTS[selectedUC] || [];
  const stats = useMemo(() => getStats(reqs), [reqs]);
  const ucInfo = USE_CASES[selectedUC] || {};
  const ucLabel = USE_CASE_LIST.find(u => u.id === selectedUC)?.label || '';

  const processSteps = [
    { label: 'UC Intake', done: true },
    { label: 'Business Need', done: true },
    { label: 'FRIM Map', done: true },
    { label: 'BLDM Map', done: true },
    { label: 'DDS Check', done: true },
    { label: 'Data Orig', done: true },
    { label: 'Gap Analysis', done: true },
    { label: 'Handoff', done: true },
  ];

  // Data Products derived from the use case
  const dataProducts = useMemo(() => {
    const domains = [...new Set(reqs.map(r => r.domain))];
    return domains.map(d => {
      const domainReqs = reqs.filter(r => r.domain === d);
      const entities = [...new Set(domainReqs.map(r => r.entity))];
      return {
        name: `${ucLabel} — ${d} Data Product`,
        domain: d,
        owner: `${d} Domain`,
        attrCount: domainReqs.length,
        cdeCount: domainReqs.filter(r => r.cde).length,
        newCount: domainReqs.filter(r => r.match === 'new').length,
        entities,
        sla: d === 'Credits' ? 'T+1 by 07:00 CET' : d === 'Consumer' ? 'Daily by 06:00 CET' : 'T+1 by 08:00 CET',
        frequency: ucInfo.frequency || 'Quarterly',
        format: 'Delta Parquet → Databricks Unity Catalog',
        quality: domainReqs.filter(r => r.match === 'exact').length / domainReqs.length * 100,
      };
    });
  }, [reqs, ucLabel, ucInfo]);

  return (
    <div>
      <SectionHeader sub="Structured output for the next steps. Who needs to do what?" tip="This is the final handoff step. It lists all action items, data products to be created, assigned teams, priorities, and dependencies. Export the requirements package, create Jira tickets, or notify stakeholders to kick off implementation.">
        Step 8 — Handoff & Change Process Actions
      </SectionHeader>
      <OwnershipBar step={8} />

      <div style={{ ...styles.card }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGreen, marginBottom: 16, ...styles.fontSans }}>Change Process Status</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', padding: '8px 0' }}>
          {processSteps.map((s, i) => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80, gap: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.done ? COLORS.green : `${COLORS.lightGrey}30`, color: s.done ? '#fff' : COLORS.mediumGrey, transition: 'all 0.2s' }}>
                  {s.done ? <Check size={16} /> : <Circle size={16} />}
                </div>
                <div style={{ fontSize: 10, color: s.done ? COLORS.green : COLORS.mediumGrey, textAlign: 'center', fontWeight: s.done ? 600 : 400, ...styles.fontSans }}>{s.label}</div>
              </div>
              {i < processSteps.length - 1 && (
                <div style={{ height: 2, flex: 1, minWidth: 16, background: s.done && processSteps[i + 1]?.done ? COLORS.green : `${COLORS.lightGrey}30`, marginBottom: 20 }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={{ ...styles.card, borderLeft: `4px solid ${COLORS.green}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGreen, marginBottom: 12, ...styles.fontSans }}>FRIM Update Summary</div>
        <div className="r-kpi" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {[
            { label: 'New Lexicon Terms', value: stats.newR },
            { label: 'Modified Definitions', value: stats.review },
            { label: 'New BLDM Attributes', value: stats.newR },
            { label: 'BLDM Entities Affected', value: new Set(reqs.filter(r => r.match === 'new').map(r => r.entity)).size },
            { label: 'CDE Registrations', value: stats.newCdes },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: 10, background: `${COLORS.green}06`, borderRadius: 10 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.green, ...styles.fontSerif }}>{s.value}</div>
              <div style={{ fontSize: 11, color: COLORS.darkGrey }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Products */}
      <div style={{ ...styles.card, borderLeft: `4px solid ${COLORS.petrol}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={16} color={COLORS.petrol} /> Data Products
            </div>
            <div style={{ fontSize: 12, color: COLORS.mediumGrey, marginTop: 4, ...styles.fontSans }}>
              Data products to be created or updated in the F&R Data Delivery Service (DDS)
            </div>
          </div>
          <span style={styles.badge(`${COLORS.petrol}15`, COLORS.petrol)}>{dataProducts.length} products</span>
        </div>
        <div className="r-grid" style={{ display: 'grid', gridTemplateColumns: dataProducts.length > 2 ? 'repeat(3, 1fr)' : `repeat(${dataProducts.length}, 1fr)`, gap: 14 }}>
          {dataProducts.map((dp, i) => (
            <div key={i} style={{ borderRadius: 12, border: `1px solid ${COLORS.lightGrey}30`, overflow: 'hidden', transition: 'box-shadow 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ background: `${COLORS.petrol}10`, padding: '12px 16px', borderBottom: `1px solid ${COLORS.lightGrey}20` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans }}>{dp.name}</div>
                <div style={{ fontSize: 11, color: COLORS.mediumGrey, marginTop: 2 }}>Owner: <strong>{dp.owner}</strong></div>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 12, ...styles.fontSans }}>
                  <div>
                    <div style={{ color: COLORS.mediumGrey, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Attributes</div>
                    <div style={{ color: COLORS.darkGreen, fontWeight: 600, marginTop: 2 }}>{dp.attrCount} <span style={{ fontWeight: 400, color: COLORS.mediumGrey }}>({dp.cdeCount} CDE)</span></div>
                  </div>
                  <div>
                    <div style={{ color: COLORS.mediumGrey, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>New</div>
                    <div style={{ color: dp.newCount > 0 ? COLORS.red : COLORS.green, fontWeight: 600, marginTop: 2 }}>{dp.newCount > 0 ? `${dp.newCount} to add` : 'All existing'}</div>
                  </div>
                  <div>
                    <div style={{ color: COLORS.mediumGrey, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>SLA</div>
                    <div style={{ color: COLORS.darkGreen, fontWeight: 500, marginTop: 2 }}>{dp.sla}</div>
                  </div>
                  <div>
                    <div style={{ color: COLORS.mediumGrey, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Frequency</div>
                    <div style={{ color: COLORS.darkGreen, fontWeight: 500, marginTop: 2 }}>{dp.frequency}</div>
                  </div>
                </div>
                <div style={{ marginTop: 10, padding: '6px 10px', background: `${COLORS.lightGrey}10`, borderRadius: 6, fontSize: 10, color: COLORS.mediumGrey, ...styles.fontMono }}>
                  <Server size={10} style={{ display: 'inline', marginRight: 4 }} /> {dp.format}
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {dp.entities.slice(0, 4).map(e => (
                    <span key={e} style={styles.bldmBadge}>{e}</span>
                  ))}
                  {dp.entities.length > 4 && <span style={{ ...styles.bldmBadge, fontStyle: 'italic' }}>+{dp.entities.length - 4} more</span>}
                </div>
                <div style={{ marginTop: 10, background: `${COLORS.green}08`, borderRadius: 6, padding: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 6, background: `${COLORS.lightGrey}20`, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round(dp.quality)}%`, background: dp.quality > 80 ? COLORS.green : dp.quality > 50 ? COLORS.yellow : COLORS.red, borderRadius: 3, transition: 'width 0.5s' }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: dp.quality > 80 ? COLORS.green : dp.quality > 50 ? '#92750a' : COLORS.red }}>{Math.round(dp.quality)}%</span>
                  </div>
                  <div style={{ fontSize: 9, color: COLORS.mediumGrey, marginTop: 2, textAlign: 'center' }}>Coverage (existing FRIM matches)</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 0', fontSize: 13, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans }}>Action Items</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={styles.th}>Team</th>
                <th style={styles.th}>Action</th>
                <th style={styles.th}>Priority</th>
                <th style={styles.th}>Dependency</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {ACTION_ITEMS.map((a, i) => (
                <tr key={i} style={{ transition: 'background 0.15s' }}>
                  <td style={{ ...styles.td, fontWeight: 600, fontSize: 12 }}>{a.team}</td>
                  <td style={{ ...styles.td, fontSize: 12 }}>{a.action}</td>
                  <td style={styles.td}>
                    <span style={styles.badge(a.priority === 'High' ? `${COLORS.red}15` : `${COLORS.yellow}18`, a.priority === 'High' ? COLORS.red : '#92750a')}>
                      {a.priority}
                    </span>
                  </td>
                  <td style={{ ...styles.td, fontSize: 12, color: COLORS.mediumGrey }}>{a.dep}</td>
                  <td style={styles.td}>
                    <span style={styles.badge(`${COLORS.lightGrey}20`, COLORS.darkGrey)}>
                      <Clock size={10} /> Pending
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
        <button style={{ ...styles.btnPrimary, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => {
          const data = reqs.map(r => ({
            'ID': r.id, 'FRIM Term': r.frim, 'Entity': r.entity, 'Attribute': r.attr,
            'Match': r.match, 'CDE': r.cde ? 'Yes' : 'No', 'Domain': r.domain, 'Reg Ref': r.regRef,
          }));
          exportToExcel(data, 'Requirements Package', `Requirements_Package_UC${selectedUC}.xlsx`);
        }}>
          <Download size={14} /> Export Requirements Package
        </button>
        <button style={{ ...styles.btnSecondary, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => {
          const data = ACTION_ITEMS.map(a => ({ 'Team': a.team, 'Action': a.action, 'Priority': a.priority, 'Dependency': a.dep, 'Status': 'Pending' }));
          exportToExcel(data, 'Action Items', `Action_Items_UC${selectedUC}.xlsx`);
        }}>
          <ExternalLink size={14} /> Export Action Items
        </button>
        <button style={styles.btnSecondary}><Bell size={14} /> Notify Stakeholders</button>
        <button style={{ ...styles.btnSecondary, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => {
          const data = reqs.filter(r => r.match === 'new').map(r => ({
            'FRIM Term': r.frim, 'Definition': r.def, 'Entity': r.entity, 'Attribute': r.attr, 'CDE': r.cde ? 'Yes' : 'No',
          }));
          exportToExcel(data, 'FRIM Change Request', `FRIM_Change_Request_UC${selectedUC}.xlsx`);
        }}>
          <FileText size={14} /> Export FRIM Change Request
        </button>
        <button style={{ ...styles.btnSecondary, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => {
          const data = dataProducts.map(dp => ({
            'Product': dp.name, 'Domain': dp.domain, 'Owner': dp.owner, 'Attributes': dp.attrCount,
            'CDEs': dp.cdeCount, 'New': dp.newCount, 'SLA': dp.sla, 'Frequency': dp.frequency, 'Format': dp.format,
          }));
          exportToExcel(data, 'Data Products', `Data_Products_UC${selectedUC}.xlsx`);
        }}>
          <Package size={14} /> Export Data Product Spec
        </button>
        <button style={{ ...styles.btnSecondary, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => alert('Add Action Item modal — coming soon')}>
          <Plus size={14} /> Add Action Item
        </button>
      </div>
      <ReviewPanel step={8} />
    </div>
  );
}

// ============================================================
// Portfolio View — Admin/Manager Overview
// ============================================================
function PortfolioView({ setActiveStep, setSelectedUC }) {
  const statusColors = { 'In Progress': COLORS.yellow, 'Completed': COLORS.green, 'Not Started': COLORS.mediumGrey, 'Blocked': COLORS.red };
  const stepLabels = ['Intake', 'Business Need', 'FRIM', 'BLDM', 'DDS', 'Origination', 'Gap', 'Handoff'];

  const ucPortfolio = useMemo(() => {
    return USE_CASE_LIST.map(uc => {
      const reqs = REQUIREMENTS[uc.id] || [];
      const stats = getStats(reqs);
      const persona = PERSONAS.find(p => p.id === uc.personaId);
      // Simulate progress — use coverage & match stats to determine step completion
      const progress = Math.min(8, Math.max(1, Math.round(stats.coverage / 14) + 1));
      const status = progress >= 8 ? 'Completed' : progress >= 4 ? 'In Progress' : progress >= 2 ? 'In Progress' : 'Not Started';
      return { ...uc, reqs: reqs.length, stats, persona, progress, status, coverage: stats.coverage };
    });
  }, []);

  const totalUCs = ucPortfolio.length;
  const completed = ucPortfolio.filter(u => u.status === 'Completed').length;
  const inProgress = ucPortfolio.filter(u => u.status === 'In Progress').length;
  const notStarted = ucPortfolio.filter(u => u.status === 'Not Started').length;
  const avgCoverage = Math.round(ucPortfolio.reduce((s, u) => s + u.coverage, 0) / totalUCs);

  const personaGroups = useMemo(() => {
    const groups = {};
    ucPortfolio.forEach(uc => {
      const key = uc.personaId;
      if (!groups[key]) groups[key] = { persona: uc.persona, ucs: [] };
      groups[key].ucs.push(uc);
    });
    return Object.values(groups);
  }, [ucPortfolio]);

  return (
    <div>
      <SectionHeader sub="Admin/Manager dashboard showing all use cases and their current status across the data requirements process." tip="Portfolio view provides a bird's-eye view of all use cases registered in the tool.">
        Portfolio View — All Use Cases
      </SectionHeader>

      {/* Summary KPIs */}
      <div className="r-kpi" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        <KpiCard label="Total Use Cases" value={totalUCs} color={COLORS.petrol} />
        <KpiCard label="Completed" value={completed} color={COLORS.green} />
        <KpiCard label="In Progress" value={inProgress} color={COLORS.yellow} />
        <KpiCard label="Not Started" value={notStarted} color={COLORS.mediumGrey} />
        <KpiCard label="Avg Coverage" value={`${avgCoverage}%`} color={COLORS.green} />
      </div>

      {/* Visual Status Grid */}
      <div style={{ ...styles.card, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.darkGreen, marginBottom: 16, ...styles.fontSans }}>
          <Eye size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Use Case Status Overview
        </div>
        <div className="r-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {ucPortfolio.map(uc => (
            <div key={uc.id} onClick={() => { setSelectedUC(uc.id); setActiveStep(1); }} style={{
              borderRadius: 14, border: `1px solid ${COLORS.lightGrey}30`, overflow: 'hidden', cursor: 'pointer',
              transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${COLORS.lightGrey}15`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{uc.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGreen, ...styles.fontSans }}>{uc.label}</div>
                    <div style={{ fontSize: 11, color: COLORS.mediumGrey }}>{uc.persona?.label}</div>
                  </div>
                </div>
                <span style={{
                  ...styles.badge(
                    `${statusColors[uc.status]}20`,
                    uc.status === 'In Progress' ? '#92750a' : statusColors[uc.status]
                  ),
                  fontSize: 10, fontWeight: 700
                }}>
                  {uc.status}
                </span>
              </div>
              <div style={{ padding: '12px 16px' }}>
                {/* Step progress bar */}
                <div style={{ display: 'flex', gap: 3, marginBottom: 10 }}>
                  {stepLabels.map((label, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{
                        height: 6, borderRadius: 3,
                        background: i < uc.progress ? COLORS.green : `${COLORS.lightGrey}30`,
                        transition: 'background 0.3s',
                      }} />
                      <div style={{ fontSize: 8, color: i < uc.progress ? COLORS.green : COLORS.mediumGrey, marginTop: 3 }}>{label}</div>
                    </div>
                  ))}
                </div>
                {/* Stats row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: COLORS.darkGrey }}>
                  <span>{uc.reqs} reqs</span>
                  <span style={{ color: COLORS.green, fontWeight: 600 }}>{uc.stats.exact} matched</span>
                  <span style={{ color: COLORS.yellow }}>{uc.stats.review} review</span>
                  <span style={{ color: COLORS.red }}>{uc.stats.newR} new</span>
                </div>
                {/* Coverage bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <div style={{ flex: 1, height: 6, background: `${COLORS.lightGrey}25`, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${uc.coverage}%`, background: uc.coverage > 70 ? COLORS.green : uc.coverage > 40 ? COLORS.yellow : COLORS.red, borderRadius: 3, transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: uc.coverage > 70 ? COLORS.green : uc.coverage > 40 ? '#92750a' : COLORS.red }}>{uc.coverage}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grouped by Persona */}
      <div style={{ ...styles.card }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.darkGreen, marginBottom: 16, ...styles.fontSans }}>
          <Building2 size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          By Persona / Grid
        </div>
        {personaGroups.map(({ persona, ucs }) => (
          <div key={persona?.id} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>{persona?.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGreen }}>{persona?.label}</span>
              <span style={styles.badge(`${COLORS.petrol}15`, COLORS.petrol)}>{ucs.length} UC{ucs.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={styles.th}>Use Case</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>Step</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>Status</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>Reqs</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>Matched</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>New</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {ucs.map(uc => (
                    <tr key={uc.id} style={{ cursor: 'pointer', transition: 'background 0.15s' }} onClick={() => { setSelectedUC(uc.id); setActiveStep(1); }}>
                      <td style={styles.td}>
                        <span style={{ marginRight: 8 }}>{uc.icon}</span>
                        <span style={{ fontWeight: 600 }}>{uc.label}</span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.petrol }}>{uc.progress}/8</span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span style={{ ...styles.badge(`${statusColors[uc.status]}20`, uc.status === 'In Progress' ? '#92750a' : statusColors[uc.status]), fontSize: 10, fontWeight: 700 }}>
                          {uc.status}
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center', fontWeight: 600 }}>{uc.reqs}</td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span style={styles.badge(`${COLORS.green}15`, COLORS.green)}>{uc.stats.exact}</span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span style={styles.badge(`${COLORS.red}15`, COLORS.red)}>{uc.stats.newR}</span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                          <div style={{ width: 60, height: 6, background: `${COLORS.lightGrey}25`, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${uc.coverage}%`, background: uc.coverage > 70 ? COLORS.green : uc.coverage > 40 ? COLORS.yellow : COLORS.red, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: uc.coverage > 70 ? COLORS.green : '#92750a' }}>{uc.coverage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Export */}
      <div className="r-btn-row" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <button style={{ ...styles.btnPrimary, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => {
          const data = ucPortfolio.map(uc => ({
            'Use Case': uc.label, 'Persona': uc.persona?.label, 'Status': uc.status, 'Step': `${uc.progress}/8`,
            'Requirements': uc.reqs, 'Matched': uc.stats.exact, 'Review': uc.stats.review, 'New': uc.stats.newR,
            'Coverage': `${uc.coverage}%`,
          }));
          exportToExcel(data, 'Portfolio', 'Portfolio_Overview.xlsx');
        }}>
          <Download size={14} /> Export Portfolio
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Main App
// ============================================================
export default function App() {
  const isMobile = useIsMobile();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState('fin_risk');
  const [selectedUC, setSelectedUC] = useState(1);
  const [selectedRegs, setSelectedRegs] = useState(UC_PRESELECTIONS[1].regs);
  const [selectedPolicies, setSelectedPolicies] = useState(UC_PRESELECTIONS[1].policies);
  const [selectedRefs, setSelectedRefs] = useState(UC_PRESELECTIONS[1].refs);
  const [selectedEntities, setSelectedEntities] = useState(ENTITY_PRESELECTIONS[1] || []);

  const birdEnabled = selectedRefs.includes('bird_ldm');
  const birdTransformationsEnabled = selectedRefs.includes('bird_tr');

  // When persona/grid changes, auto-select first UC in that grid
  const handlePersonaChange = useCallback((personaId) => {
    setSelectedPersona(personaId);
    const firstUC = USE_CASE_LIST.find(u => u.personaId === personaId);
    if (firstUC) {
      const pre = UC_PRESELECTIONS[firstUC.id] || { regs: [], policies: [], refs: [] };
      setSelectedUC(firstUC.id);
      setSelectedRegs(pre.regs);
      setSelectedPolicies(pre.policies);
      setSelectedRefs(pre.refs);
      setSelectedEntities(ENTITY_PRESELECTIONS[firstUC.id] || []);
    }
  }, []);

  // When UC changes within the same grid
  const handleUCChange = useCallback((ucId) => {
    setSelectedUC(ucId);
    const pre = UC_PRESELECTIONS[ucId] || { regs: [], policies: [], refs: [] };
    setSelectedRegs(pre.regs);
    setSelectedPolicies(pre.policies);
    setSelectedRefs(pre.refs);
    setSelectedEntities(ENTITY_PRESELECTIONS[ucId] || []);
    // Also update persona to match
    const ucItem = USE_CASE_LIST.find(u => u.id === ucId);
    if (ucItem) setSelectedPersona(ucItem.personaId);
  }, []);

  const personaObj = PERSONAS.find(p => p.id === selectedPersona);
  const ucObj = USE_CASE_LIST.find(u => u.id === selectedUC);

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: COLORS.bg, ...styles.fontSans }}>
      <Sidebar activeStep={activeStep} setActiveStep={setActiveStep} selectedPersona={selectedPersona} setSelectedPersona={handlePersonaChange} selectedUC={selectedUC} setSelectedUC={handleUCChange} isMobile={isMobile} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="r-content" style={{ marginLeft: isMobile ? 0 : 300, flex: 1, display: 'flex', flexDirection: 'column', width: isMobile ? '100%' : undefined }}>
        <TopBar personaLabel={personaObj?.label || ''} ucLabel={ucObj?.label || ''} isMobile={isMobile} onMenuToggle={() => setSidebarOpen(true)} />
        <div className="r-content-inner" style={{ flex: 1, padding: isMobile ? 10 : 32, overflowY: 'auto' }}>
          {activeStep === 0 && <PortfolioView setActiveStep={setActiveStep} setSelectedUC={handleUCChange} />}
          {activeStep === 1 && (
            <Step1
              selectedPersona={selectedPersona} setSelectedPersona={handlePersonaChange}
              selectedUC={selectedUC} setSelectedUC={handleUCChange}
              onNext={() => setActiveStep(2)}
              selectedRegs={selectedRegs} setSelectedRegs={setSelectedRegs}
              selectedPolicies={selectedPolicies} setSelectedPolicies={setSelectedPolicies}
              selectedRefs={selectedRefs} setSelectedRefs={setSelectedRefs}
              selectedEntities={selectedEntities} setSelectedEntities={setSelectedEntities}
            />
          )}
          {activeStep === 2 && <Step2BusinessNeed selectedUC={selectedUC} onNext={() => setActiveStep(3)} />}
          {activeStep === 3 && <Step3FRIM selectedUC={selectedUC} birdEnabled={birdEnabled} birdTransformationsEnabled={birdTransformationsEnabled} onNext={() => setActiveStep(4)} />}
          {activeStep === 4 && <Step5BLDM selectedUC={selectedUC} birdEnabled={birdEnabled} onNext={() => setActiveStep(5)} />}
          {activeStep === 5 && <Step4DDS selectedUC={selectedUC} selectedEntities={selectedEntities} onNext={() => setActiveStep(6)} />}
          {activeStep === 6 && <Step6Origination selectedUC={selectedUC} onNext={() => setActiveStep(7)} />}
          {activeStep === 7 && <Step7Gap selectedUC={selectedUC} birdEnabled={birdEnabled} onNext={() => setActiveStep(8)} />}
          {activeStep === 8 && <Step8Handoff selectedUC={selectedUC} />}
        </div>
      </div>
    </div>
  );
}