import { loadDb, saveDb, getNextId, paginate } from '../db'
import type { Reader } from '../db'

export function getReaders(params: {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
  type?: string
}): { list: Reader[]; total: number } {
  const db = loadDb()
  const page = params.page || 1
  const pageSize = params.pageSize || 20

  let filtered = [...db.readers]

  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    filtered = filtered.filter(r =>
      r.name.toLowerCase().includes(kw) ||
      r.card_no.toLowerCase().includes(kw) ||
      (r.phone && r.phone.toLowerCase().includes(kw))
    )
  }
  if (params.status) {
    filtered = filtered.filter(r => r.status === params.status)
  }
  if (params.type) {
    filtered = filtered.filter(r => r.type === params.type)
  }

  filtered.sort((a, b) => b.id - a.id)

  return paginate(filtered, page, pageSize)
}

export function getReaderById(id: number): Reader | undefined {
  const db = loadDb()
  return db.readers.find(r => r.id === id)
}

export function getReaderByCardNo(cardNo: string): Reader | undefined {
  const db = loadDb()
  return db.readers.find(r => r.card_no === cardNo)
}

export function addReader(reader: Omit<Reader, 'id' | 'register_date'>): number {
  const db = loadDb()
  const id = getNextId('readers')
  const now = new Date().toISOString()

  const newReader: Reader = {
    id,
    card_no: reader.card_no,
    name: reader.name,
    gender: reader.gender || '',
    phone: reader.phone || '',
    email: reader.email || '',
    address: reader.address || '',
    id_card: reader.id_card || '',
    type: reader.type || 'adult',
    max_borrow: reader.max_borrow || 10,
    borrow_days: reader.borrow_days || 30,
    status: reader.status || 'active',
    register_date: now,
    expire_date: reader.expire_date,
    photo: reader.photo,
    notes: reader.notes,
  }

  db.readers.push(newReader)
  saveDb()
  return id
}

export function updateReader(id: number, reader: Partial<Reader>): void {
  const db = loadDb()
  const index = db.readers.findIndex(r => r.id === id)
  if (index === -1) return

  db.readers[index] = {
    ...db.readers[index],
    ...reader,
    id,
  }
  saveDb()
}

export function deleteReader(id: number): void {
  const db = loadDb()
  const index = db.readers.findIndex(r => r.id === id)
  if (index !== -1) {
    db.readers.splice(index, 1)
    saveDb()
  }
}

export function getReaderBorrowStats(readerId: number): { borrowed: number; overdue: number } {
  const db = loadDb()
  const today = new Date().toISOString().split('T')[0]

  const borrowedBooks = db.borrows.filter(b => b.reader_id === readerId && b.status === 'borrowed')
  const overdue = borrowedBooks.filter(b => b.due_date < today)

  return {
    borrowed: borrowedBooks.length,
    overdue: overdue.length,
  }
}
