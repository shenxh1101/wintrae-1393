import { ipcMain } from 'electron'
import * as booksModule from './modules/books'
import * as readersModule from './modules/readers'
import * as borrowsModule from './modules/borrows'
import * as reservationsModule from './modules/reservations'
import * as inventoryModule from './modules/inventory'
import * as statsModule from './modules/stats'
import * as templatesModule from './modules/templates'
import * as exportModule from './modules/export'

export function setupIpcHandlers() {
  // Books
  ipcMain.handle('books:getList', (_, params) => booksModule.getBooks(params))
  ipcMain.handle('books:getById', (_, id) => booksModule.getBookById(id))
  ipcMain.handle('books:getByBarcode', (_, barcode) => booksModule.getBookByBarcode(barcode))
  ipcMain.handle('books:add', (_, book) => booksModule.addBook(book))
  ipcMain.handle('books:update', (_, id, book) => booksModule.updateBook(id, book))
  ipcMain.handle('books:delete', (_, id) => booksModule.deleteBook(id))
  ipcMain.handle('books:getCategories', () => booksModule.getCategories())

  // Readers
  ipcMain.handle('readers:getList', (_, params) => readersModule.getReaders(params))
  ipcMain.handle('readers:getById', (_, id) => readersModule.getReaderById(id))
  ipcMain.handle('readers:getByCardNo', (_, cardNo) => readersModule.getReaderByCardNo(cardNo))
  ipcMain.handle('readers:add', (_, reader) => readersModule.addReader(reader))
  ipcMain.handle('readers:update', (_, id, reader) => readersModule.updateReader(id, reader))
  ipcMain.handle('readers:delete', (_, id) => readersModule.deleteReader(id))
  ipcMain.handle('readers:getBorrowStats', (_, id) => readersModule.getReaderBorrowStats(id))

  // Borrows
  ipcMain.handle('borrows:borrow', (_, bookId, readerId) => borrowsModule.borrowBook(bookId, readerId))
  ipcMain.handle('borrows:return', (_, borrowId) => borrowsModule.returnBook(borrowId))
  ipcMain.handle('borrows:renew', (_, borrowId) => borrowsModule.renewBook(borrowId))
  ipcMain.handle('borrows:getList', (_, params) => borrowsModule.getBorrows(params))
  ipcMain.handle('borrows:getOverdue', () => borrowsModule.getOverdueBorrows())
  ipcMain.handle('borrows:getById', (_, id) => borrowsModule.getBorrowById(id))

  // Reservations
  ipcMain.handle('reservations:add', (_, bookId, readerId) => reservationsModule.addReservation(bookId, readerId))
  ipcMain.handle('reservations:cancel', (_, id) => reservationsModule.cancelReservation(id))
  ipcMain.handle('reservations:getList', (_, params) => reservationsModule.getReservations(params))
  ipcMain.handle('reservations:getQueue', (_, bookId) => reservationsModule.getBookReservationQueue(bookId))

  // Inventory & Locations & Damages
  ipcMain.handle('locations:getList', () => inventoryModule.getLocations())
  ipcMain.handle('locations:add', (_, name, description) => inventoryModule.addLocation(name, description))

  ipcMain.handle('inventory:create', (_, name, locationId) => inventoryModule.createInventory(name, locationId))
  ipcMain.handle('inventory:getList', (_, params) => inventoryModule.getInventories(params))
  ipcMain.handle('inventory:getById', (_, id) => inventoryModule.getInventoryById(id))
  ipcMain.handle('inventory:getItems', (_, params) => inventoryModule.getInventoryItems(params))
  ipcMain.handle('inventory:checkItem', (_, inventoryId, bookId, status) =>
    inventoryModule.checkInventoryItem(inventoryId, bookId, status)
  )
  ipcMain.handle('inventory:complete', (_, id) => inventoryModule.completeInventory(id))

  ipcMain.handle('damages:report', (_, bookId, damageLevel, description, handler) =>
    inventoryModule.reportDamage(bookId, damageLevel, description, handler)
  )
  ipcMain.handle('damages:getList', (_, params) => inventoryModule.getDamages(params))

  // Stats
  ipcMain.handle('stats:getOverall', () => statsModule.getOverallStats())
  ipcMain.handle('stats:getHotBooks', (_, limit) => statsModule.getHotBooks(limit))
  ipcMain.handle('stats:getMonthly', (_, months) => statsModule.getMonthlyStats(months))
  ipcMain.handle('stats:getOverdueList', (_, params) => statsModule.getOverdueList(params))
  ipcMain.handle('stats:getCategoryStats', () => statsModule.getCategoryStats())
  ipcMain.handle('stats:getLocationStats', () => statsModule.getLocationStats())

  // Templates
  ipcMain.handle('templates:getList', () => templatesModule.getNotificationTemplates())
  ipcMain.handle('templates:getByType', (_, type) => templatesModule.getTemplateByType(type))
  ipcMain.handle('templates:add', (_, template) => templatesModule.addTemplate(template))
  ipcMain.handle('templates:update', (_, id, template) => templatesModule.updateTemplate(id, template))
  ipcMain.handle('templates:delete', (_, id) => templatesModule.deleteTemplate(id))
  ipcMain.handle('templates:render', (_, templateStr, data) => templatesModule.renderTemplate(templateStr, data))

  // Export
  ipcMain.handle('export:books', (_, filePath) => exportModule.exportBooksToExcel(filePath))
  ipcMain.handle('export:readers', (_, filePath) => exportModule.exportReadersToExcel(filePath))
  ipcMain.handle('export:borrows', (_, filePath, status) => exportModule.exportBorrowsToExcel(filePath, status))
  ipcMain.handle('export:inventory', (_, inventoryId, filePath) =>
    exportModule.exportInventoryToExcel(inventoryId, filePath)
  )
  ipcMain.handle('export:stats', (_, filePath) => exportModule.exportStatsToExcel(filePath))
}

export default setupIpcHandlers
