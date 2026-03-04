import React, { useState, useRef, useEffect } from 'react'
import NIcon, { IBtn } from '../ui/NIcon.jsx'
import { Modal, DP, IngPicker, Spark, BarChart } from '../ui/index.jsx'
import { toFa, fc, fp, dailyR, todayJ, nowStr, UPAIRS, ICATS, MCATS, JMONS, PROLES, CCOLORS } from '../../lib/utils.js'


function Customers(props) {
  var D=props.D, setD=props.setD;
  var modalS=useState(false); var modal=modalS[0]; var setModal=modalS[1];
  var editIdS=useState(null); var editId=editIdS[0]; var setEditId=editIdS[1];
  var selCustS=useState(null); var selCust=selCustS[0]; var setSelCust=selCustS[1];
  var formS=useState({name:'',phone:'',code:'',note:''}); var form=formS[0]; var setForm=formS[1];
  var filterS=useState('all'); var filter=filterS[0]; var setFilter=filterS[1];

  var nonWalk = D.customers.filter(function(c){return !c.isWalk;});

  function save(){
    if(!form.name.trim()) return;
    var newCust = Object.assign({},form,{id:editId||Date.now(),isWalk:false});
    if(editId){
      setD(function(d){return Object.assign({},d,{customers:d.customers.map(function(c){return c.id===editId?newCust:c;})});});
    } else {
      setD(function(d){return Object.assign({},d,{customers:d.customers.concat([newCust])});});
    }
    setModal(false);
  }
  function del(id){
    if(!confirm('حذف مشتری؟')) return;
    setD(function(d){return Object.assign({},d,{customers:d.customers.filter(function(c){return c.id!==id;})});});
    if(selCust&&selCust.id===id) setSelCust(null);
  }
  function toggleInvPaid(invId){
    setD(function(d){return Object.assign({},d,{saleInvoices:(d.saleInvoices||[]).map(function(inv){
      if(inv.id!==invId) return inv;
      var ns = inv.status==='paid'?'unpaid':'paid';
      return Object.assign({},inv,{status:ns,paid:ns==='paid'});
    })});});
  }

  var custInvoices = selCust ? (D.saleInvoices||[]).filter(function(inv){return inv.custId===selCust.id;}) : [];
  var filteredInvs = filter==='all' ? custInvoices : custInvoices.filter(function(i){return i.status===filter;});
  var totalDebt = custInvoices.filter(function(i){return i.status==='unpaid';}).reduce(function(s,i){return s+i.total;},0);

  return (
    <div className="g21">
      {/* Customer list */}
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <span className="stl" style={{marginBottom:0}}>مشتریان ثبت‌شده</span>
          <button className="btn bp bsm" onClick={function(){setForm({name:'',phone:'',code:'',note:''});setEditId(null);setModal(true);}}>
            <NIcon n="plus" s={13}/> مشتری جدید
          </button>
        </div>

        {nonWalk.length===0 ? (
          <div className="card"><div className="empty"><div className="empty-i"><NIcon n="users"/></div><p>مشتری ثبت‌شده‌ای وجود ندارد</p></div></div>
        ) : (
          <div>
            {nonWalk.map(function(c){
              var invs = (D.saleInvoices||[]).filter(function(i){return i.custId===c.id;});
              var debt = invs.filter(function(i){return i.status==='unpaid';}).reduce(function(s,i){return s+i.total;},0);
              return (
                <div key={c.id} className="card" style={{marginBottom:8,cursor:'pointer',border:'1.5px solid '+(selCust&&selCust.id===c.id?'var(--t1)':'var(--line)')}}
                  onClick={function(){setSelCust(selCust&&selCust.id===c.id?null:c);}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:38,height:38,borderRadius:'50%',background:'var(--blue)',color:'#fff',
                      display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,flexShrink:0}}>
                      {c.name[0]}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:13}}>{c.name}</div>
                      <div style={{fontSize:11,color:'var(--t3)'}}>{c.phone||'—'} {c.code&&('· '+c.code)}</div>
                    </div>
                    <div style={{textAlign:'left'}}>
                      {debt>0 && <div style={{fontSize:12,fontWeight:700,color:'var(--red)'}}>{fc(debt)} ت<div style={{fontSize:10,color:'var(--t3)'}}>بدهی</div></div>}
                      <div style={{fontSize:11,color:'var(--t3)',marginTop:2}}>{toFa(String(invs.length))} فاکتور</div>
                    </div>
                    <div style={{display:'flex',gap:4}}>
                      <button className="btn bs bxs" onClick={function(e){e.stopPropagation();setForm(Object.assign({},c));setEditId(c.id);setModal(true);}}><NIcon n="edit" s={12}/></button>
                      <button className="btn bda bxs" onClick={function(e){e.stopPropagation();del(c.id);}}><NIcon n="trash" s={12}/></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer detail */}
      <div>
        {selCust ? (
          <div>
            <div className="card">
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <div style={{width:44,height:44,borderRadius:'50%',background:'var(--blue)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:16}}>{selCust.name[0]}</div>
                <div>
                  <div style={{fontWeight:800,fontSize:15}}>{selCust.name}</div>
                  <div style={{fontSize:11,color:'var(--t3)'}}>{selCust.phone} {selCust.code&&('· کد: '+selCust.code)}</div>
                </div>
              </div>
              <div className="g2" style={{marginBottom:0}}>
                <div style={{background:'var(--surface2)',borderRadius:'var(--r2)',padding:'10px 12px',textAlign:'center'}}>
                  <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',marginBottom:3}}>کل خرید</div>
                  <div style={{fontWeight:800,fontSize:14}}>{fc(custInvoices.reduce(function(s,i){return s+i.total;},0))} ت</div>
                </div>
                <div style={{background:totalDebt>0?'var(--red-soft)':'var(--green-soft)',borderRadius:'var(--r2)',padding:'10px 12px',textAlign:'center'}}>
                  <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',marginBottom:3}}>بدهی</div>
                  <div style={{fontWeight:800,fontSize:14,color:totalDebt>0?'var(--red)':'var(--green)'}}>{fc(totalDebt)} ت</div>
                </div>
              </div>
              {selCust.note&&<div style={{marginTop:10,fontSize:12,color:'var(--t2)',background:'var(--surface2)',padding:'6px 10px',borderRadius:'var(--r2)'}}>{selCust.note}</div>}
            </div>

            <div className="card">
              <div className="chd">
                <div className="ctl">فاکتورها</div>
                <div className="tabs" style={{marginBottom:0}}>
                  <span className={'tab'+(filter==='all'?' act':'')} onClick={function(){setFilter('all');}}>همه</span>
                  <span className={'tab'+(filter==='unpaid'?' act':'')} onClick={function(){setFilter('unpaid');}} style={{color:filter!=='unpaid'&&custInvoices.filter(function(i){return i.status==='unpaid';}).length>0?'var(--red)':''}}>پرداخت نشده</span>
                  <span className={'tab'+(filter==='paid'?' act':'')} onClick={function(){setFilter('paid');}}>پرداخت شده</span>
                </div>
              </div>
              {filteredInvs.length===0
                ? <div className="empty" style={{padding:'20px'}}><p>فاکتوری وجود ندارد</p></div>
                : filteredInvs.map(function(inv){
                  return (
                    <div key={inv.id} style={{padding:'10px 0',borderBottom:'1px solid var(--line)'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                        <div>
                          <div style={{fontWeight:700,fontSize:12,fontFamily:'monospace'}}>{inv.num}</div>
                          <div style={{fontSize:11,color:'var(--t3)'}}>{inv.date} — {inv.time}</div>
                          <div style={{fontSize:11,color:'var(--t2)',marginTop:2}}>{inv.items.map(function(i){return i.name+'×'+i.qty;}).join('، ')}</div>
                        </div>
                        <div style={{textAlign:'left'}}>
                          <div style={{fontWeight:800,fontSize:13}}>{fc(inv.total)} ت</div>
                          <span className={'bdg '+(inv.status==='paid'?'bg':'br')} onClick={function(){toggleInvPaid(inv.id);}} style={{cursor:'pointer',marginTop:4}}>
                            {inv.status==='paid'?'✓ پرداخت شده':'✗ پرداخت نشده'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        ) : (
          <div className="card"><div className="empty"><div className="empty-i"><NIcon n="user"/></div><p>یک مشتری انتخاب کنید</p></div></div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={function(){setModal(false);}} title={editId?'ویرایش مشتری':'مشتری جدید'}>
        <div className="fr">
          <div className="fg"><label className="fl">نام کامل *</label><input className="fc" value={form.name} onChange={function(e){setForm(Object.assign({},form,{name:e.target.value}));}} placeholder="علی احمدی"/></div>
          <div className="fg"><label className="fl">شماره تلفن</label><input className="fc" value={form.phone} onChange={function(e){setForm(Object.assign({},form,{phone:e.target.value}));}} placeholder="09xxxxxxxxx"/></div>
        </div>
        <div className="fg"><label className="fl">کد مشتری</label><input className="fc" value={form.code} onChange={function(e){setForm(Object.assign({},form,{code:e.target.value}));}} placeholder="C001"/></div>
        <div className="fg"><label className="fl">یادداشت</label><textarea className="fc" rows="2" value={form.note} onChange={function(e){setForm(Object.assign({},form,{note:e.target.value}));}} placeholder="توضیحات اضافی..."/></div>
        <div className="mft">
          <button className="btn bs" onClick={function(){setModal(false);}}>انصراف</button>
          <button className="btn bp" onClick={save}>ذخیره</button>
        </div>
      </Modal>
    </div>
  );
}

/* ════════════════════════════════════════
   SETTINGS — تنظیمات
════════════════════════════════════════ */

export default Customers
