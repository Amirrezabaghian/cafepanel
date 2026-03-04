import React, { useState, useRef, useEffect } from 'react'
import NIcon, { IBtn } from '../ui/NIcon.jsx'
import { Modal, DP, IngPicker, Spark, BarChart } from '../ui/index.jsx'
import { toFa, fc, fp, dailyR, todayJ, nowStr, UPAIRS, ICATS, MCATS, JMONS, PROLES, CCOLORS } from '../../lib/utils.js'


function StockPage(props) {
  var D=props.D, setD=props.setD;
  var adjModalS=useState(false); var adjModal=adjModalS[0]; var setAdjModal=adjModalS[1];
  var adjIngValS=useState(null); var adjIngVal=adjIngValS[0]; var setAdjIngVal=adjIngValS[1];
  var adjAmtS=useState(0); var adjAmt=adjAmtS[0]; var setAdjAmt=adjAmtS[1];
  var adjNoteS=useState(''); var adjNote=adjNoteS[0]; var setAdjNote=adjNoteS[1];
  var adjTypeS=useState('add'); var adjType=adjTypeS[0]; var setAdjType=adjTypeS[1];
  var fcatS=useState('همه'); var fcatVal=fcatS[0]; var setFcat=fcatS[1];

  var tj=todayJ();
  var todayStr=tj[0]+'/'+String(tj[1]).padStart(2,'0')+'/'+String(tj[2]).padStart(2,'0');

  function openAdj(ing){setAdjIngVal(ing);setAdjAmt(0);setAdjNote('');setAdjType('add');setAdjModal(true);}

  function saveAdj(){
    if(!adjIngVal||!adjAmt) return;
    var delta=adjType==='add'?Number(adjAmt):-Number(adjAmt);
    var newIngs=D.ingredients.map(function(i){
      if(i.id!==adjIngVal.id) return i;
      var newStock=Math.max(0,i.stock+delta);
      /* Update maxStock on purchase/add */
      var ms=i.maxStock||i.stock;
      if(delta>0) ms=newStock;
      return Object.assign({},i,{stock:newStock,maxStock:ms});
    });
    var log={id:Date.now(),date:todayStr,type:adjType,
      label:(adjType==='add'?'افزایش':'کاهش')+' دستی: '+adjIngVal.name,
      changes:[{ingName:adjIngVal.name,deduct:delta<0?-delta:0,add:delta>0?delta:0,
        unit:adjIngVal.recipe_unit||adjIngVal.mic_unit,before:adjIngVal.stock,
        after:Math.max(0,adjIngVal.stock+delta),note:adjNote}]};
    setD(function(d){return Object.assign({},d,{ingredients:newIngs,stockLogs:[log].concat(d.stockLogs||[])});});
    setAdjModal(false);
  }

  var cats=['همه'].concat(ICATS);
  var list=fcatVal==='همه'?D.ingredients:D.ingredients.filter(function(i){return i.category===fcatVal;});

  function daysLeft(ing){
    var usage=D.recipes.filter(function(r){return r.iid===ing.id;}).reduce(function(s,r){return s+r.qty;},0)*D.estOrders;
    return usage>0?Math.floor(ing.stock/usage):999;
  }

  /* Stock bar pct: relative to maxStock (set on last purchase) */
  function stockPct(ing){
    var ms=ing.maxStock||ing.stock;
    if(ms<=0) return 100;
    return Math.min(Math.round(ing.stock/ms*100),100);
  }

  var totalIngValue=D.ingredients.reduce(function(s,i){return s+i.stock*i.avg_cost;},0);
  var lowStock=D.ingredients.filter(function(i){return daysLeft(i)<7;}).length;
  var critStock=D.ingredients.filter(function(i){return daysLeft(i)<3;}).length;

  return (
    <div>
      {/* KPIs */}
      <div className="g3">
        <div className="stat">
          <div className="slb">ارزش کل انبار</div>
          <div className="svl">{fc(Math.round(totalIngValue/1000))}<span className="svl-unit">هزار ت</span></div>
          <div className="stat-sub">{toFa(String(D.ingredients.length))} نوع ماده اولیه</div>
        </div>
        <div className="stat">
          <div className="slb">مواد کم‌موجودی</div>
          <div className="svl" style={{color:lowStock>0?'var(--amber)':'var(--green)'}}>{toFa(String(lowStock))}<span className="svl-unit">ماده</span></div>
          <div className="stat-sub" style={{color:critStock>0?'var(--red)':'var(--t3)'}}>
            {critStock>0?toFa(String(critStock))+' ماده بحرانی':'وضعیت انبار مناسب'}
          </div>
        </div>
        <div className="stat">
          <div className="slb">تعدیل‌های انبار</div>
          <div className="svl">{toFa(String((D.stockLogs||[]).length))}</div>
          <div className="stat-sub">کل تغییرات ثبت‌شده</div>
        </div>
      </div>

      {/* Category filter */}
      <div className="tabs" style={{marginBottom:12}}>
        {cats.map(function(c){return <span key={c} className={'tab'+(fcatVal===c?' act':'')} onClick={function(){setFcat(c);}}>{c}</span>;})}
      </div>

      {/* Stock grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))',gap:10,marginBottom:14}}>
        {list.map(function(ing){
          var days=daysLeft(ing);
          var pct=stockPct(ing);
          var statusCol=pct<=20?'var(--red)':pct<=50?'var(--amber)':'var(--green)';
          var statusLabel=days<=3?'بحرانی':days<=10?'کم':days>=999?'کافی':toFa(String(days))+' روز';
          return (
            <div key={ing.id} className="card" style={{marginBottom:0}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                <div>
                  <div style={{fontWeight:700,fontSize:13.5,marginBottom:3}}>{ing.name}</div>
                  <span className="cpill">{ing.category}</span>
                </div>
                <div style={{textAlign:'left',display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                  <span className="bdg" style={{background:statusCol+'22',color:statusCol,border:'1px solid '+statusCol+'44'}}>{statusLabel}</span>
                  <button className="btn bs bxs" onClick={function(){openAdj(ing);}}>تعدیل</button>
                </div>
              </div>

              {/* Progress bar — based on ratio to maxStock (last purchase level) */}
              <div style={{marginBottom:9}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                  <span style={{color:'var(--t3)'}}>موجودی</span>
                  <span style={{fontWeight:700}}>{fc(ing.stock)} {ing.mic_unit}</span>
                </div>
                <div style={{height:7,background:'var(--surface2)',borderRadius:99,overflow:'hidden',position:'relative'}}>
                  <div style={{height:'100%',width:pct+'%',background:statusCol,borderRadius:99,transition:'width .5s cubic-bezier(.4,0,.2,1)'}}/>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--t3)',marginTop:3}}>
                  <span>{toFa(String(pct))}٪ از آخرین خرید</span>
                  {ing.maxStock&&<span>حداکثر: {fc(ing.maxStock)} {ing.mic_unit}</span>}
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>
                <div style={{background:'var(--surface2)',borderRadius:'var(--r2)',padding:'7px 9px'}}>
                  <div style={{fontSize:10,color:'var(--t3)',marginBottom:1}}>قیمت/واحد</div>
                  <div style={{fontSize:12,fontWeight:700}}>{fc(ing.avg_cost)} ت</div>
                </div>
                <div style={{background:'var(--surface2)',borderRadius:'var(--r2)',padding:'7px 9px'}}>
                  <div style={{fontSize:10,color:'var(--t3)',marginBottom:1}}>ارزش انبار</div>
                  <div style={{fontSize:12,fontWeight:700}}>{fc(Math.round(ing.stock*ing.avg_cost))} ت</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stock log */}
      {(D.stockLogs||[]).length>0&&(
        <div className="card">
          <div className="chd"><div className="ctl">تاریخچه تغییرات انبار</div><div className="csb">{toFa(String(Math.min((D.stockLogs||[]).length,20)))} رکورد اخیر</div></div>
          <div className="tw"><table>
            <thead><tr><th>تاریخ</th><th>نوع</th><th>شرح</th><th>تغییرات</th></tr></thead>
            <tbody>
              {(D.stockLogs||[]).slice(0,20).map(function(log){
                return (
                  <tr key={log.id}>
                    <td style={{color:'var(--t3)',fontSize:12}}>{log.date}</td>
                    <td><span className={'bdg '+(log.type==='sale'?'br':log.type==='add'?'bg':'bo')}>{log.type==='sale'?'فروش':log.type==='add'?'افزایش':'کاهش'}</span></td>
                    <td style={{fontSize:12}}>{log.label}</td>
                    <td>
                      {(log.changes||[]).slice(0,2).map(function(ch,i){
                        return <div key={i} style={{fontSize:11}}>{ch.ingName}: {ch.deduct>0?'−'+fc(ch.deduct):'+'+fc(ch.add||0)} {ch.unit}</div>;
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </div>
      )}

      {/* Adjust Modal */}
      <Modal open={adjModal} onClose={function(){setAdjModal(false);}} title={'تعدیل انبار'+(adjIngVal?' — '+adjIngVal.name:'')}>
        <div className="fg">
          <label className="fl">نوع تغییر</label>
          <div className="tabs" style={{marginBottom:0}}>
            <span className={'tab'+(adjType==='add'?' act':'')} onClick={function(){setAdjType('add');}}>افزایش موجودی</span>
            <span className={'tab'+(adjType==='sub'?' act':'')} onClick={function(){setAdjType('sub');}}>کاهش / هدررفت</span>
          </div>
        </div>
        <div className="fg">
          <label className="fl">مقدار ({adjIngVal?(adjIngVal.recipe_unit||adjIngVal.mic_unit):''})</label>
          <input className="fc" type="number" min="0" value={adjAmt||''}
            onChange={function(e){setAdjAmt(Math.max(0,Number(e.target.value)||0));}} placeholder="مقدار را وارد کنید..."/>
        </div>
        {adjIngVal&&adjAmt>0&&(
          <div className="al" style={{background:'var(--surface2)',borderColor:'var(--line)',color:'var(--t1)'}}>
            موجودی: {fc(adjIngVal.stock)} → <strong>{fc(Math.max(0,adjIngVal.stock+(adjType==='add'?1:-1)*Number(adjAmt)))}</strong> {adjIngVal.mic_unit}
          </div>
        )}
        <div className="fg">
          <label className="fl">یادداشت (اختیاری)</label>
          <input className="fc" value={adjNote} onChange={function(e){setAdjNote(e.target.value);}} placeholder="دلیل تغییر..."/>
        </div>
        <div className="mft">
          <button className="btn bs" onClick={function(){setAdjModal(false);}}>انصراف</button>
          <button className="btn bp" onClick={saveAdj} disabled={!adjAmt}>
            <NIcon n="check" s={13}/> ثبت تغییر
          </button>
        </div>
      </Modal>
    </div>
  );
}


export default StockPage
