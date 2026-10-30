import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Field } from './ui'

afterEach(cleanup)
describe('accessible form fields', () => {
  it('keeps the field label stable when an error is shown', () => {
    const { rerender } = render(
      <Field label="Tên đăng nhập">
        <input />
      </Field>,
    )
    const input = screen.getByRole('textbox', { name: 'Tên đăng nhập', exact: true })
    rerender(
      <Field label="Tên đăng nhập" error="Cần nhập tên đăng nhập">
        <input />
      </Field>,
    )
    expect(screen.getByRole('textbox', { name: 'Tên đăng nhập', exact: true })).toBe(input)
    expect(input).toHaveAccessibleDescription('Cần nhập tên đăng nhập')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })
  it('links a nested password control without including its visibility button', () => {
    render(
      <Field label="Mật khẩu">
        <span>
          <input type="password" />
          <button type="button">Hiện mật khẩu</button>
        </span>
      </Field>,
    )
    expect(screen.getByLabelText('Mật khẩu', { exact: true })).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: 'Hiện mật khẩu' })).toBeInTheDocument()
  })
})
