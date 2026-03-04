import React, { useState, useRef, useEffect } from 'react'
import { callGroq, buildCafeContext, analyzeWeeklySales, analyzeInventory, analyzePricing, analyzeCustomers, generateWeeklyReport, analyzeBreakEven, renderMd, AI_CHIPS, aiTodayStr } from './aiEngine.js'
import { toFa, fc } from '../../lib/utils.js'

function AIKeyModal(props) {
  var onDone = props.onDone;
  var keyS = useState(window._groqKey || ''); var key = keyS[0]; var setKey = keyS[1];
  var testS = useState('idle'); var testState = testS[0]; var setTestState = testS[1];
  var msgS = useState(''); var msg = msgS[0]; var setMsg = msgS[1];

  async function testKey() {
    if (!key.trim()) return;
    setTestState('loading'); setMsg('');
    try {
      await callGroq([{ role: 'user', content: 'فقط بگو سلام' }], 'سلام بگو.', 10);
      setTestState('ok'); setMsg('✓ کلید معتبره!');
    } catch (e) {
      setTestState('err'); setMsg(e.message === 'INVALID_KEY' ? '✕ کلید نامعتبره' : '✕ خطا در اتصال');
    }
  }

  function save() {
    window._groqKey = key.trim();
    localStorage.setItem('groq_key', key.trim());
    onDone();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '28px', width: 400, boxShadow: '0 32px 80px rgba(0,0,0,.25)', border: '1px solid var(--line)' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#F55036,#ff6b4a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)' }}>اتصال به Groq AI</div>
          <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 4 }}>کلید رایگان Groq برای هوش مصنوعی نیاز داری، کلید API آنتروپیک نیاز داری</div>
        </div>

        <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '12px 14px', marginBottom: 16, fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.8 }}>
          ۱. برو به <strong>console.groq.com/keys</strong><br />
          ۲. روی Create API Key کلیک کن (رایگانه) کلیک کن<br />
          ۳. کلید رو اینجا paste کن
        </div>

        <div style={{ marginBottom: 10 }}>
          <input
            type="password"
            value={key}
            onChange={function(e) { setKey(e.target.value); setTestState('idle'); setMsg(''); }}
            placeholder="gsk_..."
            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--line2)', background: 'var(--surface2)', fontSize: 13, fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none', color: 'var(--t1)' }}
          />
        </div>

        {msg && (
          <div style={{ padding: '8px 12px', borderRadius: 8, marginBottom: 10, fontSize: 12, fontWeight: 600, background: testState === 'ok' ? 'var(--green-soft)' : 'var(--red-soft)', color: testState === 'ok' ? 'var(--green)' : 'var(--red)', border: '1px solid ' + (testState === 'ok' ? 'var(--green-line)' : 'var(--red-line)') }}>
            {msg}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={testKey} disabled={!key.trim() || testState === 'loading'} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid var(--line2)', background: 'var(--surface2)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--t2)', fontFamily: 'inherit' }}>
            {testState === 'loading' ? '...' : 'تست اتصال'}
          </button>
          <button onClick={save} disabled={!key.trim()} style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#F55036,#ff6b4a)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>
            ذخیره و شروع
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 10.5, color: 'var(--t3)' }}>کلید فقط در مرورگر شما ذخیره می‌شه · Groq رایگانه</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   FEATURE 2-6: AI HUB — تمام فیچرها در یک پنل
══════════════════════════════════════════════════════════════════════════════ */

function AIHub(props) {
  var D = props.D; var page = props.page; var onClose = props.onClose;

  /* tabs: chat | sales | stock | price | customer | report */
  var tabS = useState('chat'); var tab = tabS[0]; var setTab = tabS[1];

  /* chat state */
  var msgsS = useState(null); var msgs = msgsS[0]; var setMsgs = msgsS[1];
  var inputS = useState(''); var input = inputS[0]; var setInput = inputS[1];
  var chatLoadS = useState(false); var chatLoad = chatLoadS[0]; var setChatLoad = chatLoadS[1];
  var bottomRef = useRef(null);
  var inputRef = useRef(null);

  /* analysis results */
  var salesResS = useState(null); var salesRes = salesResS[0]; var setSalesRes = salesResS[1];
  var stockResS = useState(null); var stockRes = stockResS[0]; var setStockRes = stockResS[1];
  var priceResS = useState(null); var priceRes = priceResS[0]; var setPriceRes = priceResS[1];
  var custResS = useState(null); var custRes = custResS[0]; var setCustRes = custResS[1];
  var reportResS = useState(null); var reportRes = reportResS[0]; var setReportRes = reportResS[1];
  var breakResS = useState(null); var breakRes = breakResS[0]; var setBreakRes = breakResS[1];

  var loadingS = useState(''); var loadingTab = loadingS[0]; var setLoadingTab = loadingS[1];
  var errS = useState(''); var err = errS[0]; var setErr = errS[1];

  /* init greeting */
  useEffect(function() {
    if (msgs !== null) return;
    var cafeN = (D.settings && D.settings.cafeNameFa) || 'کافه شما';
    var todayInvs = (D.saleInvoices || []).filter(function(i) { return i.date === aiTodayStr(); });
    var todayRev = todayInvs.reduce(function(s, i) { return s + (i.total || 0); }, 0);
    var lowCnt = (D.ingredients || []).filter(function(ing) {
      var u = (D.recipes || []).filter(function(r) { return r.iid === ing.id; }).reduce(function(s, r) { return s + (r.qty || 0); }, 0) * (D.estOrders || 80);
      return u > 0 && Math.floor((ing.stock || 0) / u) < 3;
    }).length;
    var g = 'سلام! دستیار هوشمند ' + cafeN + ' اینجام 👋\n\n';
    if (todayInvs.length > 0) g += '**امروز ' + toFa(String(todayInvs.length)) + ' فاکتور** ثبت شده — ' + toFa(String(Math.round(todayRev / 1000))) + ' هزار تومان\n\n';
    if (lowCnt > 0) g += '⚠️ **' + toFa(String(lowCnt)) + ' ماده اولیه** موجودی بحرانی دارن\n\n';
    g += 'از تب‌های بالا هر آنالیزی می‌خوای انجام بده، یا اینجا سوال بپرس.';
    setMsgs([{ role: 'assistant', content: g, ts: new Date() }]);
  }, []);

  useEffect(function() {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, chatLoad]);

  useEffect(function() {
    if (tab === 'chat') setTimeout(function() { if (inputRef.current) inputRef.current.focus(); }, 200);
  }, [tab]);

  async function runAnalysis(type) {
    setLoadingTab(type); setErr('');
    try {
      var res;
      if (type === 'sales')   { res = await analyzeWeeklySales(D); setSalesRes(res); }
      if (type === 'stock')   { res = await analyzeInventory(D); setStockRes(res); }
      if (type === 'price')   { res = await analyzePricing(D); setPriceRes(res); }
      if (type === 'customer'){ res = await analyzeCustomers(D); setCustRes(res); }
      if (type === 'report')  { res = await generateWeeklyReport(D); setReportRes(res); }
      if (type === 'break')   { res = await analyzeBreakEven(D); setBreakRes(res); }
    } catch (e) {
      var em = e.message;
      if (em === 'NO_KEY') setErr('کلید API تنظیم نشده. پنجره رو ببند و دوباره باز کن.');
      else if (em === 'INVALID_KEY') setErr('کلید API نامعتبره. از تنظیمات دوباره وارد کن.');
      else if (em === 'RATE_LIMIT') setErr('درخواست‌ها زیاد شدن. چند ثانیه صبر کن.');
      else setErr('خطا در اتصال: ' + em);
    } finally {
      setLoadingTab('');
    }
  }

  async function sendChat(text) {
    var q = (text || input).trim();
    if (!q || chatLoad) return;
    setInput('');
    var userMsg = { role: 'user', content: q, ts: new Date() };
    setMsgs(function(p) { return (p || []).concat([userMsg]); });
    setChatLoad(true); setErr('');
    try {
      var history = (msgs || []).concat([userMsg]).map(function(m) { return { role: m.role, content: m.content }; });
      var sys = 'تو دستیار هوشمند یک کافه ایرانی هستی. به فارسی روان جواب بده. کوتاه و عملی.\n\n' + buildCafeContext(D);
      var res = await callGroq(history, sys, 900);
      setMsgs(function(p) { return (p || []).concat([{ role: 'assistant', content: res, ts: new Date() }]); });
    } catch (e) {
      var em = e.message;
      setMsgs(function(p) { return (p || []).concat([{ role: 'assistant', content: '⚠️ ' + (em === 'INVALID_KEY' ? 'کلید API نامعتبره.' : em === 'RATE_LIMIT' ? 'محدودیت نرخ. صبر کن.' : 'خطا در اتصال.'), ts: new Date() }]); });
    } finally {
      setChatLoad(false);
    }
  }

  function timeStr(ts) {
    if (!ts) return '';
    var d = ts instanceof Date ? ts : new Date(ts);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  /* ── Tab config ── */
  var TABS = [
    { id: 'chat',     label: 'چت',        icon: '💬' },
    { id: 'sales',    label: 'فروش',      icon: '📈' },
    { id: 'stock',    label: 'انبار',     icon: '📦' },
    { id: 'price',    label: 'قیمت',      icon: '💰' },
    { id: 'customer', label: 'مشتری',     icon: '👥' },
    { id: 'report',   label: 'گزارش',     icon: '📋' },
  ];

  /* ── Analysis tab renderer ── */
  function AnalysisTab(tabId, result, setResult, runFn, title, desc, btnLabel, extra) {
    var isLoading = loadingTab === tabId;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {!result ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 }}>
            <div style={{ fontSize: 42 }}>{TABS.find(function(t) { return t.id === tabId; }).icon}</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>{desc}</div>
            </div>
            {err && <div style={{ background: 'var(--red-soft)', border: '1px solid var(--red-line)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--red)', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>{err}</div>}
            <button onClick={function() { runFn(tabId); }} disabled={isLoading} style={{ padding: '11px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#F55036,#ff6b4a)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
              {isLoading
                ? <React.Fragment><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'ai-spin 0.8s linear infinite' }}/>در حال آنالیز...</React.Fragment>
                : <React.Fragment><span>✦</span>{btnLabel}</React.Fragment>
              }
            </button>
            {extra}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
              <div className="ai-result" dangerouslySetInnerHTML={{ __html: renderMd(result) }} />
            </div>
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--line)', display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={function() { setResult(null); setErr(''); }} style={{ flex: 1, padding: '8px', borderRadius: 9, border: '1.5px solid var(--line2)', background: 'var(--surface2)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--t2)', fontFamily: 'inherit' }}>↺ آنالیز مجدد</button>
              <button onClick={function() {
                var txt = result.replace(/<[^>]+>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
                if (navigator.clipboard) navigator.clipboard.writeText(txt);
              }} style={{ flex: 1, padding: '8px', borderRadius: 9, border: '1.5px solid var(--line2)', background: 'var(--surface2)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--t2)', fontFamily: 'inherit' }}>📋 کپی</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  var chips = AI_CHIPS[page] || AI_CHIPS['dashboard'];

  return (
    <div style={{
      position: 'fixed', bottom: 88, left: 24, width: 400,
      maxHeight: 'calc(100vh - 110px)',
      background: 'var(--surface)', borderRadius: 22,
      boxShadow: '0 32px 100px rgba(0,0,0,.22), 0 4px 24px rgba(0,0,0,.1)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 1002,
      border: '1px solid var(--line)',
      animation: 'ai-slide-up .3s cubic-bezier(.34,1.56,.64,1)',
    }}>

      {/* ── Header ── */}
      <div style={{ flexShrink: 0, background: 'linear-gradient(135deg,#F55036 0%,#ff6b4a 100%)', padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>دستیار هوشمند — Groq AI</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.75)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }}/>
            آنلاین · Llama-3.3-70b
          </div>
        </div>
        <button onClick={function() { if (window._groqKey) { window._groqKey = ''; localStorage.removeItem('groq_key'); window.location.reload(); } }} title="تغییر کلید API" style={{ background: 'rgba(255,255,255,.12)', border: 'none', borderRadius: 7, width: 26, height: 26, cursor: 'pointer', color: 'rgba(255,255,255,.8)', fontSize: 11, marginLeft: 2 }}>🔑</button>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,.12)', border: 'none', borderRadius: 7, width: 26, height: 26, cursor: 'pointer', color: '#fff', fontSize: 14 }}>✕</button>
      </div>

      {/* ── Tabs ── */}
      <div style={{ flexShrink: 0, display: 'flex', borderBottom: '1px solid var(--line)', background: 'var(--surface2)', overflowX: 'auto' }}>
        {TABS.map(function(t) {
          return (
            <button key={t.id} onClick={function() { setTab(t.id); setErr(''); }}
              style={{ flex: 1, padding: '9px 4px', border: 'none', borderBottom: tab === t.id ? '2.5px solid #F55036' : '2.5px solid transparent', background: 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? '#F55036' : 'var(--t3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontFamily: 'inherit', transition: '.15s', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

        {/* CHAT TAB */}
        {tab === 'chat' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 13px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(msgs || []).map(function(m, i) {
                var isAI = m.role === 'assistant';
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isAI ? 'flex-start' : 'flex-end' }}>
                    {isAI && (
                      <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#F55036', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="8" height="8" viewBox="0 0 41 41" fill="white"><path d="M21.67 20L28 16.33V23.67L21.67 20Z"/><path d="M13 24V16L20.33 20L13 24Z"/></svg>
                        </div>
                        Groq AI
                      </div>
                    )}
                    <div className="ai-msg" style={{ maxWidth: '90%', padding: isAI ? '10px 13px' : '9px 13px', borderRadius: isAI ? '4px 16px 16px 16px' : '16px 4px 16px 16px', background: isAI ? 'var(--surface2)' : 'linear-gradient(135deg,#F55036,#ff6b4a)', color: isAI ? 'var(--t1)' : '#fff', fontSize: 12.5, lineHeight: 1.7, border: isAI ? '1px solid var(--line)' : 'none', boxShadow: isAI ? 'none' : '0 2px 12px rgba(245,80,54,.3)' }}
                      dangerouslySetInnerHTML={{ __html: renderMd(m.content) }} />
                    <div style={{ fontSize: 9.5, color: 'var(--t3)', marginTop: 2, paddingInlineEnd: 4 }}>{timeStr(m.ts)}</div>
                  </div>
                );
              })}
              {chatLoad && (
                <div style={{ display: 'flex', gap: 4, padding: '10px 14px', background: 'var(--surface2)', borderRadius: '4px 16px 16px 16px', border: '1px solid var(--line)', width: 'fit-content' }}>
                  {[0, 1, 2].map(function(i) { return <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#F55036', animation: 'ai-dot .9s ease-in-out infinite', animationDelay: i * 0.15 + 's' }} />; })}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            {/* quick chips */}
            {(msgs || []).length <= 1 && (
              <div style={{ padding: '0 12px 8px', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {chips.map(function(s, i) {
                  return <button key={i} onClick={function() { sendChat(s); }} style={{ padding: '5px 11px', borderRadius: 99, fontSize: 11, cursor: 'pointer', background: 'rgba(245,80,54,.08)', border: '1px solid rgba(245,80,54,.2)', color: '#c73b22', fontWeight: 600, fontFamily: 'inherit' }}>{s}</button>;
                })}
              </div>
            )}
            {/* input */}
            <div style={{ padding: '10px 12px', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea ref={inputRef} value={input} onChange={function(e) { setInput(e.target.value); }}
                  onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                  placeholder="سوال بپرس... (Enter = ارسال)" rows={1}
                  style={{ flex: 1, resize: 'none', border: '1.5px solid var(--line2)', borderRadius: 12, padding: '9px 13px', fontSize: 12.5, outline: 'none', fontFamily: 'inherit', background: 'var(--surface2)', color: 'var(--t1)', lineHeight: 1.5, maxHeight: 90, transition: '.15s' }}
                  onInput={function(e) { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 90) + 'px'; }}
                />
                <button onClick={function() { sendChat(); }} disabled={!input.trim() || chatLoad}
                  style={{ width: 38, height: 38, borderRadius: 12, border: 'none', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: (input.trim() && !chatLoad) ? 'linear-gradient(135deg,#F55036,#ff6b4a)' : 'var(--surface3)', color: (input.trim() && !chatLoad) ? '#fff' : 'var(--t3)', boxShadow: (input.trim() && !chatLoad) ? '0 4px 14px rgba(245,80,54,.4)' : 'none', transition: '.2s' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SALES TAB */}
        {tab === 'sales' && AnalysisTab('sales', salesRes, setSalesRes, runAnalysis,
          'تحلیل فروش هوشمند',
          'آنالیز عمیق فروش ۱۴ روز اخیر، کشف الگوهای روزانه و هفتگی، شناسایی بهترین و بدترین روزها، و پیش‌بینی هفته آینده.',
          'شروع تحلیل فروش',
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%' }}>
            {[
              { t: 'فروش امروز', v: toFa(String((D.saleInvoices||[]).filter(function(i){return i.date===aiTodayStr();}).length)) + ' فاکتور' },
              { t: 'این ماه', v: toFa(String((D.saleInvoices||[]).filter(function(i){return i.date&&i.date.slice(0,7)===aiTodayStr().slice(0,7);}).length)) + ' فاکتور' },
              { t: 'مانده‌دار', v: toFa(String((D.saleInvoices||[]).filter(function(i){return i.status==='unpaid';}).length)) + ' فاکتور' },
              { t: 'آیتم‌های منو', v: toFa(String((D.menuItems||[]).length)) + ' آیتم' },
            ].map(function(s,i) {
              return <div key={i} style={{ background:'var(--surface2)', borderRadius:10, padding:'10px 12px', border:'1px solid var(--line)' }}>
                <div style={{ fontSize:10, color:'var(--t3)', marginBottom:4 }}>{s.t}</div>
                <div style={{ fontSize:16, fontWeight:800, color:'var(--t1)' }}>{s.v}</div>
              </div>;
            })}
          </div>
        )}

        {/* STOCK TAB */}
        {tab === 'stock' && AnalysisTab('stock', stockRes, setStockRes, runAnalysis,
          'تحلیل هوشمند انبار',
          'بررسی موجودی تمام مواد اولیه، پیش‌بینی تاریخ دقیق تموم شدن هر ماده، محاسبه مقدار بهینه برای خرید بعدی.',
          'آنالیز انبار',
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, width: '100%' }}>
            {(D.ingredients||[]).slice(0,4).map(function(ing,i) {
              var u=(D.recipes||[]).filter(function(r){return r.iid===ing.id;}).reduce(function(s,r){return s+(r.qty||0);},0)*(D.estOrders||80);
              var days=u>0?Math.floor((ing.stock||0)/u):999;
              var color=days<3?'var(--red)':days<7?'var(--amber)':'var(--green)';
              return <div key={i} style={{display:'flex',alignItems:'center',gap:6,background:'var(--surface2)',borderRadius:8,padding:'7px 10px',border:'1px solid var(--line)',fontSize:11}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:color,flexShrink:0}}/>
                <span style={{color:'var(--t1)',fontWeight:600}}>{ing.name}</span>
                <span style={{color:'var(--t3)'}}>{days<999?toFa(String(days))+' روز':'—'}</span>
              </div>;
            })}
          </div>
        )}

        {/* PRICE TAB */}
        {tab === 'price' && AnalysisTab('price', priceRes, setPriceRes, runAnalysis,
          'بهینه‌سازی قیمت‌گذاری',
          'محاسبه هزینه واقعی هر آیتم از مواد اولیه، بررسی مارجین فعلی، مقایسه با break-even، و پیشنهاد قیمت بهینه.',
          'تحلیل قیمت‌گذاری',
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
            {(D.menuItems||[]).slice(0,3).map(function(mi,i) {
              var recs=(D.recipes||[]).filter(function(r){return r.mid===mi.id;});
              var cost=recs.reduce(function(s,r){var ing=(D.ingredients||[]).find(function(x){return x.id===r.iid;});return ing?s+(r.qty||0)*(ing.avg_cost||0):s;},0);
              var margin=mi.price>0?Math.round((mi.price-cost)/mi.price*100):0;
              var barColor=margin>60?'var(--green)':margin>40?'var(--amber)':'var(--red)';
              return <div key={i} style={{background:'var(--surface2)',borderRadius:8,padding:'8px 12px',border:'1px solid var(--line)'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:12,fontWeight:600,color:'var(--t1)'}}>{mi.name}</span>
                  <span style={{fontSize:12,fontWeight:700,color:barColor}}>{toFa(String(margin))}٪</span>
                </div>
                <div style={{height:4,background:'var(--surface3)',borderRadius:99}}>
                  <div style={{height:'100%',width:Math.min(margin,100)+'%',background:barColor,borderRadius:99,transition:'.3s'}}/>
                </div>
              </div>;
            })}
          </div>
        )}

        {/* CUSTOMER TAB */}
        {tab === 'customer' && AnalysisTab('customer', custRes, setCustRes, runAnalysis,
          'آنالیز مشتریان',
          'سگمنت‌بندی مشتریان، شناسایی پرخریدها، هشدار مشتریان در خطر از دست دادن، و پیشنهاد برنامه وفاداری.',
          'آنالیز مشتریان',
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, width: '100%' }}>
            {(function(){
              var custSpend={};
              (D.saleInvoices||[]).forEach(function(inv){var cn=inv.custName||'گذری';custSpend[cn]=(custSpend[cn]||0)+(inv.total||0);});
              return Object.entries(custSpend).sort(function(a,b){return b[1]-a[1];}).slice(0,4).map(function(c,i){
                return <div key={i} style={{display:'flex',alignItems:'center',gap:6,background:'var(--surface2)',borderRadius:8,padding:'7px 10px',border:'1px solid var(--line)',fontSize:11}}>
                  <div style={{width:24,height:24,borderRadius:'50%',background:'var(--blue)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:11,flexShrink:0}}>{c[0][0]}</div>
                  <div><div style={{fontWeight:600,color:'var(--t1)'}}>{c[0]}</div><div style={{color:'var(--t3)'}}>{fc(Math.round(c[1]/1000))}هزار ت</div></div>
                </div>;
              });
            })()}
          </div>
        )}

        {/* REPORT TAB */}
        {tab === 'report' && AnalysisTab('report', reportRes, setReportRes, runAnalysis,
          'گزارش جامع هفتگی',
          'تهیه خلاصه اجرایی کامل: فروش، انبار، مشتریان، مالی، و لیست اولویت‌دار پیشنهادهای هفته آینده.',
          'تولید گزارش هفتگی',
          null
        )}

      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   FLOATING BUTTON + ORCHESTRATOR
══════════════════════════════════════════════════════════════════════════════ */

function AIButton(props) {
  var D = props.D; var page = props.page;
  var openS = useState(false); var open = openS[0]; var setOpen = openS[1];
  var keyModalS = useState(false); var keyModal = keyModalS[0]; var setKeyModal = keyModalS[1];
  var pulseS = useState(true); var pulse = pulseS[0]; var setPulse = pulseS[1];
  var alertCntS = useState(0); var alertCnt = alertCntS[0]; var setAlertCnt = alertCntS[1];

  /* load saved key */
  useEffect(function() {
    var saved = localStorage.getItem('groq_key');
    if (saved) window._groqKey = saved;
  }, []);

  /* count alerts */
  useEffect(function() {
    var low = (D.ingredients || []).filter(function(ing) {
      var u = (D.recipes || []).filter(function(r) { return r.iid === ing.id; }).reduce(function(s, r) { return s + (r.qty || 0); }, 0) * (D.estOrders || 80);
      return u > 0 && Math.floor((ing.stock || 0) / u) < 3;
    }).length;
    var unpaid = (D.saleInvoices || []).filter(function(i) { return i.status === 'unpaid'; }).length;
    setAlertCnt(low + (unpaid > 5 ? 1 : 0));
  }, [D]);

  useEffect(function() {
    var t = setTimeout(function() { setPulse(false); }, 6000);
    return function() { clearTimeout(t); };
  }, []);

  function handleOpen() {
    if (!window._groqKey) { setKeyModal(true); return; }
    setOpen(function(o) { return !o; });
    setPulse(false);
  }

  return (
    <React.Fragment>
      {keyModal && <AIKeyModal onDone={function() { setKeyModal(false); setOpen(true); }} />}
      {open && <div onClick={function() { setOpen(false); }} style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(0,0,0,.06)', backdropFilter: 'blur(1px)' }} />}
      {open && <AIHub D={D} page={page} onClose={function() { setOpen(false); }} />}

      <button onClick={handleOpen} title="دستیار هوشمند" style={{
        position: 'fixed', bottom: 24, left: 24, zIndex: 1003,
        width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: open ? '#c73b22' : 'linear-gradient(135deg,#F55036 0%,#ff6b4a 100%)',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 28px rgba(245,80,54,.5)',
        transition: 'all .25s cubic-bezier(.34,1.56,.64,1)',
        transform: open ? 'rotate(90deg) scale(.9)' : 'scale(1)',
      }}>
        {pulse && !open && (
          <div style={{ position: 'absolute', inset: -5, borderRadius: '50%', border: '2.5px solid rgba(16,163,127,.4)', animation: 'ai-pulse 1.8s ease-out infinite', pointerEvents: 'none' }} />
        )}
        {alertCnt > 0 && !open && (
          <div style={{ position: 'absolute', top: 3, right: 3, minWidth: 16, height: 16, borderRadius: 8, background: '#EF4444', border: '2px solid #fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: '0 3px' }}>
            {alertCnt}
          </div>
        )}
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        )}
      </button>
    </React.Fragment>
  );
}

export default AIButton
