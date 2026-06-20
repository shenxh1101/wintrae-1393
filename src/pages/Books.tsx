import { useState, useEffect, useRef } from 'react'
import { Book, Location } from '../types'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import Button from '../components/Button'
import Input from '../components/Input'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import './Books.css'

declare global {
  interface Window {
    api: any
  }
}

function Books() {
  const [books, setBooks] = useState<Book[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [locations, setLocations] = useState<Location[]>([])
  const [categories, setCategories] = useState<string[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [scanning, setScanning] = useState(false)
  const scanInputRef = useRef<HTMLInputElement>(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

  const [reservations, setReservations] = useState<any[]>([])

  useEffect(() => {
    loadLocations()
    loadCategories()
  }, [])

  useEffect(() => {
    loadBooks()
  }, [page, keyword, statusFilter, locationFilter])

  const loadLocations = async () => {
    const data = await window.api.locations.getList()
    setLocations(data)
  }

  const loadCategories = async () => {
    const data = await window.api.books.getCategories()
    setCategories(data)
  }

  const loadBooks = async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize }
      if (keyword) params.keyword = keyword
      if (statusFilter) params.status = statusFilter
      if (locationFilter) params.location_id = Number(locationFilter)

      const result = await window.api.books.getList(params)
      setBooks(result.list)
      setTotal(result.total)
    } catch (error) {
      console.error('加载图书失败:', error)
    }
    setLoading(false)
  }

  const handleSearch = () => {
    setPage(1)
    loadBooks()
  }

  const handleAdd = () => {
    setEditingBook(null)
    setFormData({
      title: '',
      author: '',
      isbn: '',
      barcode: '',
      publisher: '',
      publish_date: '',
      category: '',
      location_id: '',
      shelf: '',
      total_copies: 1,
      available_copies: 1,
      description: '',
      status: 'available',
    })
    setModalOpen(true)
  }

  const handleEdit = (book: Book) => {
    setEditingBook(book)
    setFormData({ ...book })
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这本书吗？')) return
    try {
      await window.api.books.delete(id)
      loadBooks()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleSave = async () => {
    if (!formData.title) {
      alert('请输入书名')
      return
    }

    try {
      if (editingBook) {
        await window.api.books.update(editingBook.id, formData)
      } else {
        await window.api.books.add(formData)
      }
      setModalOpen(false)
      loadBooks()
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败')
    }
  }

  const handleScan = () => {
    setScanning(true)
    setTimeout(() => {
      scanInputRef.current?.focus()
    }, 100)
  }

  const handleScanInput = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const barcode = (e.target as HTMLInputElement).value.trim()
      if (!barcode) return

      try {
        const book = await window.api.books.getByBarcode(barcode)
        if (book) {
          setSelectedBook(book)
          loadReservations(book.id)
          setDetailOpen(true)
        } else {
          if (confirm(`未找到条码为 ${barcode} 的图书，是否添加新书？`)) {
            handleAdd()
            setFormData((prev: any) => ({ ...prev, barcode }))
          }
        }
      } catch (error) {
        console.error('扫码查询失败:', error)
      }

      ;(e.target as HTMLInputElement).value = ''
      setScanning(false)
    }
  }

  const loadReservations = async (bookId: number) => {
    try {
      const result = await window.api.reservations.getQueue(bookId)
      setReservations(result)
    } catch (error) {
      console.error('加载预约队列失败:', error)
    }
  }

  const handleViewDetail = (book: Book) => {
    setSelectedBook(book)
    loadReservations(book.id)
    setDetailOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      available: { label: '可借', variant: 'success' },
      borrowed: { label: '借出', variant: 'warning' },
      reserved: { label: '已预约', variant: 'primary' },
      missing: { label: '遗失', variant: 'danger' },
      damaged: { label: '损坏', variant: 'danger' },
    }
    const info = statusMap[status] || { label: status, variant: 'default' }
    return <Badge variant={info.variant}>{info.label}</Badge>
  }

  const columns = [
    {
      key: 'barcode',
      title: '条码',
      width: 100,
    },
    {
      key: 'title',
      title: '书名',
      render: (record: Book) => (
        <span className="book-title-cell" onClick={() => handleViewDetail(record)}>
          {record.title}
        </span>
      ),
    },
    {
      key: 'author',
      title: '作者',
      width: 120,
    },
    {
      key: 'category',
      title: '分类',
      width: 100,
    },
    {
      key: 'location_name',
      title: '馆藏地',
      width: 100,
    },
    {
      key: 'shelf',
      title: '书架号',
      width: 80,
    },
    {
      key: 'total_copies',
      title: '总藏量',
      width: 80,
      align: 'center' as const,
    },
    {
      key: 'available_copies',
      title: '可借',
      width: 80,
      align: 'center' as const,
      render: (record: Book) => (
        <span style={{ color: record.available_copies > 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
          {record.available_copies}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: 80,
      render: (record: Book) => getStatusBadge(record.status),
    },
    {
      key: 'action',
      title: '操作',
      width: 160,
      render: (record: Book) => (
        <div className="action-buttons">
          <Button size="small" variant="ghost" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button size="small" variant="ghost" onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="books-page">
      <div className="page-toolbar">
        <div className="toolbar-left">
          <Input
            placeholder="搜索书名、作者、ISBN、条码"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{ width: 300 }}
            prefix="🔍"
          />
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">全部状态</option>
            <option value="available">可借</option>
            <option value="borrowed">借出</option>
            <option value="missing">遗失</option>
            <option value="damaged">损坏</option>
          </select>
          <select
            className="form-select"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="">全部区域</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
          <Button variant="primary" onClick={handleSearch}>
            搜索
          </Button>
        </div>
        <div className="toolbar-right">
          <Button variant="secondary" onClick={handleScan} icon="📷">
            扫码录入
          </Button>
          <Button variant="primary" onClick={handleAdd} icon="+">
            添加图书
          </Button>
        </div>
      </div>

      {scanning && (
        <div className="scan-input-bar">
          <span className="scan-icon">📷</span>
          <input
            ref={scanInputRef}
            className="scan-input"
            placeholder="请扫描或输入图书条码，按回车确认"
            onKeyDown={handleScanInput}
            onBlur={() => setTimeout(() => setScanning(false), 200)}
            autoFocus
          />
          <Button size="small" variant="ghost" onClick={() => setScanning(false)}>
            取消
          </Button>
        </div>
      )}

      <DataTable columns={columns} data={books} loading={loading} rowKey="id" />

      <Pagination current={page} total={total} pageSize={pageSize} onChange={setPage} />

      <Modal
        open={modalOpen}
        title={editingBook ? '编辑图书' : '添加图书'}
        onClose={() => setModalOpen(false)}
        onOk={handleSave}
        width={680}
      >
        <div className="book-form">
          <div className="form-row">
            <div className="form-item">
              <label>书名 *</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="form-input"
                placeholder="请输入书名"
              />
            </div>
            <div className="form-item">
              <label>作者</label>
              <input
                type="text"
                value={formData.author || ''}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="form-input"
                placeholder="请输入作者"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-item">
              <label>ISBN</label>
              <input
                type="text"
                value={formData.isbn || ''}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                className="form-input"
                placeholder="请输入ISBN"
              />
            </div>
            <div className="form-item">
              <label>条码</label>
              <input
                type="text"
                value={formData.barcode || ''}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="form-input"
                placeholder="请输入条码"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-item">
              <label>出版社</label>
              <input
                type="text"
                value={formData.publisher || ''}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                className="form-input"
                placeholder="请输入出版社"
              />
            </div>
            <div className="form-item">
              <label>出版日期</label>
              <input
                type="date"
                value={formData.publish_date || ''}
                onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                className="form-input"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-item">
              <label>分类</label>
              <input
                type="text"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="form-input"
                placeholder="请输入分类"
                list="category-list"
              />
              <datalist id="category-list">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <div className="form-item">
              <label>馆藏地</label>
              <select
                value={formData.location_id || ''}
                onChange={(e) =>
                  setFormData({ ...formData, location_id: e.target.value ? Number(e.target.value) : null })
                }
                className="form-input"
              >
                <option value="">请选择</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-item">
              <label>书架号</label>
              <input
                type="text"
                value={formData.shelf || ''}
                onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
                className="form-input"
                placeholder="如：A-01"
              />
            </div>
            <div className="form-item">
              <label>状态</label>
              <select
                value={formData.status || 'available'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-input"
              >
                <option value="available">可借</option>
                <option value="borrowed">借出</option>
                <option value="missing">遗失</option>
                <option value="damaged">损坏</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-item">
              <label>总藏量</label>
              <input
                type="number"
                min="1"
                value={formData.total_copies || 1}
                onChange={(e) => {
                  const total = Number(e.target.value)
                  setFormData({
                    ...formData,
                    total_copies: total,
                    available_copies: Math.min(formData.available_copies || 1, total),
                  })
                }}
                className="form-input"
              />
            </div>
            <div className="form-item">
              <label>可借册数</label>
              <input
                type="number"
                min="0"
                value={formData.available_copies || 0}
                onChange={(e) =>
                  setFormData({ ...formData, available_copies: Number(e.target.value) })
                }
                className="form-input"
              />
            </div>
          </div>
          <div className="form-item">
            <label>简介</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-textarea"
              rows={3}
              placeholder="请输入图书简介"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={detailOpen}
        title="图书详情"
        onClose={() => setDetailOpen(false)}
        width={720}
        footer={null}
      >
        {selectedBook && (
          <div className="book-detail">
            <div className="detail-header">
              <div className="book-cover">
                <span className="cover-placeholder">📖</span>
              </div>
              <div className="book-info">
                <h2 className="book-title">{selectedBook.title}</h2>
                <p className="book-author">作者：{selectedBook.author || '未知'}</p>
                <div className="book-status-row">
                  {getStatusBadge(selectedBook.status)}
                  <span className="stock-info">
                    总藏 {selectedBook.total_copies} 册 / 可借 {selectedBook.available_copies} 册
                  </span>
                </div>
              </div>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">条码：</span>
                <span className="detail-value">{selectedBook.barcode || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">ISBN：</span>
                <span className="detail-value">{selectedBook.isbn || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">出版社：</span>
                <span className="detail-value">{selectedBook.publisher || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">出版日期：</span>
                <span className="detail-value">{selectedBook.publish_date || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">分类：</span>
                <span className="detail-value">{selectedBook.category || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">馆藏地：</span>
                <span className="detail-value">{selectedBook.location_name || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">书架：</span>
                <span className="detail-value">{selectedBook.shelf || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">录入时间：</span>
                <span className="detail-value">{selectedBook.created_at}</span>
              </div>
            </div>
            {selectedBook.description && (
              <div className="detail-section">
                <h4>内容简介</h4>
                <p className="detail-description">{selectedBook.description}</p>
              </div>
            )}
            <div className="detail-section">
              <h4>预约队列 ({reservations.length}人)</h4>
              {reservations.length === 0 ? (
                <p className="empty-text">暂无预约</p>
              ) : (
                <div className="reservation-list">
                  {reservations.map((r, index) => (
                    <div key={r.id} className="reservation-item">
                      <span className="queue-badge">{index + 1}</span>
                      <span className="reservation-name">{r.reader_name}</span>
                      <span className="reservation-card">{r.reader_card_no}</span>
                      <span className="reservation-date">预约于 {r.reserve_date?.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Books
