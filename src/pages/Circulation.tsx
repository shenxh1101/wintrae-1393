import { useState, useEffect, useRef } from 'react'
import { Book, Reader, Borrow, Reservation } from '../types'
import Button from '../components/Button'
import Badge from '../components/Badge'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import './Circulation.css'

type TabType = 'borrow' | 'return' | 'overdue' | 'reservation'

function Circulation() {
  const [activeTab, setActiveTab] = useState<TabType>('borrow')

  // 借阅相关
  const [borrowReader, setBorrowReader] = useState<Reader | null>(null)
  const [borrowReaderInput, setBorrowReaderInput] = useState('')
  const [borrowBooks, setBorrowBooks] = useState<Book[]>([])
  const [borrowBookInput, setBorrowBookInput] = useState('')
  const borrowBookInputRef = useRef<HTMLInputElement>(null)

  // 归还相关
  const [returnBookInput, setReturnBookInput] = useState('')
  const [returnList, setReturnList] = useState<Borrow[]>([])
  const returnBookInputRef = useRef<HTMLInputElement>(null)

  // 逾期列表
  const [overdueList, setOverdueList] = useState<Borrow[]>([])
  const [overdueLoading, setOverdueLoading] = useState(false)

  // 预约列表
  const [reservationList, setReservationList] = useState<Reservation[]>([])
  const [reservationLoading, setReservationLoading] = useState(false)
  const [reserveReaderNo, setReserveReaderNo] = useState('')
  const [reserveBookBarcode, setReserveBookBarcode] = useState('')
  const [reserving, setReserving] = useState(false)

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    title: string
    content: string
    onConfirm?: () => void
  }>({ open: false, title: '', content: '' })

  useEffect(() => {
    if (activeTab === 'overdue') {
      loadOverdueList()
    } else if (activeTab === 'reservation') {
      loadReservationList()
    }
  }, [activeTab])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // 借阅功能
  const handleSearchReader = async () => {
    if (!borrowReaderInput.trim()) return
    try {
      let reader = await window.api.readers.getByCardNo(borrowReaderInput.trim())
      if (!reader) {
        const result = await window.api.readers.getList({ keyword: borrowReaderInput.trim(), pageSize: 1 })
        if (result.list.length > 0) {
          reader = result.list[0]
        }
      }
      if (reader) {
        setBorrowReader(reader)
        setBorrowReaderInput('')
        borrowBookInputRef.current?.focus()
      } else {
        showMessage('error', '未找到该读者')
      }
    } catch (error) {
      console.error('查询读者失败:', error)
      showMessage('error', '查询失败')
    }
  }

  const handleAddBorrowBook = async () => {
    if (!borrowReader) {
      showMessage('error', '请先扫描读者证')
      return
    }
    if (!borrowBookInput.trim()) return

    try {
      let book = await window.api.books.getByBarcode(borrowBookInput.trim())
      if (!book) {
        const result = await window.api.books.getList({ keyword: borrowBookInput.trim(), pageSize: 1 })
        if (result.list.length > 0) {
          book = result.list[0]
        }
      }
      if (!book) {
        showMessage('error', '未找到该图书')
        return
      }
      if (book.available_copies <= 0) {
        showMessage('error', '该书暂无库存')
        return
      }
      if (borrowBooks.find((b) => b.id === book.id)) {
        showMessage('error', '该书已添加')
        return
      }
      setBorrowBooks([...borrowBooks, book])
      setBorrowBookInput('')
      borrowBookInputRef.current?.focus()
    } catch (error) {
      console.error('添加图书失败:', error)
      showMessage('error', '添加失败')
    }
    setBorrowBookInput('')
  }

  const handleRemoveBorrowBook = (bookId: number) => {
    setBorrowBooks(borrowBooks.filter((b) => b.id !== bookId))
  }

  const handleBorrowSubmit = async () => {
    if (!borrowReader || borrowBooks.length === 0) return

    setConfirmModal({
      open: true,
      title: '确认借阅',
      content: `确认借给 ${borrowReader.name} ${borrowBooks.length} 本图书吗？`,
      onConfirm: async () => {
        try {
          let successCount = 0
          let failCount = 0
          for (const book of borrowBooks) {
            const result = await window.api.borrows.borrow(book.id, borrowReader.id)
            if (result.success) {
              successCount++
            } else {
              failCount++
              console.warn(`借阅失败: ${book.title} - ${result.message}`)
            }
          }
          showMessage('success', `借阅完成：成功 ${successCount} 本${failCount > 0 ? `，失败 ${failCount} 本` : ''}`)
          setBorrowBooks([])
          setBorrowReader(null)
          setConfirmModal({ open: false, title: '', content: '' })
        } catch (error) {
          console.error('借阅失败:', error)
          showMessage('error', '借阅失败')
        }
      },
    })
  }

  // 归还功能
  const handleScanReturnBook = async () => {
    if (!returnBookInput.trim()) return

    try {
      const book = await window.api.books.getByBarcode(returnBookInput.trim())
      if (!book) {
        showMessage('error', '未找到该图书')
        setReturnBookInput('')
        return
      }

      const result = await window.api.borrows.getList({ book_id: book.id, status: 'borrowed', pageSize: 10 })
      if (result.list.length === 0) {
        showMessage('error', '该书未被借出')
        setReturnBookInput('')
        return
      }

      if (returnList.find((b) => b.book_id === book.id)) {
        showMessage('error', '该书已添加到归还列表')
        setReturnBookInput('')
        return
      }

      setReturnList([...returnList, result.list[0]])
      setReturnBookInput('')
      returnBookInputRef.current?.focus()
    } catch (error) {
      console.error('扫描归还图书失败:', error)
      showMessage('error', '扫描失败')
    }
    setReturnBookInput('')
  }

  const handleReturnSubmit = async () => {
    if (returnList.length === 0) return

    setConfirmModal({
      open: true,
      title: '确认归还',
      content: `确认归还 ${returnList.length} 本图书吗？`,
      onConfirm: async () => {
        try {
          let totalFine = 0
          let successCount = 0
          for (const borrow of returnList) {
            const result = await window.api.borrows.return(borrow.id)
            if (result.success) {
              successCount++
              totalFine += result.fine || 0
            }
          }
          showMessage('success', `归还完成：${successCount} 本${totalFine > 0 ? `，逾期费用 ¥${totalFine.toFixed(2)}` : ''}`)
          setReturnList([])
          setConfirmModal({ open: false, title: '', content: '' })
        } catch (error) {
          console.error('归还失败:', error)
          showMessage('error', '归还失败')
        }
      },
    })
  }

  const handleRemoveReturnBook = (borrowId: number) => {
    setReturnList(returnList.filter((b) => b.id !== borrowId))
  }

  // 续借
  const handleRenew = async (borrow: Borrow) => {
    setConfirmModal({
      open: true,
      title: '确认续借',
      content: `确认续借《${borrow.book_title}》吗？`,
      onConfirm: async () => {
        try {
          const result = await window.api.borrows.renew(borrow.id)
          if (result.success) {
            showMessage('success', `续借成功，新到期日：${result.newDueDate}`)
            if (activeTab === 'overdue') {
              loadOverdueList()
            }
          } else {
            showMessage('error', result.message)
          }
          setConfirmModal({ open: false, title: '', content: '' })
        } catch (error) {
          console.error('续借失败:', error)
          showMessage('error', '续借失败')
        }
      },
    })
  }

  // 逾期列表
  const loadOverdueList = async () => {
    setOverdueLoading(true)
    try {
      const result = await window.api.borrows.getOverdue()
      setOverdueList(result)
    } catch (error) {
      console.error('加载逾期列表失败:', error)
    }
    setOverdueLoading(false)
  }

  // 预约列表
  const loadReservationList = async () => {
    setReservationLoading(true)
    try {
      const result = await window.api.reservations.getList({ status: 'waiting', pageSize: 50 })
      setReservationList(result.list)
    } catch (error) {
      console.error('加载预约列表失败:', error)
    }
    setReservationLoading(false)
  }

  const handleCancelReservation = async (id: number) => {
    if (!confirm('确定取消该预约吗？')) return
    try {
      const result = await window.api.reservations.cancel(id)
      if (result.success) {
        showMessage('success', '取消成功，排位已自动顺延')
        loadReservationList()
      } else {
        showMessage('error', result.message)
      }
    } catch (error) {
      console.error('取消预约失败:', error)
      showMessage('error', '取消失败')
    }
  }

  const handleAddReservation = async () => {
    if (!reserveReaderNo.trim()) {
      showMessage('error', '请输入读者证号')
      return
    }
    if (!reserveBookBarcode.trim()) {
      showMessage('error', '请输入图书条码')
      return
    }

    setReserving(true)
    try {
      let reader = await window.api.readers.getByCardNo(reserveReaderNo.trim())
      if (!reader) {
        const result = await window.api.readers.getList({ keyword: reserveReaderNo.trim(), pageSize: 1 })
        if (result.list.length > 0) {
          reader = result.list[0]
        }
      }
      if (!reader) {
        showMessage('error', '未找到该读者')
        setReserving(false)
        return
      }

      let book = await window.api.books.getByBarcode(reserveBookBarcode.trim())
      if (!book) {
        const result = await window.api.books.getList({ keyword: reserveBookBarcode.trim(), pageSize: 1 })
        if (result.list.length > 0) {
          book = result.list[0]
        }
      }
      if (!book) {
        showMessage('error', '未找到该图书')
        setReserving(false)
        return
      }

      const result = await window.api.reservations.add(book.id, reader.id)
      if (result.success) {
        showMessage('success', result.message)
        setReserveReaderNo('')
        setReserveBookBarcode('')
        loadReservationList()
      } else {
        showMessage('error', result.message)
      }
    } catch (error) {
      console.error('预约失败:', error)
      showMessage('error', '预约失败')
    }
    setReserving(false)
  }

  const tabs = [
    { key: 'borrow', label: '借阅', icon: '📖' },
    { key: 'return', label: '归还', icon: '↩️' },
    { key: 'overdue', label: '逾期提醒', icon: '⚠️' },
    { key: 'reservation', label: '预约排队', icon: '📋' },
  ]

  const overdueColumns = [
    {
      key: 'book_title',
      title: '书名',
    },
    {
      key: 'book_barcode',
      title: '条码',
      width: 100,
    },
    {
      key: 'reader_name',
      title: '读者',
      width: 100,
    },
    {
      key: 'reader_card_no',
      title: '读者证号',
      width: 120,
    },
    {
      key: 'reader_phone',
      title: '联系电话',
      width: 120,
    },
    {
      key: 'borrow_date',
      title: '借阅日期',
      width: 120,
    },
    {
      key: 'due_date',
      title: '应还日期',
      width: 120,
      render: (record: Borrow) => (
        <span style={{ color: 'var(--danger-color)', fontWeight: 500 }}>{record.due_date}</span>
      ),
    },
    {
      key: 'action',
      title: '操作',
      width: 160,
      render: (record: Borrow) => (
        <div className="action-buttons">
          <Button size="small" variant="primary" onClick={() => handleRenew(record)}>
            续借
          </Button>
        </div>
      ),
    },
  ]

  const reservationColumns = [
    {
      key: 'queue_position',
      title: '排队',
      width: 60,
      align: 'center' as const,
      render: (record: Reservation) => (
        <Badge variant="primary">第{record.queue_position}位</Badge>
      ),
    },
    {
      key: 'book_title',
      title: '书名',
    },
    {
      key: 'book_barcode',
      title: '条码',
      width: 100,
    },
    {
      key: 'reader_name',
      title: '预约读者',
      width: 100,
    },
    {
      key: 'reader_card_no',
      title: '读者证号',
      width: 120,
    },
    {
      key: 'reserve_date',
      title: '预约时间',
      width: 160,
    },
    {
      key: 'expire_date',
      title: '有效期至',
      width: 120,
    },
    {
      key: 'action',
      title: '操作',
      width: 120,
      render: (record: Reservation) => (
        <div className="action-buttons">
          <Button
            size="small"
            variant="danger"
            onClick={() => handleCancelReservation(record.id)}
          >
            取消
          </Button>
        </div>
      ),
    },
  ]

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="circulation-page">
      {message && (
        <div className={`message-toast ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="tabs-nav">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key as TabType)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            {tab.key === 'overdue' && overdueList.length > 0 && (
              <span className="tab-badge">{overdueList.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* 借阅面板 */}
      {activeTab === 'borrow' && (
        <div className="circulation-panel">
          <div className="reader-card-section">
            <div className="section-title">读者信息</div>
            {borrowReader ? (
              <div className="reader-info-card">
                <div className="reader-avatar-big">{borrowReader.name?.charAt(0)}</div>
                <div className="reader-details">
                  <h3 className="reader-name">{borrowReader.name}</h3>
                  <p className="reader-card-no">证号：{borrowReader.card_no}</p>
                  <div className="reader-meta">
                    <Badge variant="success">{borrowReader.type === 'adult' ? '成人' : '少儿'}</Badge>
                    <span className="meta-text">可借 {borrowReader.max_borrow} 本 / {borrowReader.borrow_days} 天</span>
                  </div>
                </div>
                <Button variant="ghost" size="small" onClick={() => setBorrowReader(null)}>
                  更换
                </Button>
              </div>
            ) : (
              <div className="reader-input-area">
                <div className="input-group">
                  <input
                    className="scan-input"
                    placeholder="请扫描或输入读者证号"
                    value={borrowReaderInput}
                    onChange={(e) => setBorrowReaderInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchReader()}
                    autoFocus
                  />
                  <Button variant="primary" onClick={handleSearchReader}>
                    查询
                  </Button>
                </div>
                <p className="input-hint">请先扫描或输入读者证号，再扫描图书</p>
              </div>
            )}
          </div>

          <div className="books-section">
            <div className="section-header">
              <div className="section-title">借阅图书</div>
              <span className="books-count">已选 {borrowBooks.length} 本</span>
            </div>
            <div className="book-scan-area">
              <input
                ref={borrowBookInputRef}
                className="scan-input"
                placeholder={borrowReader ? '扫描或输入图书条码' : '请先选择读者'}
                value={borrowBookInput}
                onChange={(e) => setBorrowBookInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddBorrowBook()}
                disabled={!borrowReader}
              />
              <Button
                variant="primary"
                onClick={handleAddBorrowBook}
                disabled={!borrowReader}
              >
                添加
              </Button>
            </div>
            <div className="borrow-books-list">
              {borrowBooks.length === 0 ? (
                <div className="empty-placeholder">
                  <span className="empty-icon">📚</span>
                  <p>暂无待借图书</p>
                </div>
              ) : (
                borrowBooks.map((book) => (
                  <div key={book.id} className="borrow-book-item">
                    <div className="book-cover-sm">📖</div>
                    <div className="book-info-sm">
                      <div className="book-title-sm">{book.title}</div>
                      <div className="book-meta-sm">
                        {book.author} · {book.barcode}
                      </div>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveBorrowBook(book.id)}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="action-footer">
              <Button
                variant="primary"
                size="large"
                onClick={handleBorrowSubmit}
                disabled={!borrowReader || borrowBooks.length === 0}
              >
                确认借阅 ({borrowBooks.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 归还面板 */}
      {activeTab === 'return' && (
        <div className="circulation-panel">
          <div className="section-header">
            <div className="section-title">图书归还</div>
            <span className="books-count">待还 {returnList.length} 本</span>
          </div>
          <div className="book-scan-area">
            <input
              ref={returnBookInputRef}
              className="scan-input"
              placeholder="扫描或输入图书条码进行归还"
              value={returnBookInput}
              onChange={(e) => setReturnBookInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScanReturnBook()}
              autoFocus
            />
            <Button variant="primary" onClick={handleScanReturnBook}>
              扫描
            </Button>
          </div>

          <div className="return-books-list">
            {returnList.length === 0 ? (
              <div className="empty-placeholder">
                <span className="empty-icon">📥</span>
                <p>请扫描图书条码进行归还</p>
              </div>
            ) : (
              <div className="return-table">
                <table>
                  <thead>
                    <tr>
                      <th>书名</th>
                      <th>条码</th>
                      <th>借阅人</th>
                      <th>借阅日期</th>
                      <th>应还日期</th>
                      <th>状态</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnList.map((borrow) => (
                      <tr key={borrow.id}>
                        <td>{borrow.book_title}</td>
                        <td>{borrow.book_barcode}</td>
                        <td>{borrow.reader_name}</td>
                        <td>{borrow.borrow_date?.split(' ')[0]}</td>
                        <td className={isOverdue(borrow.due_date) ? 'text-danger' : ''}>
                          {borrow.due_date}
                        </td>
                        <td>
                          {isOverdue(borrow.due_date) ? (
                            <Badge variant="danger">已逾期</Badge>
                          ) : (
                            <Badge variant="warning">借阅中</Badge>
                          )}
                        </td>
                        <td>
                          <button
                            className="link-btn"
                            onClick={() => handleRemoveReturnBook(borrow.id)}
                          >
                            移除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="action-footer">
            <Button
              variant="success"
              size="large"
              onClick={handleReturnSubmit}
              disabled={returnList.length === 0}
            >
              确认归还 ({returnList.length})
            </Button>
          </div>
        </div>
      )}

      {/* 逾期提醒 */}
      {activeTab === 'overdue' && (
        <div className="circulation-panel">
          <div className="section-header">
            <div className="section-title">逾期图书列表</div>
            <Badge variant="danger">{overdueList.length} 本逾期</Badge>
          </div>
          <DataTable
            columns={overdueColumns}
            data={overdueList}
            loading={overdueLoading}
            rowKey="id"
          />
        </div>
      )}

      {/* 预约排队 */}
      {activeTab === 'reservation' && (
        <div className="circulation-panel">
          <div className="section-header">
            <div className="section-title">预约排队</div>
            <Badge variant="primary">{reservationList.length} 个预约</Badge>
          </div>

          <div className="reservation-form">
            <div className="form-row">
              <div className="form-item">
                <label>读者证号</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="请输入读者证号"
                  value={reserveReaderNo}
                  onChange={(e) => setReserveReaderNo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddReservation()}
                />
              </div>
              <div className="form-item">
                <label>图书条码</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="请输入图书条码"
                  value={reserveBookBarcode}
                  onChange={(e) => setReserveBookBarcode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddReservation()}
                />
              </div>
              <div className="form-item form-item-btn">
                <label>&nbsp;</label>
                <Button
                  variant="primary"
                  onClick={handleAddReservation}
                  disabled={reserving}
                  icon="+"
                >
                  {reserving ? '处理中...' : '添加预约'}
                </Button>
              </div>
            </div>
          </div>

          <DataTable
            columns={reservationColumns}
            data={reservationList}
            loading={reservationLoading}
            rowKey="id"
          />
        </div>
      )}

      {/* 确认对话框 */}
      <Modal
        open={confirmModal.open}
        title={confirmModal.title}
        onClose={() => setConfirmModal({ open: false, title: '', content: '' })}
        onOk={confirmModal.onConfirm}
        width={420}
      >
        <p style={{ padding: '10px 0', fontSize: 14 }}>{confirmModal.content}</p>
      </Modal>
    </div>
  )
}

export default Circulation
