import { Menu, Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

interface TopBarProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, string> = {
  '/': 'Dashboard Overview',
  '/expenses': 'Expense Management',
  '/revenue': 'Revenue Management',
  '/transactions': 'All Transactions',
  '/reports': 'Financial Reports',
  '/settings': 'Settings',
};

export default function TopBar({ onMenuClick }: TopBarProps) {
  const location = useLocation();
  const { state } = useApp();
  const title = pageTitles[location.pathname] || 'Dashboard';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="hamburger-btn" onClick={onMenuClick} aria-label="Toggle menu">
          <Menu size={24} />
        </button>
        <h2 className="topbar-title">{title}</h2>
      </div>
      <div className="topbar-right">
        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
          {state.settings.companyName}
        </span>
        <button className="btn-ghost" style={{ position: 'relative' }}>
          <Bell size={20} />
        </button>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          A
        </div>
      </div>
    </header>
  );
}
