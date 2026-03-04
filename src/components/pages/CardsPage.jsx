import React, { useState, useRef, useEffect } from 'react'
import NIcon, { IBtn } from '../ui/NIcon.jsx'
import { Modal, DP, IngPicker, Spark, BarChart } from '../ui/index.jsx'
import { toFa, fc, fp, dailyR, todayJ, nowStr, UPAIRS, ICATS, MCATS, JMONS, PROLES, CCOLORS } from '../../lib/utils.js'


function CardsPage(props) {
  var D=props.D, setD=props.setD;
  var addM = useState(false), setAddM = addM[1]; addM = addM[0];
  var topM = useState(null), setTopM = topM[1]; topM = topM[0];
  var form = useState({name:'',num:'',bal:0,color:'var(--blue)'}), setForm = form[1]; form = form[0];
  var topAmt = useState(0), setTopAmt = topAmt[1]; topAmt = topAmt[0];
  function saveCard() {
    if(!form.name) return;
    setD(function(d){return Object.assign({},d,{cards:d.cards.concat([Object.assign({},form,{id:Date.now(),bal:Number(form.bal)})])});});
    setAddM(false);
  }
  function topup() {
    setD(function(d){return Object.assign({},d,{cards:d.cards.map(function(c){return c.id===topM?Object.assign({},c,{bal:c.bal+Number(topAmt)}):c;})});});
    setTopM(null); setTopAmt(0);
  }
  function del(id) { if(confirm('حذف؟')) setD(function(d){return Object.assign({},d,{cards:d.cards.filter(function(c){return c.id!==id;})});}); }
  var topCard = D.cards.filter(function(c){return c.id===topM;})[0];
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <span className="stl" style={{marginBottom:0}}>کارت‌های بانکی</span>
        <button className="btn bp" onClick={function(){setAddM(true);}}>+ افزودن کارت</button>
      </div>
      <div className="g3">
        {D.cards.map(function(c){
          return (
            <div key={c.id}>
              <div className="bkcard" style={{background:c.color,marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:13,fontWeight:700}}>{c.name}</span><svg width="18" height="14" viewBox="0 0 18 14" fill="none"><rect x="1" y="1" width="16" height="12" rx="2" stroke="rgba(255,255,255,0.5)" stroke-width="1.2"/><line x1="1" y1="5" x2="17" y2="5" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/><rect x="3" y="8.5" width="4" height="1.5" rx=".5" fill="rgba(255,255,255,0.4)"/></svg></div>
                <div>
                  <div style={{fontSize:10,opacity:.75,marginBottom:2}}>موجودی</div>
                  <div style={{fontSize:20,fontWeight:800}}>{fc(c.bal)} <span style={{fontSize:12,fontWeight:400}}>ت</span></div>
                  <div style={{fontSize:11,opacity:.7,marginTop:4}}>{c.num}</div>
                </div>
              </div>
              <div style={{display:'flex',gap:6}}>
                <button className="btn bs bsm" style={{flex:1}} onClick={function(){setTopM(c.id);setTopAmt(0);}}>+ افزایش موجودی</button>
                <button className="btn bda bsm" onClick={function(){del(c.id);}}><NIcon n='trash' s={13} /></button>
              </div>
            </div>
          );
        })}
      </div>
      <Modal open={addM} onClose={function(){setAddM(false);}} title="افزودن کارت">
        <div className="fr">
          <div className="fg"><label className="fl">نام بانک *</label><input className="fc" value={form.name} onChange={function(e){setForm(function(f){return Object.assign({},f,{name:e.target.value});});}} placeholder="بانک ملت" /></div>
          <div className="fg"><label className="fl">شماره کارت</label><input className="fc" value={form.num} onChange={function(e){setForm(function(f){return Object.assign({},f,{num:e.target.value});});}} /></div>
        </div>
        <div className="fr">
          <div className="fg"><label className="fl">موجودی اولیه (تومان)</label><input className="fc" type="number" value={form.bal} onChange={function(e){setForm(function(f){return Object.assign({},f,{bal:e.target.value});});}} /></div>
          <div className="fg"><label className="fl">رنگ</label>
            <div style={{display:'flex',gap:6,marginTop:4,flexWrap:'wrap'}}>
              {CCOLORS.map(function(col){
                return <div key={col} onClick={function(){setForm(function(f){return Object.assign({},f,{color:col});});}} style={{width:26,height:26,borderRadius:6,background:col,cursor:'pointer',border:'2.5px solid '+(form.color===col?'#000':'transparent')}} />;
              })}
            </div>
          </div>
        </div>
        <div className="mft"><button className="btn bs" onClick={function(){setAddM(false);}}>انصراف</button><button className="btn bp" onClick={saveCard}>ذخیره</button></div>
      </Modal>
      <Modal open={topM!==null} onClose={function(){setTopM(null);}} title="افزایش موجودی">
        <div className="fg"><label className="fl">مبلغ (تومان)</label><input className="fc" type="number" value={topAmt} onChange={function(e){setTopAmt(e.target.value);}} /></div>
        {topAmt>0 && topCard && <div className="al as">موجودی جدید: {fc(topCard.bal+Number(topAmt))} تومان</div>}
        <div className="mft"><button className="btn bs" onClick={function(){setTopM(null);}}>انصراف</button><button className="btn bp" onClick={topup}>افزودن</button></div>
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════
   USERS
══════════════════════════════════════ */

export default CardsPage
