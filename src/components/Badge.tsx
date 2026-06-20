import './Badge.css'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary'
  size?: 'small' | 'medium'
}

function Badge({ children, variant = 'default', size = 'medium' }: BadgeProps) {
  return (
    <span className={`badge badge-${variant} badge-${size}`}>
      {children}
    </span>
  )
}

export default Badge
