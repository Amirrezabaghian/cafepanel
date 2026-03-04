import React, { useState, useRef, useEffect } from 'react'
import NIcon, { IBtn } from '../ui/NIcon.jsx'
import { Modal, DP, IngPicker, Spark, BarChart } from '../ui/index.jsx'
import { toFa, fc, fp, dailyR, todayJ, nowStr, UPAIRS, ICATS, MCATS, JMONS, PROLES, CCOLORS } from '../../lib/utils.js'


function Login(props) {
  var D=props.D, setD=props.setD;
  var un = useState(''), setUn = un[1]; un = un[0];
  var pw = useState(''), setPw = pw[1]; pw = pw[0];
  var err = useState(''), setErr = err[1]; err = err[0];
  
  function login() {
    var u = D.users.filter(function(u){ return u.username===un && u.password===pw; })[0];
    if(u) { setErr(''); setD(function(d){ return Object.assign({},d,{currentUser:u}); }); }
    else setErr('نام کاربری یا رمز عبور اشتباه است.');
  }
  
  return (
    <div className="lwrap">
      <div className="lbox">
        <div style={{display:'flex',alignItems:'center',gap:12,justifyContent:'center',marginBottom:24}}>
          <div className="logo-dot-w"><NIcon n="coffee" s={18} style={{color:'#111'}} /></div>
          <div><div style={{fontSize:20,fontWeight:800,color:'#fff',letterSpacing:'-.5px'}}>کافه‌پنل</div><div style={{fontSize:11,color:'rgba(255,255,255,.4)'}}>مدیریت هوشمند کافه</div></div>
        </div>
        <p style={{textAlign:'center',color:'rgba(255,255,255,.35)',fontSize:13,marginBottom:22}}>برای ادامه وارد حساب کاربری خود شوید</p>
        {err && <div className="lerr">{err}</div>}
        <div className="fg">
          <label className="fl">نام کاربری</label>
          <input className="fc" value={un} onChange={function(e){setUn(e.target.value);}} placeholder="admin" onKeyDown={function(e){if(e.key==='Enter')login();}} />
        </div>
        <div className="fg">
          <label className="fl">رمز عبور</label>
          <input className="fc" type="password" value={pw} onChange={function(e){setPw(e.target.value);}} placeholder="••••" onKeyDown={function(e){if(e.key==='Enter')login();}} />
        </div>
        <button className="btn bp bfull" style={{marginTop:8}} onClick={login}>ورود به سیستم</button>
        <p style={{textAlign:'center',marginTop:14,fontSize:11,color:'rgba(255,255,255,.25)'}}>کاربر نمونه: admin / 1234</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   DASHBOARD
══════════════════════════════════════ */

export default Login
