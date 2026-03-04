import React, { useState, useRef, useEffect } from 'react'
import NIcon, { IBtn } from '../ui/NIcon.jsx'
import { Modal, DP, IngPicker, Spark, BarChart } from '../ui/index.jsx'
import { toFa, fc, fp, dailyR, todayJ, nowStr, UPAIRS, ICATS, MCATS, JMONS, PROLES, CCOLORS } from '../../lib/utils.js'


function Users(props) {
  var D=props.D, setD=props.setD;
  var modal = useState(false), setModal = modal[1]; modal = modal[0];
  var editId = useState(null), setEditId = editId[1]; editId = editId[0];
  var form = useState({name:'',role:'باریستا',username:'',password:''}), setForm = form[1]; form = form[0];
  function save() {
    if(!form.name||!form.username) return;
    if(editId) setD(function(d){return Object.assign({},d,{users:d.users.map(function(u){return u.id===editId?Object.assign({},form,{id:editId}):u;})});});
    else setD(function(d){return Object.assign({},d,{users:d.users.concat([Object.assign({},form,{id:Date.now()})])});});
    setModal(false);
  }
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
        <span className="stl" style={{marginBottom:0}}>کاربران سیستم</span>
        <button className="btn bp" onClick={function(){setForm({name:'',role:'باریستا',username:'',password:''});setEditId(null);setModal(true);}}>+ افزودن</button>
      </div>
      <div className="card">
        {D.users.length===0
          ? <div className="empty"><div className="empty-i"><NIcon n="users" /></div><p>کاربری ثبت نشده</p></div>
          : <div className="tw"><table>
              <thead><tr><th>#</th><th>نام</th><th>نام کاربری</th><th>نقش</th><th></th></tr></thead>
              <tbody>
                {D.users.map(function(u,i){
                  return (
                    <tr key={u.id}>
                      <td className="mt">{i+1}</td>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{width:30,height:30,borderRadius:'50%',background:'var(--blue)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:12}}>{u.name[0]}</div>
                          <strong>{u.name}</strong>
                        </div>
                      </td>
                      <td><span className="bdg bw">{u.username}</span></td>
                      <td><span className="bdg bb">{u.role}</span></td>
                      <td>
                        <div style={{display:'flex',gap:4}}>
                          <button className="btn bsm bs" onClick={function(){setForm(Object.assign({},u));setEditId(u.id);setModal(true);}}><NIcon n='edit' s={13} /></button>
                          <button className="btn bsm bda" onClick={function(){if(confirm('حذف؟'))setD(function(d){return Object.assign({},d,{users:d.users.filter(function(x){return x.id!==u.id;})});});}}><NIcon n='trash' s={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
        }
      </div>
      <Modal open={modal} onClose={function(){setModal(false);}} title={editId?'ویرایش کاربر':'افزودن کاربر'}>
        <div className="fr">
          <div className="fg"><label className="fl">نام کامل *</label><input className="fc" value={form.name} onChange={function(e){setForm(function(f){return Object.assign({},f,{name:e.target.value});});}} placeholder="علی احمدی" /></div>
          <div className="fg"><label className="fl">نقش</label>
            <select className="fc" value={form.role} onChange={function(e){setForm(function(f){return Object.assign({},f,{role:e.target.value});});}}>
              {PROLES.map(function(r){return <option key={r}>{r}</option>;})}
            </select>
          </div>
        </div>
        <div className="fr">
          <div className="fg"><label className="fl">نام کاربری *</label><input className="fc" value={form.username} onChange={function(e){setForm(function(f){return Object.assign({},f,{username:e.target.value});});}} /></div>
          <div className="fg"><label className="fl">رمز عبور</label><input className="fc" type="password" value={form.password} onChange={function(e){setForm(function(f){return Object.assign({},f,{password:e.target.value});});}} /></div>
        </div>
        <div className="mft"><button className="btn bs" onClick={function(){setModal(false);}}>انصراف</button><button className="btn bp" onClick={save}>ذخیره</button></div>
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════
   SALES PAGE — فروش روزانه
══════════════════════════════════════ */


/* ════════════════════════════════════════
   POS — صفحه ثبت فاکتور فروش
════════════════════════════════════════ */

export default Users
