import { contextBridge, ipcRenderer } from 'electron'

const api = {
  books: {
    getList: (params: any) => ipcRenderer.invoke('books:getList', params),
    getById: (id: number) => ipcRenderer.invoke('books:getById', id),
    getByBarcode: (barcode: string) => ipcRenderer.invoke('books:getByBarcode', barcode),
    add: (book: any) => ipcRenderer.invoke('books:add', book),
    update: (id: number, book: any) => ipcRenderer.invoke('books:update', id, book),
    delete: (id: number) => ipcRenderer.invoke('books:delete', id),
    getCategories: () => ipcRenderer.invoke('books:getCategories')
  },
  readers: {
    getList: (params: any) => ipcRenderer.invoke('readers:getList', params),
    getById: (id: number) => ipcRenderer.invoke('readers:getById', id),
    getByCardNo: (cardNo: string) => ipcRenderer.invoke('readers:getByCardNo', cardNo),
    add: (reader: any) => ipcRenderer.invoke('readers:add', reader),
    update: (id: number, reader: any) => ipcRenderer.invoke('readers:update', id, reader),
    delete: (id: number) => ipcRenderer.invoke('readers:delete', id),
    getBorrowStats: (id: number) => ipcRenderer.invoke('readers:getBorrowStats', id)
  },
  borrows: {
    borrow: (bookId: number, readerId: number) => ipcRenderer.invoke('borrows:borrow', bookId, readerId),
    return: (borrowId: number) => ipcRenderer.invoke('borrows:return', borrowId),
    renew: (borrowId: number) => ipcRenderer.invoke('borrows:renew', borrowId),
    getList: (params: any) => ipcRenderer.invoke('borrows:getList', params),
    getOverdue: () => ipcRenderer.invoke('borrows:getOverdue'),
    getById: (id: number) => ipcRenderer.invoke('borrows:getById', id)
  },
  reservations: {
    add: (bookId: number, readerId: number) => ipcRenderer.invoke('reservations:add', bookId, readerId),
    cancel: (id: number) => ipcRenderer.invoke('reservations:cancel', id),
    getList: (params: any) => ipcRenderer.invoke('reservations:getList', params),
    getQueue: (bookId: number) => ipcRenderer.invoke('reservations:getQueue', bookId)
  },
  locations: {
    getList: () => ipcRenderer.invoke('locations:getList'),
    add: (name: string, description?: string) => ipcRenderer.invoke('locations:add', name, description)
  },
  inventory: {
    create: (name: string, locationId?: number) => ipcRenderer.invoke('inventory:create', name, locationId),
    getList: (params: any) => ipcRenderer.invoke('inventory:getList', params),
    getById: (id: number) => ipcRenderer.invoke('inventory:getById', id),
    getItems: (params: any) => ipcRenderer.invoke('inventory:getItems', params),
    checkItem: (inventoryId: number, bookId: number, status: string) =>
      ipcRenderer.invoke('inventory:checkItem', inventoryId, bookId, status),
    complete: (id: number) => ipcRenderer.invoke('inventory:complete', id)
  },
  damages: {
    report: (bookId: number, damageLevel: string, description: string, handler?: string) =>
      ipcRenderer.invoke('damages:report', bookId, damageLevel, description, handler),
    getList: (params: any) => ipcRenderer.invoke('damages:getList', params)
  },
  stats: {
    getOverall: () => ipcRenderer.invoke('stats:getOverall'),
    getHotBooks: (limit?: number) => ipcRenderer.invoke('stats:getHotBooks', limit),
    getMonthly: (months?: number) => ipcRenderer.invoke('stats:getMonthly', months),
    getOverdueList: (params: any) => ipcRenderer.invoke('stats:getOverdueList', params),
    getCategoryStats: () => ipcRenderer.invoke('stats:getCategoryStats'),
    getLocationStats: () => ipcRenderer.invoke('stats:getLocationStats')
  },
  templates: {
    getList: () => ipcRenderer.invoke('templates:getList'),
    getByType: (type: string) => ipcRenderer.invoke('templates:getByType', type),
    add: (template: any) => ipcRenderer.invoke('templates:add', template),
    update: (id: number, template: any) => ipcRenderer.invoke('templates:update', id, template),
    delete: (id: number) => ipcRenderer.invoke('templates:delete', id),
    render: (templateStr: string, data: Record<string, string>) =>
      ipcRenderer.invoke('templates:render', templateStr, data)
  },
  export: {
    books: (filePath: string) => ipcRenderer.invoke('export:books', filePath),
    readers: (filePath: string) => ipcRenderer.invoke('export:readers', filePath),
    borrows: (filePath: string, status?: string) => ipcRenderer.invoke('export:borrows', filePath, status),
    inventory: (inventoryId: number, filePath: string) =>
      ipcRenderer.invoke('export:inventory', inventoryId, filePath),
    stats: (filePath: string) => ipcRenderer.invoke('export:stats', filePath)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
