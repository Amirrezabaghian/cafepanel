import React, { useState, useRef, useEffect } from 'react'
import NIcon, { IBtn } from '../ui/NIcon.jsx'
import { Modal, DP, IngPicker, Spark, BarChart } from '../ui/index.jsx'
import { toFa, fc, fp, dailyR, todayJ, nowStr, UPAIRS, ICATS, MCATS, JMONS, PROLES, CCOLORS } from '../../lib/utils.js'


function PurchaseReport(props) {
  var D=props.D;
  var selIng = useState(D.ingredients[0]?D.ingredients[0].id:null), setSelIng = selIng[1]; selIng = selIng[0];
  var period = useState('monthly'), setPeriod = period[1]; period = period[0];
  var ing = D.ingredients.filter(function(i){return i.id===selIng;})[0];
  var tj = todayJ(); var jY=tj[0], jM=tj[1], jD=tj[2];
  var mPrefix = jY+'/'+String(jM).padStart(2,'0');
  
  var allPurchases = [];
  D.invoices.forEach(function(inv){
    (inv.items||[]).forEach(function(it){
      if(it.ing_id===selIng) allPurchases.push({date:inv.date,qty:it.qty,uprice:it.uprice,total:it.total});
    });
  });
  allPurchases.sort(function(a,b){return (b.date||'').localeCompare(a.date||'');});
  
  var filtered = allPurchases.filter(function(p){
    if(!p.date) return false;
    var parts = p.date.split('/').map(Number);
    if(period==='daily') return parts[0]===jY && parts[1]===jM && parts[2]===jD;
    if(period==='weekly') {
      var diff = (jY*365+jM*30+jD)-(parts[0]*365+parts[1]*30+parts[2]);
      return diff>=0 && diff<=7;
    }
    if(period==='monthly') return p.date.indexOf(mPrefix)===0;
    return true;
  });
  
  var totalQty = filtered.reduce(function(s,p){return s+p.qty;},0);
  var totalSpent = filtered.reduce(function(s,p){return s+p.total;},0);
  
  var chartData = Array.from({length:8},function(_,i){
    var mi = ((jM-1-i+12)%12)+1;
    var yi = jY - (jM-1-i<0?1:0);
    var pref = yi+'/'+String(mi).padStart(2,'0');
    var qty = D.invoices.reduce(function(s,inv){
      if(!inv.date||inv.date.indexOf(pref)!==0) return s;
      return s + (inv.items||[]).filter(function(it){return it.ing_id===selIng;}).reduce(function(ss,it){return ss+it.qty;},0);
    },0);
    return {month:JMONS[mi-1], qty:qty};
  }).reverse();
  
  return (
    <div>
      <div className="g2" style={{marginBottom:16,alignItems:'flex-start'}}>
        <div className="card" style={{maxHeight:600,overflowY:'auto'}}>
          <div className="chd"><div className="ctl">مواد اولیه</div></div>
          {D.ingredients.map(function(i) {
            var tot = D.invoices.reduce(function(s,inv){return s+(inv.items||[]).filter(function(it){return it.ing_id===i.id;}).reduce(function(ss,it){return ss+it.qty;},0);},0);
            return (
              <div key={i.id} className={'rpcard'+(selIng===i.id?' sl':'')} onClick={function(){setSelIng(i.id);}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div><div style={{fontWeight:700,fontSize:13}}>{i.name}</div><span className="cpill" style={{fontSize:10}}>{i.category}</span></div>
                  <div style={{textAlign:'left'}}><div style={{fontWeight:700,color:'var(--blue)'}}>{fc(tot)} {i.mac_unit}</div><div style={{fontSize:11,color:'var(--t3)'}}>کل خرید</div></div>
                </div>
              </div>
            );
          })}
        </div>
        {ing && (
          <div>
            <div className="card">
              <div className="ctl" style={{marginBottom:10}}>{ing.name} — گزارش</div>
              <div className="tabs">
                {[['daily','امروز'],['weekly','هفته'],['monthly','ماه'],['all','همه']].map(function(kl){
                  return <span key={kl[0]} className={'tab'+(period===kl[0]?' act':'')} onClick={function(){setPeriod(kl[0]);}}>{kl[1]}</span>;
                })}
              </div>
              <div className="g2" style={{marginBottom:12}}>
                <div className="stat"><div className="slb">مجموع مقدار</div><div className="svl" style={{fontSize:18}}>{fc(totalQty)} <span style={{fontSize:11,fontWeight:400}}>{ing.mac_unit}</span></div></div>
                <div className="stat"><div className="slb">مجموع هزینه</div><div className="svl" style={{fontSize:18}}>{fc(totalSpent)} <span style={{fontSize:11,fontWeight:400}}>ت</span></div></div>
              </div>
              <div className="stl" style={{fontSize:12,color:'var(--t3)'}}>روند خرید ({ing.mac_unit})</div>
              <BarChart data={chartData.map(function(c){return c.qty||0;})} labels={chartData.map(function(c){return c.month;})} h={100} />
            </div>
            <div className="card">
              {filtered.length===0
                ? <div className="empty"><div className="empty-i"><NIcon n="chart" /></div><p>خریدی در این بازه نیست</p></div>
                : <div className="tw"><table>
                    <thead><tr><th>تاریخ</th><th>مقدار</th><th>قیمت واحد</th><th>جمع</th></tr></thead>
                    <tbody>
                      {filtered.map(function(p,i){
                        return (
                          <tr key={i}>
                            <td>{p.date}</td>
                            <td><strong>{fc(p.qty)} {ing.mac_unit}</strong><br/><span style={{fontSize:11,color:'var(--t3)'}}>{fc(p.qty*ing.rate)} {ing.mic_unit}</span></td>
                            <td>{fc(p.uprice)} ت</td>
                            <td><strong>{fc(p.total)} ت</strong></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table></div>
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   OVERHEAD
══════════════════════════════════════ */

export default PurchaseReport
