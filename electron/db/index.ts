import fs from 'fs'
import path from 'path'
import { app } from 'electron'

export interface Book {
  id: number
  isbn?: string
  barcode?: string
  title: string
  author?: string
  publisher?: string
  publish_date?: string
  category?: string
  location_id?: number
  shelf?: string
  status: string
  description?: string
  total_copies: number
  available_copies: number
  created_at: string
  updated_at: string
}

export interface Reader {
  id: number
  card_no: string
  name: string
  gender?: string
  phone?: string
  email?: string
  address?: string
  id_card?: string
  type: string
  max_borrow: number
  borrow_days: number
  status: string
  register_date: string
  expire_date?: string
  photo?: string
  notes?: string
}

export interface Borrow {
  id: number
  book_id: number
  reader_id: number
  borrow_date: string
  due_date: string
  return_date?: string
  renew_count: number
  status: string
  fine_amount: number
  fine_paid: number
  notes?: string
}

export interface Reservation {
  id: number
  book_id: number
  reader_id: number
  reserve_date: string
  expire_date?: string
  status: string
  queue_position?: number
  notify_date?: string
  notes?: string
}

export interface Location {
  id: number
  name: string
  description?: string
  created_at: string
}

export interface Inventory {
  id: number
  inventory_no: string
  name: string
  location_id?: number
  start_date: string
  end_date?: string
  status: string
  total_books: number
  checked_books: number
  missing_books: number
  damaged_books: number
  notes?: string
}

export interface InventoryItem {
  id: number
  inventory_id: number
  book_id: number
  status: string
  check_date?: string
  notes?: string
}

export interface Damage {
  id: number
  book_id: number
  report_date: string
  damage_level?: string
  description?: string
  handler?: string
  status: string
  repair_cost: number
  notes?: string
}

export interface NotificationTemplate {
  id: number
  name: string
  type: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

interface Database {
  books: Book[]
  readers: Reader[]
  borrows: Borrow[]
  reservations: Reservation[]
  locations: Location[]
  inventories: Inventory[]
  inventory_items: InventoryItem[]
  damages: Damage[]
  notification_templates: NotificationTemplate[]
  nextIds: {
    books: number
    readers: number
    borrows: number
    reservations: number
    locations: number
    inventories: number
    inventory_items: number
    damages: number
    notification_templates: number
  }
}

let db: Database | null = null
let dbPath: string = ''

function defaultDb(): Database {
  const now = new Date().toISOString()
  return {
    books: [],
    readers: [],
    borrows: [],
    reservations: [],
    locations: [
      { id: 1, name: '文学区', description: '文学类图书', created_at: now },
      { id: 2, name: '科技区', description: '科技类图书', created_at: now },
      { id: 3, name: '少儿区', description: '少儿读物', created_at: now },
      { id: 4, name: '综合区', description: '综合类图书', created_at: now },
    ],
    inventories: [],
    inventory_items: [],
    damages: [],
    notification_templates: [
      { id: 1, name: '逾期提醒', type: 'overdue', title: '图书逾期提醒', content: '尊敬的{reader_name}读者，您借阅的《{book_title}》已于{due_date}到期，请尽快归还。', created_at: now, updated_at: now },
      { id: 2, name: '到期提醒', type: 'due_soon', title: '图书即将到期提醒', content: '尊敬的{reader_name}读者，您借阅的《{book_title}》将于{due_date}到期，请及时归还或办理续借。', created_at: now, updated_at: now },
      { id: 3, name: '预约到馆', type: 'reservation_ready', title: '预约图书到馆通知', content: '尊敬的{reader_name}读者，您预约的《{book_title}》已到馆，请在{expire_date}前前来借阅。', created_at: now, updated_at: now },
    ],
    nextIds: {
      books: 1,
      readers: 1,
      borrows: 1,
      reservations: 1,
      locations: 5,
      inventories: 1,
      inventory_items: 1,
      damages: 1,
      notification_templates: 4,
    },
  }
}

export function loadDb(): Database {
  if (db) return db

  try {
    const userDataPath = app.getPath('userData')
    dbPath = path.join(userDataPath, 'library-data.json')

    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true })
    }

    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8')
      db = JSON.parse(data)
    } else {
      db = defaultDb()
      saveDb()
    }
  } catch (e) {
    console.error('加载数据库失败，使用内存数据库', e)
    db = defaultDb()
  }

  return db!
}

export function saveDb(): void {
  if (!db) return
  try {
    if (dbPath) {
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8')
    }
  } catch (e) {
    console.error('保存数据库失败:', e)
  }
}

export function getNextId(table: keyof Database['nextIds']): number {
  loadDb()
  const id = db!.nextIds[table]
  db!.nextIds[table]++
  return id
}

export function findById<T extends { id: number }>(arr: T[], id: number): T | undefined {
  return arr.find(item => item.id === id)
}

export function paginate<T>(arr: T[], page: number = 1, pageSize: number = 20): { list: T[]; total: number } {
  const total = arr.length
  const start = (page - 1) * pageSize
  const list = arr.slice(start, start + pageSize)
  return { list, total }
}

export function getLocationName(locationId?: number): string {
  loadDb()
  if (!locationId) return ''
  const loc = db!.locations.find(l => l.id === locationId)
  return loc ? loc.name : ''
}

export default { loadDb, saveDb, getNextId }
