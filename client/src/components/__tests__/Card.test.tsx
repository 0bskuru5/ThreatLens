import { render, screen } from '@testing-library/react'
import Card, { CardHeader, CardContent, CardFooter } from '../Card'

describe('Card', () => {
  test('renders with default props', () => {
    render(
      <Card>
        <p>Card content</p>
      </Card>
    )

    const card = screen.getByText('Card content').parentElement
    expect(card).toHaveClass('bg-white', 'rounded-xl', 'shadow-sm', 'border', 'p-6')
  })

  test('renders with custom className', () => {
    render(
      <Card className="custom-class">
        <p>Card content</p>
      </Card>
    )

    const card = screen.getByText('Card content').parentElement
    expect(card).toHaveClass('custom-class')
  })

  test('renders with none padding', () => {
    render(
      <Card padding="none">
        <p>Card content</p>
      </Card>
    )

    const card = screen.getByText('Card content').parentElement
    expect(card).not.toHaveClass('p-6')
  })

  test('renders with small padding', () => {
    render(
      <Card padding="sm">
        <p>Card content</p>
      </Card>
    )

    const card = screen.getByText('Card content').parentElement
    expect(card).toHaveClass('p-4')
  })

  test('renders with large padding', () => {
    render(
      <Card padding="lg">
        <p>Card content</p>
      </Card>
    )

    const card = screen.getByText('Card content').parentElement
    expect(card).toHaveClass('p-8')
  })
})

describe('CardHeader', () => {
  test('renders with children', () => {
    render(
      <Card>
        <CardHeader>
          <h3>Header Title</h3>
        </CardHeader>
      </Card>
    )

    expect(screen.getByText('Header Title')).toBeInTheDocument()
  })

  test('applies default styling', () => {
    render(
      <Card>
        <CardHeader>
          <h3>Header Title</h3>
        </CardHeader>
      </Card>
    )

    const header = screen.getByText('Header Title').parentElement
    expect(header).toHaveClass('mb-4', 'pb-4', 'border-b', 'border-gray-100')
  })

  test('applies custom className', () => {
    render(
      <Card>
        <CardHeader className="custom-header">
          <h3>Header Title</h3>
        </CardHeader>
      </Card>
    )

    const header = screen.getByText('Header Title').parentElement
    expect(header).toHaveClass('custom-header')
  })
})

describe('CardContent', () => {
  test('renders with children', () => {
    render(
      <Card>
        <CardContent>
          <p>Content text</p>
        </CardContent>
      </Card>
    )

    expect(screen.getByText('Content text')).toBeInTheDocument()
  })

  test('applies custom className', () => {
    render(
      <Card>
        <CardContent className="custom-content">
          <p>Content text</p>
        </CardContent>
      </Card>
    )

    const content = screen.getByText('Content text').parentElement
    expect(content).toHaveClass('custom-content')
  })
})

describe('CardFooter', () => {
  test('renders with children', () => {
    render(
      <Card>
        <CardFooter>
          <p>Footer text</p>
        </CardFooter>
      </Card>
    )

    expect(screen.getByText('Footer text')).toBeInTheDocument()
  })

  test('applies default styling', () => {
    render(
      <Card>
        <CardFooter>
          <p>Footer text</p>
        </CardFooter>
      </Card>
    )

    const footer = screen.getByText('Footer text').parentElement
    expect(footer).toHaveClass('mt-4', 'pt-4', 'border-t', 'border-gray-100')
  })

  test('applies custom className', () => {
    render(
      <Card>
        <CardFooter className="custom-footer">
          <p>Footer text</p>
        </CardFooter>
      </Card>
    )

    const footer = screen.getByText('Footer text').parentElement
    expect(footer).toHaveClass('custom-footer')
  })
})
