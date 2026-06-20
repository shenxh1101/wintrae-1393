import { loadDb, getLocationName } from '../db'
import * as XLSX from 'xlsx'

export function exportBooksToExcel(filePath: string): { success: boolean; message: string } {
  const db = loadDb()
  const books = db.books
    .sort((a, b) => a.id - b.id)
    .map(b => ({
      id: b.id,
      isbn: b.isbn,
      barcode: b.barcode,
      title: b.title,
      author: b.author,
      publisher: b.publisher,
      publish_date: b.publish_date,
      category: b.category,
      location: getLocationName(b.location_id),
      shelf: b.shelf,
      status: b.status,
      total_copies: b.total_copies,
      available_copies: b.available_copies,
      created_at: b.created_at,
    }))

  const worksheet = XLSX.utils.json_to_sheet(books)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '图书列表')

  XLSX.writeFile(workbook, filePath)

  return { success: true, message: '导出成功' }
}

export function exportReadersToExcel(filePath: string): { success: boolean; message: string } {
  const db = loadDb()
  const readers = db.readers
    .sort((a, b) => a.id - b.id)
    .map(r => ({
      id: r.id,
      card_no: r.card_no,
      name: r.name,
      gender: r.gender,
      phone: r.phone,
      email: r.email,
      address: r.address,
      type: r.type,
      max_borrow: r.max_borrow,
      borrow_days: r.borrow_days,
      status: r.status,
      register_date: r.register_date,
      expire_date: r.expire_date,
    }))

  const worksheet = XLSX.utils.json_to_sheet(readers)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '读者列表')

  XLSX.writeFile(workbook, filePath)

  return { success: true, message: '导出成功' }
}

export function exportBorrowsToExcel(filePath: string, status?: string): { success: boolean; message: string } {
  const db = loadDb()
  let borrows = [...db.borrows]

  if (status) {
    borrows = borrows.filter(b => b.status === status)
  }

  const borrowList = borrows
    .sort((a, b) => b.id - a.id)
    .map(br => {
      const book = db.books.find(bk => bk.id === br.book_id)
      const reader = db.readers.find(r => r.id === br.reader_id)
      return {
        id: br.id,
        book_title: book?.title,
        book_barcode: book?.barcode,
        reader_name: reader?.name,
        reader_card_no: reader?.card_no,
        borrow_date: br.borrow_date,
        due_date: br.due_date,
        return_date: br.return_date,
        renew_count: br.renew_count,
        status: br.status,
        fine_amount: br.fine_amount,
      }
    })

  const worksheet = XLSX.utils.json_to_sheet(borrowList)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '借阅记录')

  XLSX.writeFile(workbook, filePath)

  return { success: true, message: '导出成功' }
}

export function exportInventoryToExcel(inventoryId: number, filePath: string): { success: boolean; message: string } {
  const db = loadDb()

  const inventory = db.inventories.find(i => i.id === inventoryId)
  if (!inventory) {
    return { success: false, message: '盘点任务不存在' }
  }

  const items = db.inventory_items
    .filter(ii => ii.inventory_id === inventoryId)
    .sort((a, b) => a.id - b.id)
    .map(ii => {
      const book = db.books.find(b => b.id === ii.book_id)
      return {
        id: ii.id,
        barcode: book?.barcode,
        title: book?.title,
        author: book?.author,
        status: ii.status,
        check_date: ii.check_date,
        notes: ii.notes,
      }
    })

  const workbook = XLSX.utils.book_new()

  const infoSheet = XLSX.utils.json_to_sheet([
    {
      '盘点单号': inventory.inventory_no,
      '盘点名称': inventory.name,
      '开始日期': inventory.start_date,
      '状态': inventory.status,
      '总册数': inventory.total_books,
      '已盘': inventory.checked_books,
      '缺失': inventory.missing_books,
      '损坏': inventory.damaged_books,
    }
  ])
  XLSX.utils.book_append_sheet(workbook, infoSheet, '盘点信息')

  const itemsSheet = XLSX.utils.json_to_sheet(items)
  XLSX.utils.book_append_sheet(workbook, itemsSheet, '盘点明细')

  XLSX.writeFile(workbook, filePath)

  return { success: true, message: '导出成功' }
}

export function exportStatsToExcel(filePath: string): { success: boolean; message: string } {
  const db = loadDb()
  const workbook = XLSX.utils.book_new()

  const overall = {
    '图书总数': db.books.length,
    '可借册数': db.books.reduce((sum, b) => sum + b.available_copies, 0),
    '读者总数': db.readers.length,
    '当前借出数': db.borrows.filter(b => b.status === 'borrowed').length,
    '逾期数': db.borrows.filter(b => b.status === 'borrowed' && b.due_date < new Date().toISOString().split('T')[0]).length,
  }

  const overallSheet = XLSX.utils.json_to_sheet([overall])
  XLSX.utils.book_append_sheet(workbook, overallSheet, '总体统计')

  const borrowCounts: Record<number, number> = {}
  for (const borrow of db.borrows) {
    borrowCounts[borrow.book_id] = (borrowCounts[borrow.book_id] || 0) + 1
  }

  const hotBooks = Object.entries(borrowCounts)
    .map(([bookId, count]) => {
      const book = db.books.find(b => b.id === Number(bookId))
      return {
        '书名': book?.title || '',
        '作者': book?.author || '',
        '借阅次数': count,
      }
    })
    .sort((a, b) => b['借阅次数'] - a['借阅次数'])
    .slice(0, 20)

  const hotSheet = XLSX.utils.json_to_sheet(hotBooks)
  XLSX.utils.book_append_sheet(workbook, hotSheet, '热门图书')

  XLSX.writeFile(workbook, filePath)

  return { success: true, message: '导出成功' }
}
