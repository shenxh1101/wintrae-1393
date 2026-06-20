import { loadDb, saveDb, getNextId, paginate, getLocationName } from '../db'
import type { Book } from '../db'

export interface BookWithLocation extends Book {
  location_name?: string
}

export function getBooks(params: {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
  location_id?: number
  category?: string
}): { list: BookWithLocation[]; total: number } {
  const db = loadDb()
  const page = params.page || 1
  const pageSize = params.pageSize || 20

  let filtered = db.books as BookWithLocation[]

  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    filtered = filtered.filter(b =>
      b.title.toLowerCase().includes(kw) ||
      (b.author && b.author.toLowerCase().includes(kw)) ||
      (b.isbn && b.isbn.toLowerCase().includes(kw)) ||
      (b.barcode && b.barcode.toLowerCase().includes(kw))
    )
  }
  if (params.status) {
    filtered = filtered.filter(b => b.status === params.status)
  }
  if (params.location_id) {
    filtered = filtered.filter(b => b.location_id === params.location_id)
  }
  if (params.category) {
    filtered = filtered.filter(b => b.category === params.category)
  }

  filtered = filtered.map(b => ({
    ...b,
    location_name: getLocationName(b.location_id),
  }))

  filtered.sort((a, b) => b.id - a.id)

  return paginate(filtered, page, pageSize)
}

export function getBookById(id: number): BookWithLocation | undefined {
  const db = loadDb()
  const book = db.books.find(b => b.id === id)
  if (!book) return undefined
  return { ...book, location_name: getLocationName(book.location_id) }
}

export function getBookByBarcode(barcode: string): BookWithLocation | undefined {
  const db = loadDb()
  const book = db.books.find(b => b.barcode === barcode)
  if (!book) return undefined
  return { ...book, location_name: getLocationName(book.location_id) }
}

export function addBook(book: Omit<Book, 'id' | 'created_at' | 'updated_at'>): number {
  const db = loadDb()
  const now = new Date().toISOString()
  const id = getNextId('books')

  const newBook: Book = {
    id,
    isbn: book.isbn || '',
    barcode: book.barcode || '',
    title: book.title,
    author: book.author || '',
    publisher: book.publisher || '',
    publish_date: book.publish_date || '',
    category: book.category || '',
    location_id: book.location_id,
    shelf: book.shelf || '',
    status: book.status || 'available',
    description: book.description || '',
    total_copies: book.total_copies || 1,
    available_copies: book.available_copies || book.total_copies || 1,
    created_at: now,
    updated_at: now,
  }

  db.books.push(newBook)
  saveDb()
  return id
}

export function updateBook(id: number, book: Partial<Book>): void {
  const db = loadDb()
  const index = db.books.findIndex(b => b.id === id)
  if (index === -1) return

  db.books[index] = {
    ...db.books[index],
    ...book,
    id,
    updated_at: new Date().toISOString(),
  }
  saveDb()
}

export function deleteBook(id: number): void {
  const db = loadDb()
  const index = db.books.findIndex(b => b.id === id)
  if (index !== -1) {
    db.books.splice(index, 1)
    saveDb()
  }
}

export function getCategories(): string[] {
  const db = loadDb()
  const categories = new Set<string>()
  for (const book of db.books) {
    if (book.category && book.category.trim() !== '') {
      categories.add(book.category)
    }
  }
  return Array.from(categories).sort()
}
