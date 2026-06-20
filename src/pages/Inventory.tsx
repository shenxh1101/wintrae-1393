import { useState, useEffect, useRef } from 'react'
import { Inventory, InventoryItem, Location, Damage } from '../types'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import './Inventory.css'

type SubTab = 'list' | 'damage'

function InventoryPage() {
  const [subTab, setSubTab] = useState<SubTab>('list')

  // 盘点列表
  const [inventories, setInventories] = useState<Inventory[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState('')

  const [locations, setLocations] = useState<Location[]>([])

  // 创建盘点
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', location_id: '' })

  // 盘点详情
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [currentInventory, setCurrentInventory] = useState<Inventory | null>(null)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [itemsTotal, setItemsTotal] = useState(0)
  const [itemsPage, setItemsPage] = useState(1)
  const [itemsPageSize] = useState(20)
  const [itemStatusFilter, setItemStatusFilter] = useState('')
  const [itemsLoading, setItemsLoading] = useState(false)
  const [scanInput, setScanInput] = useState('')
  const scanInputRef = useRef<HTMLInputElement>(null)

  // 损坏登记
  const [damages, setDamages] = useState<Damage[]>([])
  const [damageTotal, setDamageTotal] = useState(0)
  const [damageLoading, setDamageLoading] = useState(false)
  const [damagePage, setDamagePage] = useState(1)
  const [damagePageSize] = useState(20)
  const [damageStatusFilter, setDamageStatusFilter] = useState('')

  const [damageModalOpen, setDamageModalOpen] = useState(false)
  const [damageForm, setDamageForm] = useState({
    book_barcode: '',
    book_title: '',
    book_id: 0,
    damage_level: 'minor',
    description: '',
    handler: '',
  })
  const [damageSubmitting, setDamageSubmitting] = useState(false)
  const [damageFormError, setDamageFormError] = useState('')

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadLocations()
  }, [])

  useEffect(() => {
    if (subTab === 'list') {
      loadInventories()
    } else {
      loadDamages()
    }
  }, [subTab, page, statusFilter, damagePage, damageStatusFilter])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const loadLocations = async () => {
    try {
      const data = await window.api.locations.getList()
      setLocations(data)
    } catch (error) {
      console.error('加载区域失败:', error)
    }
  }

  const loadInventories = async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize }
      if (statusFilter) params.status = statusFilter
      const result = await window.api.inventory.getList(params)
      setInventories(result.list)
      setTotal(result.total)
    } catch (error) {
      console.error('加载盘点列表失败:', error)
    }
    setLoading(false)
  }

  const loadDamages = async () => {
    setDamageLoading(true)
    try {
      const params: any = { page: damagePage, pageSize: damagePageSize }
      if (damageStatusFilter) params.status = damageStatusFilter
      const result = await window.api.damages.getList(params)
      setDamages(result.list)
      setDamageTotal(result.total)
    } catch (error) {
      console.error('加载损坏记录失败:', error)
    }
    setDamageLoading(false)
  }

  const handleCreateInventory = () => {
    setCreateForm({ name: '', location_id: '' })
    setCreateModalOpen(true)
  }

  const handleCreateSubmit = async () => {
    if (!createForm.name.trim()) {
      alert('请输入盘点名称')
      return
    }
    try {
      const locationId = createForm.location_id ? Number(createForm.location_id) : undefined
      const result = await window.api.inventory.create(createForm.name, locationId)
      if (result.success) {
        showMessage('success', result.message)
        setCreateModalOpen(false)
        loadInventories()
      } else {
        showMessage('error', result.message)
      }
    } catch (error) {
      console.error('创建盘点失败:', error)
      showMessage('error', '创建失败')
    }
  }

  const handleViewDetail = async (inventory: Inventory) => {
    setCurrentInventory(inventory)
    setItemsPage(1)
    setItemStatusFilter('')
    setDetailModalOpen(true)
    loadInventoryItems(inventory.id)
    setTimeout(() => scanInputRef.current?.focus(), 300)
  }

  const loadInventoryItems = async (inventoryId: number) => {
    setItemsLoading(true)
    try {
      const params: any = {
        inventoryId,
        page: itemsPage,
        pageSize: itemsPageSize,
      }
      if (itemStatusFilter) params.status = itemStatusFilter
      const result = await window.api.inventory.getItems(params)
      setInventoryItems(result.list)
      setItemsTotal(result.total)
    } catch (error) {
      console.error('加载盘点明细失败:', error)
    }
    setItemsLoading(false)
  }

  useEffect(() => {
    if (detailModalOpen && currentInventory) {
      loadInventoryItems(currentInventory.id)
    }
  }, [itemsPage, itemStatusFilter, detailModalOpen])

  const handleScanBook = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !scanInput.trim() || !currentInventory) return

    try {
      const book = await window.api.books.getByBarcode(scanInput.trim())
      if (!book) {
        showMessage('error', '未找到该图书')
        setScanInput('')
        return
      }

      const result = await window.api.inventory.checkItem(currentInventory.id, book.id, 'checked')
      if (result.success) {
        showMessage('success', `《${book.title}》 盘点完成`)
        loadInventoryItems(currentInventory.id)
        // 更新汇总
        const updated = await window.api.inventory.getById(currentInventory.id)
        if (updated) setCurrentInventory(updated)
      } else {
        showMessage('error', result.message)
      }
    } catch (error) {
      console.error('盘点失败:', error)
      showMessage('error', '盘点失败')
    }
    setScanInput('')
  }

  const handleMarkStatus = async (item: InventoryItem, status: string) => {
    if (!currentInventory) return
    try {
      const result = await window.api.inventory.checkItem(currentInventory.id, item.book_id, status)
      if (result.success) {
        showMessage('success', '状态已更新')
        loadInventoryItems(currentInventory.id)
        const updated = await window.api.inventory.getById(currentInventory.id)
        if (updated) setCurrentInventory(updated)
      } else {
        showMessage('error', result.message)
      }
    } catch (error) {
      console.error('更新状态失败:', error)
    }
  }

  const handleCompleteInventory = async () => {
    if (!currentInventory) return
    if (!confirm('确认完成本次盘点吗？')) return

    try {
      const result = await window.api.inventory.complete(currentInventory.id)
      if (result.success) {
        showMessage('success', result.message)
        const updated = await window.api.inventory.getById(currentInventory.id)
        if (updated) setCurrentInventory(updated)
        loadInventories()
      }
    } catch (error) {
      console.error('完成盘点失败:', error)
    }
  }

  // 损坏登记相关
  const handleDamageBook = async () => {
    setDamageFormError('')

    if (!damageForm.book_barcode.trim()) {
      setDamageFormError('请输入图书条码')
      return
    }
    if (!damageForm.description.trim()) {
      setDamageFormError('请输入损坏描述')
      return
    }

    setDamageSubmitting(true)

    try {
      let bookId = damageForm.book_id
      let bookTitle = damageForm.book_title

      if (!bookId || bookId === 0) {
        let book = await window.api.books.getByBarcode(damageForm.book_barcode.trim())
        if (!book) {
          const result = await window.api.books.getList({ keyword: damageForm.book_barcode.trim(), pageSize: 1 })
          if (result.list.length > 0) {
            book = result.list[0]
          }
        }
        if (!book) {
          setDamageFormError('未找到该图书，请检查条码后重新输入')
          setDamageSubmitting(false)
          return
        }
        bookId = book.id
        bookTitle = book.title
        setDamageForm({
          ...damageForm,
          book_id: book.id,
          book_title: book.title,
        })
      }

      const result = await window.api.damages.report(
        bookId,
        damageForm.damage_level,
        damageForm.description,
        damageForm.handler
      )
      if (result.success) {
        showMessage('success', '登记成功')
        setDamageModalOpen(false)
        setDamageForm({
          book_barcode: '',
          book_title: '',
          book_id: 0,
          damage_level: 'minor',
          description: '',
          handler: '',
        })
        setDamageFormError('')
        loadDamages()
      } else {
        setDamageFormError(result.message)
      }
    } catch (error) {
      console.error('损坏登记失败:', error)
      setDamageFormError('登记失败，请稍后重试')
    }
    setDamageSubmitting(false)
  }

  const handleDamageBookScan = async (barcode: string) => {
    if (!barcode.trim()) return
    try {
      const book = await window.api.books.getByBarcode(barcode.trim())
      if (book) {
        setDamageForm({
          ...damageForm,
          book_id: book.id,
          book_title: book.title,
          book_barcode: book.barcode || '',
        })
      } else {
        showMessage('error', '未找到该图书')
      }
    } catch (error) {
      console.error('查询图书失败:', error)
    }
  }

  const inventoryColumns = [
    {
      key: 'inventory_no',
      title: '盘点单号',
      width: 140,
    },
    {
      key: 'name',
      title: '盘点名称',
    },
    {
      key: 'location_name',
      title: '盘点区域',
      width: 100,
      render: (record: Inventory) => record.location_name || '全部',
    },
    {
      key: 'total_books',
      title: '应盘',
      width: 80,
      align: 'center' as const,
    },
    {
      key: 'checked_books',
      title: '已盘',
      width: 80,
      align: 'center' as const,
    },
    {
      key: 'missing_books',
      title: '缺失',
      width: 80,
      align: 'center' as const,
      render: (record: Inventory) => (
        <span style={{ color: record.missing_books > 0 ? 'var(--danger-color)' : 'inherit' }}>
          {record.missing_books}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (record: Inventory) => {
        const statusMap: Record<string, { label: string; variant: any }> = {
          in_progress: { label: '进行中', variant: 'primary' },
          completed: { label: '已完成', variant: 'success' },
        }
        const info = statusMap[record.status] || { label: record.status, variant: 'default' }
        return <Badge variant={info.variant}>{info.label}</Badge>
      },
    },
    {
      key: 'start_date',
      title: '开始日期',
      width: 120,
    },
    {
      key: 'action',
      title: '操作',
      width: 140,
      render: (record: Inventory) => (
        <div className="action-buttons">
          <Button size="small" variant="primary" onClick={() => handleViewDetail(record)}>
            详情
          </Button>
        </div>
      ),
    },
  ]

  const itemColumns = [
    {
      key: 'book_barcode',
      title: '条码',
      width: 100,
    },
    {
      key: 'book_title',
      title: '书名',
    },
    {
      key: 'book_author',
      title: '作者',
      width: 100,
    },
    {
      key: 'status',
      title: '盘点状态',
      width: 100,
      render: (record: InventoryItem) => {
        const statusMap: Record<string, { label: string; variant: any }> = {
          pending: { label: '待盘', variant: 'default' },
          checked: { label: '在馆', variant: 'success' },
          missing: { label: '缺失', variant: 'danger' },
          damaged: { label: '损坏', variant: 'warning' },
        }
        const info = statusMap[record.status] || { label: record.status, variant: 'default' }
        return <Badge variant={info.variant}>{info.label}</Badge>
      },
    },
    {
      key: 'action',
      title: '操作',
      width: 200,
      render: (record: InventoryItem) => (
        <div className="action-buttons">
          <Button size="small" variant="success" onClick={() => handleMarkStatus(record, 'checked')}>
            在馆
          </Button>
          <Button size="small" variant="danger" onClick={() => handleMarkStatus(record, 'missing')}>
            缺失
          </Button>
          <Button size="small" variant="warning" onClick={() => handleMarkStatus(record, 'damaged')}>
            损坏
          </Button>
        </div>
      ),
    },
  ]

  const damageColumns = [
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
      key: 'damage_level',
      title: '损坏程度',
      width: 100,
      render: (record: Damage) => {
        const levelMap: Record<string, { label: string; variant: any }> = {
          minor: { label: '轻微', variant: 'success' },
          moderate: { label: '中等', variant: 'warning' },
          severe: { label: '严重', variant: 'danger' },
        }
        const info = levelMap[record.damage_level || ''] || { label: record.damage_level, variant: 'default' }
        return <Badge variant={info.variant}>{info.label}</Badge>
      },
    },
    {
      key: 'description',
      title: '损坏描述',
    },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (record: Damage) => {
        const statusMap: Record<string, { label: string; variant: any }> = {
          reported: { label: '已登记', variant: 'warning' },
          repairing: { label: '维修中', variant: 'primary' },
          repaired: { label: '已修复', variant: 'success' },
          scrapped: { label: '已报废', variant: 'danger' },
        }
        const info = statusMap[record.status] || { label: record.status, variant: 'default' }
        return <Badge variant={info.variant}>{info.label}</Badge>
      },
    },
    {
      key: 'report_date',
      title: '登记日期',
      width: 120,
    },
  ]

  return (
    <div className="inventory-page">
      {message && (
        <div className={`message-toast ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="tabs-nav">
        <button
          className={`tab-item ${subTab === 'list' ? 'active' : ''}`}
          onClick={() => setSubTab('list')}
        >
          <span className="tab-icon">📋</span>
          <span className="tab-label">盘点任务</span>
        </button>
        <button
          className={`tab-item ${subTab === 'damage' ? 'active' : ''}`}
          onClick={() => setSubTab('damage')}
        >
          <span className="tab-icon">⚠️</span>
          <span className="tab-label">损坏登记</span>
        </button>
      </div>

      {subTab === 'list' && (
        <>
          <div className="page-toolbar">
            <div className="toolbar-left">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
              >
                <option value="">全部状态</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
              </select>
            </div>
            <div className="toolbar-right">
              <Button variant="primary" onClick={handleCreateInventory} icon="+">
                新建盘点
              </Button>
            </div>
          </div>

          <DataTable columns={inventoryColumns} data={inventories} loading={loading} rowKey="id" />

          <Pagination current={page} total={total} pageSize={pageSize} onChange={setPage} />
        </>
      )}

      {subTab === 'damage' && (
        <>
          <div className="page-toolbar">
            <div className="toolbar-left">
              <select
                className="form-select"
                value={damageStatusFilter}
                onChange={(e) => {
                  setDamageStatusFilter(e.target.value)
                  setDamagePage(1)
                }}
              >
                <option value="">全部状态</option>
                <option value="reported">已登记</option>
                <option value="repairing">维修中</option>
                <option value="repaired">已修复</option>
                <option value="scrapped">已报废</option>
              </select>
            </div>
            <div className="toolbar-right">
              <Button variant="primary" onClick={() => setDamageModalOpen(true)} icon="+">
                损坏登记
              </Button>
            </div>
          </div>

          <DataTable columns={damageColumns} data={damages} loading={damageLoading} rowKey="id" />

          <Pagination current={damagePage} total={damageTotal} pageSize={damagePageSize} onChange={setDamagePage} />
        </>
      )}

      {/* 新建盘点弹窗 */}
      <Modal
        open={createModalOpen}
        title="新建盘点任务"
        onClose={() => setCreateModalOpen(false)}
        onOk={handleCreateSubmit}
        width={480}
      >
        <div className="create-form">
          <div className="form-item">
            <label>盘点名称 *</label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="form-input"
              placeholder="如：2024年第一季度盘点"
            />
          </div>
          <div className="form-item">
            <label>盘点区域</label>
            <select
              value={createForm.location_id}
              onChange={(e) => setCreateForm({ ...createForm, location_id: e.target.value })}
              className="form-input"
            >
              <option value="">全部区域</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
            <p className="form-hint">选择区域将只盘点该区域的图书</p>
          </div>
        </div>
      </Modal>

      {/* 盘点详情弹窗 */}
      <Modal
        open={detailModalOpen}
        title="盘点详情"
        onClose={() => setDetailModalOpen(false)}
        width={900}
        footer={
          currentInventory?.status === 'in_progress' ? (
            <>
              <button className="btn-cancel" onClick={() => setDetailModalOpen(false)}>
                关闭
              </button>
              <button className="btn-ok" onClick={handleCompleteInventory}>
                完成盘点
              </button>
            </>
          ) : null
        }
      >
        {currentInventory && (
          <div className="inventory-detail">
            <div className="detail-summary">
              <div className="summary-item">
                <span className="summary-label">盘点单号</span>
                <span className="summary-value">{currentInventory.inventory_no}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">盘点名称</span>
                <span className="summary-value">{currentInventory.name}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">盘点区域</span>
                <span className="summary-value">{currentInventory.location_name || '全部'}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">状态</span>
                <span className="summary-value">
                  {currentInventory.status === 'in_progress' ? (
                    <Badge variant="primary">进行中</Badge>
                  ) : (
                    <Badge variant="success">已完成</Badge>
                  )}
                </span>
              </div>
            </div>

            <div className="progress-section">
              <div className="progress-header">
                <span>盘点进度</span>
                <span>
                  {currentInventory.checked_books} / {currentInventory.total_books}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${currentInventory.total_books > 0 ? (currentInventory.checked_books / currentInventory.total_books) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="progress-stats">
                <span style={{ color: 'var(--success-color)' }}>
                  在馆: {currentInventory.checked_books - currentInventory.missing_books - currentInventory.damaged_books}
                </span>
                <span style={{ color: 'var(--danger-color)' }}>缺失: {currentInventory.missing_books}</span>
                <span style={{ color: 'var(--warning-color)' }}>损坏: {currentInventory.damaged_books}</span>
              </div>
            </div>

            {currentInventory.status === 'in_progress' && (
              <div className="scan-section">
                <div className="scan-title">扫码盘点</div>
                <div className="scan-input-row">
                  <input
                    ref={scanInputRef}
                    type="text"
                    className="scan-input"
                    placeholder="扫描或输入图书条码，按回车确认"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    onKeyDown={handleScanBook}
                  />
                  <span className="scan-hint">提示：扫描到图书即视为在馆</span>
                </div>
              </div>
            )}

            <div className="filter-section">
              <div className="filter-label">筛选：</div>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${itemStatusFilter === '' ? 'active' : ''}`}
                  onClick={() => {
                    setItemStatusFilter('')
                    setItemsPage(1)
                  }}
                >
                  全部
                </button>
                <button
                  className={`filter-btn ${itemStatusFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => {
                    setItemStatusFilter('pending')
                    setItemsPage(1)
                  }}
                >
                  待盘
                </button>
                <button
                  className={`filter-btn ${itemStatusFilter === 'checked' ? 'active' : ''}`}
                  onClick={() => {
                    setItemStatusFilter('checked')
                    setItemsPage(1)
                  }}
                >
                  在馆
                </button>
                <button
                  className={`filter-btn ${itemStatusFilter === 'missing' ? 'active' : ''}`}
                  onClick={() => {
                    setItemStatusFilter('missing')
                    setItemsPage(1)
                  }}
                >
                  缺失
                </button>
                <button
                  className={`filter-btn ${itemStatusFilter === 'damaged' ? 'active' : ''}`}
                  onClick={() => {
                    setItemStatusFilter('damaged')
                    setItemsPage(1)
                  }}
                >
                  损坏
                </button>
              </div>
            </div>

            <DataTable
              columns={itemColumns}
              data={inventoryItems}
              loading={itemsLoading}
              rowKey="id"
            />

            <Pagination
              current={itemsPage}
              total={itemsTotal}
              pageSize={itemsPageSize}
              onChange={setItemsPage}
            />
          </div>
        )}
      </Modal>

      {/* 损坏登记弹窗 */}
      <Modal
        open={damageModalOpen}
        title="损坏图书登记"
        onClose={() => setDamageModalOpen(false)}
        onOk={handleDamageBook}
        width={520}
        loading={damageSubmitting}
      >
        <div className="damage-form">
          {damageFormError && (
            <div className="form-error-tip">
              <span className="error-icon">⚠️</span>
              {damageFormError}
            </div>
          )}
          <div className="form-item">
            <label>图书条码 *</label>
            <input
              type="text"
              value={damageForm.book_barcode}
              onChange={(e) => {
                setDamageForm({ ...damageForm, book_barcode: e.target.value, book_id: 0, book_title: '' })
                setDamageFormError('')
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleDamageBookScan(damageForm.book_barcode)}
              className="form-input"
              placeholder="请输入图书条码，按回车或点确定查询"
            />
          </div>
          {damageForm.book_title && (
            <div className="book-info-preview">
              <span className="info-label">图书：</span>
              <span className="info-value">{damageForm.book_title}</span>
            </div>
          )}
          <div className="form-item">
            <label>损坏程度</label>
            <select
              value={damageForm.damage_level}
              onChange={(e) => setDamageForm({ ...damageForm, damage_level: e.target.value })}
              className="form-input"
            >
              <option value="minor">轻微</option>
              <option value="moderate">中等</option>
              <option value="severe">严重</option>
            </select>
          </div>
          <div className="form-item">
            <label>损坏描述 *</label>
            <textarea
              value={damageForm.description}
              onChange={(e) => {
                setDamageForm({ ...damageForm, description: e.target.value })
                setDamageFormError('')
              }}
              className="form-textarea"
              rows={3}
              placeholder="请描述图书的损坏情况"
            />
          </div>
          <div className="form-item">
            <label>处理人</label>
            <input
              type="text"
              value={damageForm.handler}
              onChange={(e) => setDamageForm({ ...damageForm, handler: e.target.value })}
              className="form-input"
              placeholder="处理人姓名"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default InventoryPage
