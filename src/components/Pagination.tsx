import './Pagination.css'

interface PaginationProps {
  current: number
  total: number
  pageSize: number
  onChange: (page: number) => void
  showTotal?: boolean
}

function Pagination({ current, total, pageSize, onChange, showTotal = true }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize) || 1

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (current >= totalPages - 3) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = current - 1; i <= current + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="pagination">
      {showTotal && <span className="pagination-total">共 {total} 条</span>}
      <div className="pagination-pages">
        <button
          className="page-btn"
          disabled={current === 1}
          onClick={() => onChange(current - 1)}
        >
          ‹
        </button>
        {getPageNumbers().map((page, index) =>
          typeof page === 'number' ? (
            <button
              key={index}
              className={`page-btn ${page === current ? 'active' : ''}`}
              onClick={() => onChange(page)}
            >
              {page}
            </button>
          ) : (
            <span key={index} className="page-ellipsis">
              {page}
            </span>
          )
        )}
        <button
          className="page-btn"
          disabled={current === totalPages}
          onClick={() => onChange(current + 1)}
        >
          ›
        </button>
      </div>
    </div>
  )
}

export default Pagination
