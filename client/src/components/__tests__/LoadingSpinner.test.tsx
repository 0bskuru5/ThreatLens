import { render, screen } from '@testing-library/react'
import LoadingSpinner from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  test('renders with default props', () => {
    render(<LoadingSpinner />)

    const spinner = screen.getByRole('generic')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('h-6', 'w-6')
  })

  test('renders with small size', () => {
    render(<LoadingSpinner size="sm" />)

    const spinner = screen.getByRole('generic')
    expect(spinner).toHaveClass('h-4', 'w-4')
  })

  test('renders with medium size', () => {
    render(<LoadingSpinner size="md" />)

    const spinner = screen.getByRole('generic')
    expect(spinner).toHaveClass('h-6', 'w-6')
  })

  test('renders with large size', () => {
    render(<LoadingSpinner size="lg" />)

    const spinner = screen.getByRole('generic')
    expect(spinner).toHaveClass('h-8', 'w-8')
  })

  test('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />)

    const spinner = screen.getByRole('generic')
    expect(spinner).toHaveClass('custom-class')
  })

  test('has animate-spin class for spinning animation', () => {
    render(<LoadingSpinner />)

    const spinner = screen.getByRole('generic')
    expect(spinner).toHaveClass('animate-spin')
  })

  test('has correct border styling', () => {
    render(<LoadingSpinner />)

    const spinner = screen.getByRole('generic')
    expect(spinner).toHaveClass('border-2', 'border-gray-300', 'border-t-primary-600')
  })
})
