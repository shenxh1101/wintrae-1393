import { loadDb, saveDb, getNextId, paginate } from '../db'
import type { Reservation } from '../db'
import dayjs from 'dayjs'

export interface ReservationWithDetails extends Reservation {
  book_title?: string
  book_barcode?: string
  reader_name?: string
  reader_card_no?: string
  reader_phone?: string
}

export function addReservation(bookId: number, readerId: number): { success: boolean; message: string; reservationId?: number } {
  const db = loadDb()

  const book = db.books.find(b => b.id === bookId)
  if (!book) {
    return { success: false, message: '图书不存在' }
  }

  const reader = db.readers.find(r => r.id === readerId)
  if (!reader) {
    return { success: false, message: '读者不存在' }
  }
  if (reader.status !== 'active') {
    return { success: false, message: '读者证已失效' }
  }

  const existing = db.reservations.find(r => r.book_id === bookId && r.reader_id === readerId && r.status === 'waiting')
  if (existing) {
    return { success: false, message: '您已预约过此书' }
  }

  const borrow = db.borrows.find(b => b.book_id === bookId && b.reader_id === readerId && b.status === 'borrowed')
  if (borrow) {
    return { success: false, message: '您已借阅此书，无需预约' }
  }

  const queueCount = db.reservations.filter(r => r.book_id === bookId && r.status === 'waiting').length
  const expireDate = dayjs().add(7, 'day').format('YYYY-MM-DD')

  const id = getNextId('reservations')
  const now = new Date().toISOString()

  const newReservation: Reservation = {
    id,
    book_id: bookId,
    reader_id: readerId,
    reserve_date: now,
    expire_date: expireDate,
    status: 'waiting',
    queue_position: queueCount + 1,
  }

  db.reservations.push(newReservation)
  saveDb()

  return {
    success: true,
    message: `预约成功，当前排队第 ${queueCount + 1} 位`,
    reservationId: id,
  }
}

export function cancelReservation(reservationId: number): { success: boolean; message: string } {
  const db = loadDb()

  const reservation = db.reservations.find(r => r.id === reservationId)
  if (!reservation) {
    return { success: false, message: '预约记录不存在' }
  }
  if (reservation.status !== 'waiting') {
    return { success: false, message: '当前状态不可取消' }
  }

  reservation.status = 'cancelled'

  const waitingList = db.reservations
    .filter(r => r.book_id === reservation.book_id && r.status === 'waiting' && r.id > reservationId)
    .sort((a, b) => (a.queue_position || 0) - (b.queue_position || 0))

  for (const item of waitingList) {
    item.queue_position = (item.queue_position || 1) - 1
  }

  saveDb()

  return { success: true, message: '预约已取消' }
}

export function getReservations(params: {
  page?: number
  pageSize?: number
  status?: string
  book_id?: number
  reader_id?: number
}): { list: ReservationWithDetails[]; total: number } {
  const db = loadDb()
  const page = params.page || 1
  const pageSize = params.pageSize || 20

  let filtered = [...db.reservations] as ReservationWithDetails[]

  if (params.status) {
    filtered = filtered.filter(r => r.status === params.status)
  }
  if (params.book_id) {
    filtered = filtered.filter(r => r.book_id === params.book_id)
  }
  if (params.reader_id) {
    filtered = filtered.filter(r => r.reader_id === params.reader_id)
  }

  filtered = filtered.map(r => {
    const book = db.books.find(bk => bk.id === r.book_id)
    const reader = db.readers.find(rd => rd.id === r.reader_id)
    return {
      ...r,
      book_title: book?.title,
      book_barcode: book?.barcode,
      reader_name: reader?.name,
      reader_card_no: reader?.card_no,
    }
  })

  filtered.sort((a, b) => b.reserve_date.localeCompare(a.reserve_date))

  return paginate(filtered, page, pageSize)
}

export function getBookReservationQueue(bookId: number): ReservationWithDetails[] {
  const db = loadDb()

  const queue = db.reservations
    .filter(r => r.book_id === bookId && r.status === 'waiting')
    .sort((a, b) => (a.queue_position || 0) - (b.queue_position || 0)) as ReservationWithDetails[]

  return queue.map(r => {
    const reader = db.readers.find(rd => rd.id === r.reader_id)
    return {
      ...r,
      reader_name: reader?.name,
      reader_card_no: reader?.card_no,
      reader_phone: reader?.phone,
    }
  })
}
