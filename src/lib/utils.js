/* ─── Persian digits & formatters ─── */


/* global React ReactDOM */
var useState = React.useState;
var useEffect = React.useEffect;
var useRef = React.useRef;
var useMemo = React.useMemo;

/* ─── CONSTANTS ─── */
var UPAIRS = {
  'کیلوگرم/گرم': {mac:'کیلوگرم',mic:'گرم',rate:1000},
  'لیتر/میلی‌لیتر': {mac:'لیتر',mic:'میلی‌لیتر',rate:1000},
  'تعداد/عدد': {mac:'تعداد',mic:'عدد',rate:1}
};
var ICATS = ['دانه قهوه','لبنیات','شکر و شیرینی','میوه','نوشیدنی','ادویه','سایر'];
var MCATS = ['قهوه','نوشیدنی سرد','نوشیدنی گرم','اسموتی','کیک','ساندویچ','صبحانه','سایر'];
var JMONS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
var JDAYS = ['ش','ی','د','س','چ','پ','ج'];
var CCOLORS = ['#2563EB','#7C3AED','#059669','#DC2626','#D97706','#0891B2'];
var PROLES = ['مدیر','باریستا','صندوقدار','گارسون','آشپز','سایر'];

/* ─── UTILS ─── */
var P=['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
function toFa(s){return String(s).replace(/[0-9]/g,function(d){return P[d];});}
function fc(n){
  var v=Number(n)||0;
  return toFa(v.toLocaleString('en-US',{maximumFractionDigits:0}));
}
function fp(n){
  var v=Number(n)||0;
  return toFa(v.toFixed(1));
}
function dailyR(o) {
  var d = {daily:1, monthly:30, yearly:365};
  return o.amount / (d[o.period] || 30);
}
function nowStr() {
  var n = new Date();
  var parts = toJ(n.getFullYear(), n.getMonth()+1, n.getDate());
  var h = String(n.getHours()).padStart(2,'0');
  var m = String(n.getMinutes()).padStart(2,'0');
  return parts[0]+'/'+String(parts[1]).padStart(2,'0')+'/'+String(parts[2]).padStart(2,'0')+' — '+h+':'+m;
}

/* ─── JALALI ─── */
function toJ(gy, gm, gd) {
  var g2=[0,31,59,90,120,151,181,212,243,273,304,334];
  gy-=1600; gm-=1; gd-=1;
  var gDN=365*gy+Math.floor((gy+3)/4)-Math.floor((gy+99)/100)+Math.floor((gy+399)/400)+g2[gm]+gd;
  var jDN=gDN-79, jnp=Math.floor(jDN/12053); jDN%=12053;
  var jy=979+33*jnp+4*Math.floor(jDN/1461); jDN%=1461;
  if(jDN>=366){jy+=Math.floor((jDN-1)/365);jDN=(jDN-1)%365;}
  var mo=[31,31,31,31,31,31,30,30,30,30,30,29], jm=0;
  for(var i=0;i<12;i++){if(jDN>=mo[i]){jDN-=mo[i];jm++;}else break;}
  return [jy, jm+1, jDN+1];
}
function todayJ() { var n=new Date(); return toJ(n.getFullYear(),n.getMonth()+1,n.getDate()); }
function daysInM(jy,jm) { if(jm<=6)return 31; if(jm<=11)return 30; return 29; }
function firstWD(jy,jm) {
  var mo=[0,31,31,31,31,31,31,30,30,30,30,30,29], t=0;
  for(var y=1;y<jy;y++) t+=365;
  for(var mi=1;mi<jm;mi++) t+=mo[mi];
  return (t+3)%7;
}

/* ─── DATE PICKER ─── */

/* ─── App constants ─── */
/* ─── CONSTANTS ─── */
var UPAIRS = {
  'کیلوگرم/گرم': {mac:'کیلوگرم',mic:'گرم',rate:1000},
  'لیتر/میلی‌لیتر': {mac:'لیتر',mic:'میلی‌لیتر',rate:1000},
  'تعداد/عدد': {mac:'تعداد',mic:'عدد',rate:1}
};
var ICATS = ['دانه قهوه','لبنیات','شکر و شیرینی','میوه','نوشیدنی','ادویه','سایر'];
var MCATS = ['قهوه','نوشیدنی سرد','نوشیدنی گرم','اسموتی','کیک','ساندویچ','صبحانه','سایر'];
var JMONS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
var JDAYS = ['ش','ی','د','س','چ','پ','ج'];
var CCOLORS = ['#2563EB','#7C3AED','#059669','#DC2626','#D97706','#0891B2'];
var PROLES = ['مدیر','باریستا','صندوقدار','گارسون','آشپز','سایر'];


/* ─── Navigation ─── */
/* ── PAGES ── */
var PAGES = [
  {id:'dashboard',      label:'داشبورد',         icon:'dashboard', grp:'اصلی'},
  {id:'pos',            label:'ثبت فاکتور',       icon:'coffee',    grp:'فروش'},
  {id:'sale-report',    label:'گزارش فروش',       icon:'chart',     grp:'فروش'},
  {id:'customers',      label:'مشتریان',           icon:'users',     grp:'فروش'},
  {id:'stock',          label:'موجودی انبار',     icon:'inventory', grp:'انبار'},
  {id:'ingredients',    label:'مواد اولیه',       icon:'log',       grp:'انبار'},
  {id:'invoices',       label:'فاکتور خرید',      icon:'receipt',   grp:'انبار'},
  {id:'purchase-report',label:'گزارش خرید',       icon:'chart',     grp:'انبار'},
  {id:'recipe',         label:'رسپی‌ساز',         icon:'recipe',    grp:'منو'},
  {id:'overhead',       label:'هزینه‌ها',          icon:'overhead',  grp:'مالی'},
  {id:'cards',          label:'حساب‌ها',           icon:'card',      grp:'مالی'},
  {id:'settings',       label:'تنظیمات',          icon:'settings',  grp:'مالی'},
  {id:'users',          label:'کاربران',           icon:'users',     grp:'تنظیمات'}
];
var PI = {
  dashboard:        {t:'داشبورد',            s:'خلاصه عملکرد کافه'},
  pos:              {t:'ثبت فاکتور فروش',    s:'انتخاب آیتم و صدور فاکتور'},
  'sale-report':    {t:'گزارش فروش',         s:'فاکتورهای فروش ثبت‌شده'},
  customers:        {t:'مشتریان',             s:'مدیریت مشتریان'},
  stock:            {t:'موجودی انبار',        s:'وضعیت مواد اولیه'},
  ingredients:      {t:'مواد اولیه',         s:'مدیریت مواد اولیه'},
  invoices:         {t:'فاکتور خرید',        s:'ثبت خرید مواد اولیه'},
  'purchase-report':{t:'گزارش خرید',         s:'تحلیل خریدها'},
  recipe:           {t:'رسپی‌ساز',           s:'تعریف رسپی برای آیتم‌های منو'},
  overhead:         {t:'هزینه‌های ثابت',     s:'اجاره، حقوق و سایر هزینه‌ها'},
  cards:            {t:'حساب‌های بانکی',     s:'مدیریت کارت‌ها و موجودی'},
  settings:         {t:'تنظیمات',            s:'مالیات، نام کافه و تنظیمات عمومی'},
  users:            {t:'کاربران',             s:'مدیریت کاربران و دسترسی‌ها'}
};
