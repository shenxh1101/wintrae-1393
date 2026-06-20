import { ReactNode, useEffect } from 'react'
import './Modal.css'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  onOk?: () => void
  okText?: string
  cancelText?: string
  width?: number | string
  children: ReactNode
  footer?: ReactNode | null
  loading?: boolean
}

function Modal({
  open,
  title,
  onClose,
  onOk,
  okText = '确定',
  cancelText = '取消',
  width = 520,
  children,
  footer,
  loading = false,
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-wrap" onClick={(e) => e.stopPropagation()}>
        <div className="modal" style={{ width: typeof width === 'number' ? `${width}px` : width }}>
          <div className="modal-header">
            <h3 className="modal-title">{title}</h3>
            <button className="modal-close" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-body">{children}</div>
          {footer !== null && (
            <div className="modal-footer">
              {footer || (
                <>
                  <button className="btn-cancel" onClick={onClose}>
                    {cancelText}
                  </button>
                  <button className="btn-ok" onClick={onOk} disabled={loading}>
                    {loading ? '处理中...' : okText}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Modal
