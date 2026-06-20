import { loadDb } from '../db'
import dayjs from 'dayjs'

export interface HotBook {
  book_id: number
  title: string
  author?: string
  borrow_count: number
}

export interface MonthlyStats {
  month: string
  borrow_count: number
  return_count: number
  new_readers: number
}

export interface OverallStats {
  total_books: number
  total_readers: number
  borrowed_books: number
  overdue_books: number
  available_books: number
  total_reservations: number
}

export function getOverallStats(): OverallStats {
  const db = loadDb()
  const today = new Date().toISOString().split('T')[0]

  const totalBooks = db.books.length
  const totalReaders = db.readers.length
  const borrowedBooks = db.borrows.filter(b => b.status === 'borrowed').length
  const overdueBooks = db.borrows.filter(b => b.status === 'borrowed' && b.due_date < today).length
  const availableBooks = db.books.reduce((sum, b) => sum + b.available_copies, 0)
  const totalReservations = db.reservations.filter(r => r.status === 'waiting').length

  return {
    total_books: totalBooks,
    total_readers: totalReaders,
    borrowed_books: borrowedBooks,
    overdue_books: overdueBooks,
    available_books: availableBooks,
    total_reservations: totalReservations,
  }
}

export function getHotBooks(limit: number = 10): HotBook[] {
  const db = loadDb()

  const borrowCounts: Record<number, number> = {}
  for (const borrow of db.borrows) {
    borrowCounts[borrow.book_id] = (borrowCounts[borrow.book_id] || 0) + 1
  }

  const hotBooks: HotBook[] = Object.entries(borrowCounts)
    .map(([bookId, count]) => {
      const book = db.books.find(b => b.id === Number(bookId))
      return {
        book_id: Number(bookId),
        title: book?.title || '',
        author: book?.author,
        borrow_count: count,
      }
    })
    .sort((a, b) => b.borrow_count - a.borrow_count)
    .slice(0, limit)

  return hotBooks
}

export function getMonthlyStats(months: number = 12): MonthlyStats[] {
  const db = loadDb()
  const result: MonthlyStats[] = []

  for (let i = months - 1; i >= 0; i--) {
    const month = dayjs().subtract(i, 'month').format('YYYY-MM')
    const startDate = `${month}-01`
    const endDate = dayjs(startDate).endOf('month').format('YYYY-MM-DD')

    const borrowCount = db.borrows.filter(b => {
      const borrowDate = b.borrow_date.split('T')[0]
      return borrowDate >= startDate && borrowDate <= endDate
    }).length

    const returnCount = db.borrows.filter(b => {
      if (b.status !== 'returned' || !b.return_date) return false
      return b.return_date >= startDate && b.return_date <= endDate
    }).length

    const newReaders = db.readers.filter(r => {
      const regDate = r.register_date.split('T')[0]
      return regDate >= startDate && regDate <= endDate
    }).length

    result.push({
      month,
      borrow_count: borrowCount,
      return_count: returnCount,
      new_readers: newReaders,
    })
  }

  return result
}

export function getOverdueList(params: {
  page?: number
  pageSize?: number
}): { list: any[]; total: number } {
  const db = loadDb()
  const page = params.page || 1
  const pageSize = params.pageSize || 20
  const today = new Date().toISOString().split('T')[0]

  const overdue = db.borrows
    .filter(b => b.status === 'borrowed' && b.due_date < today)
    .map(b => {
      const reader = db.readers.find(r => r.id === b.reader_id)
      const book = db.books.find(bk => bk.id === b.book_id)
      const overdueDays = Math.floor((new Date(today).getTime() - new Date(b.due_date).getTime()) / (1000 * 60 * 60 * 24))
      return {
        ...b,
        reader_name: reader?.name,
        reader_card_no: reader?.card_no,
        reader_phone: reader?.phone,
        book_title: book?.title,
        book_barcode: book?.barcode,
        overdue_days: overdueDays,
      }
    })
    .sort((a, b) => a.due_date.localeCompare(b.due_date))

  const total = overdue.length
  const start = (page - 1) * pageSize
  const list = overdue.slice(start, start + pageSize)

  return { list, total }
}

export function getCategoryStats(): { category: string; count: number }[] {
  const db = loadDb()
  const categoryMap: Record<string, number> = {}

  for (const book of db.books) {
    const cat = book.category && book.category.trim() !== '' ? book.category : '未分类'
    categoryMap[cat] = (categoryMap[cat] || 0) + 1
  }

  return Object.entries(categoryMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
}

export function getLocationStats(): { location: string; count: number }[] {
  const db = loadDb()
  const locationMap: Record<string, number> = {}

  for (const book of db.books) {
    let locName = '未分配'
    if (book.location_id) {
      const loc = db.locations.find(l => l.id === book.location_id)
      if (loc) locName = loc.name
    }
    locationMap[locName] = (locationMap[locName] || 0) + 1
  }

  return Object.entries(locationMap)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
}
