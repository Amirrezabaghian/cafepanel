import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

/* ─── Auth ─────────────────────────────────────────────────────────────── */
export async function sbLogin(username, password) {
  // کاربران در جدول users نگه داری می‌شن، نه Supabase Auth
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password', password)  // در محیط واقعی باید hash بشه
    .single()
  if (error || !data) throw new Error('نام کاربری یا رمز اشتباه است')
  return data
}

/* ─── Ingredients ──────────────────────────────────────────────────────── */
export const sbIngredients = {
  list: () => supabase.from('ingredients').select('*').order('name'),
  upsert: (row) => supabase.from('ingredients').upsert(row).select().single(),
  delete: (id) => supabase.from('ingredients').delete().eq('id', id),
}

/* ─── Menu Items ───────────────────────────────────────────────────────── */
export const sbMenu = {
  list: () => supabase.from('menu_items').select('*').order('name'),
  upsert: (row) => supabase.from('menu_items').upsert(row).select().single(),
  delete: (id) => supabase.from('menu_items').delete().eq('id', id),
}

/* ─── Recipes ──────────────────────────────────────────────────────────── */
export const sbRecipes = {
  list: () => supabase.from('recipes').select('*'),
  upsert: (row) => supabase.from('recipes').upsert(row).select().single(),
  delete: (id) => supabase.from('recipes').delete().eq('id', id),
  deleteByMenu: (mid) => supabase.from('recipes').delete().eq('mid', mid),
}

/* ─── Purchase Invoices ────────────────────────────────────────────────── */
export const sbInvoices = {
  list: () => supabase.from('invoices').select('*').order('date', { ascending: false }),
  upsert: (row) => supabase.from('invoices').upsert(row).select().single(),
  delete: (id) => supabase.from('invoices').delete().eq('id', id),
}

/* ─── Sale Invoices ────────────────────────────────────────────────────── */
export const sbSaleInvoices = {
  list: () => supabase.from('sale_invoices').select('*').order('date', { ascending: false }),
  insert: (row) => supabase.from('sale_invoices').insert(row).select().single(),
  update: (id, changes) => supabase.from('sale_invoices').update(changes).eq('id', id).select().single(),
  delete: (id) => supabase.from('sale_invoices').delete().eq('id', id),
}

/* ─── Customers ────────────────────────────────────────────────────────── */
export const sbCustomers = {
  list: () => supabase.from('customers').select('*').order('name'),
  upsert: (row) => supabase.from('customers').upsert(row).select().single(),
  delete: (id) => supabase.from('customers').delete().eq('id', id),
}

/* ─── Overheads ────────────────────────────────────────────────────────── */
export const sbOverheads = {
  list: () => supabase.from('overheads').select('*'),
  upsert: (row) => supabase.from('overheads').upsert(row).select().single(),
  delete: (id) => supabase.from('overheads').delete().eq('id', id),
}

/* ─── Bank Cards ───────────────────────────────────────────────────────── */
export const sbCards = {
  list: () => supabase.from('cards').select('*'),
  upsert: (row) => supabase.from('cards').upsert(row).select().single(),
  delete: (id) => supabase.from('cards').delete().eq('id', id),
}

/* ─── Users ────────────────────────────────────────────────────────────── */
export const sbUsers = {
  list: () => supabase.from('users').select('id, name, role, username').order('name'),
  upsert: (row) => supabase.from('users').upsert(row).select().single(),
  delete: (id) => supabase.from('users').delete().eq('id', id),
}

/* ─── Settings ─────────────────────────────────────────────────────────── */
export const sbSettings = {
  get: async () => {
    const { data } = await supabase.from('settings').select('*')
    const obj = {}
    ;(data || []).forEach(r => { obj[r.key] = r.value })
    return obj
  },
  set: (key, value) => supabase.from('settings').upsert({ key, value: String(value) }),
  setMany: (obj) => supabase.from('settings').upsert(
    Object.entries(obj).map(([key, value]) => ({ key, value: String(value) }))
  ),
}

/* ─── Stock Logs ───────────────────────────────────────────────────────── */
export const sbStockLogs = {
  list: () => supabase.from('stock_logs').select('*').order('id', { ascending: false }).limit(500),
  insert: (row) => supabase.from('stock_logs').insert(row),
}

/* ─── Full data loader ─────────────────────────────────────────────────── */
export async function loadAllData() {
  const [ing, menu, rec, oh, invs, saleInvs, custs, cards, users, settings, logs] = await Promise.all([
    sbIngredients.list(),
    sbMenu.list(),
    sbRecipes.list(),
    sbOverheads.list(),
    sbInvoices.list(),
    sbSaleInvoices.list(),
    sbCustomers.list(),
    sbCards.list(),
    sbUsers.list(),
    sbSettings.get(),
    sbStockLogs.list(),
  ])
  return {
    ingredients:  ing.data   || [],
    menuItems:    menu.data  || [],
    recipes:      rec.data   || [],
    overheads:    oh.data    || [],
    invoices:     invs.data  || [],
    saleInvoices: saleInvs.data || [],
    customers:    custs.data || [],
    cards:        cards.data || [],
    users:        users.data || [],
    settings:     settings   || {},
    stockLogs:    logs.data  || [],
    estOrders:    Number(settings.estOrders || 80),
  }
}
