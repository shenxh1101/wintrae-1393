import { useState, useEffect } from 'react'
import { Reader, Borrow } from '../types'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import Button from '../components/Button'
import Input from '../components/Input'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import './Readers.css'

function Readers() {
  const [readers, setReaders] = useState<Reader[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingReader, setEditingReader] = useState<Reader | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})

  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedReader, setSelectedReader] = useState<Reader | null>(null)
  const [readerStats, setReaderStats] = useState({ borrowed: 0, overdue: 0 })
  const [borrowHistory, setBorrowHistory] = useState<Borrow[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    loadReaders()
  }, [page, keyword, statusFilter, typeFilter])

  const loadReaders = async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize }
      if (keyword) params.keyword = keyword
      if (statusFilter) params.status = statusFilter
      if (typeFilter) params.type = typeFilter

      const result = await window.api.readers.getList(params)
      setReaders(result.list)
      setTotal(result.total)
    } catch (error) {
      console.error('加载读者失败:', error)
    }
    setLoading(false)
  }

  const handleSearch = () => {
    setPage(1)
    loadReaders()
  }

  const handleAdd = () => {
    setEditingReader(null)
    const timestamp = Date.now().toString().slice(-6)
    setFormData({
      card_no: `R${timestamp}`,
      name: '',
      gender: '',
      phone: '',
      email: '',
      address: '',
      id_card: '',
      type: 'adult',
      max_borrow: 10,
      borrow_days: 30,
      status: 'active',
      expire_date: '',
      notes: '',
    })
    setModalOpen(true)
  }

  const handleEdit = (reader: Reader) => {
    setEditingReader(reader)
    setFormData({ ...reader })
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该读者吗？')) return
    try {
      await window.api.readers.delete(id)
      loadReaders()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.card_no) {
      alert('请填写姓名和读者证号')
      return
    }

    try {
      if (editingReader) {
        await window.api.readers.update(editingReader.id, formData)
      } else {
        await window.api.readers.add(formData)
      }
      setModalOpen(false)
      loadReaders()
    } catch (error: any) {
      console.error('保存失败:', error)
      alert(error.message || '保存失败')
    }
  }

  const handleViewDetail = async (reader: Reader) => {
    setSelectedReader(reader)
    setDetailOpen(true)

    try {
      const stats = await window.api.readers.getBorrowStats(reader.id)
      setReaderStats(stats)
    } catch (error) {
      console.error('加载借阅统计失败:', error)
    }

    loadBorrowHistory(reader.id)
  }

  const loadBorrowHistory = async (readerId: number) => {
    setHistoryLoading(true)
    try {
      const result = await window.api.borrows.getList({ reader_id: readerId, pageSize: 50 })
      setBorrowHistory(result.list)
    } catch (error) {
      console.error('加载借阅历史失败:', error)
    }
    setHistoryLoading(false)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      active: { label: '正常', variant: 'success' },
      inactive: { label: '停用', variant: 'default' },
      expired: { label: '过期', variant: 'warning' },
      lost: { label: '挂失', variant: 'danger' },
    }
    const info = statusMap[status] || { label: status, variant: 'default' }
    return <Badge variant={info.variant}>{info.label}</Badge>
  }

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      adult: '成人',
      child: '少儿',
      student: '学生',
      senior: '老年',
    }
    return typeMap[type] || type
  }

  const columns = [
    {
      key: 'card_no',
      title: '读者证号',
      width: 120,
    },
    {
      key: 'name',
      title: '姓名',
      width: 100,
      render: (record: Reader) => (
        <span className="reader-name-cell" onClick={() => handleViewDetail(record)}>
          {record.name}
        </span>
      ),
    },
    {
      key: 'gender',
      title: '性别',
      width: 60,
    },
    {
      key: 'type',
      title: '类型',
      width: 80,
      render: (record: Reader) => getTypeLabel(record.type),
    },
    {
      key: 'phone',
      title: '电话',
      width: 120,
    },
    {
      key: 'max_borrow',
      title: '最大借阅',
      width: 80,
      align: 'center' as const,
    },
    {
      key: 'borrow_days',
      title: '借阅天数',
      width: 80,
      align: 'center' as const,
    },
    {
      key: 'status',
      title: '状态',
      width: 80,
      render: (record: Reader) => getStatusBadge(record.status),
    },
    {
      key: 'register_date',
      title: '注册日期',
      width: 120,
    },
    {
      key: 'action',
      title: '操作',
      width: 140,
      render: (record: Reader) => (
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

  const historyColumns = [
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
      key: 'borrow_date',
      title: '借阅日期',
      width: 120,
    },
    {
      key: 'due_date',
      title: '应还日期',
      width: 120,
    },
    {
      key: 'return_date',
      title: '归还日期',
      width: 120,
      render: (record: Borrow) => record.return_date || '-',
    },
    {
      key: 'status',
      title: '状态',
      width: 80,
      render: (record: Borrow) => {
        const isOverdue = record.status === 'borrowed' && new Date(record.due_date) < new Date()
        if (isOverdue) return <Badge variant="danger">已逾期</Badge>
        if (record.status === 'borrowed') return <Badge variant="warning">借阅中</Badge>
        return <Badge variant="success">已归还</Badge>
      },
    },
  ]

  return (
    <div className="readers-page">
      <div className="page-toolbar">
        <div className="toolbar-left">
          <Input
            placeholder="搜索姓名、读者证号、电话"
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
            <option value="active">正常</option>
            <option value="inactive">停用</option>
            <option value="expired">过期</option>
            <option value="lost">挂失</option>
          </select>
          <select
            className="form-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">全部类型</option>
            <option value="adult">成人</option>
            <option value="child">少儿</option>
            <option value="student">学生</option>
            <option value="senior">老年</option>
          </select>
          <Button variant="primary" onClick={handleSearch}>
            搜索
          </Button>
        </div>
        <div className="toolbar-right">
          <Button variant="primary" onClick={handleAdd} icon="+">
            添加读者
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={readers} loading={loading} rowKey="id" />

      <Pagination current={page} total={total} pageSize={pageSize} onChange={setPage} />

      <Modal
        open={modalOpen}
        title={editingReader ? '编辑读者' : '添加读者'}
        onClose={() => setModalOpen(false)}
        onOk={handleSave}
        width={680}
      >
        <div className="reader-form">
          <div className="form-row">
            <div className="form-item">
              <label>读者证号 *</label>
              <input
                type="text"
                value={formData.card_no || ''}
                onChange={(e) => setFormData({ ...formData, card_no: e.target.value })}
                className="form-input"
                placeholder="请输入读者证号"
              />
            </div>
            <div className="form-item">
              <label>姓名 *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-input"
                placeholder="请输入姓名"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-item">
              <label>性别</label>
              <select
                value={formData.gender || ''}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="form-input"
              >
                <option value="">请选择</option>
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>
            <div className="form-item">
              <label>读者类型</label>
              <select
                value={formData.type || 'adult'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="form-input"
              >
                <option value="adult">成人</option>
                <option value="child">少儿</option>
                <option value="student">学生</option>
                <option value="senior">老年</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-item">
              <label>电话</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="form-input"
                placeholder="请输入电话"
              />
            </div>
            <div className="form-item">
              <label>邮箱</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-input"
                placeholder="请输入邮箱"
              />
            </div>
          </div>
          <div className="form-item">
            <label>地址</label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="form-input"
              placeholder="请输入地址"
            />
          </div>
          <div className="form-row">
            <div className="form-item">
              <label>身份证号</label>
              <input
                type="text"
                value={formData.id_card || ''}
                onChange={(e) => setFormData({ ...formData, id_card: e.target.value })}
                className="form-input"
                placeholder="请输入身份证号"
              />
            </div>
            <div className="form-item">
              <label>有效期至</label>
              <input
                type="date"
                value={formData.expire_date || ''}
                onChange={(e) => setFormData({ ...formData, expire_date: e.target.value })}
                className="form-input"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-item">
              <label>最大借阅数</label>
              <input
                type="number"
                min="1"
                value={formData.max_borrow || 10}
                onChange={(e) => setFormData({ ...formData, max_borrow: Number(e.target.value) })}
                className="form-input"
              />
            </div>
            <div className="form-item">
              <label>借阅天数</label>
              <input
                type="number"
                min="1"
                value={formData.borrow_days || 30}
                onChange={(e) => setFormData({ ...formData, borrow_days: Number(e.target.value) })}
                className="form-input"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-item">
              <label>状态</label>
              <select
                value={formData.status || 'active'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-input"
              >
                <option value="active">正常</option>
                <option value="inactive">停用</option>
                <option value="expired">过期</option>
                <option value="lost">挂失</option>
              </select>
            </div>
          </div>
          <div className="form-item">
            <label>备注</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="form-textarea"
              rows={2}
              placeholder="备注信息"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={detailOpen}
        title="读者详情"
        onClose={() => setDetailOpen(false)}
        width={800}
        footer={null}
      >
        {selectedReader && (
          <div className="reader-detail">
            <div className="detail-header">
              <div className="reader-avatar">
                {selectedReader.name?.charAt(0) || '读'}
              </div>
              <div className="reader-info">
                <h2 className="reader-name">{selectedReader.name}</h2>
                <p className="reader-card">证号：{selectedReader.card_no}</p>
                <div className="reader-status-row">
                  {getStatusBadge(selectedReader.status)}
                  <span className="reader-type">{getTypeLabel(selectedReader.type)}</span>
                </div>
              </div>
              <div className="reader-stats">
                <div className="stat-item">
                  <span className="stat-value">{readerStats.borrowed}</span>
                  <span className="stat-label">当前借阅</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value overdue">{readerStats.overdue}</span>
                  <span className="stat-label">已逾期</span>
                </div>
              </div>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">性别：</span>
                <span className="detail-value">{selectedReader.gender || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">电话：</span>
                <span className="detail-value">{selectedReader.phone || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">邮箱：</span>
                <span className="detail-value">{selectedReader.email || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">地址：</span>
                <span className="detail-value">{selectedReader.address || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">注册日期：</span>
                <span className="detail-value">{selectedReader.register_date?.split(' ')[0]}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">有效期至：</span>
                <span className="detail-value">{selectedReader.expire_date || '长期有效'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">最大借阅：</span>
                <span className="detail-value">{selectedReader.max_borrow} 本</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">借阅期限：</span>
                <span className="detail-value">{selectedReader.borrow_days} 天</span>
              </div>
            </div>

            {selectedReader.notes && (
              <div className="detail-section">
                <h4>备注</h4>
                <p className="detail-description">{selectedReader.notes}</p>
              </div>
            )}

            <div className="detail-section">
              <h4>借阅记录</h4>
              <DataTable
                columns={historyColumns}
                data={borrowHistory}
                loading={historyLoading}
                rowKey="id"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Readers
