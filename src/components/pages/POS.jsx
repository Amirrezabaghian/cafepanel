import React, { useState, useRef, useEffect } from 'react'
import NIcon, { IBtn } from '../ui/NIcon.jsx'
import { Modal, DP, IngPicker, Spark, BarChart } from '../ui/index.jsx'
import { toFa, fc, fp, dailyR, todayJ, nowStr, UPAIRS, ICATS, MCATS, JMONS, PROLES, CCOLORS } from '../../lib/utils.js'


function POS(props) {
  var D=props.D, setD=props.setD, goPage=props.goPage;
  var tj=todayJ();
  var todayStr=tj[0]+'/'+String(tj[1]).padStart(2,'0')+'/'+String(tj[2]).padStart(2,'0');

  var selCatS=useState('همه'); var selCat=selCatS[0]; var setSelCat=selCatS[1];
  var cartS=useState([]); var cart=cartS[0]; var setCart=cartS[1];
  var selCustIdS=useState(1); var selCustId=selCustIdS[0]; var setSelCustId=selCustIdS[1];
  var discountS=useState(0); var discount=discountS[0]; var setDiscount=discountS[1];
  var noteS=useState(''); var note=noteS[0]; var setNote=noteS[1];
  var showCustPickS=useState(false); var showCustPick=showCustPickS[0]; var setShowCustPick=showCustPickS[1];
  var showDiscountS=useState(false); var showDiscount=showDiscountS[0]; var setShowDiscount=showDiscountS[1];
  var confirmPrintS=useState(false); var confirmPrint=confirmPrintS[0]; var setConfirmPrint=confirmPrintS[1];
  var showTodayInvsS=useState(false); var showTodayInvs=showTodayInvsS[0]; var setShowTodayInvs=showTodayInvsS[1];
  var pagerNumS=useState(''); var pagerNum=pagerNumS[0]; var setPagerNum=pagerNumS[1];

  var taxPct = (D.settings||{}).taxPct||9;
  var selCust = D.customers.filter(function(c){return c.id===selCustId;})[0]||D.customers[0];

  /* Menu items with recipes only */
  var menuWithRecipe = D.menuItems.filter(function(mi){
    return D.recipes.some(function(r){return r.mid===mi.id;});
  });

  function maxServings(mi) {
    var recs=D.recipes.filter(function(r){return r.mid===mi.id;});
    if(recs.length===0) return 999;
    var min=999;
    recs.forEach(function(r){
      var ing=D.ingredients.filter(function(i){return i.id===r.iid;})[0];
      if(!ing||r.qty<=0) return;
      var s=Math.floor(ing.stock/r.qty);
      if(s<min) min=s;
    });
    return min;
  }

  var cats=['همه'];
  menuWithRecipe.forEach(function(mi){if(cats.indexOf(mi.category)<0) cats.push(mi.category);});
  var displayed=selCat==='همه'?menuWithRecipe:menuWithRecipe.filter(function(mi){return mi.category===selCat;});

  function addItem(mi){
    var ms=maxServings(mi);
    var inCart=cart.filter(function(c){return c.mid===mi.id;}).reduce(function(s,c){return s+c.qty;},0);
    if(inCart>=ms) return;
    setCart(function(prev){
      var ex=prev.filter(function(c){return c.mid===mi.id;})[0];
      if(ex) return prev.map(function(c){return c.mid===mi.id?Object.assign({},c,{qty:c.qty+1}):c;});
      return prev.concat([{mid:mi.id,name:mi.name,price:mi.price,qty:1}]);
    });
  }
  function setQty(mid,qty){
    if(qty<=0){setCart(function(p){return p.filter(function(c){return c.mid!==mid;});});return;}
    var mi=D.menuItems.filter(function(m){return m.id===mid;})[0];
    var ms=maxServings(mi);
    setCart(function(p){return p.map(function(c){return c.mid===mid?Object.assign({},c,{qty:Math.min(qty,ms)}):c;});});
  }
  function clearCart(){setCart([]);setDiscount(0);setNote('');setSelCustId(1);setPagerNum('');}

  var subTotal=cart.reduce(function(s,c){return s+c.price*c.qty;},0);
  var discountAmt=discount>0?Math.round(subTotal*discount/100):0;
  var afterDiscount=subTotal-discountAmt;
  var taxAmt=Math.round(afterDiscount*taxPct/100);
  var grandTotal=afterDiscount+taxAmt;

  var todayInvList=(D.saleInvoices||[]).filter(function(inv){return inv.date===todayStr;});
  var todayRevenue=todayInvList.reduce(function(s,i){return s+i.total;},0);

  function submitInvoice(withPrint){
    if(cart.length===0) return;
    var invNum=((D.settings||{}).invCounter||1);
    var prefix=(D.settings||{}).invoicePrefix||'INV';
    var invId=Date.now();
    var inv={
      id:invId,
      num:prefix+'-'+String(invNum).padStart(4,'0'),
      date:todayStr,
      time:(function(){var n=new Date();return String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0');}()),
      custId:selCustId,
      custName:selCust.name,
      pager:pagerNum,
      items:cart.map(function(c){return Object.assign({},c);}),
      subTotal:subTotal,
      discountPct:discount,
      discountAmt:discountAmt,
      taxPct:taxPct,
      taxAmt:taxAmt,
      total:grandTotal,
      note:note,
      paid:selCust.isWalk?true:false,
      status:selCust.isWalk?'paid':'unpaid'
    };
    var newIngs=D.ingredients.map(function(i){return Object.assign({},i);});
    var changes=[];
    cart.forEach(function(cartItem){
      D.recipes.filter(function(r){return r.mid===cartItem.mid;}).forEach(function(rec){
        var idx=newIngs.findIndex(function(i){return i.id===rec.iid;});
        if(idx<0) return;
        var deduct=rec.qty*cartItem.qty;
        var before=newIngs[idx].stock;
        newIngs[idx]=Object.assign({},newIngs[idx],{stock:Math.max(0,newIngs[idx].stock-deduct)});
        changes.push({ingName:newIngs[idx].name,deduct:deduct,unit:newIngs[idx].recipe_unit||newIngs[idx].mic_unit,before:before,after:newIngs[idx].stock});
      });
    });
    var logEntry={id:invId,date:todayStr,type:'sale',label:'فروش '+inv.num,changes:changes};
    setD(function(d){
      var ns=Object.assign({},d.settings,{invCounter:(d.settings.invCounter||1)+1});
      return Object.assign({},d,{saleInvoices:[inv].concat(d.saleInvoices||[]),ingredients:newIngs,stockLogs:[logEntry].concat(d.stockLogs||[]),settings:ns});
    });
    if(withPrint) printInvoice(inv,D);
    clearCart();
    setConfirmPrint(false);
  }

  function printInvoice(inv,dRef){
    var cafeName=(dRef.settings||{}).cafeNameFa||'کافه من';
    var addr=(dRef.settings||{}).address||'';
    var kitchenTicket='<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><style>'+
      'body{font-family:Tahoma,sans-serif;margin:0;padding:8px;font-size:13px;}'+
      'h2{font-size:16px;font-weight:900;margin:0 0 4px;border-bottom:2px solid #000;padding-bottom:4px;}'+
      '.pager{font-size:28px;font-weight:900;text-align:center;border:3px solid #000;padding:6px;margin:6px 0;border-radius:6px;}'+
      'ul{list-style:none;padding:0;margin:4px 0;}'+
      'li{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px dashed #ccc;font-size:15px;font-weight:700;}'+
      '.note{font-size:11px;margin-top:6px;border-top:1px dashed #000;padding-top:4px;}'+
      '</style></head><body>'+
      '<h2>'+inv.num+' — '+inv.time+'</h2>'+
      (inv.pager?'<div class="pager">پیجر '+inv.pager+'</div>':'')+
      '<ul>'+inv.items.map(function(it){return '<li><span>'+it.name+'</span><span>× '+it.qty+'</span></li>';}).join('')+'</ul>'+
      (inv.note?'<div class="note">یادداشت: '+inv.note+'</div>':'')+
      '</body></html>';
    var customerTicket='<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><style>'+
      'body{font-family:Tahoma,sans-serif;font-size:12px;margin:0;padding:0;}'+
      '.t{width:80mm;padding:10px;margin:0 auto;}'+
      '.c{text-align:center;}.b{font-weight:bold;}'+
      '.dv{border-top:1px dashed #000;margin:6px 0;}'+
      'table{width:100%;border-collapse:collapse;}td,th{padding:3px 2px;font-size:11px;}'+
      'th{border-bottom:1px solid #000;font-weight:bold;}'+
      '</style></head><body><div class="t">'+
      '<div class="c b" style="font-size:16px;">'+cafeName+'</div>'+
      (addr?'<div class="c" style="font-size:10px;">'+addr+'</div>':'')+
      '<div class="c" style="font-size:10px;margin-top:3px;">'+inv.date+' — '+inv.time+'</div>'+
      '<div class="c" style="font-size:10px;">فاکتور: '+inv.num+(inv.pager?' | پیجر: '+inv.pager:'')+'</div>'+
      '<div class="c" style="font-size:10px;">مشتری: '+inv.custName+'</div>'+
      '<div class="dv"></div>'+
      '<table><thead><tr><th style="text-align:right">آیتم</th><th>تعداد</th><th>قیمت</th><th>جمع</th></tr></thead><tbody>'+
      inv.items.map(function(it){return '<tr><td>'+it.name+'</td><td style="text-align:center">'+it.qty+'</td><td style="text-align:left">'+it.price.toLocaleString()+'</td><td style="text-align:left">'+(it.price*it.qty).toLocaleString()+'</td></tr>';}).join('')+
      '</tbody></table><div class="dv"></div>'+
      '<div style="display:flex;justify-content:space-between;font-size:11px;"><span>جمع:</span><span>'+inv.subTotal.toLocaleString()+' ت</span></div>'+
      (inv.discountAmt>0?'<div style="display:flex;justify-content:space-between;font-size:11px;color:green;"><span>تخفیف ('+inv.discountPct+'%):</span><span>-'+inv.discountAmt.toLocaleString()+' ت</span></div>':'')+
      '<div style="display:flex;justify-content:space-between;font-size:11px;"><span>مالیات ('+inv.taxPct+'%):</span><span>'+inv.taxAmt.toLocaleString()+' ت</span></div>'+
      '<div style="display:flex;justify-content:space-between;font-size:14px;font-weight:bold;border-top:2px solid #000;margin-top:4px;padding-top:4px;"><span>مبلغ کل:</span><span>'+inv.total.toLocaleString()+' تومان</span></div>'+
      '<div class="dv"></div><div class="c" style="font-size:10px;">ممنون از مراجعه شما</div>'+
      '</div></body></html>';
    var pw=window.open('','_blank','width=920,height=720');
    pw.document.write('<html><head><title>چاپ فاکتور</title><style>'+
      'body{margin:0;display:flex;gap:20px;padding:20px;background:#e5e5e5;justify-content:center;align-items:flex-start;}'+
      '.wrap{background:#fff;padding:12px;box-shadow:0 2px 12px rgba(0,0,0,.2);}'+
      '.lbl{text-align:center;font-family:Tahoma;font-size:11px;color:#666;margin-bottom:6px;font-weight:bold;}'+
      '.pbt{display:block;margin:16px auto;padding:10px 32px;font-size:14px;cursor:pointer;background:#111;color:#fff;border:none;border-radius:6px;font-family:Tahoma;}'+
      '@media print{.pbt,.lbl{display:none!important;}body{background:#fff!important;gap:0!important;padding:0!important;}}</style></head><body>'+
      '<div><div class="lbl">فاکتور آشپزخانه / بار</div><div class="wrap">'+kitchenTicket.replace(/<html>[\s\S]*?<body>/,'').replace(/<\/body>[\s\S]*?<\/html>/,'')+'</div></div>'+
      '<div><div class="lbl">فاکتور مشتری</div><div class="wrap">'+customerTicket.replace(/<html>[\s\S]*?<body>/,'').replace(/<\/body>[\s\S]*?<\/html>/,'')+'</div></div>'+
      '<button class="pbt" onclick="window.print()">🖨 چاپ هر دو فاکتور</button>'+
      '</body></html>');
    pw.document.close();
  }

  var itemCount=cart.reduce(function(s,c){return s+c.qty;},0);

  return (
    <div style={{height:'calc(100vh - var(--tb-h))',display:'flex',overflow:'hidden',width:'100%',flex:1}}>

      {/* ─── RIGHT: Categories Panel ─── */}
      <div style={{width:148,flexShrink:0,background:'var(--surface2)',borderLeft:'1px solid var(--line)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{fontSize:9,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em',padding:'10px 10px 6px',flexShrink:0}}>دسته‌بندی</div>
        <div style={{flex:1,overflowY:'auto',padding:'0 6px 6px'}}>
          {cats.map(function(cat){
            var count=cat==='همه'?menuWithRecipe.length:menuWithRecipe.filter(function(m){return m.category===cat;}).length;
            return (
              <div key={cat} onClick={function(){setSelCat(cat);}}
                style={{padding:'8px 10px',borderRadius:'var(--r2)',cursor:'pointer',marginBottom:2,
                  background:selCat===cat?'var(--purple-soft)':'transparent',
                  fontWeight:selCat===cat?700:500,fontSize:12.5,color:selCat===cat?'var(--purple)':'var(--t2)',
                  border:'1.5px solid '+(selCat===cat?'var(--purple-line)':'transparent'),transition:'.12s'}}>
                <div style={{lineHeight:1.3}}>{cat}</div>
                <div style={{fontSize:10,color:'var(--t3)',marginTop:1}}>{toFa(String(count))} آیتم</div>
              </div>
            );
          })}
        </div>
        {/* Today counter */}
        <div style={{padding:'10px 8px',borderTop:'1px solid var(--line)',flexShrink:0}}>
          <div onClick={function(){if(goPage) goPage('sale-report'); else setShowTodayInvs(true);}}
            style={{padding:'9px 10px',borderRadius:14,cursor:'pointer',background:'var(--purple-soft)',border:'1.5px solid var(--purple-line)',textAlign:'center'}}>
            <div style={{fontSize:22,fontWeight:900,color:'var(--purple)',lineHeight:1}}>{toFa(String(todayInvList.length))}</div>
            <div style={{fontSize:10,color:'var(--purple)',fontWeight:600,marginTop:2}}>فاکتور امروز</div>
            <div style={{fontSize:10,color:'var(--purple)',opacity:.7}}>{fc(Math.round(todayRevenue/1000))} هزار ت</div>
          </div>
        </div>
      </div>

      {/* ─── CENTER: Menu Grid ─── */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
        <div style={{padding:'10px 14px',borderBottom:'1px solid var(--line)',background:'var(--surface)',flexShrink:0,display:'flex',gap:8,alignItems:'center'}}>
          <NIcon n="coffee" s={14} style={{color:'var(--t3)',flexShrink:0}}/>
          <span style={{fontSize:13,fontWeight:700,whiteSpace:'nowrap'}}>{selCat==='همه'?'همه آیتم‌ها':selCat}</span>
          <span style={{fontSize:11,color:'var(--t3)',marginRight:4,whiteSpace:'nowrap'}}>{toFa(String(displayed.length))} آیتم</span>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:12,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:9,alignContent:'start'}}>
          {displayed.length===0&&(
            <div style={{gridColumn:'1/-1'}} className="empty">
              <div className="empty-i"><NIcon n="coffee"/></div>
              <p>آیتمی در این دسته وجود ندارد</p>
              <p style={{fontSize:11,marginTop:4}}>ابتدا رسپی اضافه کنید</p>
            </div>
          )}
          {displayed.map(function(mi){
            var ms=maxServings(mi);
            var inCart=cart.filter(function(c){return c.mid===mi.id;}).reduce(function(s,c){return s+c.qty;},0);
            var isOut=ms<=0;
            var isLow=ms>0&&ms<=5;
            return (
              <div key={mi.id} onClick={function(){if(!isOut)addItem(mi);}}
                style={{background:'var(--surface)',border:'1.5px solid '+(inCart>0?'var(--purple)':'var(--line)'),
                  borderRadius:20,padding:12,cursor:isOut?'not-allowed':'pointer',
                  transition:'.13s',opacity:isOut?.45:1,position:'relative',
                  boxShadow:inCart>0?'0 0 0 3px rgba(17,17,16,.08)':'var(--shadow)'}}>
                {inCart>0&&(
                  <div style={{position:'absolute',top:7,left:7,background:'var(--t1)',color:'#fff',
                    borderRadius:'50%',width:20,height:20,display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:11,fontWeight:800}}>{toFa(String(inCart))}</div>
                )}
                <div style={{fontSize:12.5,fontWeight:700,marginBottom:4,lineHeight:1.3,paddingLeft:inCart>0?22:0}}>{mi.name}</div>
                <div style={{fontSize:13,color:'var(--blue)',fontWeight:700}}>{fc(mi.price)} ت</div>
                <div style={{fontSize:10,marginTop:3,color:isOut?'var(--red)':isLow?'var(--amber)':'var(--t3)'}}>
                  {isOut?'ناموجود':isLow?'فقط '+toFa(String(ms)):'موجود: '+toFa(String(ms))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── LEFT: Cart ─── */}
      <div style={{width:285,flexShrink:0,background:'var(--surface)',borderRight:'1px solid var(--line)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'10px 14px',borderBottom:'1px solid var(--line)',flexShrink:0}}>
          <div style={{fontSize:10,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:7}}>فاکتور جاری</div>
          {/* Customer */}
          <div onClick={function(){setShowCustPick(true);}}
            style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',background:'var(--surface2)',
              borderRadius:'var(--r2)',cursor:'pointer',border:'1px solid var(--line)',marginBottom:6,transition:'.12s'}}>
            <div style={{width:26,height:26,borderRadius:10,background:selCust.isWalk?'var(--t3)':'var(--purple)',
              color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>
              {selCust.name[0]}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{selCust.name}</div>
              <div style={{fontSize:10,color:'var(--t3)'}}>{selCust.isWalk?'مشتری گذری':'کد: '+selCust.code}</div>
            </div>
            <NIcon n="expand" s={11} style={{color:'var(--t3)',flexShrink:0}}/>
          </div>
          {/* Pager + Note row */}
          <div style={{display:'flex',gap:6,marginBottom:0}}>
            <div style={{position:'relative',width:90,flexShrink:0}}>
              <input className="fc" style={{fontSize:12,height:30,paddingRight:28}} placeholder="پیجر..." 
                value={pagerNum} onChange={function(e){setPagerNum(e.target.value);}} maxLength={4}/>
              <span style={{position:'absolute',right:9,top:'50%',transform:'translateY(-50%)',fontSize:10,color:'var(--t3)',pointerEvents:'none'}}>
                <NIcon n="tag" s={11}/>
              </span>
            </div>
            <input className="fc" style={{fontSize:11.5,height:30,flex:1}} placeholder="یادداشت..."
              value={note} onChange={function(e){setNote(e.target.value);}}/>
          </div>
        </div>

        {/* Cart items */}
        <div style={{flex:1,overflowY:'auto',padding:'6px 10px'}}>
          {cart.length===0&&(
            <div style={{textAlign:'center',padding:'28px 10px',color:'var(--t3)'}}>
              <div style={{fontSize:26,marginBottom:6}}>☕</div>
              <div style={{fontSize:12}}>آیتم انتخاب کنید</div>
            </div>
          )}
          {cart.map(function(item){
            return (
              <div key={item.mid} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 0',borderBottom:'1px solid var(--line)'}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</div>
                  <div style={{fontSize:10.5,color:'var(--t2)'}}>{fc(item.price)} ت</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:3}}>
                  <button onClick={function(){setQty(item.mid,item.qty-1);}}
                    style={{width:22,height:22,borderRadius:5,border:'1px solid var(--line2)',background:'var(--surface2)',cursor:'pointer',fontSize:14,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                  <span style={{fontSize:13,fontWeight:700,minWidth:18,textAlign:'center'}}>{toFa(String(item.qty))}</span>
                  <button onClick={function(){setQty(item.mid,item.qty+1);}}
                    style={{width:22,height:22,borderRadius:5,border:'1px solid var(--line2)',background:'var(--surface2)',cursor:'pointer',fontSize:14,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
                </div>
                <div style={{fontSize:11.5,fontWeight:700,minWidth:50,textAlign:'left'}}>{fc(item.price*item.qty)}</div>
                <button onClick={function(){setQty(item.mid,0);}} style={{border:'none',background:'none',cursor:'pointer',color:'var(--red)',padding:2}}>
                  <NIcon n="x" s={12}/>
                </button>
              </div>
            );
          })}
        </div>

        {/* Totals + actions */}
        <div style={{padding:'10px 14px',borderTop:'1px solid var(--line)',background:'var(--surface)',flexShrink:0}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11.5,color:'var(--t2)',marginBottom:3}}>
            <span>جمع:</span><span>{fc(subTotal)} ت</span>
          </div>
          {discountAmt>0&&(
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--green)',marginBottom:3}}>
              <span>تخفیف ({toFa(String(discount))}٪):</span><span>−{fc(discountAmt)} ت</span>
            </div>
          )}
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11.5,color:'var(--t2)',marginBottom:6}}>
            <span>مالیات ({toFa(String(taxPct))}٪):</span><span>{fc(taxAmt)} ت</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderTop:'2px solid var(--t1)',marginBottom:9}}>
            <span style={{fontWeight:800,fontSize:13}}>مبلغ نهایی:</span>
            <span style={{fontWeight:900,fontSize:16,color:'var(--t1)'}}>{fc(grandTotal)} ت</span>
          </div>
          <div style={{display:'flex',gap:5,marginBottom:6}}>
            <button className="btn bs bsm" style={{flex:1}} onClick={function(){setShowDiscount(true);}}>
              <NIcon n="discount" s={12}/> تخفیف{discount>0?' ('+toFa(String(discount))+'٪)':''}
            </button>
            <button className="btn bs bsm" style={{flex:1}} onClick={clearCart} disabled={cart.length===0}>
              <NIcon n="trash" s={12}/> پاک
            </button>
          </div>
          <button className="btn bp bfull" onClick={function(){if(cart.length>0)setConfirmPrint(true);}} disabled={cart.length===0}
            style={{height:42,fontSize:13.5,gap:7}}>
            <NIcon n="print" s={15}/>
            ثبت و چاپ فاکتور
          </button>
          <button className="btn bs bfull" onClick={function(){submitInvoice(false);}} disabled={cart.length===0}
            style={{marginTop:5,height:32,fontSize:12}}>
            ثبت بدون چاپ
          </button>
        </div>
      </div>

      {/* ═══ Customer Picker Modal ═══ */}
      <Modal open={showCustPick} onClose={function(){setShowCustPick(false);}} title="انتخاب مشتری">
        <div style={{maxHeight:360,overflowY:'auto'}}>
          {D.customers.map(function(c){
            return (
              <div key={c.id} onClick={function(){setSelCustId(c.id);setShowCustPick(false);}}
                style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:'var(--r2)',
                  cursor:'pointer',border:'1.5px solid '+(selCustId===c.id?'var(--t1)':'transparent'),
                  background:selCustId===c.id?'var(--surface2)':'transparent',marginBottom:4,transition:'.12s'}}>
                <div style={{width:34,height:34,borderRadius:12,background:c.isWalk?'var(--t3)':'var(--purple)',
                  color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,flexShrink:0}}>
                  {c.name[0]}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:13}}>{c.name}</div>
                  <div style={{fontSize:11,color:'var(--t3)'}}>{c.phone||'بدون تلفن'} {c.code&&('· '+c.code)}</div>
                </div>
                {selCustId===c.id&&<NIcon n="check" s={14} style={{color:'var(--green)'}}/>}
              </div>
            );
          })}
        </div>
        <div className="mft"><button className="btn bs bsm" onClick={function(){setShowCustPick(false);}}>بستن</button></div>
      </Modal>

      {/* ═══ Discount Modal ═══ */}
      <Modal open={showDiscount} onClose={function(){setShowDiscount(false);}} title="اعمال تخفیف">
        <div className="fg">
          <label className="fl">درصد تخفیف</label>
          <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:10}}>
            {[5,10,15,20,25,30,50].map(function(p){
              return <button key={p} className={'btn bsm '+(discount===p?'bp':'bs')} onClick={function(){setDiscount(p);}}>{toFa(String(p))}٪</button>;
            })}
          </div>
          <input className="fc" type="number" min="0" max="100" value={discount||''}
            onChange={function(e){setDiscount(Math.min(100,Math.max(0,Number(e.target.value)||0)));}}
            placeholder="درصد دلخواه..."/>
        </div>
        {discount>0&&subTotal>0&&(
          <div className="al as"><NIcon n="discount" s={14}/><span>مبلغ تخفیف: {fc(Math.round(subTotal*discount/100))} تومان</span></div>
        )}
        <div className="mft">
          <button className="btn bda bsm" onClick={function(){setDiscount(0);setShowDiscount(false);}}>حذف تخفیف</button>
          <button className="btn bp" onClick={function(){setShowDiscount(false);}}>تأیید</button>
        </div>
      </Modal>

      {/* ═══ Confirm + Print Modal ═══ */}
      <Modal open={confirmPrint} onClose={function(){setConfirmPrint(false);}} title="ثبت فاکتور">
        <div style={{marginBottom:14}}>
          <div style={{fontSize:13,marginBottom:8}}>
            {toFa(String(itemCount))} آیتم · مبلغ کل: <strong>{fc(grandTotal)} تومان</strong>
          </div>
          {pagerNum&&<div style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',background:'var(--amber-soft)',border:'1px solid var(--amber-line)',borderRadius:99,fontSize:12,fontWeight:700,color:'var(--amber)',marginBottom:8}}><NIcon n="tag" s={12}/>پیجر {pagerNum}</div>}
          <div className="al aw" style={{marginBottom:0,fontSize:12}}>
            <NIcon n="warn" s={13}/><span>پس از ثبت، موجودی انبار خودکار کسر می‌شود.</span>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:14}}>
          <button className="btn bp bfull" style={{height:44}} onClick={function(){submitInvoice(true);}}>
            <NIcon n="print" s={15}/> ثبت و چاپ
          </button>
          <button className="btn bs bfull" style={{height:44}} onClick={function(){submitInvoice(false);}}>
            ثبت بدون چاپ
          </button>
        </div>
        <div style={{marginTop:8,textAlign:'center'}}>
          <button className="btn bs bsm" onClick={function(){setConfirmPrint(false);}}>انصراف</button>
        </div>
      </Modal>

      {/* ═══ Today's Invoices Modal ═══ */}
      <Modal open={showTodayInvs} onClose={function(){setShowTodayInvs(false);}} title={'فاکتورهای امروز — '+todayStr} lg={true}>
        {todayInvList.length===0
          ?<div className="empty"><p>هنوز فاکتوری ثبت نشده</p></div>
          :(
            <div>
              <div className="g3" style={{marginBottom:14}}>
                <div className="stat" style={{padding:'12px 14px'}}><div className="slb">تعداد</div><div className="svl" style={{fontSize:22}}>{toFa(String(todayInvList.length))}</div></div>
                <div className="stat" style={{padding:'12px 14px'}}><div className="slb">درآمد</div><div className="svl" style={{fontSize:18}}>{fc(Math.round(todayRevenue/1000))}<span className="svl-unit">هزار ت</span></div></div>
                <div className="stat" style={{padding:'12px 14px'}}><div className="slb">پرداخت‌نشده</div><div className="svl" style={{fontSize:22,color:'var(--red)'}}>{toFa(String(todayInvList.filter(function(i){return i.status==='unpaid';}).length))}</div></div>
              </div>
              <div className="tw"><table>
                <thead><tr><th>شماره</th><th>ساعت</th><th>پیجر</th><th>مشتری</th><th>آیتم‌ها</th><th>مبلغ</th><th>وضعیت</th></tr></thead>
                <tbody>
                  {todayInvList.map(function(inv){
                    return (
                      <tr key={inv.id}>
                        <td style={{fontFamily:'monospace',fontWeight:700,fontSize:11}}>{inv.num}</td>
                        <td style={{color:'var(--t3)',fontSize:12}}>{inv.time}</td>
                        <td>{inv.pager?<span style={{fontWeight:700,color:'var(--amber)'}}>{inv.pager}</span>:'—'}</td>
                        <td>{inv.custName}</td>
                        <td style={{fontSize:11,color:'var(--t2)',maxWidth:160}}>{inv.items.map(function(i){return i.name+'×'+toFa(String(i.qty));}).join('، ')}</td>
                        <td><strong>{fc(inv.total)} ت</strong></td>
                        <td><span className={'bdg '+(inv.status==='paid'?'bg':'br')}>{inv.status==='paid'?'پرداخت':'باقی'}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table></div>
            </div>
          )
        }
        <div className="mft"><button className="btn bs" onClick={function(){setShowTodayInvs(false);}}>بستن</button></div>
      </Modal>
    </div>
  );
}


export default POS
