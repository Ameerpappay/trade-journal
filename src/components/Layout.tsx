import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()

  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <h1 className="logo">Trade Journal</h1>
          <nav className="nav">
            <Link 
              to="/trades" 
              className={location.pathname === '/trades' ? 'nav-link active' : 'nav-link'}
            >
              Trades
            </Link>
            <Link 
              to="/add-trade" 
              className={location.pathname === '/add-trade' ? 'nav-link active' : 'nav-link'}
            >
              Add Trade
            </Link>
            <Link 
              to="/settings" 
              className={location.pathname === '/settings' ? 'nav-link active' : 'nav-link'}
            >
              Settings
            </Link>
          </nav>
          <div className="profile-icon">👤</div>
        </div>
      </header>
      <main className="main">
        <div className="container">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout 