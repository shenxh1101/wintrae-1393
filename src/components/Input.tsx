import { InputHTMLAttributes, ReactNode } from 'react'
import './Input.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  prefix?: ReactNode
  suffix?: ReactNode
  error?: string
}

function Input({ label, prefix, suffix, error, className = '', ...props }: InputProps) {
  return (
    <div className="input-wrapper">
      {label && <label className="input-label">{label}</label>}
      <div className={`input-container ${error ? 'has-error' : ''}`}>
        {prefix && <span className="input-prefix">{prefix}</span>}
        <input className="input-field" {...props} />
        {suffix && <span className="input-suffix">{suffix}</span>}
      </div>
      {error && <span className="input-error">{error}</span>}
    </div>
  )
}

export default Input
