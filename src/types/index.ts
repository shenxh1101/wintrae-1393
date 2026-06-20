export interface Book {
  id: number
  isbn?: string
  barcode?: string
  title: string
  author?: string
  publisher?: string
  publish_date?: string
  category?: string
  location_id?: number
  location_name?: string
  shelf?: string
  status: string
  description?: string
  cover_image?: string
  total_copies: number
  available_copies: number
  created_at: string
  updated_at: string
}

export interface Reader {
  id: number
  card_no: string
  name: string
  gender?: string
  phone?: string
  email?: string
  address?: string
  id_card?: string
  type: string
  max_borrow: number
  borrow_days: number
  status: string
  register_date: string
  expire_date?: string
  photo?: string
  notes?: string
}

export interface Borrow {
  id: number
  book_id: number
  reader_id: number
  borrow_date: string
  due_date: string
  return_date?: string
  renew_count: number
  status: string
  fine_amount: number
  fine_paid: number
  notes?: string
  book_title?: string
  book_barcode?: string
  reader_name?: string
  reader_card_no?: string
  reader_phone?: string
  overdue_days?: number
}

export interface Reservation {
  id: number
  book_id: number
  reader_id: number
  reserve_date: string
  expire_date?: string
  status: string
  queue_position?: number
  notify_date?: string
  notes?: string
  book_title?: string
  book_barcode?: string
  reader_name?: string
  reader_card_no?: string
  reader_phone?: string
}

export interface Location {
  id: number
  name: string
  description?: string
  created_at: string
}

export interface Inventory {
  id: number
  inventory_no: string
  name: string
  location_id?: number
  location_name?: string
  start_date: string
  end_date?: string
  status: string
  total_books: number
  checked_books: number
  missing_books: number
  damaged_books: number
  notes?: string
}

export interface InventoryItem {
  id: number
  inventory_id: number
  book_id: number
  status: string
  check_date?: string
  notes?: string
  book_title?: string
  book_barcode?: string
  book_author?: string
}

export interface Damage {
  id: number
  book_id: number
  report_date: string
  damage_level?: string
  description?: string
  handler?: string
  status: string
  repair_cost: number
  notes?: string
  book_title?: string
  book_barcode?: string
}

export interface NotificationTemplate {
  id: number
  name: string
  type: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface OverallStats {
  total_books: number
  total_readers: number
  borrowed_books: number
  overdue_books: number
  available_books: number
  total_reservations: number
}

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

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
}

export interface PaginatedResponse<T> {
  list: T[]
  total: number
}
