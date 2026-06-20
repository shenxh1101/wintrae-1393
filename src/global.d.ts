/// <reference types="vite/client" />

interface Window {
  api: {
    books: {
      getList: (params: any) => Promise<any>
      getById: (id: number) => Promise<any>
      getByBarcode: (barcode: string) => Promise<any>
      add: (book: any) => Promise<any>
      update: (id: number, book: any) => Promise<void>
      delete: (id: number) => Promise<void>
      getCategories: () => Promise<string[]>
    }
    readers: {
      getList: (params: any) => Promise<any>
      getById: (id: number) => Promise<any>
      getByCardNo: (cardNo: string) => Promise<any>
      add: (reader: any) => Promise<any>
      update: (id: number, reader: any) => Promise<void>
      delete: (id: number) => Promise<void>
      getBorrowStats: (id: number) => Promise<any>
    }
    borrows: {
      borrow: (bookId: number, readerId: number) => Promise<any>
      return: (borrowId: number) => Promise<any>
      renew: (borrowId: number) => Promise<any>
      getList: (params: any) => Promise<any>
      getOverdue: () => Promise<any[]>
      getById: (id: number) => Promise<any>
    }
    reservations: {
      add: (bookId: number, readerId: number) => Promise<any>
      cancel: (id: number) => Promise<any>
      getList: (params: any) => Promise<any>
      getQueue: (bookId: number) => Promise<any[]>
    }
    locations: {
      getList: () => Promise<any[]>
      add: (name: string, description?: string) => Promise<number>
    }
    inventory: {
      create: (name: string, locationId?: number) => Promise<any>
      getList: (params: any) => Promise<any>
      getById: (id: number) => Promise<any>
      getItems: (params: any) => Promise<any>
      checkItem: (inventoryId: number, bookId: number, status: string) => Promise<any>
      complete: (id: number) => Promise<any>
    }
    damages: {
      report: (bookId: number, damageLevel: string, description: string, handler?: string) => Promise<any>
      getList: (params: any) => Promise<any>
    }
    stats: {
      getOverall: () => Promise<any>
      getHotBooks: (limit?: number) => Promise<any[]>
      getMonthly: (months?: number) => Promise<any[]>
      getOverdueList: (params: any) => Promise<any>
      getCategoryStats: () => Promise<any[]>
      getLocationStats: () => Promise<any[]>
    }
    templates: {
      getList: () => Promise<any[]>
      getByType: (type: string) => Promise<any>
      add: (template: any) => Promise<number>
      update: (id: number, template: any) => Promise<void>
      delete: (id: number) => Promise<void>
      render: (templateStr: string, data: Record<string, string>) => Promise<string>
    }
    export: {
      books: (filePath: string) => Promise<any>
      readers: (filePath: string) => Promise<any>
      borrows: (filePath: string, status?: string) => Promise<any>
      inventory: (inventoryId: number, filePath: string) => Promise<any>
      stats: (filePath: string) => Promise<any>
    }
  }
}
