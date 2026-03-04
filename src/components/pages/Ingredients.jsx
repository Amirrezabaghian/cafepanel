import React, { useState, useRef, useEffect } from 'react'
import NIcon, { IBtn } from '../ui/NIcon.jsx'
import { Modal, DP, IngPicker, Spark, BarChart } from '../ui/index.jsx'
import { toFa, fc, fp, dailyR, todayJ, nowStr, UPAIRS, ICATS, MCATS, JMONS, PROLES, CCOLORS } from '../../lib/utils.js'


function Ingredients(props) {
  var D=props.D, setD=props.setD;
  var modal = useState(false), setModal = modal[1]; modal = modal[0];
  var editId = useState(null), setEditId = editId[1]; editId = editId[0];
  var iF = {name:'',category:'دانه قهوه',unit_pair:'کیلوگرم/گرم',mac_unit:'کیلوگرم',mic_unit:'گرم',rate:1000,stock:0,avg_cost:0,recipe_unit:'گرم',mprice:''};
  var form = useState(iF), setForm = form[1]; form = form[0];
  var fcat = useState('همه'), setFcat = fcat[1]; fcat = fcat[0];
  var cats = ['همه'].concat(ICATS);
  var list = fcat==='همه' ? D.ingredients : D.ingredients.filter(function(i){return i.category===fcat;});
  
  function onUP(pair) {
    var p = UPAIRS[pair];
    if(!p) return;
    setForm(function(f){ return Object.assign({},f,{unit_pair:pair,mac_unit:p.mac,mic_unit:p.mic,rate:p.rate,recipe_unit:p.mic,mprice:''}); });
  }
  function save() {
    if(!form.name) return;
    var avg = form.mprice ? Number(form.mprice)/Number(form.rate) : Number(form.avg_cost);
    var u = Object.assign({},form,{id:editId||Date.now(),rate:Number(form.rate),stock:Number(form.stock),avg_cost:avg});
    delete u.mprice;
    if(editId) setD(function(d){ return Object.assign({},d,{ingredients:d.ingredients.map(function(i){return i.id===editId?u:i;})}); });
    else setD(function(d){ return Object.assign({},d,{ingredients:d.ingredients.concat([u])}); });
    setModal(false);
  }
  function del(id) {
    if(!confirm('حذف شود؟')) return;
    setD(function(d){ return Object.assign({},d,{ingredients:d.ingredients.filter(function(i){return i.id!==id;})}); });
  }
  function openEdit(ing) { setForm(Object.assign({},ing,{mprice:''})); setEditId(ing.id); setModal(true); }
  function openAdd() { setForm(iF); setEditId(null); setModal(true); }
  var avgM = form.mprice && form.rate ? Number(form.mprice)/Number(form.rate) : null;
  
  return (
    <div>
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:14,flexWrap:'wrap'}}>
        <div className="tabs" style={{marginBottom:0,flex:1}}>
          {cats.map(function(c){ return <span key={c} className={'tab'+(fcat===c?' act':'')} onClick={function(){setFcat(c);}}>{c}</span>; })}
        </div>
        <button className="btn bp" onClick={openAdd}>+ افزودن ماده</button>
      </div>
      <div className="card">
        {list.length===0
          ? <div className="empty"><div className="empty-i"><NIcon n="inventory" /></div><p>موادی ثبت نشده</p></div>
          : <div className="tw"><table>
              <thead><tr><th>#</th><th>نام</th><th>دسته</th><th>واحد مصرف</th><th>موجودی</th><th>قیمت/واحد</th><th>وضعیت</th><th></th></tr></thead>
              <tbody>
                {list.map(function(ing,i) {
                  var st = ing.stock<1000?'br':ing.stock<3000?'bo':'bg';
                  var sl = ing.stock<1000?'کمبود':ing.stock<3000?'متوسط':'کافی';
                  return (
                    <tr key={ing.id}>
                      <td className="mt">{i+1}</td>
                      <td><strong>{ing.name}</strong></td>
                      <td><span className="cpill">{ing.category}</span></td>
                      <td><span className="bdg bb">{ing.recipe_unit||ing.mic_unit}</span></td>
                      <td>{fc(ing.stock)} {ing.mic_unit}</td>
                      <td>{fc(ing.avg_cost)} ت</td>
                      <td><span className={'bdg '+st}>{sl}</span></td>
                      <td>
                        <div style={{display:'flex',gap:4}}>
                          <button className="btn bsm bs" onClick={function(){openEdit(ing);}}><NIcon n='edit' s={13} /></button>
                          <button className="btn bsm bda" onClick={function(){del(ing.id);}}><NIcon n='trash' s={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
        }
      </div>
      <Modal open={modal} onClose={function(){setModal(false);}} title={editId?'ویرایش ماده اولیه':'افزودن ماده اولیه'}>
        <div className="fr">
          <div className="fg"><label className="fl">نام ماده *</label><input className="fc" value={form.name} onChange={function(e){setForm(function(f){return Object.assign({},f,{name:e.target.value});});}} placeholder="قهوه اسپرسو" /></div>
          <div className="fg"><label className="fl">دسته‌بندی</label>
            <select className="fc" value={form.category} onChange={function(e){setForm(function(f){return Object.assign({},f,{category:e.target.value});});}}>
              {ICATS.map(function(c){return <option key={c}>{c}</option>;})}
            </select>
          </div>
        </div>
        <div className="fg"><label className="fl">واحد اندازه‌گیری</label>
          <select className="fc" value={form.unit_pair} onChange={function(e){onUP(e.target.value);}}>
            {Object.keys(UPAIRS).map(function(k){return <option key={k}>{k}</option>;})}
          </select>
          <p className="fh">ضریب تبدیل: ۱ {form.mac_unit} = {fc(form.rate)} {form.mic_unit}</p>
        </div>
        <div className="fg"><label className="fl">واحد مصرف در رسپی</label>
          <select className="fc" value={form.recipe_unit} onChange={function(e){setForm(function(f){return Object.assign({},f,{recipe_unit:e.target.value});});}}>
            <option value={form.mic_unit}>{form.mic_unit}</option>
            <option value={form.mac_unit}>{form.mac_unit}</option>
            <option value="عدد">عدد</option>
          </select>
          <p className="fh">قهوه → گرم | شیر → میلی‌لیتر | نان → عدد</p>
        </div>
        <div className="fr">
          <div className="fg"><label className="fl">موجودی ({form.mic_unit})</label><input className="fc" type="number" value={form.stock} onChange={function(e){setForm(function(f){return Object.assign({},f,{stock:e.target.value});});}} /></div>
          <div className="fg"><label className="fl">قیمت هر {form.mac_unit} (تومان)</label><input className="fc" type="number" value={form.mprice} placeholder="قیمت واحد بزرگ" onChange={function(e){setForm(function(f){return Object.assign({},f,{mprice:e.target.value});});}} /></div>
        </div>
        {avgM!==null && avgM>0 && <div className="al ai">هر {form.mic_unit}: <strong>{fc(avgM)} تومان</strong></div>}
        <div className="mft"><button className="btn bs" onClick={function(){setModal(false);}}>انصراف</button><button className="btn bp" onClick={save}>ذخیره</button></div>
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════
   INVOICES
══════════════════════════════════════ */

export default Ingredients
