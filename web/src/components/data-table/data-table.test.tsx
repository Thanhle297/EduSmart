import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTable } from './data-table'

afterEach(cleanup)
describe('DataTable', () => {
  it('filters real rows, paginates, and shows an empty state', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        data={[{ name: 'Cô Hương' }, { name: 'Thầy Bình' }, { name: 'Cô Trang' }]}
        columns={[{ accessorKey: 'name', header: 'Giáo viên' }]}
        pageSize={2}
      />,
    )
    expect(screen.getByText('Cô Hương')).toBeInTheDocument()
    expect(screen.queryByText('Cô Trang')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Trang sau' }))
    expect(screen.getByText('Cô Trang')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox'), 'Hương')
    expect(screen.getByText('Cô Hương')).toBeInTheDocument()
    expect(screen.queryByText('Cô Trang')).not.toBeInTheDocument()
    await user.clear(screen.getByRole('textbox'))
    await user.type(screen.getByRole('textbox'), 'Không tồn tại')
    expect(screen.getByText('Không có dữ liệu phù hợp')).toBeInTheDocument()
  })
  it('sorts values using the column heading', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        data={[{ name: 'B' }, { name: 'A' }]}
        columns={[{ accessorKey: 'name', header: 'Tên' }]}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Tên' }))
    expect(screen.getAllByRole('cell')[0]).toHaveTextContent('A')
  })
})
