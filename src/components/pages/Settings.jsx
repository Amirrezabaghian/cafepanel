import React, { useState, useRef, useEffect } from 'react'
import NIcon, { IBtn } from '../ui/NIcon.jsx'
import { Modal, DP, IngPicker, Spark, BarChart } from '../ui/index.jsx'
import { toFa, fc, fp, dailyR, todayJ, nowStr, UPAIRS, ICATS, MCATS, JMONS, PROLES, CCOLORS } from '../../lib/utils.js'


function Settings(props) {
  var D=props.D, setD=props.setD;
  var sS=useState(Object.assign({},D.settings)); var s=sS[0]; var setS=sS[1];
  var savedS=useState(false); var saved=savedS[0]; var setSaved=savedS[1];

  function save(){
    setD(function(d){return Object.assign({},d,{settings:Object.assign({},s,{taxPct:Number(s.taxPct)||0,invCounter:Number(s.invCounter)||1})});});
    setSaved(true);
    setTimeout(function(){setSaved(false);},2000);
  }

  return (
    <div style={{maxWidth:600}}>
      <div className="card">
        <div className="ctl" style={{marginBottom:16}}>اطلاعات کافه</div>
        <div className="fg"><label className="fl">نام کافه (فارسی)</label><input className="fc" value={s.cafeNameFa||''} onChange={function(e){setS(Object.assign({},s,{cafeNameFa:e.target.value}));}} placeholder="کافه من"/></div>
        <div className="fg"><label className="fl">آدرس</label><input className="fc" value={s.address||''} onChange={function(e){setS(Object.assign({},s,{address:e.target.value}));}} placeholder="آدرس کافه..."/></div>
      </div>
      <div className="card">
        <div className="ctl" style={{marginBottom:16}}>تنظیمات فاکتور</div>
        <div className="fr">
          <div className="fg">
            <label className="fl">نرخ مالیات (%)</label>
            <input className="fc" type="number" min="0" max="100" value={s.taxPct||0} onChange={function(e){setS(Object.assign({},s,{taxPct:e.target.value}));}}/>
            <div className="fh">این مالیات روی همه فاکتورهای فروش اعمال می‌شود</div>
          </div>
          <div className="fg">
            <label className="fl">پیشوند شماره فاکتور</label>
            <input className="fc" value={s.invoicePrefix||'INV'} onChange={function(e){setS(Object.assign({},s,{invoicePrefix:e.target.value}));}}/>
          </div>
        </div>
        <div className="fg">
          <label className="fl">شماره فاکتور بعدی</label>
          <input className="fc" type="number" value={s.invCounter||1} onChange={function(e){setS(Object.assign({},s,{invCounter:e.target.value}));}}/>
          <div className="fh">فاکتور بعدی: <strong>{s.invoicePrefix||'INV'}-{String(s.invCounter||1).padStart(4,'0')}</strong></div>
        </div>
      </div>
      {saved && <div className="al as"><NIcon n="check" s={14}/>تنظیمات ذخیره شد</div>}
      <button className="btn bp" style={{width:'100%',height:42}} onClick={save}>ذخیره تنظیمات</button>
    </div>
  );
}



export default Settings
