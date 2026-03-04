import React, { useState, useRef, useEffect } from 'react'
import NIcon from './NIcon.jsx'
import { todayJ, daysInM, firstWD, JMONS, JDAYS, ICATS } from '../../lib/utils.js'

function JCal(props) {
  var value = props.value, onChange = props.onChange, onClose = props.onClose;
  var today = todayJ();
  var init = value ? value.split('/').map(Number) : today;
  var vy = useState(init[0]), setVy = vy[1]; vy = vy[0];
  var vm = useState(init[1]), setVm = vm[1]; vm = vm[0];
  var days = daysInM(vy, vm);
  var fw = firstWD(vy, vm);
  var cells = [];
  for(var e=0;e<fw;e++) cells.push(null);
  for(var d=1;d<=days;d++) cells.push(d);
  var sel = value ? value.split('/').map(Number) : null;
  
  function prev() { if(vm===1){setVm(12);setVy(vy-1);}else setVm(vm-1); }
  function next() { if(vm===12){setVm(1);setVy(vy+1);}else setVm(vm+1); }
  
  return (
    <div className="cal" onClick={function(e){e.stopPropagation();}}>
      <div className="cal-hd">
        <button className="cal-nv" onClick={prev}>›</button>
        <span style={{fontSize:13,fontWeight:700}}>{JMONS[vm-1]} {vy}</span>
        <button className="cal-nv" onClick={next}>‹</button>
      </div>
      <div className="cal-gr">
        {JDAYS.map(function(dd) { return <div key={dd} className="cal-dn">{dd}</div>; })}
        {cells.map(function(dd, idx) {
          if(dd===null) return <div key={'e'+idx} className="cal-d em" />;
          var isTd = today[0]===vy && today[1]===vm && today[2]===dd;
          var isSel = sel && sel[0]===vy && sel[1]===vm && sel[2]===dd;
          var cls = 'cal-d' + (isSel?' sl':isTd?' td':'');
          var dateStr = vy+'/'+String(vm).padStart(2,'0')+'/'+String(dd).padStart(2,'0');
          return <div key={idx} className={cls} onClick={function(){ onChange(dateStr); onClose(); }}>{dd}</div>;
        })}
      </div>
    </div>
  );
}

function DP(props) {
  var value = props.value, onChange = props.onChange, ph = props.ph || 'انتخاب تاریخ';
  var open = useState(false), setOpen = open[1]; open = open[0];
  var ref = useRef(null);
  useEffect(function() {
    function h(e) { if(ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return function() { document.removeEventListener('mousedown', h); };
  }, []);
  return (
    <div className="diwrap" ref={ref}>
      <div className={'disp'+(open?' op':'')} onClick={function(){ setOpen(!open); }}>
        <span style={{color:value?'#0F172A':'#94A3B8'}}>{value||ph}</span>
        <NIcon n='cal' s={14} style={{color:'#9ca3af'}} />
      </div>
      {open && <JCal value={value} onChange={function(v){ onChange(v); setOpen(false); }} onClose={function(){ setOpen(false); }} />}
    </div>
  );
}


function DP(props) {
  var value = props.value, onChange = props.onChange, ph = props.ph || 'انتخاب تاریخ';
  var open = useState(false), setOpen = open[1]; open = open[0];
  var ref = useRef(null);
  useEffect(function() {
    function h(e) { if(ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return function() { document.removeEventListener('mousedown', h); };
  }, []);
  return (
    <div className="diwrap" ref={ref}>
      <div className={'disp'+(open?' op':'')} onClick={function(){ setOpen(!open); }}>
        <span style={{color:value?'#0F172A':'#94A3B8'}}>{value||ph}</span>
        <NIcon n='cal' s={14} style={{color:'#9ca3af'}} />
      </div>
      {open && <JCal value={value} onChange={function(v){ onChange(v); setOpen(false); }} onClose={function(){ setOpen(false); }} />}
    </div>
  );
}

function Spark(props) {
  var data = props.data, color = props.color || '#3B82F6';
  var max = Math.max.apply(null, data.concat([1]));
  return (
    <div className="spark">
      {data.map(function(v,i) {
        return <div key={i} className="spb" style={{height:((v/max)*100)+'%', background:i===data.length-1?color:color+'44'}} />;
      })}
    </div>
  );
}

function BarChart(props) {
  var data=props.data, labels=props.labels, activeIdx=props.activeIdx!=null?props.activeIdx:-1, h=props.h||110;
  var max = Math.max.apply(null, data.concat([1]));
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:5,height:h,paddingBottom:4}}>
      {data.map(function(v,i) {
        return (
          <div key={i} className="barcol">
            <div className="barfill" style={{height:((v/max)*95)+'%',minHeight:4,background:i===activeIdx?'#2563EB':'#BFDBFE'}} />
            <span style={{fontSize:9,color:'var(--t3)',whiteSpace:'nowrap'}}>{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

function Modal(props) {
  if(!props.open) return null;
  return (
    <div className="ovl" onClick={props.onClose}>
      <div className={'mdl'+(props.lg?' mdl-lg':'')} onClick={function(e){e.stopPropagation();}}>
        <div className="mhd">
          <span className="mtl">{props.title}</span>
          <button className="mcl" onClick={props.onClose}><NIcon n="x" /></button>
        </div>
        {props.children}
      </div>
    </div>
  );
}

function IngPicker(props) {
  var ingredients = props.ingredients, value = props.value, onChange = props.onChange, exclude = props.exclude || [];
  var sq = useState(''), setSq = sq[1]; sq = sq[0];
  
  var grouped = {};
  ICATS.forEach(function(cat) {
    var ings = ingredients.filter(function(i) {
      return i.category===cat && exclude.indexOf(i.id)<0 && (sq===''||i.name.indexOf(sq)>=0);
    });
    if(ings.length) grouped[cat] = ings;
  });
  
  var catColors = {'دانه قهوه':'#92400e','لبنیات':'#1d4ed8','شکر و شیرینی':'#7c3aed','میوه':'#dc2626','نوشیدنی':'#0891b2','ادویه':'#15803d','سایر':'#374151'};
  var catBg = {'دانه قهوه':'#fef3c7','لبنیات':'#dbeafe','شکر و شیرینی':'#ede9fe','میوه':'#fee2e2','نوشیدنی':'#e0f2fe','ادویه':'#dcfce7','سایر':'#f3f4f6'};
  
  return (
    <div>
      <input className="fc fcs" placeholder="جستجو..." value={sq} onChange={function(e){setSq(e.target.value);}} style={{marginBottom:8}} />
      <div style={{maxHeight:220,overflowY:'auto'}}>
        {Object.keys(grouped).map(function(cat) {
          return (
            <div key={cat} style={{marginBottom:8}}>
              <div className="icats">{cat}</div>
              {grouped[cat].map(function(ing) {
                return (
                  <div key={ing.id} className={'iopt'+(value===ing.id?' sl':'')} onClick={function(){ onChange(ing.id); }}>
                    <span style={{width:28,height:28,borderRadius:6,background:catBg[ing.category]||'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:catColors[ing.category]||'#374151',flexShrink:0}}>{ing.category.slice(0,2)}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:13}}>{ing.name}</div>
                      <div style={{fontSize:11,color:'var(--t3)'}}>{ing.recipe_unit||ing.mic_unit} · {fc(ing.avg_cost)} ت/واحد</div>
                    </div>
                    {value===ing.id && <NIcon n="check" s={13} style={{color:"var(--green)"}} />}
                  </div>
                );
              })}
            </div>
          );
        })}
        {Object.keys(grouped).length===0 && <div className="empty"><div className="empty-i"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" stroke-width="1.4"/><line x1="10" y1="10" x2="14" y2="14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></div><p>موادی پیدا نشد</p></div>}
      </div>
    </div>
  );
}

export { JCal, DP, Spark, BarChart, Modal, IngPicker }
