// AI Engine — Groq (llama-3.3-70b-versatile) — رایگان و بدون CORS

async function callGroq(messages, sysPrompt, maxTokens) {
  var apiKey = window._groqKey || '';
  if (!apiKey) throw new Error('NO_KEY');
  var resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: maxTokens || 900,
      temperature: 0.7,
      messages: [{ role: 'system', content: sysPrompt }].concat(messages),
    }),
  });
  if (!resp.ok) {
    var err = await resp.json().catch(function() { return {}; });
    if (resp.status === 401) throw new Error('INVALID_KEY');
    if (resp.status === 429) throw new Error('RATE_LIMIT');
    throw new Error((err.error && err.error.message) || 'API_ERROR');
  }
  var data = await resp.json();
  return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
}

/* ─── Build rich cafe context ─────────────────────────────────────────────── */
function buildCafeContext(D) {
  var today = aiTodayStr();
  var allInvs = D.saleInvoices || [];
  var todayInvs = allInvs.filter(function(i) { return i.date === today; });
  var thisMonth = today.slice(0, 7);
  var monthInvs = allInvs.filter(function(i) { return i.date && i.date.slice(0, 7) === thisMonth; });
  var todayRev = todayInvs.reduce(function(s, i) { return s + (i.total || 0); }, 0);
  var monthRev = monthInvs.reduce(function(s, i) { return s + (i.total || 0); }, 0);
  var unpaidAmt = allInvs.filter(function(i) { return i.status === 'unpaid'; }).reduce(function(s, i) { return s + (i.total || 0); }, 0);
  var unpaidCnt = allInvs.filter(function(i) { return i.status === 'unpaid'; }).length;

  /* item sales ranking */
  var itemSales = {};
  allInvs.forEach(function(inv) {
    (inv.items || []).forEach(function(it) { itemSales[it.name] = (itemSales[it.name] || 0) + (it.qty || 0); });
  });
  var topItems = Object.entries(itemSales).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 6);

  /* customer spend */
  var custSpend = {};
  allInvs.forEach(function(inv) {
    var cn = inv.custName || 'گذری';
    custSpend[cn] = (custSpend[cn] || 0) + (inv.total || 0);
  });
  var topCusts = Object.entries(custSpend).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 5);

  /* item cost & margin */
  var itemCosts = (D.menuItems || []).map(function(mi) {
    var recs = (D.recipes || []).filter(function(r) { return r.mid === mi.id; });
    var cost = recs.reduce(function(s, r) {
      var ing = (D.ingredients || []).find(function(x) { return x.id === r.iid; });
      return ing ? s + (r.qty || 0) * (ing.avg_cost || 0) : s;
    }, 0);
    var margin = mi.price > 0 ? Math.round((mi.price - cost) / mi.price * 100) : 0;
    return { name: mi.name, price: mi.price, cost: Math.round(cost), margin: margin, category: mi.category || '' };
  });

  /* overheads */
  var monthOH = (D.overheads || []).reduce(function(s, o) {
    return s + (o.period === 'monthly' ? o.amount : (o.amount || 0) / 12);
  }, 0);

  /* daily sales per day (last 14 days) */
  var dailyStats = [];
  for (var dd = 13; dd >= 0; dd--) {
    var dt = new Date(); dt.setDate(dt.getDate() - dd);
    var jd = aiToJ(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
    var ds = jd[0] + '/' + String(jd[1]).padStart(2, '0') + '/' + String(jd[2]).padStart(2, '0');
    var dInvs = allInvs.filter(function(inv) { return inv.date === ds; });
    var dRev = dInvs.reduce(function(s, inv) { return s + (inv.total || 0); }, 0);
    if (dInvs.length > 0 || dd < 7) {
      var dayNames = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'];
      dailyStats.push(ds + ' (' + dayNames[dt.getDay()] + '): ' + dInvs.length + ' فاکتور / ' + Math.round(dRev / 1000) + 'هزار ت');
    }
  }

  /* stock health */
  var stockInfo = (D.ingredients || []).map(function(ing) {
    var dailyUse = (D.recipes || []).filter(function(r) { return r.iid === ing.id; }).reduce(function(s, r) { return s + (r.qty || 0); }, 0) * (D.estOrders || 80);
    var daysLeft = dailyUse > 0 ? Math.floor((ing.stock || 0) / dailyUse) : 999;
    var pct = ing.maxStock > 0 ? Math.round((ing.stock || 0) / ing.maxStock * 100) : 100;
    return '- ' + ing.name + ': موجودی=' + (ing.stock || 0) + ing.mic_unit +
      ' | ' + pct + '% از حداکثر' + (daysLeft < 999 ? ' | ' + daysLeft + ' روز' : '') +
      ' | قیمت میانگین: ' + (ing.avg_cost || 0) + ' ت/' + ing.recipe_unit;
  });

  return [
    '## اطلاعات کافه',
    'نام: ' + ((D.settings && D.settings.cafeNameFa) || 'کافه من'),
    'تاریخ امروز: ' + today + ' | برآورد سفارش روزانه: ' + (D.estOrders || 80),
    '',
    '## آمار مالی',
    'فروش امروز: ' + todayInvs.length + ' فاکتور | ' + Math.round(todayRev / 1000) + 'هزار تومان',
    'فروش این ماه: ' + monthInvs.length + ' فاکتور | ' + Math.round(monthRev / 1000) + 'هزار تومان',
    'مانده‌دار: ' + unpaidCnt + ' فاکتور | ' + Math.round(unpaidAmt / 1000) + 'هزار تومان',
    'هزینه ثابت ماهانه: ' + Math.round(monthOH / 1000) + 'هزار تومان',
    'break-even روزانه: ' + Math.round(monthOH / 26 / 1000) + 'هزار تومان',
    '',
    '## آیتم‌های منو + هزینه واقعی',
    itemCosts.map(function(i) {
      return '- ' + i.name + ' (' + i.category + '): قیمت فروش ' + Math.round(i.price / 1000) + 'هزار | هزینه ' + Math.round(i.cost / 1000) + 'هزار | مارجین ' + i.margin + '%';
    }).join('\n'),
    '',
    '## رنکینگ فروش آیتم‌ها (کل زمان)',
    topItems.length ? topItems.map(function(t) { return '- ' + t[0] + ': ' + t[1] + ' عدد'; }).join('\n') : 'فاکتوری ثبت نشده',
    '',
    '## مشتریان برتر',
    topCusts.length ? topCusts.map(function(c) { return '- ' + c[0] + ': ' + Math.round(c[1] / 1000) + 'هزار تومان'; }).join('\n') : '—',
    '',
    '## موجودی انبار',
    stockInfo.join('\n'),
    '',
    '## رسپی‌های ثبت‌شده',
    (D.menuItems || []).map(function(mi) {
      var recs = (D.recipes || []).filter(function(r) { return r.mid === mi.id; });
      if (!recs.length) return '- ' + mi.name + ': رسپی ندارد';
      return '- ' + mi.name + ': ' + recs.map(function(r) {
        var ing = (D.ingredients || []).find(function(x) { return x.id === r.iid; });
        return ing ? ing.name + ' ' + r.qty + ing.recipe_unit : '';
      }).filter(Boolean).join(', ');
    }).join('\n'),
    '',
    '## آمار روزانه ۱۴ روز اخیر',
    dailyStats.join('\n') || 'داده‌ای ثبت نشده',
  ].join('\n');
}

function aiTodayStr() {
  var n = new Date();
  var j = aiToJ(n.getFullYear(), n.getMonth() + 1, n.getDate());
  return j[0] + '/' + String(j[1]).padStart(2, '0') + '/' + String(j[2]).padStart(2, '0');
}
function aiToJ(gy, gm, gd) {
  var g = 365 * gy + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400) + gd + [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334][gm - 1] + (gm > 2 && ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0) ? 1 : 0);
  var j = g - 79, jnp = Math.floor(j / 12053); j %= 12053;
  var jy = 979 + 33 * jnp + 4 * Math.floor(j / 1461); j %= 1461;
  if (j >= 366) { jy += Math.floor((j - 1) / 365); j = (j - 1) % 365; }
  var mo = [0, 31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29]; var jm = 0;
  for (var i = 1; i <= 12; i++) { j -= mo[i]; if (j < 0) { jm = i; j += mo[i]; break; } }
  return [jy, jm, j + 1];
}

/* ─── Specialized analysis functions ─────────────────────────────────────── */
async function analyzeWeeklySales(D) {
  var ctx = buildCafeContext(D);
  return callGPT([{ role: 'user', content: 'تحلیل کامل فروش ۷ روز اخیر بده. الگوهای روزانه، پیش‌بینی هفته آینده، پیشنهاد عملی.' }],
    'تو تحلیلگر فروش یک کافه ایرانی هستی. فقط بر اساس داده‌های زیر تحلیل کن. فارسی روان و کوتاه.\n\n' + ctx, 900);
}

async function analyzeInventory(D) {
  var ctx = buildCafeContext(D);
  return callGPT([{ role: 'user', content: 'وضعیت انبار رو آنالیز کن. چی باید بخرم و چقدر؟ هشدار موجودی بده.' }],
    'تو متخصص مدیریت انبار کافه هستی. داده‌های واقعی زیر رو آنالیز کن. فارسی کوتاه و عملی.\n\n' + ctx, 800);
}

async function analyzePricing(D) {
  var ctx = buildCafeContext(D);
  return callGPT([{ role: 'user', content: 'مارجین هر آیتم رو بررسی کن. کدوم‌ها ضعیفن؟ قیمت پیشنهادی برای بهینه‌سازی بده.' }],
    'تو متخصص قیمت‌گذاری کافه هستی. هزینه واقعی رو داری. فارسی کوتاه.\n\n' + ctx, 800);
}

async function analyzeCustomers(D) {
  var ctx = buildCafeContext(D);
  return callGPT([{ role: 'user', content: 'مشتری‌ها رو آنالیز کن. دسته‌بندی‌شون کن. چه مشتری‌هایی در خطر از دست دادنن؟' }],
    'تو متخصص CRM کافه هستی. داده‌های مشتریان رو آنالیز کن. فارسی کوتاه.\n\n' + ctx, 800);
}

async function generateWeeklyReport(D) {
  var ctx = buildCafeContext(D);
  return callGPT([{ role: 'user', content: 'گزارش کامل هفتگی بنویس. مالی + انبار + مشتری + پیشنهادهای اولویت‌دار.' }],
    'تو مشاور مدیریت یک کافه ایرانی هستی. گزارش اجرایی کوتاه و مفید بنویس.\n\n' + ctx, 1200);
}

async function analyzeBreakEven(D) {
  var ctx = buildCafeContext(D);
  return callGPT([{ role: 'user', content: 'break-even امروز چنده؟ آیا رسیدیم؟ اگه نرسیدیم چقدر مونده؟ پیشنهاد عملی بده.' }],
    'تو متخصص مالی کافه هستی. محاسبه دقیق break-even انجام بده.\n\n' + ctx, 700);
}

/* ─── Markdown renderer ───────────────────────────────────────────────────── */
function renderMd(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<div class="ai-h3">$1</div>')
    .replace(/^## (.+)$/gm, '<div class="ai-h2">$1</div>')
    .replace(/^✓ (.+)$/gm, '<div class="ai-ok">✓ $1</div>')
    .replace(/^⚠️ (.+)$/gm, '<div class="ai-warn">⚠️ $1</div>')
    .replace(/^🔴 (.+)$/gm, '<div class="ai-red">🔴 $1</div>')
    .replace(/^🟢 (.+)$/gm, '<div class="ai-green">🟢 $1</div>')
    .replace(/^- (.+)$/gm, '<div class="ai-li">• $1</div>')
    .replace(/^\d+\. (.+)$/gm, '<div class="ai-li">$&</div>')
    .replace(/\n{2,}/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

/* ─── Page suggestion chips ──────────────────────────────────────────────── */
var AI_CHIPS = {
  'dashboard':        ['امروز چطور بودیم؟', 'break-even رسیدیم؟', 'هفته آینده چطوره؟'],
  'pos':              ['مواد کم‌موجود داریم؟', 'الان چی بیشتر می‌فروشه؟', 'تخفیف مناسبه؟'],
  'sale-report':      ['الگوی فروش این هفته', 'بهترین روز کدومه؟', 'پیش‌بینی ماه آینده'],
  'customers':        ['پرخریدترین مشتری‌ها', 'کی مدتیه نیومده؟', 'استراتژی وفاداری'],
  'stock':            ['چی باید بخرم؟', 'موجودی بحرانی کدومه؟', 'هدررفت داریم؟'],
  'ingredients':      ['گران‌ترین ماده‌ام چیه؟', 'جایگزین ارزان‌تر داریم؟'],
  'invoices':         ['این خرید بصرفه‌ست؟', 'میانگین خرید ماهانه‌ام'],
  'purchase-report':  ['بهترین تامین‌کننده کدومه؟', 'روند هزینه‌ها'],
  'recipe':           ['بیشترین مارجین کدوم آیتمه؟', 'رسپی بهینه‌کن'],
  'overhead':         ['break-even روزانه', 'کجا هزینه کم کنم؟'],
  'cards':            ['وضع نقدینگی چطوره؟'],
  'settings':         ['تنظیمات بهینه پیشنهاد بده'],
};

/* ══════════════════════════════════════════════════════════════════════════════
   FEATURE 1: API KEY SETUP MODAL
══════════════════════════════════════════════════════════════════════════════ */
