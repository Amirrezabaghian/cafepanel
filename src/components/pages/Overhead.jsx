import React, { useState, useRef, useEffect } from 'react'
import NIcon, { IBtn } from '../ui/NIcon.jsx'
import { Modal, DP, IngPicker, Spark, BarChart } from '../ui/index.jsx'
import { toFa, fc, fp, dailyR, todayJ, nowStr, UPAIRS, ICATS, MCATS, JMONS, PROLES, CCOLORS } from '../../lib/utils.js'


function Overhead(props) {
  var D=props.D, setD=props.setD;
  var modal = useState(false), setModal = modal[1]; modal = modal[0];
  var editId = useState(null), setEditId = editId[1]; editId = editId[0];
  var form = useState({name:'',amount:0,period:'monthly'}), setForm = form[1]; form = form[0];
  var totM = D.overheads.reduce(function(s,o){return s+(o.period==='monthly'?o.amount:o.period==='daily'?o.amount*30:o.amount/12);},0);
  var totD = D.overheads.reduce(function(s,o){return s+dailyR(o);},0);
  function save() {
    if(!form.name) return;
    var u = Object.assign({},form,{id:editId||Date.now(),amount:Number(form.amount)});
    if(editId) setD(function(d){return Object.assign({},d,{overheads:d.overheads.map(function(o){return o.id===editId?u:o;})});});
    else setD(function(d){return Object.assign({},d,{overheads:d.overheads.concat([u])});});
    setModal(false);
  }
  var periods = {daily:'روزانه',monthly:'ماهانه',yearly:'سالانه'};
  return (
    <div>
      <div className="g3">
        <div className="stat"><div className="slb">مجموع ماهانه</div><div className="svl" style={{fontSize:20}}>{fc(totM)} ت</div></div>
        <div className="stat"><div className="slb">نرخ روزانه</div><div className="svl" style={{fontSize:20}}>{fc(totD)} ت</div></div>
        <div className="stat"><div className="slb">تعداد اقلام</div><div className="svl">{D.overheads.length}</div></div>
      </div>
      <div className="card">
        <div className="chd"><div className="ctl">هزینه‌های سربار</div><button className="btn bp" onClick={function(){setForm({name:'',amount:0,period:'monthly'});setEditId(null);setModal(true);}}>+ افزودن</button></div>
        <div className="tw"><table>
          <thead><tr><th>#</th><th>نام</th><th>مبلغ</th><th>دوره</th><th>نرخ روزانه</th><th></th></tr></thead>
          <tbody>
            {D.overheads.map(function(o,i){
              return (
                <tr key={o.id}>
                  <td className="mt">{i+1}</td>
                  <td><strong>{o.name}</strong></td>
                  <td>{fc(o.amount)} ت</td>
                  <td><span className="bdg bb">{periods[o.period]}</span></td>
                  <td>{fc(dailyR(o))} ت</td>
                  <td>
                    <div style={{display:'flex',gap:4}}>
                      <button className="btn bsm bs" onClick={function(){setForm(Object.assign({},o));setEditId(o.id);setModal(true);}}><NIcon n='edit' s={13} /></button>
                      <button className="btn bsm bda" onClick={function(){if(confirm('حذف؟'))setD(function(d){return Object.assign({},d,{overheads:d.overheads.filter(function(x){return x.id!==o.id;})});});}}><NIcon n='trash' s={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </div>
      <Modal open={modal} onClose={function(){setModal(false);}} title={editId?'ویرایش':'افزودن هزینه'}>
        <div className="fg"><label className="fl">نام *</label><input className="fc" value={form.name} onChange={function(e){setForm(function(f){return Object.assign({},f,{name:e.target.value});});}} placeholder="اجاره محل" /></div>
        <div className="fr">
          <div className="fg"><label className="fl">مبلغ (تومان)</label><input className="fc" type="number" value={form.amount} onChange={function(e){setForm(function(f){return Object.assign({},f,{amount:e.target.value});});}} /></div>
          <div className="fg"><label className="fl">دوره</label>
            <select className="fc" value={form.period} onChange={function(e){setForm(function(f){return Object.assign({},f,{period:e.target.value});});}}>  
              {Object.keys(periods).map(function(k){return <option key={k} value={k}>{periods[k]}</option>;})}
            </select>
          </div>
        </div>
        {form.amount>0 && <div className="al ai">نرخ روزانه: {fc(dailyR(Object.assign({},form,{amount:Number(form.amount)})))} تومان</div>}
        <div className="mft"><button className="btn bs" onClick={function(){setModal(false);}}>انصراف</button><button className="btn bp" onClick={save}>ذخیره</button></div>
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════
   CARDS
══════════════════════════════════════ */

export default Overhead
