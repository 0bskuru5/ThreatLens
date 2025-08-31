import { useLocation } from 'react-router-dom'
import { useWebSocket } from '../contexts/WebSocketContext'
import { Bell, Wifi, WifiOff } from 'lucide-react'

export default function Header() {
  const location = useLocation()
  const { isConnected } = useWebSocket()

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = (pathname: string) => {
    const paths = pathname.split('/').filter(Boolean)
    const breadcrumbs = [{ name: 'Dashboard', href: '/dashboard' }]

    if (paths.length > 0 && paths[0] !== 'dashboard') {
      paths.forEach((path, index) => {
        const href = '/' + paths.slice(0, index + 1).join('/')
        const name = path.charAt(0).toUpperCase() + path.slice(1)
        breadcrumbs.push({ name, href })
      })
    }

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs(location.pathname)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Breadcrumbs */}
          <div className="flex items-center space-x-2">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                {breadcrumbs.map((crumb, index) => (
                  <li key={crumb.href}>
                    <div className="flex items-center">
                      {index > 0 && (
                        <svg
                          className="mx-2 h-4 w-4 text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      <span className="text-sm font-medium text-gray-500 hover:text-gray-700">
                        {crumb.name}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Connection status */}
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <div className="flex items-center space-x-1 text-green-600">
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm font-medium">Live</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-red-600">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm font-medium">Offline</span>
                </div>
              )}
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
              <Bell className="h-5 w-5" />
              {/* Notification badge */}
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-danger-400 ring-2 ring-white"></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
