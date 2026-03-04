import React, { useState, useRef, useEffect } from 'react'
import NIcon, { IBtn } from '../ui/NIcon.jsx'
import { Modal, DP, IngPicker, Spark, BarChart } from '../ui/index.jsx'
import { toFa, fc, fp, dailyR, todayJ, nowStr, UPAIRS, ICATS, MCATS, JMONS, PROLES, CCOLORS } from '../../lib/utils.js'


function SaleReport(props) {
  var D=props.D, setD=props.setD;
  var tj=todayJ();
  var todayStr=tj[0]+'/'+String(tj[1]).padStart(2,'0')+'/'+String(tj[2]).padStart(2,'0');

  var periodS=useState('daily'); var period=periodS[0]; var setPeriod=periodS[1];
  var fromS=useState(todayStr); var from=fromS[0]; var setFrom=fromS[1];
  var toS=useState(todayStr); var to=toS[0]; var setTo=toS[1];
  var selInvS=useState(null); var selInv=selInvS[0]; var setSelInv=selInvS[1];
  var editInvS=useState(null); var editInv=editInvS[0]; var setEditInv=editInvS[1];
  var filterCustS=useState('all'); var filterCust=filterCustS[0]; var setFilterCust=filterCustS[1];
  var filterPayS=useState('all'); var filterPay=filterPayS[0]; var setFilterPay=filterPayS[1];

  var invoices=D.saleInvoices||[];

  function dateInRange(date){
    if(period==='daily') return date===todayStr;
    if(period==='weekly'){
      var d1=date.split('/').map(Number);
      var d2=todayStr.split('/').map(Number);
      var diff=(d2[0]*365+d2[1]*30+d2[2])-(d1[0]*365+d1[1]*30+d1[2]);
      return diff>=0&&diff<=6;
    }
    if(period==='monthly') return date.slice(0,7)===todayStr.slice(0,7);
    if(period==='yearly') return date.slice(0,4)===todayStr.slice(0,4);
    if(period==='custom'){if(!from||!to) return true;return date>=from&&date<=to;}
    return true;
  }

  var filtered=invoices.filter(function(inv){
    if(!dateInRange(inv.date)) return false;
    if(filterCust!=='all'&&String(inv.custId)!==String(filterCust)) return false;
    if(filterPay==='paid'&&inv.status!=='paid') return false;
    if(filterPay==='unpaid'&&inv.status!=='unpaid') return false;
    return true;
  });
  filtered=filtered.slice().sort(function(a,b){return b.id-a.id;});

  var totalRev=filtered.reduce(function(s,i){return s+i.total;},0);
  var totalTax=filtered.reduce(function(s,i){return s+i.taxAmt;},0);
  var totalDisc=filtered.reduce(function(s,i){return s+i.discountAmt;},0);
  var unpaidCount=filtered.filter(function(i){return i.status==='unpaid';}).length;
  var unpaidAmt=filtered.filter(function(i){return i.status==='unpaid';}).reduce(function(s,i){return s+i.total;},0);

  function togglePaid(invId){
    setD(function(d){
      return Object.assign({},d,{saleInvoices:(d.saleInvoices||[]).map(function(inv){
        if(inv.id!==invId) return inv;
        var ns=inv.status==='paid'?'unpaid':'paid';
        return Object.assign({},inv,{status:ns,paid:ns==='paid'});
      })});
    });
    if(selInv&&selInv.id===invId){
      setSelInv(function(si){var ns=si.status==='paid'?'unpaid':'paid';return Object.assign({},si,{status:ns,paid:ns==='paid'});});
    }
  }
  function deleteInv(invId){
    if(!confirm('این فاکتور حذف شود؟')) return;
    setD(function(d){return Object.assign({},d,{saleInvoices:(d.saleInvoices||[]).filter(function(i){return i.id!==invId;})});});
    if(selInv&&selInv.id===invId) setSelInv(null);
  }
  function saveEdit(){
    if(!editInv) return;
    setD(function(d){return Object.assign({},d,{saleInvoices:(d.saleInvoices||[]).map(function(i){return i.id===editInv.id?editInv:i;})});});
    setSelInv(editInv);
    setEditInv(null);
  }

  function reprintInv(inv){
    var cafeName=(D.settings||{}).cafeNameFa||'کافه من';
    var kitTick='<html dir="rtl"><head><meta charset="UTF-8"><style>body{font-family:Tahoma;font-size:13px;padding:8px;}h2{font-size:15px;font-weight:900;border-bottom:2px solid #000;padding-bottom:4px;margin:0 0 6px;}.pager{font-size:26px;font-weight:900;text-align:center;border:3px solid #000;padding:5px;margin:5px 0;border-radius:4px;}ul{list-style:none;padding:0;margin:0;}li{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dashed #ccc;font-size:14px;font-weight:700;}</style></head><body>'+
      '<h2>'+inv.num+' — '+inv.time+'</h2>'+
      (inv.pager?'<div class="pager">پیجر '+inv.pager+'</div>':'')+
      '<ul>'+inv.items.map(function(it){return '<li><span>'+it.name+'</span><span>×'+it.qty+'</span></li>';}).join('')+'</ul>'+
      (inv.note?'<div style="font-size:11px;border-top:1px dashed #000;margin-top:5px;padding-top:4px;">'+inv.note+'</div>':'')+
      '</body></html>';
    var cusTick='<html dir="rtl"><head><meta charset="UTF-8"><style>body{font-family:Tahoma;font-size:12px;padding:10px;}table{width:100%;border-collapse:collapse;}td,th{padding:3px;border-bottom:1px solid #eee;font-size:11px;}th{font-weight:bold;border-bottom:2px solid #ccc;}</style></head><body>'+
      '<div style="text-align:center;margin-bottom:8px;"><div style="font-size:16px;font-weight:bold;">'+cafeName+'</div><div style="font-size:10px;color:#666;">'+inv.date+' — '+inv.num+(inv.pager?' | پیجر: '+inv.pager:'')+'</div></div>'+
      '<table><thead><tr><th style="text-align:right">آیتم</th><th>تعداد</th><th>قیمت</th><th>جمع</th></tr></thead><tbody>'+
      inv.items.map(function(it){return '<tr><td>'+it.name+'</td><td style="text-align:center">'+it.qty+'</td><td>'+it.price.toLocaleString()+'</td><td>'+it.price*it.qty.toLocaleString()+'</td></tr>';}).join('')+
      '</tbody></table>'+
      '<div style="margin-top:8px;border-top:2px dashed #000;padding-top:6px;">'+
      '<div style="display:flex;justify-content:space-between;font-size:11px;"><span>جمع:</span><span>'+inv.subTotal.toLocaleString()+' ت</span></div>'+
      (inv.discountAmt>0?'<div style="display:flex;justify-content:space-between;font-size:11px;color:green;"><span>تخفیف ('+inv.discountPct+'%):</span><span>-'+inv.discountAmt.toLocaleString()+' ت</span></div>':'')+
      '<div style="display:flex;justify-content:space-between;font-size:11px;"><span>مالیات ('+inv.taxPct+'%):</span><span>'+inv.taxAmt.toLocaleString()+' ت</span></div>'+
      '<div style="display:flex;justify-content:space-between;font-size:14px;font-weight:bold;border-top:2px solid #000;margin-top:4px;padding-top:4px;"><span>مبلغ کل:</span><span>'+inv.total.toLocaleString()+' تومان</span></div>'+
      '</div></body></html>';
    var pw=window.open('','_blank','width=920,height=720');
    pw.document.write('<html><head><title>چاپ مجدد</title><style>body{margin:0;display:flex;gap:20px;padding:20px;background:#e5e5e5;justify-content:center;align-items:flex-start;}.wrap{background:#fff;padding:12px;box-shadow:0 2px 12px rgba(0,0,0,.2);}.lbl{text-align:center;font-family:Tahoma;font-size:11px;color:#666;margin-bottom:6px;font-weight:bold;}.pbt{display:block;margin:16px auto;padding:10px 32px;font-size:14px;cursor:pointer;background:#111;color:#fff;border:none;border-radius:6px;}@media print{.pbt,.lbl{display:none!important;}body{background:#fff!important;gap:0!important;}}</style></head><body>'+
      '<div><div class="lbl">فاکتور آشپزخانه</div><div class="wrap">'+kitTick.replace(/<html>[\s\S]*?<body>/,'').replace(/<\/body>[\s\S]*?<\/html>/,'')+'</div></div>'+
      '<div><div class="lbl">فاکتور مشتری</div><div class="wrap">'+cusTick.replace(/<html>[\s\S]*?<body>/,'').replace(/<\/body>[\s\S]*?<\/html>/,'')+'</div></div>'+
      '<button class="pbt" onclick="window.print()">🖨 چاپ</button></body></html>');
    pw.document.close();
  }

  /* Unique customers in results */
  var custOptions=[{id:'all',name:'همه مشتریان'}].concat(
    D.customers.filter(function(c){return invoices.some(function(i){return i.custId===c.id;});})
    .map(function(c){return {id:String(c.id),name:c.name};})
  );

  return (
    <div>
      {/* KPIs */}
      <div className="g4" style={{marginBottom:14}}>
        <div className="stat">
          <div className="slb">فاکتورها</div>
          <div className="svl">{toFa(String(filtered.length))}</div>
          <div className="stat-sub">در بازه انتخابی</div>
        </div>
        <div className="stat">
          <div className="slb">درآمد کل</div>
          <div className="svl" style={{fontSize:20}}>{fc(Math.round(totalRev/1000))}<span className="svl-unit">هزار ت</span></div>
          <div className="stat-sub">تخفیف: {fc(Math.round(totalDisc/1000))} هزار ت</div>
        </div>
        <div className="stat">
          <div className="slb">مالیات جمع</div>
          <div className="svl" style={{fontSize:20,color:'var(--amber)'}}>{fc(Math.round(totalTax/1000))}<span className="svl-unit">هزار ت</span></div>
        </div>
        <div className="stat">
          <div className="slb">مانده‌دار</div>
          <div className="svl" style={{color:unpaidCount>0?'var(--red)':'var(--green)'}}>{toFa(String(unpaidCount))}</div>
          <div className="stat-sub" style={{color:'var(--red)'}}>{unpaidCount>0?fc(Math.round(unpaidAmt/1000))+' هزار ت':''}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="fbar" style={{flexWrap:'wrap',gap:10}}>
        <div className="tabs" style={{marginBottom:0}}>
          {[['daily','امروز'],['weekly','هفته'],['monthly','ماه'],['yearly','سال'],['custom','دلخواه']].map(function(kl){
            return <span key={kl[0]} className={'tab'+(period===kl[0]?' act':'')} onClick={function(){setPeriod(kl[0]);}}>{kl[1]}</span>;
          })}
        </div>
        {period==='custom'&&(
          <div style={{display:'flex',gap:7,alignItems:'center'}}>
            <span style={{fontSize:11,color:'var(--t3)'}}>از:</span><DP value={from} onChange={setFrom}/>
            <span style={{fontSize:11,color:'var(--t3)'}}>تا:</span><DP value={to} onChange={setTo}/>
          </div>
        )}
        <div style={{display:'flex',gap:7,alignItems:'center',flexWrap:'wrap'}}>
          <select className="fc fcs" value={filterCust} onChange={function(e){setFilterCust(e.target.value);}} style={{minWidth:140}}>
            {custOptions.map(function(c){return <option key={c.id} value={c.id}>{c.name}</option>;})}
          </select>
          <select className="fc fcs" value={filterPay} onChange={function(e){setFilterPay(e.target.value);}}>
            <option value="all">همه وضعیت‌ها</option>
            <option value="paid">پرداخت شده</option>
            <option value="unpaid">پرداخت نشده</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{marginBottom:0,padding:0,overflow:'hidden'}}>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>شماره</th><th>تاریخ</th><th>ساعت</th><th>پیجر</th><th>مشتری</th>
                <th>آیتم‌ها</th><th>تخفیف</th><th>مالیات</th><th>مبلغ کل</th><th>وضعیت</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length===0&&(
                <tr><td colSpan="11" style={{textAlign:'center',padding:'30px',color:'var(--t3)'}}>فاکتوری در این بازه ثبت نشده</td></tr>
              )}
              {filtered.map(function(inv){
                var isExpanded=selInv&&selInv.id===inv.id;
                return [
                  <tr key={inv.id} style={{cursor:'pointer',background:isExpanded?'var(--purple-soft)':'',transition:'background .15s'}} onClick={function(){setSelInv(isExpanded?null:inv);}}>
                    <td><span style={{fontFamily:'monospace',fontSize:11,fontWeight:700}}>{inv.num}</span></td>
                    <td style={{color:'var(--t3)',fontSize:12}}>{inv.date}</td>
                    <td style={{color:'var(--t3)',fontSize:12}}>{inv.time}</td>
                    <td>{inv.pager?<span style={{fontWeight:700,color:'var(--amber)',background:'var(--amber-soft)',padding:'1px 7px',borderRadius:99,fontSize:10.5}}>{inv.pager}</span>:'—'}</td>
                    <td style={{fontSize:12}}>{inv.custName}</td>
                    <td style={{fontSize:11,color:'var(--t2)',maxWidth:180}}>{inv.items.map(function(i){return i.name+'×'+toFa(String(i.qty));}).join('، ')}</td>
                    <td style={{fontSize:12,color:'var(--green)'}}>{inv.discountAmt>0?fc(inv.discountAmt)+' ت':'—'}</td>
                    <td style={{fontSize:12,color:'var(--amber)'}}>{fc(inv.taxAmt)} ت</td>
                    <td><strong>{fc(inv.total)} ت</strong></td>
                    <td>
                      <span className={'bdg '+(inv.status==='paid'?'bg':'br')} onClick={function(e){e.stopPropagation();togglePaid(inv.id);}} style={{cursor:'pointer',borderRadius:99}}>
                        {inv.status==='paid'?'پرداخت شده':'پرداخت نشده'}
                      </span>
                    </td>
                    <td>
                      <div style={{display:'flex',gap:3}}>
                        <button className="btn bs bxs" title="چاپ" onClick={function(e){e.stopPropagation();reprintInv(inv);}}><NIcon n="print" s={11}/></button>
                        <button className="btn bs bxs" title="ویرایش" onClick={function(e){e.stopPropagation();setEditInv(Object.assign({},inv));}}><NIcon n="edit" s={11}/></button>
                        <button className="btn bda bxs" title="حذف" onClick={function(e){e.stopPropagation();deleteInv(inv.id);}}><NIcon n="trash" s={11}/></button>
                      </div>
                    </td>
                  </tr>,
                  isExpanded&&(
                    <tr key={inv.id+'_detail'}>
                      <td colSpan="11" style={{padding:0,background:'var(--surface2)'}}>
                        <div style={{padding:'14px 20px'}}>
                          <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                            <div style={{flex:2,minWidth:280}}>
                              <div className="stl">جزئیات آیتم‌ها</div>
                              <table style={{minWidth:'unset'}}>
                                <thead><tr><th>آیتم</th><th>تعداد</th><th>قیمت واحد</th><th>جمع</th></tr></thead>
                                <tbody>
                                  {inv.items.map(function(it,i){
                                    return <tr key={i}><td>{it.name}</td><td>{toFa(String(it.qty))}</td><td>{fc(it.price)} ت</td><td><strong>{fc(it.price*it.qty)} ت</strong></td></tr>;
                                  })}
                                </tbody>
                              </table>
                            </div>
                            <div style={{width:200,flexShrink:0}}>
                              <div className="stl">خلاصه مالی</div>
                              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'4px 0'}}><span style={{color:'var(--t2)'}}>جمع کل:</span><span>{fc(inv.subTotal)} ت</span></div>
                              {inv.discountAmt>0&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--green)',padding:'4px 0'}}><span>تخفیف ({toFa(String(inv.discountPct))}٪):</span><span>−{fc(inv.discountAmt)} ت</span></div>}
                              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--amber)',padding:'4px 0'}}><span>مالیات ({toFa(String(inv.taxPct))}٪):</span><span>{fc(inv.taxAmt)} ت</span></div>
                              <div style={{display:'flex',justifyContent:'space-between',fontWeight:800,fontSize:14,borderTop:'2px solid var(--t1)',paddingTop:8,marginTop:4}}><span>نهایی:</span><span>{fc(inv.total)} ت</span></div>
                              {inv.note&&<div style={{marginTop:8,fontSize:11.5,color:'var(--t2)',background:'var(--surface)',padding:'5px 8px',borderRadius:'var(--r2)'}}>یادداشت: {inv.note}</div>}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                ];
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={!!editInv} onClose={function(){setEditInv(null);}} title="ویرایش فاکتور" lg={true}>
        {editInv&&(
          <div>
            <div className="fr" style={{marginBottom:13}}>
              <div className="fg" style={{marginBottom:0}}>
                <label className="fl">وضعیت پرداخت</label>
                <div className="tabs" style={{marginBottom:0}}>
                  <span className={'tab'+(editInv.status==='paid'?' act':'')} onClick={function(){setEditInv(Object.assign({},editInv,{status:'paid',paid:true}));}}>پرداخت شده</span>
                  <span className={'tab'+(editInv.status==='unpaid'?' act':'')} onClick={function(){setEditInv(Object.assign({},editInv,{status:'unpaid',paid:false}));}}>پرداخت نشده</span>
                </div>
              </div>
              <div className="fg" style={{marginBottom:0}}>
                <label className="fl">شماره پیجر</label>
                <input className="fc" value={editInv.pager||''} onChange={function(e){setEditInv(Object.assign({},editInv,{pager:e.target.value}));}} placeholder="شماره پیجر..."/>
              </div>
            </div>
            <div className="fg">
              <label className="fl">یادداشت</label>
              <input className="fc" value={editInv.note||''} onChange={function(e){setEditInv(Object.assign({},editInv,{note:e.target.value}));}}/>
            </div>
            <div style={{borderRadius:'var(--r2)',border:'1px solid var(--line)',overflow:'hidden',marginBottom:13}}>
              <table style={{minWidth:'unset'}}>
                <thead><tr><th>آیتم</th><th>تعداد</th><th>قیمت واحد</th><th>جمع</th></tr></thead>
                <tbody>
                  {editInv.items.map(function(it,i){
                    return (
                      <tr key={i}>
                        <td>{it.name}</td>
                        <td>
                          <input type="number" min="1" value={it.qty}
                            onChange={function(e){
                              var nq=Math.max(1,Number(e.target.value)||1);
                              var ni=editInv.items.map(function(x,j){return j===i?Object.assign({},x,{qty:nq}):x;});
                              var ns=ni.reduce(function(s,x){return s+x.price*x.qty;},0);
                              var da=editInv.discountPct>0?Math.round(ns*editInv.discountPct/100):0;
                              var ta=Math.round((ns-da)*editInv.taxPct/100);
                              setEditInv(Object.assign({},editInv,{items:ni,subTotal:ns,discountAmt:da,taxAmt:ta,total:ns-da+ta}));
                            }}
                            style={{width:60,textAlign:'center',border:'1px solid var(--line2)',borderRadius:'var(--r3)',padding:'2px 6px'}}/>
                        </td>
                        <td>{fc(it.price)} ت</td>
                        <td><strong>{fc(it.price*it.qty)} ت</strong></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{background:'var(--surface2)',borderRadius:'var(--r2)',padding:'10px 14px',fontSize:13}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{color:'var(--t2)'}}>جمع:</span><span>{fc(editInv.subTotal)} ت</span></div>
              {editInv.discountAmt>0&&<div style={{display:'flex',justifyContent:'space-between',color:'var(--green)',marginBottom:4}}><span>تخفیف:</span><span>−{fc(editInv.discountAmt)} ت</span></div>}
              <div style={{display:'flex',justifyContent:'space-between',color:'var(--amber)',marginBottom:4}}><span>مالیات:</span><span>{fc(editInv.taxAmt)} ت</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontWeight:800,fontSize:15,borderTop:'1px solid var(--line)',paddingTop:8}}><span>نهایی:</span><span>{fc(editInv.total)} ت</span></div>
            </div>
            <div className="mft">
              <button className="btn bs bsm" onClick={function(){reprintInv(editInv);}}>
                <NIcon n="print" s={12}/> چاپ مجدد
              </button>
              <button className="btn bs" onClick={function(){setEditInv(null);}}>انصراف</button>
              <button className="btn bp" onClick={saveEdit}>
                <NIcon n="check" s={13}/> ذخیره تغییرات
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


export default SaleReport
