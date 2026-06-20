import { loadDb, saveDb, getNextId, paginate, getLocationName } from '../db'
import type { Inventory, InventoryItem, Location, Damage } from '../db'

export interface InventoryWithLocation extends Inventory {
  location_name?: string
}

export interface InventoryItemWithBook extends InventoryItem {
  book_title?: string
  book_barcode?: string
  book_author?: string
}

export interface DamageWithBook extends Damage {
  book_title?: string
  book_barcode?: string
}

export function getLocations(): Location[] {
  const db = loadDb()
  return [...db.locations].sort((a, b) => a.id - b.id)
}

export function addLocation(name: string, description?: string): number {
  const db = loadDb()
  const id = getNextId('locations')
  const now = new Date().toISOString()

  const newLocation: Location = {
    id,
    name,
    description,
    created_at: now,
  }

  db.locations.push(newLocation)
  saveDb()
  return id
}

export function createInventory(name: string, locationId?: number): { success: boolean; message: string; inventoryId?: number } {
  const db = loadDb()

  const inventoryNo = `PD${Date.now()}`

  let books = db.books
  if (locationId) {
    books = books.filter(b => b.location_id === locationId)
  }

  const totalBooks = books.length

  const inventoryId = getNextId('inventories')
  const now = new Date().toISOString()

  const newInventory: Inventory = {
    id: inventoryId,
    inventory_no: inventoryNo,
    name,
    location_id: locationId,
    start_date: now,
    status: 'in_progress',
    total_books: totalBooks,
    checked_books: 0,
    missing_books: 0,
    damaged_books: 0,
  }

  db.inventories.push(newInventory)

  for (const book of books) {
    const itemId = getNextId('inventory_items')
    const item: InventoryItem = {
      id: itemId,
      inventory_id: inventoryId,
      book_id: book.id,
      status: 'pending',
    }
    db.inventory_items.push(item)
  }

  saveDb()

  return { success: true, message: '盘点任务创建成功', inventoryId }
}

export function getInventories(params: {
  page?: number
  pageSize?: number
  status?: string
}): { list: InventoryWithLocation[]; total: number } {
  const db = loadDb()
  const page = params.page || 1
  const pageSize = params.pageSize || 20

  let filtered = [...db.inventories] as InventoryWithLocation[]

  if (params.status) {
    filtered = filtered.filter(i => i.status === params.status)
  }

  filtered = filtered.map(i => ({
    ...i,
    location_name: getLocationName(i.location_id),
  }))

  filtered.sort((a, b) => b.id - a.id)

  return paginate(filtered, page, pageSize)
}

export function getInventoryById(id: number): InventoryWithLocation | undefined {
  const db = loadDb()
  const inventory = db.inventories.find(i => i.id === id)
  if (!inventory) return undefined
  return {
    ...inventory,
    location_name: getLocationName(inventory.location_id),
  }
}

export function getInventoryItems(params: {
  inventoryId: number
  status?: string
  page?: number
  pageSize?: number
}): { list: InventoryItemWithBook[]; total: number } {
  const db = loadDb()
  const page = params.page || 1
  const pageSize = params.pageSize || 50

  let filtered = db.inventory_items.filter(ii => ii.inventory_id === params.inventoryId) as InventoryItemWithBook[]

  if (params.status) {
    filtered = filtered.filter(ii => ii.status === params.status)
  }

  filtered = filtered.map(ii => {
    const book = db.books.find(b => b.id === ii.book_id)
    return {
      ...ii,
      book_title: book?.title,
      book_barcode: book?.barcode,
      book_author: book?.author,
    }
  })

  filtered.sort((a, b) => a.id - b.id)

  return paginate(filtered, page, pageSize)
}

export function checkInventoryItem(inventoryId: number, bookId: number, status: string): { success: boolean; message: string } {
  const db = loadDb()

  const item = db.inventory_items.find(ii => ii.inventory_id === inventoryId && ii.book_id === bookId)
  if (!item) {
    return { success: false, message: '该书不在此盘点任务中' }
  }

  const today = new Date().toISOString().split('T')[0]
  item.status = status
  item.check_date = today

  const items = db.inventory_items.filter(ii => ii.inventory_id === inventoryId)
  const checked = items.filter(ii => ii.status !== 'pending').length
  const missing = items.filter(ii => ii.status === 'missing').length
  const damaged = items.filter(ii => ii.status === 'damaged').length

  const inventory = db.inventories.find(i => i.id === inventoryId)
  if (inventory) {
    inventory.checked_books = checked
    inventory.missing_books = missing
    inventory.damaged_books = damaged
  }

  saveDb()

  return { success: true, message: '盘点记录已更新' }
}

export function completeInventory(id: number): { success: boolean; message: string } {
  const db = loadDb()

  const inventory = db.inventories.find(i => i.id === id)
  if (!inventory) {
    return { success: false, message: '盘点任务不存在' }
  }

  inventory.status = 'completed'
  inventory.end_date = new Date().toISOString().split('T')[0]

  saveDb()

  return { success: true, message: '盘点任务已完成' }
}

export function reportDamage(bookId: number, damageLevel: string, description: string, handler?: string): { success: boolean; message: string; damageId?: number } {
  const db = loadDb()

  const book = db.books.find(b => b.id === bookId)
  if (!book) {
    return { success: false, message: '图书不存在' }
  }

  const id = getNextId('damages')
  const now = new Date().toISOString()

  const newDamage: Damage = {
    id,
    book_id: bookId,
    report_date: now,
    damage_level: damageLevel,
    description,
    handler: handler || '',
    status: 'reported',
    repair_cost: 0,
  }

  db.damages.push(newDamage)
  saveDb()

  return { success: true, message: '损坏登记成功', damageId: id }
}

export function getDamages(params: {
  page?: number
  pageSize?: number
  status?: string
}): { list: DamageWithBook[]; total: number } {
  const db = loadDb()
  const page = params.page || 1
  const pageSize = params.pageSize || 20

  let filtered = [...db.damages] as DamageWithBook[]

  if (params.status) {
    filtered = filtered.filter(d => d.status === params.status)
  }

  filtered = filtered.map(d => {
    const book = db.books.find(b => b.id === d.book_id)
    return {
      ...d,
      book_title: book?.title,
      book_barcode: book?.barcode,
    }
  })

  filtered.sort((a, b) => b.id - a.id)

  return paginate(filtered, page, pageSize)
}
