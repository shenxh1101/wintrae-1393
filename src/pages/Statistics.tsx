import { useState, useEffect } from 'react'
import { OverallStats, HotBook, MonthlyStats, NotificationTemplate } from '../types'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Modal from '../components/Modal'
import './Statistics.css'

declare global {
  interface Window {
    api: any
  }
}

type SubTab = 'overview' | 'templates' | 'export'

function Statistics() {
  const [subTab, setSubTab] = useState<SubTab>('overview')
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null)
  const [hotBooks, setHotBooks] = useState<HotBook[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([])
  const [overdueList, setOverdueList] = useState<any[]>([])
  const [categoryStats, setCategoryStats] = useState<{ category: string; count: number }[]>([])
  const [locationStats, setLocationStats] = useState<{ location: string; count: number }[]>([])
  const [loading, setLoading] = useState(false)

  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null)
  const [templateForm, setTemplateForm] = useState<Record<string, any>>({})

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (subTab === 'overview') {
      loadAllStats()
    } else if (subTab === 'templates') {
      loadTemplates()
    }
  }, [subTab])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const loadAllStats = async () => {
    setLoading(true)
    try {
      const [overall, hot, monthly, overdue, category, location] = await Promise.all([
        window.api.stats.getOverall(),
        window.api.stats.getHotBooks(10),
        window.api.stats.getMonthly(6),
        window.api.stats.getOverdueList({ pageSize: 10 }),
        window.api.stats.getCategoryStats(),
        window.api.stats.getLocationStats(),
      ])
      setOverallStats(overall)
      setHotBooks(hot)
      setMonthlyStats(monthly)
      setOverdueList(overdue.list)
      setCategoryStats(category)
      setLocationStats(location)
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
    setLoading(false)
  }

  const loadTemplates = async () => {
    try {
      const data = await window.api.templates.getList()
      setTemplates(data)
    } catch (error) {
      console.error('加载模板失败:', error)
    }
  }

  const handleAddTemplate = () => {
    setEditingTemplate(null)
    setTemplateForm({
      name: '',
      type: 'overdue',
      title: '',
      content: '',
    })
    setTemplateModalOpen(true)
  }

  const handleEditTemplate = (template: NotificationTemplate) => {
    setEditingTemplate(template)
    setTemplateForm({ ...template })
    setTemplateModalOpen(true)
  }

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('确定删除该模板吗？')) return
    try {
      await window.api.templates.delete(id)
      loadTemplates()
      showMessage('success', '删除成功')
    } catch (error) {
      console.error('删除模板失败:', error)
      showMessage('error', '删除失败')
    }
  }

  const handleSaveTemplate = async () => {
    if (!templateForm.name || !templateForm.title || !templateForm.content) {
      alert('请填写完整的模板信息')
      return
    }
    try {
      if (editingTemplate) {
        await window.api.templates.update(editingTemplate.id, templateForm)
      } else {
        await window.api.templates.add(templateForm)
      }
      setTemplateModalOpen(false)
      loadTemplates()
      showMessage('success', '保存成功')
    } catch (error) {
      console.error('保存模板失败:', error)
      showMessage('error', '保存失败')
    }
  }

  const handleExport = async (type: string) => {
    try {
      let fileName = ''
      let result: any = null

      switch (type) {
        case 'books':
          fileName = `图书列表_${new Date().toISOString().split('T')[0]}.xlsx`
          result = await window.api.export.books(fileName)
          break
        case 'readers':
          fileName = `读者列表_${new Date().toISOString().split('T')[0]}.xlsx`
          result = await window.api.export.readers(fileName)
          break
        case 'borrows':
          fileName = `借阅记录_${new Date().toISOString().split('T')[0]}.xlsx`
          result = await window.api.export.borrows(fileName)
          break
        case 'stats':
          fileName = `统计报表_${new Date().toISOString().split('T')[0]}.xlsx`
          result = await window.api.export.stats(fileName)
          break
      }

      if (result?.success) {
        showMessage('success', `导出成功！文件已保存为 ${fileName}`)
      } else {
        showMessage('error', result?.message || '导出失败')
      }
    } catch (error: any) {
      console.error('导出失败:', error)
      showMessage('error', error.message || '导出失败')
    }
  }

  const statCards = overallStats
    ? [
        { label: '图书总数', value: overallStats.total_books, icon: '📚', color: 'blue' },
        { label: '可借册数', value: overallStats.available_books, icon: '✅', color: 'green' },
        { label: '读者总数', value: overallStats.total_readers, icon: '👥', color: 'purple' },
        { label: '当前借出', value: overallStats.borrowed_books, icon: '📖', color: 'orange' },
        { label: '逾期图书', value: overallStats.overdue_books, icon: '⚠️', color: 'red' },
        { label: '待处理预约', value: overallStats.total_reservations, icon: '📋', color: 'cyan' },
      ]
    : []

  const maxBorrowCount = monthlyStats.length > 0 
    ? Math.max(...monthlyStats.map((m) => Math.max(m.borrow_count, m.return_count))) 
    : 1

  const overdueColumns = [
    { key: 'book_title', title: '书名' },
    { key: 'reader_name', title: '读者', width: 100 },
    { key: 'reader_phone', title: '联系电话', width: 120 },
    {
      key: 'due_date',
      title: '应还日期',
      width: 120,
      render: (record: any) => (
        <span style={{ color: 'var(--danger-color)', fontWeight: 500 }}>{record.due_date}</span>
      ),
    },
    {
      key: 'overdue_days',
      title: '逾期天数',
      width: 100,
      align: 'center' as const,
      render: (record: any) => (
        <Badge variant="danger">{Math.floor(record.overdue_days || 0)} 天</Badge>
      ),
    },
  ]

  const hotBookColumns = [
    {
      key: 'rank',
      title: '排名',
      width: 60,
      align: 'center' as const,
      render: (_: any, index: number) => {
        const rank = index + 1
        if (rank <= 3) {
          const medals = ['🥇', '🥈', '🥉']
          return <span className="rank-medal">{medals[index]}</span>
        }
        return <span className="rank-num">{rank}</span>
      },
    },
    { key: 'title', title: '书名' },
    { key: 'author', title: '作者', width: 100 },
    {
      key: 'borrow_count',
      title: '借阅次数',
      width: 100,
      align: 'center' as const,
      render: (record: HotBook) => (
        <Badge variant="primary">{record.borrow_count} 次</Badge>
      ),
    },
  ]

  const templateColumns = [
    { key: 'name', title: '模板名称' },
    {
      key: 'type',
      title: '类型',
      width: 100,
      render: (record: NotificationTemplate) => {
        const typeMap: Record<string, { label: string; variant: any }> = {
          overdue: { label: '逾期提醒', variant: 'danger' },
          due_soon: { label: '到期提醒', variant: 'warning' },
          reservation_ready: { label: '预约到馆', variant: 'success' },
        }
        const info = typeMap[record.type] || { label: record.type, variant: 'default' }
        return <Badge variant={info.variant}>{info.label}</Badge>
      },
    },
    { key: 'title', title: '标题', width: 200 },
    {
      key: 'content',
      title: '内容',
      render: (record: NotificationTemplate) => (
        <span className="template-content-preview">{record.content}</span>
      ),
    },
    {
      key: 'action',
      title: '操作',
      width: 140,
      render: (record: NotificationTemplate) => (
        <div className="action-buttons">
          <Button size="small" variant="ghost" onClick={() => handleEditTemplate(record)}>
            编辑
          </Button>
          <Button size="small" variant="ghost" onClick={() => handleDeleteTemplate(record.id)}>
            删除
          </Button>
        </div>
      ),
    },
  ]

  const subTabs = [
    { key: 'overview', label: '总览', icon: '📊' },
    { key: 'templates', label: '通知模板', icon: '📝' },
    { key: 'export', label: '数据导出', icon: '📤' },
  ]

  const exportItems = [
    { type: 'books', title: '导出图书数据', desc: '导出全部图书的详细信息，包括书目、分类、馆藏地等', icon: '📚' },
    { type: 'readers', title: '导出读者数据', desc: '导出全部读者的信息，包括基本资料、借阅权限等', icon: '👥' },
    { type: 'borrows', title: '导出借阅记录', desc: '导出所有借阅记录，便于存档和分析', icon: '📖' },
    { type: 'stats', title: '导出统计报表', desc: '导出统计数据，包括热门图书、流通量等', icon: '📊' },
  ]

  return (
    <div className="statistics-page">
      {message && (
        <div className={`message-toast ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="tabs-nav">
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-item ${subTab === tab.key ? 'active' : ''}`}
            onClick={() => setSubTab(tab.key as SubTab)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {subTab === 'overview' && (
        <>
          <div className="stats-cards">
            {statCards.map((card, index) => (
              <div key={index} className={`stat-card card-${card.color}`}>
                <div className="card-icon">{card.icon}</div>
                <div className="card-info">
                  <div className="card-value">{card.value}</div>
                  <div className="card-label">{card.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="stats-grid">
            <div className="stats-panel">
              <div className="panel-header">
                <h3 className="panel-title">月度流通量</h3>
              </div>
              <div className="chart-container">
                <div className="bar-chart">
                  {monthlyStats.map((month, index) => (
                    <div key={index} className="bar-group">
                      <div className="bars">
                        <div
                          className="bar bar-borrow"
                          style={{ height: `${(month.borrow_count / maxBorrowCount) * 100}%` }}
                          title={`借出: ${month.borrow_count}`}
                        />
                        <div
                          className="bar bar-return"
                          style={{ height: `${(month.return_count / maxBorrowCount) * 100}%` }}
                          title={`归还: ${month.return_count}`}
                        />
                      </div>
                      <div className="bar-label">{month.month.slice(5)}</div>
                    </div>
                  ))}
                </div>
                <div className="chart-legend">
                  <span className="legend-item">
                    <span className="legend-dot borrow" />
                    借出
                  </span>
                  <span className="legend-item">
                    <span className="legend-dot return" />
                    归还
                  </span>
                  <span className="legend-item">
                    <span className="legend-dot new-reader" />
                    新增读者
                  </span>
                </div>
              </div>
            </div>

            <div className="stats-panel">
              <div className="panel-header">
                <h3 className="panel-title">图书分类分布</h3>
              </div>
              <div className="category-list">
                {categoryStats.length === 0 ? (
                  <div className="empty-text">暂无数据</div>
                ) : (
                  categoryStats.map((item, index) => {
                    const total = categoryStats.reduce((sum, c) => sum + c.count, 0)
                    const percent = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0'
                    const colors = [
                      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
                      '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
                    ]
                    return (
                      <div key={index} className="category-item">
                        <div className="category-info">
                          <span
                            className="category-color"
                            style={{ background: colors[index % colors.length] }}
                          />
                          <span className="category-name">{item.category}</span>
                          <span className="category-count">{item.count} 本</span>
                        </div>
                        <div className="category-bar">
                          <div
                            className="category-bar-fill"
                            style={{
                              width: `${percent}%`,
                              background: colors[index % colors.length],
                            }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stats-panel">
              <div className="panel-header">
                <h3 className="panel-title">热门图书 TOP10</h3>
              </div>
              <DataTable
                columns={hotBookColumns}
                data={hotBooks}
                loading={loading}
                rowKey="book_id"
              />
            </div>

            <div className="stats-panel">
              <div className="panel-header">
                <h3 className="panel-title">逾期名单</h3>
                <Badge variant="danger">{overdueList.length} 条</Badge>
              </div>
              <DataTable
                columns={overdueColumns}
                data={overdueList}
                loading={loading}
                rowKey="id"
              />
            </div>
          </div>

          <div className="stats-panel">
            <div className="panel-header">
              <h3 className="panel-title">馆藏地分布</h3>
            </div>
            <div className="location-grid">
              {locationStats.length === 0 ? (
                <div className="empty-text">暂无数据</div>
              ) : (
                locationStats.map((item, index) => (
                  <div key={index} className="location-card">
                    <div className="location-name">{item.location}</div>
                    <div className="location-count">{item.count} 本</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {subTab === 'templates' && (
        <div className="templates-section">
          <div className="page-toolbar">
            <div className="toolbar-left">
              <span>共 {templates.length} 个模板</span>
            </div>
            <div className="toolbar-right">
              <Button variant="primary" onClick={handleAddTemplate} icon="+">
                新建模板
              </Button>
            </div>
          </div>

          <DataTable
            columns={templateColumns}
            data={templates}
            rowKey="id"
          />

          <div className="template-vars-hint">
            <span className="hint-title">可用变量：</span>
            <code>{'{reader_name}'}</code> 读者姓名、
            <code>{'{book_title}'}</code> 书名、
            <code>{'{due_date}'}</code> 到期日、
            <code>{'{expire_date}'}</code> 有效期
          </div>
        </div>
      )}

      {subTab === 'export' && (
        <div className="export-section">
          <h3 className="section-title">数据导出</h3>
          <p className="section-desc">将图书馆数据导出为 Excel 格式，便于存档和报表制作</p>
          <div className="export-grid">
            {exportItems.map((item) => (
              <div key={item.type} className="export-card">
                <div className="export-icon">{item.icon}</div>
                <div className="export-info">
                  <h4 className="export-title">{item.title}</h4>
                  <p className="export-desc">{item.desc}</p>
                </div>
                <Button variant="primary" onClick={() => handleExport(item.type)}>
                  导出
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 模板编辑弹窗 */}
      <Modal
        open={templateModalOpen}
        title={editingTemplate ? '编辑通知模板' : '新建通知模板'}
        onClose={() => setTemplateModalOpen(false)}
        onOk={handleSaveTemplate}
        width={560}
      >
        <div className="template-form">
          <div className="form-item">
            <label>模板名称 *</label>
            <input
              type="text"
              value={templateForm.name || ''}
              onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
              className="form-input"
              placeholder="如：逾期提醒"
            />
          </div>
          <div className="form-item">
            <label>模板类型 *</label>
            <select
              value={templateForm.type || 'overdue'}
              onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })}
              className="form-input"
            >
              <option value="overdue">逾期提醒</option>
              <option value="due_soon">到期提醒</option>
              <option value="reservation_ready">预约到馆通知</option>
            </select>
          </div>
          <div className="form-item">
            <label>通知标题 *</label>
            <input
              type="text"
              value={templateForm.title || ''}
              onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
              className="form-input"
              placeholder="通知标题"
            />
          </div>
          <div className="form-item">
            <label>通知内容 *</label>
            <textarea
              value={templateForm.content || ''}
              onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
              className="form-textarea"
              rows={5}
              placeholder="通知内容，可使用 {reader_name}、{book_title}、{due_date} 等变量"
            />
          </div>
          <div className="form-hint">
            提示：使用 {'{变量名}'} 格式插入动态内容，例如：
            尊敬的 {'{reader_name}'}，您借阅的《{'{book_title}'}》已到期。
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Statistics
