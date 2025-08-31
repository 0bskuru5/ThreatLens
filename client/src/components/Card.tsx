import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export default function Card({ children, className, padding = 'md' }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div className={clsx('bg-white rounded-xl shadow-sm border border-gray-200', paddingClasses[padding], className)}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={clsx('mb-4 pb-4 border-b border-gray-100', className)}>
      {children}
    </div>
  )
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={clsx('mt-4 pt-4 border-t border-gray-100', className)}>
      {children}
    </div>
  )
}
