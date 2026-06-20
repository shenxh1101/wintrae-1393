import { ReactNode } from 'react'
import './Layout.css'

interface LayoutProps {
  activeTab: string
  onTabChange: (tab: string) => void
  children: ReactNode
}

const menuItems = [
  { key: 'books', label: '书架', icon: '📚' },
  { key: 'readers', label: '读者', icon: '👥' },
  { key: 'circulation', label: '借还台', icon: '🔄' },
  { key: 'inventory', label: '盘点', icon: '📋' },
  { key: 'statistics', label: '统计', icon: '📊' },
]

function Layout({ activeTab, onTabChange, children }: LayoutProps) {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-icon">📖</span>
          <span className="logo-text">图书馆管理</span>
        </div>
        <nav className="nav-menu">
          {menuItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => onTabChange(item.key)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="admin-avatar">管</div>
            <div>
              <div className="admin-name">管理员</div>
              <div className="admin-role">系统管理员</div>
            </div>
          </div>
        </div>
      </aside>
      <main className="main-content">
        <header className="header">
          <h1 className="page-title">
            {menuItems.find((m) => m.key === activeTab)?.label || ''}
          </h1>
          <div className="header-actions">
            <span className="date-display">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </span>
          </div>
        </header>
        <div className="content-area">{children}</div>
      </main>
    </div>
  )
}

export default Layout
