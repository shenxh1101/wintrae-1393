import { loadDb, saveDb, getNextId, paginate } from '../db'
import type { Borrow, Book } from '../db'
import dayjs from 'dayjs'

function updateBookStatusByCopies(book: Book) {
  if (book.status === 'available' || book.status === 'borrowed' || book.status === 'reserved') {
    if (book.available_copies > 0) {
      book.status = 'available'
    } else {
      book.status = 'borrowed'
    }
  }
}

export interface BorrowWithDetails extends Borrow {
  book_title?: string
  book_barcode?: string
  reader_name?: string
  reader_card_no?: string
  reader_phone?: string
}

export function borrowBook(bookId: number, readerId: number): { success: boolean; message: string; borrowId?: number } {
  const db = loadDb()

  const book = db.books.find(b => b.id === bookId)
  if (!book) {
    return { success: false, message: '图书不存在' }
  }
  if (book.available_copies <= 0) {
    return { success: false, message: '该书暂无库存' }
  }

  const reader = db.readers.find(r => r.id === readerId)
  if (!reader) {
    return { success: false, message: '读者不存在' }
  }
  if (reader.status !== 'active') {
    return { success: false, message: '读者证已失效' }
  }

  const borrowedCount = db.borrows.filter(b => b.reader_id === readerId && b.status === 'borrowed').length
  if (borrowedCount >= reader.max_borrow) {
    return { success: false, message: `已达最大借阅数 ${reader.max_borrow} 本` }
  }

  const existingBorrow = db.borrows.find(b => b.book_id === bookId && b.reader_id === readerId && b.status === 'borrowed')
  if (existingBorrow) {
    return { success: false, message: '您已借阅过此书' }
  }

  const dueDate = dayjs().add(reader.borrow_days, 'day').format('YYYY-MM-DD')
  const id = getNextId('borrows')
  const now = new Date().toISOString()

  const newBorrow: Borrow = {
    id,
    book_id: bookId,
    reader_id: readerId,
    borrow_date: now,
    due_date: dueDate,
    renew_count: 0,
    status: 'borrowed',
    fine_amount: 0,
    fine_paid: 0,
  }

  db.borrows.push(newBorrow)
  book.available_copies--
  updateBookStatusByCopies(book)

  saveDb()

  return { success: true, message: '借阅成功', borrowId: id }
}

export function returnBook(borrowId: number): { success: boolean; message: string; fine?: number } {
  const db = loadDb()

  const borrow = db.borrows.find(b => b.id === borrowId)
  if (!borrow) {
    return { success: false, message: '借阅记录不存在' }
  }
  if (borrow.status === 'returned') {
    return { success: false, message: '该书已归还' }
  }

  const today = dayjs().format('YYYY-MM-DD')
  let fine = 0
  if (dayjs(today).isAfter(dayjs(borrow.due_date))) {
    const overdueDays = dayjs(today).diff(dayjs(borrow.due_date), 'day')
    fine = overdueDays * 0.5
  }

  borrow.return_date = today
  borrow.status = 'returned'
  borrow.fine_amount = fine

  const book = db.books.find(b => b.id === borrow.book_id)
  if (book) {
    book.available_copies++
    updateBookStatusByCopies(book)
  }

  saveDb()

  return { success: true, message: '归还成功', fine }
}

export function renewBook(borrowId: number): { success: boolean; message: string; newDueDate?: string } {
  const db = loadDb()

  const borrow = db.borrows.find(b => b.id === borrowId)
  if (!borrow) {
    return { success: false, message: '借阅记录不存在' }
  }
  if (borrow.status !== 'borrowed') {
    return { success: false, message: '当前状态不可续借' }
  }
  if (borrow.renew_count >= 2) {
    return { success: false, message: '已达最大续借次数' }
  }

  const reader = db.readers.find(r => r.id === borrow.reader_id)
  if (!reader) {
    return { success: false, message: '读者不存在' }
  }

  const reservationCount = db.reservations.filter(r => r.book_id === borrow.book_id && r.status === 'waiting').length
  if (reservationCount > 0) {
    return { success: false, message: '该书已被预约，无法续借' }
  }

  const newDueDate = dayjs(borrow.due_date).add(reader.borrow_days, 'day').format('YYYY-MM-DD')
  borrow.due_date = newDueDate
  borrow.renew_count++

  saveDb()

  return { success: true, message: '续借成功', newDueDate }
}

export function getBorrows(params: {
  page?: number
  pageSize?: number
  status?: string
  reader_id?: number
  book_id?: string
  keyword?: string
}): { list: BorrowWithDetails[]; total: number } {
  const db = loadDb()
  const page = params.page || 1
  const pageSize = params.pageSize || 20

  let filtered = [...db.borrows] as BorrowWithDetails[]

  if (params.status) {
    filtered = filtered.filter(b => b.status === params.status)
  }
  if (params.reader_id) {
    filtered = filtered.filter(b => b.reader_id === params.reader_id)
  }
  if (params.book_id) {
    filtered = filtered.filter(b => b.book_id === Number(params.book_id))
  }
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    filtered = filtered.filter(b => {
      const book = db.books.find(bk => bk.id === b.book_id)
      const reader = db.readers.find(r => r.id === b.reader_id)
      return (
        (book && book.title.toLowerCase().includes(kw)) ||
        (reader && reader.name.toLowerCase().includes(kw)) ||
        (reader && reader.card_no.toLowerCase().includes(kw))
      )
    })
  }

  filtered = filtered.map(b => {
    const book = db.books.find(bk => bk.id === b.book_id)
    const reader = db.readers.find(r => r.id === b.reader_id)
    return {
      ...b,
      book_title: book?.title,
      book_barcode: book?.barcode,
      reader_name: reader?.name,
      reader_card_no: reader?.card_no,
    }
  })

  filtered.sort((a, b) => b.id - a.id)

  return paginate(filtered, page, pageSize)
}

export function getOverdueBorrows(): BorrowWithDetails[] {
  const db = loadDb()
  const today = new Date().toISOString().split('T')[0]

  const overdue = db.borrows.filter(b => b.status === 'borrowed' && b.due_date < today) as BorrowWithDetails[]

  return overdue.map(b => {
    const book = db.books.find(bk => bk.id === b.book_id)
    const reader = db.readers.find(r => r.id === b.reader_id)
    return {
      ...b,
      book_title: book?.title,
      book_barcode: book?.barcode,
      reader_name: reader?.name,
      reader_card_no: reader?.card_no,
      reader_phone: reader?.phone,
    }
  }).sort((a, b) => a.due_date.localeCompare(b.due_date))
}

export function getBorrowById(id: number): BorrowWithDetails | undefined {
  const db = loadDb()
  const borrow = db.borrows.find(b => b.id === id)
  if (!borrow) return undefined

  const book = db.books.find(bk => bk.id === borrow.book_id)
  const reader = db.readers.find(r => r.id === borrow.reader_id)

  return {
    ...borrow,
    book_title: book?.title,
    book_barcode: book?.barcode,
    reader_name: reader?.name,
    reader_card_no: reader?.card_no,
  }
}
