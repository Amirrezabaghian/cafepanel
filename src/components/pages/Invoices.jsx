import React, { useState, useRef, useEffect } from 'react'
import NIcon, { IBtn } from '../ui/NIcon.jsx'
import { Modal, DP, IngPicker, Spark, BarChart } from '../ui/index.jsx'
import { toFa, fc, fp, dailyR, todayJ, nowStr, UPAIRS, ICATS, MCATS, JMONS, PROLES, CCOLORS } from '../../lib/utils.js'


function Invoices(props) {
  var D=props.D, setD=props.setD;
  var modal = useState(false), setModal = modal[1]; modal = modal[0];
  var editInv = useState(null), setEditInv = editInv[1]; editInv = editInv[0];
  var viewInv = useState(null), setViewInv = viewInv[1]; viewInv = viewInv[0];
  var imgView = useState(null), setImgView = imgView[1]; imgView = imgView[0];
  var nF = {date:'',uid:'',cid:'',note:'',items:[{iid:Date.now(),ing_id:'',qty:1,uprice:0}],img:null,imgPrev:null};
  var form = useState(nF), setForm = form[1]; form = form[0];
  var fDate = useState(''), setFDate = fDate[1]; fDate = fDate[0];
  var fUser = useState(''), setFUser = fUser[1]; fUser = fUser[0];
  var fCard = useState(''), setFCard = fCard[1]; fCard = fCard[0];
  
  var filtered = D.invoices.filter(function(inv) {
    if(fDate && inv.date && inv.date.indexOf(fDate)<0) return false;
    if(fUser && String(inv.uid)!==fUser) return false;
    if(fCard && String(inv.cid)!==fCard) return false;
    return true;
  });
  
  var invTotal = form.items.reduce(function(s,i){return s+(Number(i.qty)||0)*(Number(i.uprice)||0);},0);
  
  function addRow() { setForm(function(f){return Object.assign({},f,{items:f.items.concat([{iid:Date.now(),ing_id:'',qty:1,uprice:0}])});}); }
  function delRow(iid) { setForm(function(f){return Object.assign({},f,{items:f.items.filter(function(i){return i.iid!==iid;})});}); }
  function updRow(iid,k,v) { setForm(function(f){return Object.assign({},f,{items:f.items.map(function(i){return i.iid===iid?Object.assign({},i,{[k]:v}):i;})});}); }
  function handleImg(e) {
    var file = e.target.files[0]; if(!file) return;
    var r = new FileReader();
    r.onload = function(ev){ setForm(function(f){return Object.assign({},f,{imgPrev:ev.target.result,img:ev.target.result});}); };
    r.readAsDataURL(file);
  }
  
  function save() {
    if(!form.date||!form.cid) return;
    var items = form.items.map(function(i){
      return Object.assign({},i,{ing_id:Number(i.ing_id),qty:Number(i.qty),uprice:Number(i.uprice),total:Number(i.qty)*Number(i.uprice)});
    });
    var total = items.reduce(function(s,i){return s+i.total;},0);
    if(editInv) {
      var diff = total - editInv.total;
      setD(function(d){
        var log = (editInv.elog||[]).concat([{at:nowStr(),by:D.currentUser?D.currentUser.name:'ناشناس',note:'ویرایش فاکتور'}]);
        var newCards = d.cards.map(function(c){return c.id===Number(form.cid)?Object.assign({},c,{bal:c.bal-diff}):c;});
        return Object.assign({},d,{invoices:d.invoices.map(function(inv){return inv.id===editInv.id?Object.assign({},editInv,form,{items:items,total:total,elog:log}):inv;}),cards:newCards});
      });
      setEditInv(null);
    } else {
      var inv = Object.assign({},form,{id:Date.now(),items:items,total:total,elog:[]});
      setD(function(d){
        var newCards = d.cards.map(function(c){return c.id===Number(form.cid)?Object.assign({},c,{bal:c.bal-total}):c;});
        var newIngs = d.ingredients.slice();
        items.forEach(function(it){
          var idx = -1;
          newIngs.forEach(function(ing,i){if(ing.id===it.ing_id)idx=i;});
          if(idx<0) return;
          var ing = newIngs[idx];
          var qm = it.qty*ing.rate;
          var up = it.total/qm;
          var ns = ing.stock+qm;
          var na = ((ing.stock*ing.avg_cost)+(qm*up))/ns;
          newIngs[idx] = Object.assign({},ing,{stock:ns,avg_cost:parseFloat(na.toFixed(6)),maxStock:Math.max(ing.maxStock||0,ns)});
        });
        return Object.assign({},d,{invoices:[inv].concat(d.invoices),cards:newCards,ingredients:newIngs});
      });
    }
    setModal(false); setForm(nF);
  }
  
  function openEdit(inv) {
    setEditInv(inv);
    setForm(Object.assign({},inv,{imgPrev:inv.img,items:inv.items.map(function(i){return Object.assign({},i,{iid:i.iid||Date.now()+Math.random()});})}) );
    setModal(true);
  }
  
  return (
    <div>
      <div className="al ai">پس از ثبت فاکتور، موجودی کارت کم و انبار با میانگین متحرک آپدیت می‌شود.</div>
      <div className="fbar">
        <span style={{fontSize:12,fontWeight:700,color:'var(--t3)',whiteSpace:'nowrap'}}>فیلتر:</span>
        <input className="fc" style={{flex:1,minWidth:120}} placeholder="جستجو در تاریخ..." value={fDate} onChange={function(e){setFDate(e.target.value);}} />
        <select className="fc" style={{flex:1,minWidth:120}} value={fUser} onChange={function(e){setFUser(e.target.value);}}>
          <option value="">همه خریداران</option>
          {D.users.map(function(u){return <option key={u.id} value={u.id}>{u.name}</option>;})}
        </select>
        <select className="fc" style={{flex:1,minWidth:120}} value={fCard} onChange={function(e){setFCard(e.target.value);}}>
          <option value="">همه کارت‌ها</option>
          {D.cards.map(function(c){return <option key={c.id} value={c.id}>{c.name}</option>;})}
        </select>
        {(fDate||fUser||fCard) && <button className="btn bs bsm" onClick={function(){setFDate('');setFUser('');setFCard('');}}>× پاک</button>}
      </div>
      <div className="card">
        <div className="chd">
          <div><div className="ctl">فاکتورهای خرید</div><div className="csb">{filtered.length} از {D.invoices.length} فاکتور</div></div>
          <button className="btn bp" onClick={function(){setEditInv(null);setForm(nF);setModal(true);}}>+ ثبت فاکتور</button>
        </div>
        {filtered.length===0
          ? <div className="empty"><div className="empty-i"><NIcon n="receipt" /></div><p>فاکتوری یافت نشد</p></div>
          : <div className="tw"><table>
              <thead><tr><th>#</th><th>تاریخ</th><th>خریدار</th><th>کارت</th><th>ردیف‌ها</th><th>مبلغ کل</th><th>وضعیت</th><th>عملیات</th></tr></thead>
              <tbody>
                {filtered.map(function(inv,i) {
                  var buyer = D.users.filter(function(u){return u.id===Number(inv.uid);})[0];
                  var card = D.cards.filter(function(c){return c.id===Number(inv.cid);})[0];
                  return (
                    <tr key={inv.id}>
                      <td className="mt">{i+1}</td>
                      <td>{inv.date}</td>
                      <td><strong>{buyer?buyer.name:'—'}</strong></td>
                      <td><span className="bdg bb">{card?card.name:'—'}</span></td>
                      <td><span className="bdg bw">{inv.items?inv.items.length:0} ردیف</span></td>
                      <td><strong>{fc(inv.total)} ت</strong></td>
                      <td>{inv.elog&&inv.elog.length>0?<span className="bdg bo">ویرایش‌شده</span>:<span className="bdg bg">ثبت اولیه</span>}</td>
                      <td>
                        <div style={{display:'flex',gap:4}}>
                          <button className="btn bxs bs" onClick={function(){setViewInv(inv);}}><NIcon n='eye' s={13} /></button>
                          <button className="btn bxs bs" onClick={function(){openEdit(inv);}}><NIcon n='edit' s={13} /></button>
                          {inv.img && <button className="btn bxs bs" onClick={function(){setImgView(inv.img);}}></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
        }
      </div>
      
      {/* VIEW MODAL */}
      <Modal open={viewInv!==null} onClose={function(){setViewInv(null);}} title="جزئیات فاکتور" lg>
        {viewInv && (
          <div>
            <div className="fr" style={{marginBottom:12}}>
              <div><span className="fl">تاریخ</span><strong>{viewInv.date}</strong></div>
              <div><span className="fl">خریدار</span><strong>{(D.users.filter(function(u){return u.id===Number(viewInv.uid);})[0]||{name:'—'}).name}</strong></div>
              <div><span className="fl">کارت</span><strong>{(D.cards.filter(function(c){return c.id===Number(viewInv.cid);})[0]||{name:'—'}).name}</strong></div>
              <div><span className="fl">یادداشت</span><strong>{viewInv.note||'—'}</strong></div>
            </div>
            <div className="dv" />
            <div className="tw"><table>
              <thead><tr><th>ماده اولیه</th><th>مقدار</th><th>قیمت واحد</th><th>جمع</th></tr></thead>
              <tbody>
                {(viewInv.items||[]).map(function(it,i) {
                  var ing = D.ingredients.filter(function(x){return x.id===it.ing_id;})[0];
                  return (
                    <tr key={i}>
                      <td><strong>{ing?ing.name:'—'}</strong><br/><span style={{fontSize:11,color:'var(--t3)'}}>{ing?ing.category:''}</span></td>
                      <td>{fc(it.qty)} {ing?ing.mac_unit:''}</td>
                      <td>{fc(it.uprice)} ت</td>
                      <td><strong>{fc(it.total)} ت</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
            <div style={{textAlign:'left',padding:'10px 0',fontWeight:800,fontSize:15,borderTop:'2px solid #E2E8F0',marginTop:8}}>مجموع: {fc(viewInv.total)} تومان</div>
            {viewInv.img && <img src={viewInv.img} className="imgprev" alt="فاکتور" />}
            {viewInv.elog && viewInv.elog.length>0 && (
              <div className="elog">
                <div style={{fontWeight:700,marginBottom:4}}>تاریخچه ویرایش‌ها</div>
                {viewInv.elog.map(function(log,i){
                  return <div key={i} className="elog-e">— {log.at} — توسط <strong>{log.by}</strong></div>;
                })}
              </div>
            )}
          </div>
        )}
      </Modal>
      
      {/* ADD/EDIT MODAL */}
      <Modal open={modal} onClose={function(){setModal(false);setEditInv(null);}} title={editInv?'ویرایش فاکتور':'ثبت فاکتور خرید'} lg>
        <div className="fr">
          <div className="fg"><label className="fl">تاریخ *</label><DP value={form.date} onChange={function(v){setForm(function(f){return Object.assign({},f,{date:v});});}} /></div>
          <div className="fg"><label className="fl">خریدار</label>
            <select className="fc" value={form.uid} onChange={function(e){setForm(function(f){return Object.assign({},f,{uid:e.target.value});});}}>
              <option value="">انتخاب...</option>
              {D.users.map(function(u){return <option key={u.id} value={u.id}>{u.name}</option>;})}
            </select>
          </div>
        </div>
        <div className="fg"><label className="fl">کارت بانکی *</label>
          <select className="fc" value={form.cid} onChange={function(e){setForm(function(f){return Object.assign({},f,{cid:e.target.value});});}}>
            <option value="">انتخاب...</option>
            {D.cards.map(function(c){return <option key={c.id} value={c.id}>{c.name} — موجودی: {fc(c.bal)} ت</option>;})}
          </select>
        </div>
        <div className="fg"><label className="fl">یادداشت</label><input className="fc" value={form.note} onChange={function(e){setForm(function(f){return Object.assign({},f,{note:e.target.value});});}} placeholder="خرید هفتگی مواد اولیه" /></div>
        <div className="dv" />
        <div className="stl">آیتم‌های فاکتور</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 80px 110px 26px',gap:6,marginBottom:6}}>
          {['ماده اولیه','مقدار','قیمت واحد',''].map(function(h,i){return <span key={i} style={{fontSize:11,fontWeight:700,color:'var(--t3)'}}>{h}</span>;})}
        </div>
        {form.items.map(function(item) {
          var ing = D.ingredients.filter(function(i){return i.id===Number(item.ing_id);})[0];
          return (
            <div key={item.iid} style={{marginBottom:8}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 80px 110px 26px',gap:6,alignItems:'center'}}>
                <select className="fc fcs" value={item.ing_id} onChange={function(e){updRow(item.iid,'ing_id',e.target.value);}}>
                  <option value="">انتخاب...</option>
                  {ICATS.map(function(cat){
                    var ings = D.ingredients.filter(function(i){return i.category===cat;});
                    return ings.length ? <optgroup key={cat} label={cat}>{ings.map(function(i){return <option key={i.id} value={i.id}>{i.name}</option>;})}</optgroup> : null;
                  })}
                </select>
                <input className="fc fcs" type="number" value={item.qty} onChange={function(e){updRow(item.iid,'qty',e.target.value);}} />
                <input className="fc fcs" type="number" value={item.uprice} onChange={function(e){updRow(item.iid,'uprice',e.target.value);}} />
                <IBtn n="x" cls="bda bxs" onClick={function(){delRow(item.iid);}} />
              </div>
              {ing && item.qty && item.uprice && (
                <div style={{fontSize:11,color:'var(--t3)',marginTop:2,paddingRight:4}}>جمع: {fc(Number(item.qty)*Number(item.uprice))} ت | قیمت/{ing.mic_unit}: {fc(Number(item.uprice)/ing.rate)} ت</div>
              )}
            </div>
          );
        })}
        <button className="btn bs bsm" onClick={addRow}>+ ردیف جدید</button>
        {invTotal>0 && <div className="al as" style={{marginTop:10}}>مجموع: <strong>{fc(invTotal)} تومان</strong></div>}
        {editInv && <div className="al aw" style={{marginTop:6}}>ویرایش در لاگ ثبت می‌شود.</div>}
        <div className="dv" />
        <div className="fg"><label className="fl">تصویر فاکتور</label>
          <label className="imgbox"><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,flexDirection:"column"}}><NIcon n="img" /><span>بارگذاری تصویر فاکتور</span></div><input type="file" accept="image/*" style={{display:'none'}} onChange={handleImg} /></label>
          {form.imgPrev && <img src={form.imgPrev} className="imgprev" alt="فاکتور" />}
        </div>
        <div className="mft"><button className="btn bs" onClick={function(){setModal(false);setEditInv(null);}}>انصراف</button><button className="btn bp" onClick={save}>{editInv?'ذخیره ویرایش':'ثبت فاکتور'}</button></div>
      </Modal>
      
      {imgView && <div className="ovl" onClick={function(){setImgView(null);}}><img src={imgView} style={{maxWidth:'90vw',maxHeight:'90vh',borderRadius:12}} onClick={function(e){e.stopPropagation();}} /></div>}
    </div>
  );
}

/* ══════════════════════════════════════
   RECIPE
══════════════════════════════════════ */

export default Invoices
