import React, { useState, useRef, useEffect } from 'react'
import NIcon, { IBtn } from '../ui/NIcon.jsx'
import { Modal, DP, IngPicker, Spark, BarChart } from '../ui/index.jsx'
import { toFa, fc, fp, dailyR, todayJ, nowStr, UPAIRS, ICATS, MCATS, JMONS, PROLES, CCOLORS } from '../../lib/utils.js'


function Dashboard(props) {
  var D=props.D, setD=props.setD;
  var ings=D.ingredients, mis=D.menuItems, recs=D.recipes, ovs=D.overheads, invs=D.invoices, cards=D.cards;

  /* ── core calcs ── */
  var todOH = ovs.reduce(function(s,o){return s+dailyR(o);},0);
  var ohItem = D.estOrders>0 ? todOH/D.estOrders : 0;
  var costed = mis.map(function(item){
    var mat=recs.filter(function(r){return r.mid===item.id;}).reduce(function(s,r){
      var ing=ings.filter(function(i){return i.id===r.iid;})[0];
      return s+(ing?r.qty*ing.avg_cost:0);
    },0);
    var tot=mat+ohItem;
    return Object.assign({},item,{mat:mat,tot:tot,profitMg:item.price>0?(item.price-tot)/item.price*100:0});
  });
  var avgMg = costed.length?costed.reduce(function(s,i){return s+i.profitMg;},0)/costed.length:0;
  var avgPrice = costed.length?costed.reduce(function(s,i){return s+i.price;},0)/costed.length:1;
  var BE = todOH>0&&avgPrice>0?Math.ceil(todOH/avgPrice):0;
  var tj=todayJ(); var jY=tj[0],jM=tj[1],jD=tj[2];
  var mPrefix=jY+'/'+String(jM).padStart(2,'0');
  var prevM=jM===1?12:jM-1, prevY=jM===1?jY-1:jY;
  var prevPrefix=prevY+'/'+String(prevM).padStart(2,'0');
  var mInvs=invs.filter(function(inv){return inv.date&&inv.date.indexOf(mPrefix)===0;});
  var prevInvs=invs.filter(function(inv){return inv.date&&inv.date.indexOf(prevPrefix)===0;});
  var mTot=mInvs.reduce(function(s,i){return s+i.total;},0);
  var prevTot=prevInvs.reduce(function(s,i){return s+i.total;},0);
  var mChange=prevTot>0?((mTot-prevTot)/prevTot*100):0;
  var recent=invs.slice().sort(function(a,b){return b.id-a.id;}).slice(0,5);

  /* ── stock depletion predictions ── */
  var ingAlerts = ings.map(function(ing){
    var totalUsagePerOrder = recs.filter(function(r){return r.iid===ing.id;}).reduce(function(s,r){return s+r.qty;},0);
    var dailyUsage = totalUsagePerOrder * D.estOrders;
    var daysLeft = dailyUsage>0 ? Math.floor(ing.stock/dailyUsage) : 999;
    return Object.assign({},ing,{daysLeft:daysLeft,dailyUsage:dailyUsage});
  }).filter(function(i){return i.daysLeft<14;}).sort(function(a,b){return a.daysLeft-b.daysLeft;});

  /* ── price trend alerts ── */
  var priceAlerts = ings.map(function(ing){
    var purchases = [];
    invs.forEach(function(inv){
      (inv.items||[]).forEach(function(it){
        if(it.ing_id===ing.id && it.qty>0) purchases.push({date:inv.date,uprice:it.uprice/ing.rate});
      });
    });
    purchases.sort(function(a,b){return (a.date||'').localeCompare(b.date||'');});
    if(purchases.length<2) return null;
    var last=purchases[purchases.length-1].uprice;
    var prev=purchases[purchases.length-2].uprice;
    var chg = prev>0?(last-prev)/prev*100:0;
    if(Math.abs(chg)<5) return null;
    return {name:ing.name,chg:chg,last:last};
  }).filter(Boolean);

  /* ── monthly chart data from real invoices ── */
  var chartMonths = Array.from({length:6},function(_,i){
    var mi=((jM-1-i+12)%12)+1;
    var yi=jY-(jM-1-i<0?1:0);
    var pref=yi+'/'+String(mi).padStart(2,'0');
    var tot=invs.filter(function(inv){return inv.date&&inv.date.indexOf(pref)===0;})
               .reduce(function(s,inv){return s+inv.total;},0);
    return {label:JMONS[mi-1],val:tot};
  }).reverse();

  /* ── top spend ingredients ── */
  var ingSpend = ings.map(function(ing){
    var tot=invs.reduce(function(s,inv){
      return s+(inv.items||[]).filter(function(it){return it.ing_id===ing.id;}).reduce(function(ss,it){return ss+it.total;},0);
    },0);
    return {name:ing.name,tot:tot};
  }).sort(function(a,b){return b.tot-a.tot;}).slice(0,5);
  var maxSpend = ingSpend[0]?ingSpend[0].tot:1;

  /* ── today's date string ── */
  var todayStr = jY+'/'+String(jM).padStart(2,'0')+'/'+String(jD).padStart(2,'0');

  return (
    <div>

      {/* ── HERO: صبح بخیر ── */}
      <div className="db-hero">
        <div>
          <div className="db-hero-title">صبح بخیر، {D.currentUser?D.currentUser.name.split(' ')[0]:'مدیر'}</div>
          <div className="db-hero-sub">{todayStr} · امروز باید <strong>{toFa(String(BE))}</strong> سفارش بگیری تا سربار پوشش داده بشه</div>
        </div>
        <div className="db-hero-be">
          <div className="db-hero-be-label">نقطه سر به سر امروز</div>
          <div className="db-hero-be-val">{toFa(String(BE))}<span>سفارش</span></div>
          <div className="db-hero-be-prog">
            <div className="db-hero-be-fill" style={{width:Math.min(D.estOrders/Math.max(BE,1)*100,100)+'%'}} />
          </div>
          <div className="db-hero-be-hint">{D.estOrders>=BE?'برآورد فعلی کافیه':'برآورد فعلی '+toFa(String(D.estOrders))+' سفارشه'}</div>
        </div>
      </div>

      {/* ── KPI ROW ── */}
      <div className="g4">
        <div className="stat">
          <div className="slb">سربار روزانه</div>
          <div className="svl">{fc(Math.round(todOH))}<span className="svl-unit">ت</span></div>
          <div className="stat-sub">هر سفارش: {fc(Math.round(ohItem))} ت</div>
        </div>
        <div className="stat">
          <div className="slb">میانگین حاشیه سود</div>
          <div className="svl" style={{color:avgMg>40?'var(--green)':avgMg>20?'var(--amber)':'var(--red)'}}>{toFa(avgMg.toFixed(1))}<span className="svl-unit">٪</span></div>
          <div className="stat-sub">{toFa(String(costed.length))} آیتم منو محاسبه شد</div>
        </div>
        <div className="stat">
          <div className="slb">خرید ماه جاری</div>
          <div className="svl">{fc(Math.round(mTot/1000))}<span className="svl-unit">هزار ت</span></div>
          <div className={'stat-sub stat-trend '+(mChange>0?'up':'down')}>
            {mChange>0?'▲':'▼'} {toFa(Math.abs(mChange).toFixed(1))}٪ نسبت به ماه قبل
          </div>
        </div>
        <div className="stat">
          <div className="slb">موجودی کارت‌ها</div>
          <div className="svl">{fc(Math.round(cards.reduce(function(s,c){return s+c.bal;},0)/1000))}<span className="svl-unit">هزار ت</span></div>
          <div className="stat-sub">{toFa(String(cards.length))} کارت فعال</div>
        </div>
      </div>

      {/* ── ALERTS ── */}
      {(ingAlerts.length>0||priceAlerts.length>0) && (
        <div className="db-alerts">
          {ingAlerts.slice(0,3).map(function(ing){
            var urgency = ing.daysLeft<=2?'db-alert-r':ing.daysLeft<=7?'db-alert-a':'db-alert-i';
            return (
              <div key={ing.id} className={'db-alert '+urgency}>
                <NIcon n="warn" s={14} />
                <span><strong>{ing.name}</strong> — {ing.daysLeft===0?'امروز تموم می‌شه':toFa(String(ing.daysLeft))+' روز دیگه تموم می‌شه'}</span>
              </div>
            );
          })}
          {priceAlerts.slice(0,2).map(function(a,i){
            return (
              <div key={i} className="db-alert db-alert-a">
                <NIcon n="chart" s={14} />
                <span>قیمت <strong>{a.name}</strong> {a.chg>0?toFa(a.chg.toFixed(0))+'٪ افزایش':'کاهش'} داشته — قیمت منو رو چک کن</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MAIN GRID ── */}
      <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:12,marginBottom:12}}>

        {/* Monthly trend */}
        <div className="card" style={{marginBottom:0}}>
          <div className="chd">
            <div><div className="ctl">روند هزینه خرید</div><div className="csb">۶ ماه اخیر</div></div>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span className={'bdg '+(mChange>0?'br':'bg')}>{mChange>0?'▲':'▼'} {toFa(Math.abs(mChange).toFixed(0))}٪</span>
            </div>
          </div>
          <BarChart
            data={chartMonths.map(function(c){return c.val/1000000||0;})}
            labels={chartMonths.map(function(c){return c.label;})}
            activeIdx={5}
            h={110}
          />
          <div style={{display:'flex',justifyContent:'space-between',marginTop:8,paddingTop:8,borderTop:'1px solid var(--line)'}}>
            <div style={{fontSize:11,color:'var(--t3)'}}>ماه قبل: <strong style={{color:'var(--t2)'}}>{fc(Math.round(prevTot/1000))} هزار ت</strong></div>
            <div style={{fontSize:11,color:'var(--t3)'}}>ماه جاری: <strong style={{color:'var(--t1)'}}>{fc(Math.round(mTot/1000))} هزار ت</strong></div>
          </div>
        </div>

        {/* Stock health */}
        <div className="card" style={{marginBottom:0}}>
          <div className="chd"><div className="ctl">وضعیت انبار</div><div className="csb">بر اساس مصرف روزانه</div></div>
          {ings.slice(0,6).map(function(ing){
            var usage=recs.filter(function(r){return r.iid===ing.id;}).reduce(function(s,r){return s+r.qty;},0)*D.estOrders;
            var days=usage>0?Math.floor(ing.stock/usage):99;
            var pct=Math.min(days/30*100,100);
            var col=days<=3?'var(--red)':days<=10?'var(--amber)':'var(--green)';
            return (
              <div key={ing.id} style={{marginBottom:9}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11.5,marginBottom:3}}>
                  <span style={{fontWeight:600}}>{ing.name}</span>
                  <span style={{color:col,fontWeight:600}}>{days>=99?'کافی':toFa(String(days))+' روز'}</span>
                </div>
                <div style={{height:5,background:'var(--surface2)',borderRadius:99,overflow:'hidden'}}>
                  <div style={{height:'100%',width:pct+'%',background:col,borderRadius:99,transition:'width .4s'}} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SECOND ROW ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1.2fr',gap:12,marginBottom:12}}>

        {/* Top spend */}
        <div className="card" style={{marginBottom:0}}>
          <div className="chd"><div className="ctl">بیشترین هزینه خرید</div><div className="csb">کل دوره</div></div>
          {ingSpend.length===0
            ? <div className="empty" style={{padding:'20px 0'}}><p>داده‌ای وجود ندارد</p></div>
            : ingSpend.map(function(item,i){
                var pct=item.tot/maxSpend*100;
                return (
                  <div key={i} style={{marginBottom:10}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:3}}>
                      <span style={{fontWeight:600,color:'var(--t1)'}}>{item.name}</span>
                      <span style={{color:'var(--t2)',fontWeight:500}}>{fc(Math.round(item.tot))} ت</span>
                    </div>
                    <div style={{height:5,background:'var(--surface2)',borderRadius:99}}>
                      <div style={{height:'100%',width:pct+'%',background:'var(--t1)',borderRadius:99,opacity:.15+i*.15}} />
                    </div>
                  </div>
                );
              })
          }
        </div>

        {/* Menu profitability */}
        <div className="card" style={{marginBottom:0}}>
          <div className="chd"><div className="ctl">سودآوری منو</div><div className="csb">بر اساس بهای تمام‌شده</div></div>
          {costed.length===0
            ? <div className="empty" style={{padding:'20px 0'}}><p>رسپی‌ای تنظیم نشده</p></div>
            : costed.slice(0,5).map(function(item){
                var mg=item.profitMg;
                var col=mg>50?'var(--green)':mg>25?'var(--amber)':'var(--red)';
                return (
                  <div key={item.id} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8,padding:'8px 10px',background:'var(--surface2)',borderRadius:'var(--r2)'}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12.5,fontWeight:600}}>{item.name}</div>
                      <div style={{fontSize:11,color:'var(--t3)',marginTop:1}}>قیمت: {fc(item.price)} ت · کاست: {fc(Math.round(item.tot))} ت</div>
                    </div>
                    <div style={{textAlign:'left'}}>
                      <div style={{fontSize:14,fontWeight:800,color:col}}>{toFa(mg.toFixed(0))}٪</div>
                      <div style={{fontSize:10,color:'var(--t3)'}}>حاشیه</div>
                    </div>
                  </div>
                );
              })
          }
        </div>
      </div>

      {/* ── BOTTOM ROW ── */}
      <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr',gap:12}}>

        {/* Recent invoices */}
        <div className="card" style={{marginBottom:0}}>
          <div className="chd">
            <div><div className="ctl">فاکتورهای اخیر</div><div className="csb">{toFa(String(recent.length))} فاکتور اخیر</div></div>
          </div>
          {recent.length===0
            ? <div className="empty"><div className="empty-i"><NIcon n="receipt" /></div><p>فاکتوری ثبت نشده</p></div>
            : <div className="tw"><table>
                <thead><tr><th>تاریخ</th><th>خریدار</th><th>مبلغ</th><th>وضعیت</th></tr></thead>
                <tbody>
                  {recent.map(function(inv){
                    var buyer=D.users.filter(function(u){return u.id===Number(inv.uid);})[0];
                    return (
                      <tr key={inv.id}>
                        <td style={{color:'var(--t3)',fontSize:12}}>{inv.date}</td>
                        <td><strong style={{fontSize:12.5}}>{buyer?buyer.name:'—'}</strong></td>
                        <td><strong>{fc(inv.total)} ت</strong></td>
                        <td>{inv.elog&&inv.elog.length>0?<span className="bdg bo">ویرایش</span>:<span className="bdg bg">اولیه</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table></div>
          }
        </div>

        {/* Cards summary */}
        <div className="card" style={{marginBottom:0}}>
          <div className="chd"><div className="ctl">کارت‌های بانکی</div></div>
          {cards.map(function(c){
            return (
              <div key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'var(--surface2)',borderRadius:'var(--r2)',marginBottom:6}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:c.color,flexShrink:0}} />
                <div style={{flex:1}}>
                  <div style={{fontSize:12.5,fontWeight:600}}>{c.name}</div>
                  <div style={{fontSize:10.5,color:'var(--t3)'}}>{c.num}</div>
                </div>
                <div style={{textAlign:'left'}}>
                  <div style={{fontSize:13,fontWeight:700}}>{fc(Math.round(c.bal/1000))} هزار</div>
                  <div style={{fontSize:10,color:'var(--t3)'}}>تومان</div>
                </div>
              </div>
            );
          })}
          <div className="dv" />
          <div className="crow">
            <span style={{color:'var(--t3)',fontSize:12}}>مجموع موجودی</span>
            <strong>{fc(Math.round(cards.reduce(function(s,c){return s+c.bal;},0)/1000))} هزار ت</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   INGREDIENTS
══════════════════════════════════════ */

export default Dashboard
