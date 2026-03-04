import React, { useState, useRef, useEffect } from 'react'
import NIcon, { IBtn } from '../ui/NIcon.jsx'
import { Modal, DP, IngPicker, Spark, BarChart } from '../ui/index.jsx'
import { toFa, fc, fp, dailyR, todayJ, nowStr, UPAIRS, ICATS, MCATS, JMONS, PROLES, CCOLORS } from '../../lib/utils.js'


function Recipe(props) {
  var D=props.D, setD=props.setD;
  var sel = useState(D.menuItems[0]?D.menuItems[0].id:null), setSel = sel[1]; sel = sel[0];
  var mmOpen = useState(false), setMmOpen = mmOpen[1]; mmOpen = mmOpen[0];
  var editMid = useState(null), setEditMid = editMid[1]; editMid = editMid[0];
  var iMF = {name:'',category:'قهوه',margin:50,price:0};
  var mf = useState(iMF), setMf = mf[1]; mf = mf[0];
  var fcat = useState('همه'), setFcat = fcat[1]; fcat = fcat[0];
  var ingPRow = useState(null), setIngPRow = ingPRow[1]; ingPRow = ingPRow[0];
  var custPrice = useState(''), setCustPrice = custPrice[1]; custPrice = custPrice[0];
  var pconf = useState(false), setPconf = pconf[1]; pconf = pconf[0];
  var cats = ['همه'].concat(MCATS);
  var fMenus = fcat==='همه' ? D.menuItems : D.menuItems.filter(function(m){return m.category===fcat;});
  var todOH = D.overheads.reduce(function(s,o){return s+dailyR(o);},0);
  var ohItem = D.estOrders>0 ? todOH/D.estOrders : 0;
  var item = D.menuItems.filter(function(m){return m.id===sel;})[0];
  var iRcp = D.recipes.filter(function(r){return r.mid===sel;});
  var mat = iRcp.reduce(function(s,r){var ing=D.ingredients.filter(function(i){return i.id===r.iid;})[0];return s+(ing?r.qty*ing.avg_cost:0);},0);
  var tot = mat+ohItem;
  var sug = tot*(1+(item?item.margin:50)/100);
  var pOpts = [
    {label:'پیشنهادی ('+(item?item.margin:50)+'٪)', price:sug},
    {label:'سود ۶۰٪', price:tot*1.6},
    {label:'سود ۷۵٪', price:tot*1.75},
    {label:'سود ۱۰۰٪', price:tot*2}
  ];
  var usedIds = iRcp.map(function(r){return r.iid;});
  
  function addR() {
    if(!sel) return;
    var f = D.ingredients[0]; if(!f) return;
    setD(function(d){return Object.assign({},d,{recipes:d.recipes.concat([{id:Date.now(),mid:sel,iid:f.id,qty:0}])});});
  }
  function updR(id,k,v) {
    setD(function(d){return Object.assign({},d,{recipes:d.recipes.map(function(r){return r.id===id?Object.assign({},r,{[k]:k==='iid'?Number(v):Number(v)}):r;})});});
  }
  function delR(id) { setD(function(d){return Object.assign({},d,{recipes:d.recipes.filter(function(r){return r.id!==id;})});}); }
  function saveM() {
    if(!mf.name) return;
    var ms = Object.assign({},mf,{margin:Number(mf.margin),price:Number(mf.price)});
    if(editMid) {
      ms.id = editMid;
      setD(function(d){return Object.assign({},d,{menuItems:d.menuItems.map(function(m){return m.id===editMid?ms:m;})});});
    } else {
      ms.id = Date.now();
      setD(function(d){return Object.assign({},d,{menuItems:d.menuItems.concat([ms])});});
      setSel(ms.id);
    }
    setMmOpen(false);
  }
  function delM(id) {
    if(!confirm('آیتم منو حذف شود؟')) return;
    setD(function(d){return Object.assign({},d,{menuItems:d.menuItems.filter(function(m){return m.id!==id;}),recipes:d.recipes.filter(function(r){return r.mid!==id;})});});
    if(sel===id) setSel(null);
  }
  function confirmPrice() {
    var fp = custPrice ? Number(custPrice) : Math.round(sug);
    setD(function(d){return Object.assign({},d,{menuItems:d.menuItems.map(function(m){return m.id===sel?Object.assign({},m,{price:Math.round(fp)}):m;})});});
    setPconf(true);
    setTimeout(function(){setPconf(false);},2000);
  }
  
  return (
    <div style={{display:'flex',gap:14,flexWrap:'wrap',alignItems:'flex-start'}}>
      {/* MENU LIST */}
      <div style={{width:270,flexShrink:0}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <span className="stl" style={{marginBottom:0}}>آیتم‌های منو</span>
          <button className="btn bp bsm" onClick={function(){setMf(iMF);setEditMid(null);setMmOpen(true);}}>+ آیتم</button>
        </div>
        <div className="tabs">
          {cats.map(function(c){return <span key={c} className={'tab'+(fcat===c?' act':'')} style={{fontSize:11,padding:'4px 9px'}} onClick={function(){setFcat(c);}}>{c}</span>;})}
        </div>
        {fMenus.map(function(m) {
          var mRcp = D.recipes.filter(function(r){return r.mid===m.id;});
          var mMat = mRcp.reduce(function(s,r){var ing=D.ingredients.filter(function(i){return i.id===r.iid;})[0];return s+(ing?r.qty*ing.avg_cost:0);},0);
          var mTot = mMat+ohItem;
          var mMg = m.price>0 ? (m.price-mTot)/m.price*100 : 0;
          return (
            <div key={m.id} className={'micard'+(m.id===sel?' act':'')} onClick={function(){setSel(m.id);setCustPrice('');setPconf(false);}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:2}}>{m.name}</div>
                <div style={{display:'flex',gap:5,flexWrap:'wrap',marginTop:4}}>
                  <span className="bdg bb" style={{fontSize:10}}>{fc(m.price)} ت</span>
                  <span className={'bdg '+(mMg>0?'bg':'br')} style={{fontSize:10}}>{toFa(mMg.toFixed(0))}٪ سود</span>
                </div>
              </div>
              <div style={{display:'flex',gap:3}}>
                <button className="btn bxs bs" onClick={function(e){e.stopPropagation();setMf(Object.assign({},m));setEditMid(m.id);setMmOpen(true);}}><NIcon n='edit' s={13} /></button>
                <button className="btn bxs bda" onClick={function(e){e.stopPropagation();delM(m.id);}}><NIcon n='trash' s={13} /></button>
              </div>
            </div>
          );
        })}
        {fMenus.length===0 && <div className="empty"><div className="empty-i"><NIcon n="recipe" /></div><p>آیتمی نیست</p></div>}
      </div>
      
      {/* RECIPE + COST */}
      <div style={{flex:1,minWidth:0}}>
        {item ? (
          <div>
            <div className="card" style={{marginBottom:14}}>
              <div className="chd">
                <div><div className="ctl">رسپی — {item.name}</div><div className="csb">{item.category} · سود هدف: {item.margin}٪</div></div>
                <button className="btn bsm bs" onClick={addR}>+ ماده</button>
              </div>
              {iRcp.length===0
                ? <div className="empty"><div className="empty-i"><NIcon n="recipe" /></div><p>ماده‌ای اضافه نشده</p></div>
                : <div>
                    {iRcp.map(function(r) {
                      var ing = D.ingredients.filter(function(i){return i.id===r.iid;})[0];
                      return (
                        <div key={r.id} style={{background:'#F1F5F9',borderRadius:7,padding:'10px 12px',marginBottom:8,border:'1px solid #E2E8F0'}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                            <div style={{flex:1}}>
                              <div style={{fontWeight:700,fontSize:13}}>{ing?ing.name:'انتخاب نشده'}</div>
                              <div style={{fontSize:11,color:'var(--t3)'}}>{ing?ing.category:''} · واحد: {ing?ing.recipe_unit||ing.mic_unit:''}</div>
                            </div>
                            <button className="btn bxs bs" onClick={function(){setIngPRow(r.id);}}>تغییر</button>
                            <IBtn n="trash" cls="bda bxs" onClick={function(){delR(r.id);}} />
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <label style={{fontSize:12,fontWeight:600,color:'var(--t2)',whiteSpace:'nowrap'}}>مقدار ({ing?ing.recipe_unit||ing.mic_unit:''}):</label>
                            <input className="fc fcs" type="number" value={r.qty} onChange={function(e){updR(r.id,'qty',e.target.value);}} style={{width:100}} />
                            {ing && r.qty>0 && <span style={{fontSize:11,color:'var(--t3)'}}>هزینه: <strong>{fc(r.qty*ing.avg_cost)} ت</strong></span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
              }
            </div>
            
            <div className="card">
              <div className="ctl" style={{marginBottom:10}}>قیمت‌گذاری</div>
              <div className="fg"><label className="fl">تخمین سفارش روزانه</label>
                <input className="fc" type="number" value={D.estOrders} onChange={function(e){setD(function(d){return Object.assign({},d,{estOrders:Number(e.target.value)||1});});}} />
              </div>
              <div className="cbox" style={{marginBottom:12}}>
                <div className="crow"><span style={{color:'var(--t3)'}}>کاست مواد اولیه</span><strong>{fc(mat)} ت</strong></div>
                {iRcp.map(function(r){
                  var ing=D.ingredients.filter(function(i){return i.id===r.iid;})[0];
                  if(!ing) return null;
                  return <div key={r.id} className="crow ind"><span>{ing.name} ({r.qty} {ing.recipe_unit||ing.mic_unit})</span><span>{fc(r.qty*ing.avg_cost)} ت</span></div>;
                })}
                <div className="crow"><span style={{color:'var(--t3)'}}>سهم سربار</span><strong>{fc(ohItem)} ت</strong></div>
                <div className="crow tot"><span>بهای تمام‌شده کل</span><span>{fc(tot)} ت</span></div>
              </div>
              {tot>0 && (
                <div className="psugg">
                  <div style={{fontSize:12,fontWeight:700,color:'var(--blue)',marginBottom:8}}>قیمت پیشنهادی</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:10}}>
                    {pOpts.map(function(opt,i){
                      return (
                        <div key={i} className="popt" onClick={function(){setCustPrice(String(Math.round(opt.price)));}}>
                          <span style={{fontSize:12,fontWeight:600,color:'var(--blue)'}}>{opt.label}</span>
                          <span style={{fontWeight:800,fontSize:14}}>{fc(opt.price)} ت</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="fg" style={{marginBottom:8}}>
                    <label className="fl" style={{color:'var(--blue)'}}>قیمت نهایی (قابل تغییر)</label>
                    <input className="fc" type="number" value={custPrice||Math.round(sug)} onChange={function(e){setCustPrice(e.target.value);}} style={{fontSize:15,fontWeight:700}} />
                    {custPrice && <p className="fh">حاشیه سود: {toFa(((Number(custPrice)-tot)/Number(custPrice)*100).toFixed(1))}٪</p>}
                  </div>
                  {pconf
                    ? <div className="al as" style={{marginBottom:0}}>✓ قیمت ثبت شد!</div>
                    : <button className="btn bp bfull" onClick={confirmPrice}>✓ ثبت قیمت نهایی</button>
                  }
                </div>
              )}
              {item.price>0 && <div className="crow" style={{color:item.price>tot?'#10B981':'#EF4444',fontWeight:700,marginTop:6}}><span>قیمت ثبت‌شده</span><span>{fc(item.price)} ت</span></div>}
            </div>
          </div>
        ) : (
          <div className="card"><div className="empty"><div className="empty-i"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l5 4-5 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></div><p>یک آیتم منو انتخاب کنید</p></div></div>
        )}
      </div>
      
      {/* ING PICKER MODAL */}
      <Modal open={ingPRow!==null} onClose={function(){setIngPRow(null);}} title="انتخاب ماده اولیه">
        <IngPicker ingredients={D.ingredients}
          value={(D.recipes.filter(function(r){return r.id===ingPRow;})[0]||{}).iid}
          exclude={usedIds.filter(function(id){var rr=D.recipes.filter(function(r){return r.id===ingPRow;})[0];return rr?id!==rr.iid:true;})}
          onChange={function(id){updR(ingPRow,'iid',id);setIngPRow(null);}}
        />
      </Modal>
      
      {/* MENU MODAL */}
      <Modal open={mmOpen} onClose={function(){setMmOpen(false);}} title={editMid?'ویرایش آیتم منو':'آیتم جدید'}>
        <div className="fr">
          <div className="fg"><label className="fl">نام آیتم *</label><input className="fc" value={mf.name} onChange={function(e){setMf(function(f){return Object.assign({},f,{name:e.target.value});});}} placeholder="لاته" /></div>
          <div className="fg"><label className="fl">دسته‌بندی</label>
            <select className="fc" value={mf.category} onChange={function(e){setMf(function(f){return Object.assign({},f,{category:e.target.value});});}}>
              {MCATS.map(function(c){return <option key={c}>{c}</option>;})}
            </select>
          </div>
        </div>
        <div className="fg"><label className="fl">درصد سود هدف (%)</label><input className="fc" type="number" value={mf.margin} onChange={function(e){setMf(function(f){return Object.assign({},f,{margin:e.target.value});});}} /></div>
        <div className="mft"><button className="btn bs" onClick={function(){setMmOpen(false);}}>انصراف</button><button className="btn bp" onClick={saveM}>ذخیره</button></div>
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════
   PURCHASE REPORT
══════════════════════════════════════ */

export default Recipe
