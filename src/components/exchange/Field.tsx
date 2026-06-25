import type { ReactNode } from 'react'

interface BaseProps {
  label: string
  name: string
  required?: boolean
  defaultValue?: string
}

interface InputProps extends BaseProps {
  type?: 'text' | 'email' | 'number' | 'datetime-local'
  placeholder?: string
  min?: number
  max?: number
}

export function Field({ label, name, required, defaultValue, type = 'text', placeholder, min, max }: InputProps) {
  return (
    <label className="kx-field">
      <span className="kx-label">{label}{required && <span className="req">*</span>}</span>
      <input
        className="kx-input"
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        min={min}
        max={max}
      />
    </label>
  )
}

interface TextAreaProps extends BaseProps {
  placeholder?: string
  rows?: number
}

export function TextAreaField({ label, name, required, defaultValue, placeholder, rows = 4 }: TextAreaProps) {
  return (
    <label className="kx-field">
      <span className="kx-label">{label}{required && <span className="req">*</span>}</span>
      <textarea className="kx-input" name={name} required={required} defaultValue={defaultValue} placeholder={placeholder} rows={rows} />
    </label>
  )
}

interface SelectProps extends BaseProps {
  options: readonly { value: string; label: string }[]
  children?: ReactNode
}

export function SelectField({ label, name, required, defaultValue, options }: SelectProps) {
  return (
    <label className="kx-field">
      <span className="kx-label">{label}{required && <span className="req">*</span>}</span>
      <select className="kx-input" name={name} required={required} defaultValue={defaultValue}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}
