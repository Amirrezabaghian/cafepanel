import React, { useState, useEffect } from 'react'
import NIcon from './components/ui/NIcon.jsx'
import Login from './components/pages/Login.jsx'
import Dashboard from './components/pages/Dashboard.jsx'
import Ingredients from './components/pages/Ingredients.jsx'
import Invoices from './components/pages/Invoices.jsx'
import Recipe from './components/pages/Recipe.jsx'
import PurchaseReport from './components/pages/PurchaseReport.jsx'
import Overhead from './components/pages/Overhead.jsx'
import CardsPage from './components/pages/CardsPage.jsx'
import Users from './components/pages/Users.jsx'
import POS from './components/pages/POS.jsx'
import SaleReport from './components/pages/SaleReport.jsx'
import Customers from './components/pages/Customers.jsx'
import Settings from './components/pages/Settings.jsx'
import StockPage from './components/pages/StockPage.jsx'
import AIButton from './components/ai/AIComponents.jsx'
import { PAGES, PI } from './lib/utils.js'
import { loadAllData } from './lib/supabase.js'

/* ─── Initial seed data (نمایش قبل از لود Supabase) ─── */
/* ─── INITIAL DATA ─── */
var D0 = {
  currentUser: null,
  users: [
    {id:1, name:'محمد رضایی', role:'مدیر', username:'admin', password:'1234'},
    {id:2, name:'زهرا کریمی', role:'باریستا', username:'zahrak', password:'1234'}
  ],
  ingredients: [
    {id:1, name:'قهوه اسپرسو', category:'دانه قهوه', unit_pair:'کیلوگرم/گرم', mac_unit:'کیلوگرم', mic_unit:'گرم', rate:1000, stock:2500, avg_cost:8.5, recipe_unit:'گرم'},
    {id:2, name:'شیر', category:'لبنیات', unit_pair:'لیتر/میلی‌لیتر', mac_unit:'لیتر', mic_unit:'میلی‌لیتر', rate:1000, stock:12000, avg_cost:0.18, recipe_unit:'میلی‌لیتر'},
    {id:3, name:'شکر', category:'شکر و شیرینی', unit_pair:'کیلوگرم/گرم', mac_unit:'کیلوگرم', mic_unit:'گرم', rate:1000, stock:5000, avg_cost:1.2, recipe_unit:'گرم'},
    {id:4, name:'خامه', category:'لبنیات', unit_pair:'لیتر/میلی‌لیتر', mac_unit:'لیتر', mic_unit:'میلی‌لیتر', rate:1000, stock:3000, avg_cost:0.45, recipe_unit:'میلی‌لیتر'},
    {id:5, name:'شکلات تلخ', category:'شکر و شیرینی', unit_pair:'کیلوگرم/گرم', mac_unit:'کیلوگرم', mic_unit:'گرم', rate:1000, stock:800, avg_cost:15.0, recipe_unit:'گرم'}
  ],
  menuItems: [
    {id:1, name:'اسپرسو', category:'قهوه', margin:60, price:35000},
    {id:2, name:'لاته', category:'قهوه', margin:55, price:55000},
    {id:3, name:'موکا', category:'قهوه', margin:50, price:65000}
  ],
  recipes: [
    {id:1, mid:1, iid:1, qty:18},
    {id:2, mid:2, iid:1, qty:18},
    {id:3, mid:2, iid:2, qty:200},
    {id:4, mid:2, iid:3, qty:10},
    {id:5, mid:3, iid:1, qty:18},
    {id:6, mid:3, iid:2, qty:150},
    {id:7, mid:3, iid:5, qty:20}
  ],
  overheads: [
    {id:1, name:'اجاره محل', amount:12000000, period:'monthly'},
    {id:2, name:'حقوق کارمندان', amount:25000000, period:'monthly'},
    {id:3, name:'برق و آب و گاز', amount:2500000, period:'monthly'}
  ],
  invoices: [
    {id:1, date:'1403/11/10', uid:1, cid:1, note:'خرید هفتگی',
     items:[{iid:1, ing_id:1, qty:2, uprice:8500000, total:17000000},{iid:2, ing_id:2, qty:20, uprice:180000, total:3600000}],
     total:20600000, img:null, elog:[]}
  ],
  cards: [
    {id:1, name:'بانک ملت', num:'6104-3378-****-2810', bal:45000000, color:'var(--blue)'},
    {id:2, name:'بانک پاسارگاد', num:'5022-2910-****-7741', bal:18500000, color:'#7C3AED'}
  ],
  estOrders: 80,
  salesReports: [],
  stockLogs: [],
  customers: [
    {id:1, name:'مشتری گذری', phone:'', code:'WALK', note:'', isWalk:true}
  ],
  saleInvoices: [],
  settings: {taxPct:9, invoicePrefix:'INV', cafeNameFa:'کافه من', cafeNameEn:'My Cafe', address:''}
};

/* ─── App ─── */
function App() {
  var D = useState(D0), setD = D[1]; D = D[0];
  var col = useState(false), setCol = col[1]; col = col[0];
  var mob = useState(false), setMob = mob[1]; mob = mob[0];
  var page = useState('dashboard'), setPage = page[1]; page = page[0];

  /* ── Load from Supabase on mount ── */
  useEffect(function() {
    var saved = localStorage.getItem('groq_key');
    if (saved) window._groqKey = saved;
    loadAllData().then(function(data) {
      setD(function(prev) { return Object.assign({}, prev, data, { currentUser: prev.currentUser }); });
    }).catch(function(e) { console.warn('Supabase load failed:', e.message); });
  }, []);

  /* ── Persist to localStorage as offline backup ── */
  useEffect(function() {
    try { localStorage.setItem('cafepanel_backup', JSON.stringify(D)); } catch(e) {}
  }, [D]);

  var groups = [];
  PAGES.forEach(function(p){ if(groups.indexOf(p.grp)<0) groups.push(p.grp); });
  
  if(!D.currentUser) return <Login D={D} setD={setD} />;
  
  function go(id) { setPage(id); setMob(false); }
  function logout() { setD(function(d){return Object.assign({},d,{currentUser:null});}); }
  
  return (
    <div className="app">
      <div className={'movl'+(mob?' show':'')} onClick={function(){setMob(false);}} />
      <div className={'sb'+(col?' col':'')+(mob?' mo':'')}>
        <div className="sb-logo">
          <div className="logo-dot">
            <NIcon n="coffee" s={15} style={{color:'#fff'}} />
          </div>
          {!col && <div><div className="sb-brand">کافه‌پنل</div><div className="sb-brand-sub">مدیریت کافه</div></div>}
        </div>
        <nav className="sb-nav">
          {groups.map(function(grp){
            return (
              <div key={grp}>
                {!col && <div className="ng-lb">{grp}</div>}
                {PAGES.filter(function(p){return p.grp===grp;}).map(function(p){
                  return (
                    <div key={p.id} className={'ni'+(page===p.id?' act':'')} onClick={function(){go(p.id);}} title={col?p.label:''}>
                      <NIcon n={p.icon} />
                      {!col && <span>{p.label}</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="sb-ft">
          {!col && (
            <div className="sb-user">
              <div className="sb-av">{D.currentUser.name[0]}</div>
              <div><div className="sb-uname">{D.currentUser.name}</div><div className="sb-urole">{D.currentUser.role}</div></div>
            </div>
          )}
          {col && <div className="sb-av" style={{margin:'0 auto 8px'}}>{D.currentUser.name[0]}</div>}
          <button className="col-btn" style={{marginBottom:5,color:'rgba(248,113,113,.7)',borderColor:'rgba(248,113,113,.15)'}} onClick={logout}>
            <NIcon n="logout" />{!col&&<span>خروج</span>}
          </button>
          <button className="col-btn" onClick={function(){setCol(!col);}}>
            <NIcon n={col?'expand':'collapse'} s={13} />{!col&&<span style={{marginRight:4}}>جمع کردن</span>}
          </button>
        </div>
      </div>
      <div className={'tb'+(col?' col':'')}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button className="hbg" onClick={function(){setMob(!mob);}} style={{display:'flex',alignItems:'center',justifyContent:'center'}}><NIcon n="menu" /></button>
          <div><div className="pg-title">{(PI[page]||{t:''}).t}</div><div className="pg-sub" style={{fontSize:11,color:'var(--t3)'}}>{(PI[page]||{s:''}).s}</div></div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{fontSize:12,color:'var(--t3)',textAlign:'left',lineHeight:1.4}}>
            <div style={{fontWeight:600,color:'var(--t2)'}}>{D.estOrders} سفارش</div>
            <div>برآورد روزانه</div>
          </div>
          <div style={{width:34,height:34,borderRadius:'50%',background:'var(--blue)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13}}>{D.currentUser.name[0]}</div>
        </div>
      </div>
      <div className={'main'+(col?' col':'')}>
        <div className={page==='pos'?'':'pg'} key={page}>
          {page==='dashboard' && <Dashboard D={D} setD={setD} />}
          {page==='pos' && <POS D={D} setD={setD} goPage={go} />}
          {page==='sale-report' && <SaleReport D={D} setD={setD} />}
          {page==='customers' && <Customers D={D} setD={setD} />}
          {page==='stock' && <StockPage D={D} setD={setD} />}
          {page==='ingredients' && <Ingredients D={D} setD={setD} />}
          {page==='invoices' && <Invoices D={D} setD={setD} />}
          {page==='purchase-report' && <PurchaseReport D={D} />}
          {page==='recipe' && <Recipe D={D} setD={setD} />}
          {page==='overhead' && <Overhead D={D} setD={setD} />}
          {page==='cards' && <CardsPage D={D} setD={setD} />}
          {page==='settings' && <Settings D={D} setD={setD} />}
          {page==='users' && <Users D={D} setD={setD} />}
        </div>
      </div>
      <AIButton D={D} page={page} />
    </div>
  );
}

export default App
