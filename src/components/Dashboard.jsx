import React, { useState, useEffect, useMemo } from 'react';
import './Dashboard.css';
import { supabase } from '../lib/supabase';
import { 
  BarChart2, 
  Wallet, 
  Download, 
  TrendingUp, 
  History, 
  Calendar,
  LogOut,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  CheckCircle,
  Moon,
  Sun,
  ChevronUp,
  ChevronDown,
  Users,
  Settings,
  Bell,
  Search
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { useDashboardData } from '../hooks/useDashboardData';
export default function Dashboard() {
  const { loading, metrics, leaderboard, topDestinations, dailyChart, monthlyChart } = useDashboardData();
  const [isMounted, setIsMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'mtd', direction: 'desc' });
  const [chartFilter, setChartFilter] = useState('30D');
  
  // Phase 3 States
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Phase 4 States
  const [activeView, setActiveView] = useState('dashboard');

  const mockNotifications = [
    { id: 1, text: '🔥 Amit hit 100% of his sales target!', time: '10 mins ago', type: 'success' },
    { id: 2, text: 'Database sync completed successfully.', time: '1 hour ago', type: 'info' },
    { id: 3, text: 'System maintenance scheduled for midnight.', time: '5 hours ago', type: 'warning' }
  ];

  useEffect(() => {
    setIsMounted(true);
    // Check system preference on mount
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      document.body.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.body.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.body.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedLeaderboard = useMemo(() => {
    let sortableItems = [...leaderboard];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (typeof aValue === 'string' && aValue.startsWith('₹')) {
          aValue = parseFloat(aValue.replace(/[^0-9.-]+/g,""));
          bValue = parseFloat(bValue.replace(/[^0-9.-]+/g,""));
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [leaderboard, sortConfig]);

  const finalLeaderboard = useMemo(() => {
    return sortedLeaderboard.filter(row => 
      row.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedLeaderboard, searchQuery]);

  const filteredDailyChart = useMemo(() => {
    if (chartFilter === '7D') return dailyChart.slice(-7);
    if (chartFilter === '14D') return dailyChart.slice(-14);
    return dailyChart;
  }, [dailyChart, chartFilter]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate network request delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  const exportToCSV = () => {
    setIsDownloading(true);
    
    const headers = ['Rank', 'Name', 'Day Sales', 'MTD Sales', 'MTD Revenue', 'ARPU', 'Target %', 'Prev Month'];
    const csvRows = [headers.join(',')];
    
    leaderboard.forEach((row, i) => {
      const csvRow = [
        i + 1,
        `"${row.name}"`,
        row.day,
        row.mtd,
        `"${row.mtdRev}"`,
        `"${row.arpu}"`,
        row.target,
        row.pvMonth
      ];
      csvRows.push(csvRow.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'sales_leaderboard.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      setIsDownloading(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
           <div className="skeleton skeleton-text" style={{width: '150px', height: '30px'}}></div>
           <div className="header-actions">
              <div className="skeleton skeleton-text" style={{width: '300px', height: '30px'}}></div>
           </div>
        </header>
        <div className="metrics-grid">
           {[1,2,3,4].map(i => <div key={i} className="metric-card skeleton-block" style={{height: '140px'}}></div>)}
        </div>
        <div className="middle-grid">
           <div className="card skeleton-block" style={{height: '400px'}}></div>
           <div className="card skeleton-block" style={{height: '400px'}}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-text"><span className="logo-v">V</span>oyx</div>
        </div>
        <nav className="sidebar-nav">
          <a className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}><BarChart2 size={18} /> Dashboard</a>
          <a className={`nav-item ${activeView === 'wallet' ? 'active' : ''}`} onClick={() => setActiveView('wallet')}><Wallet size={18} /> Wallet Summary</a>
          <a className={`nav-item ${activeView === 'users' ? 'active' : ''}`} onClick={() => setActiveView('users')}><Users size={18} /> Users</a>
          <a className={`nav-item ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setActiveView('settings')}><Settings size={18} /> Settings</a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-title-area">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Sales Analytics</h2>
            <div className="date-pill">30 Jun 2026</div>
          </div>
          
          <div className="header-actions">
            {/* Notification Bell */}
            <div className="notification-bell" onClick={() => setShowNotifications(!showNotifications)}>
              <Bell size={18} color="var(--text-gray)" />
              <div className="notification-dot"></div>
              
              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notifications-title">Notifications</div>
                  {mockNotifications.map(notif => (
                    <div key={notif.id} className="notification-item">
                      <div className="notif-text">
                        {notif.text}
                        <div className="notif-time">{notif.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="btn btn-ghost" onClick={toggleDarkMode} title="Toggle Theme">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              className="btn btn-ghost" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw size={16} className={isRefreshing ? "spin-animation" : ""} /> 
            </button>
            <button 
              className={`btn ${isDownloading ? 'btn-success' : 'btn-dark'} dynamic-btn`}
              onClick={exportToCSV}
              disabled={isDownloading}
            >
              {isDownloading ? <CheckCircle size={16} /> : <Download size={16} />} 
              {isDownloading ? 'Downloaded' : 'Export CSV'}
            </button>
            
            <div className="user-profile">
              <div className="user-info">
                <span className="user-name">Voyx Admin</span>
                <span className="user-logout">Logout <LogOut size={12} className="logout-icon"/></span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        {activeView === 'dashboard' && (
        <div className="dashboard-container">
        {/* Top Metric Cards */}
        <div className="metrics-grid">
          {/* Card 1 */}
          <div className="metric-card dark-card">
            <div className="card-title">TODAY PERFORMANCE</div>
            <div className="card-value-container">
              <span className="card-value highlight">{metrics.todayOrders}</span>
              <span className="card-subtitle">Orders</span>
            </div>
            <div className="card-revenue">
              <span>₹{(metrics.todayRevenue / 1000).toFixed(2)}K Revenue</span>
              <div className="trend-indicator trend-up">
                <ArrowUpRight size={12} />
                <span>12.5%</span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="metric-card">
            <div className="card-icon-title">
              <div className="icon-wrapper orange-bg"><TrendingUp size={14} color="#f26522" /></div>
              <span>JUNE MTD</span>
            </div>
            <div className="card-value">{metrics.mtdOrders}</div>
            <div className="card-revenue text-gray">
              <span><span className="bold-gray">₹{(metrics.mtdRevenue / 1000).toFixed(2)}K</span> Revenue</span>
              <div className="trend-indicator trend-up">
                <ArrowUpRight size={12} />
                <span>8.2%</span>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="metric-card">
            <div className="card-icon-title">
              <div className="icon-wrapper gray-bg"><History size={14} color="#717a8e" /></div>
              <span>PREV MONTH (SAME DAY)</span>
            </div>
            <div className="card-value">{metrics.prevMonthSameDayOrders}</div>
            <div className="card-revenue text-gray">
              <span><span className="bold-gray">₹{(metrics.prevMonthSameDayRevenue / 1000).toFixed(2)}K</span> Revenue</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="metric-card">
            <div className="card-icon-title">
              <div className="icon-wrapper gray-bg"><Calendar size={14} color="#717a8e" /></div>
              <span>PREV MONTH</span>
            </div>
            <div className="card-value">{metrics.prevMonthOrders}</div>
            <div className="card-revenue text-gray">
              <span><span className="bold-gray">₹{(metrics.prevMonthRevenue / 1000).toFixed(2)}K</span> Revenue</span>
              <div className="trend-indicator trend-down">
                <ArrowDownRight size={12} />
                <span>2.1%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section */}
        <div className="middle-grid">
          {/* Leaderboard Table */}
          <div className="card leaderboard-card">
            <div className="card-header">
              <div className="header-title-container">
                <BarChart2 size={16} className="header-icon"/> 
                <span className="header-title">DAILY LEADERBOARD</span>
              </div>
              
              <div className="search-container">
                <Search size={14} className="search-icon" />
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Search sales rep..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th onClick={() => handleSort('name')}>SALES_R {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="sort-icon"/> : <ChevronDown size={12} className="sort-icon"/>)}</th>
                  <th onClick={() => handleSort('day')}>#DAY {sortConfig.key === 'day' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="sort-icon"/> : <ChevronDown size={12} className="sort-icon"/>)}</th>
                  <th onClick={() => handleSort('mtd')}>#MTD {sortConfig.key === 'mtd' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="sort-icon"/> : <ChevronDown size={12} className="sort-icon"/>)}</th>
                  <th onClick={() => handleSort('mtdRev')}>MTD REV {sortConfig.key === 'mtdRev' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="sort-icon"/> : <ChevronDown size={12} className="sort-icon"/>)}</th>
                  <th onClick={() => handleSort('arpu')}>ARPU {sortConfig.key === 'arpu' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="sort-icon"/> : <ChevronDown size={12} className="sort-icon"/>)}</th>
                  <th onClick={() => handleSort('target')}>TARGET {sortConfig.key === 'target' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="sort-icon"/> : <ChevronDown size={12} className="sort-icon"/>)}</th>
                  <th onClick={() => handleSort('pvMonth')}>#PV_MONTH {sortConfig.key === 'pvMonth' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="sort-icon"/> : <ChevronDown size={12} className="sort-icon"/>)}</th>
                </tr>
              </thead>
              <tbody>
                {finalLeaderboard.length > 0 ? finalLeaderboard.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td className="font-bold">{row.name}</td>
                    <td>
                      <div className={`day-val ${row.day > 0 ? 'text-green' : 'text-gray'}`}>
                        {row.day}
                        {row.dayRating && <div className="day-rating">₹{row.dayRating}</div>}
                      </div>
                    </td>
                    <td className="text-primary font-bold">{row.mtd}</td>
                    <td>{row.mtdRev}</td>
                    <td>{row.arpu}</td>
                    <td>
                      <div className="target-cell">
                        <div className="target-text">
                          <span className="font-bold">{row.target}%</span>
                          <span className="target-num">{row.targetNum}</span>
                        </div>
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: isMounted ? `${Math.min(row.target, 100)}%` : '0%' }}></div>
                        </div>
                      </div>
                    </td>
                    <td>{row.pvMonth}</td>
                  </tr>
                )) : <tr><td colSpan="8" style={{textAlign: 'center'}}>No data available</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Top Destinations */}
          <div className="card destinations-card">
            <div className="card-header dark-header">
              <div className="icon-wrapper white-bg"><TrendingUp size={14} color="#151a2d"/></div>
              <span className="header-title">TOP DESTINATIONS</span>
            </div>
            
            <div className="destinations-list">
              {topDestinations.map((dest, index) => (
                <div key={index} className="destination-item">
                  <span className="destination-name">{dest.name}</span>
                  <span className="destination-count">{dest.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section - Charts */}
        <div className="charts-grid">
          {/* Daily Summary Chart */}
          <div className="card chart-card">
            <div className="chart-header">
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-gray)'}}>
                <BarChart2 size={16} className="header-icon"/> 
                <span className="header-title">DAILY SUMMARY</span>
              </div>
              <div className="chart-filters">
                <button className={`filter-btn ${chartFilter === '7D' ? 'active' : ''}`} onClick={() => setChartFilter('7D')}>7D</button>
                <button className={`filter-btn ${chartFilter === '14D' ? 'active' : ''}`} onClick={() => setChartFilter('14D')}>14D</button>
                <button className={`filter-btn ${chartFilter === '30D' ? 'active' : ''}`} onClick={() => setChartFilter('30D')}>30D</button>
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={250}>
                {filteredDailyChart.length > 0 ? (
                  <LineChart data={filteredDailyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} angle={-45} textAnchor="end" height={40}/>
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#f26522" strokeWidth={2} dot={{ r: 3, fill: '#f26522', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </LineChart>
                ) : <div style={{textAlign: 'center', paddingTop: '100px', color: '#9ca3af'}}>No data</div>}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Summary Chart */}
          <div className="card chart-card">
            <div className="card-header">
              <BarChart2 size={16} className="header-icon"/> 
              <span className="header-title">MONTHLY SUMMARY</span>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={250}>
                {monthlyChart.length > 0 ? (
                  <AreaChart data={monthlyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f26522" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#f26522" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#f26522" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" dot={{ r: 3, fill: '#f26522', strokeWidth: 0 }} />
                  </AreaChart>
                ) : <div style={{textAlign: 'center', paddingTop: '100px', color: '#9ca3af'}}>No data</div>}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        </div>
        )}

        {/* Mock Views for other pages */}
        {activeView === 'wallet' && (
          <div className="dashboard-container" style={{ animation: 'slideUpFadeIn 0.5s ease-out forwards' }}>
            <div className="card">
              <div className="card-header">
                <Wallet size={16} className="header-icon"/> 
                <span className="header-title">WALLET SUMMARY</span>
              </div>
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '16px' }}>₹24,500.00</h1>
                <p style={{ color: 'var(--text-gray)', marginBottom: '32px' }}>Available Balance</p>
                <button className="btn btn-dark" style={{ margin: '0 auto' }}>Withdraw Funds</button>
              </div>
            </div>
          </div>
        )}

        {activeView === 'users' && (
          <div className="dashboard-container" style={{ animation: 'slideUpFadeIn 0.5s ease-out forwards' }}>
            <div className="card">
              <div className="card-header">
                <Users size={16} className="header-icon"/> 
                <span className="header-title">USER MANAGEMENT</span>
              </div>
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <Users size={64} color="var(--border-color)" style={{ margin: '0 auto 16px' }}/>
                <h3 style={{ color: 'var(--text-dark)' }}>No Users Selected</h3>
                <p style={{ color: 'var(--text-gray)', marginTop: '8px' }}>Select a user from the directory to view details.</p>
              </div>
            </div>
          </div>
        )}

        {activeView === 'settings' && (
          <div className="dashboard-container" style={{ animation: 'slideUpFadeIn 0.5s ease-out forwards' }}>
            <div className="card">
              <div className="card-header">
                <Settings size={16} className="header-icon"/> 
                <span className="header-title">SYSTEM SETTINGS</span>
              </div>
              <div style={{ padding: '24px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
                  <div>
                    <h4 style={{ color: 'var(--text-dark)', marginBottom: '4px' }}>Email Notifications</h4>
                    <p style={{ color: 'var(--text-gray)', fontSize: '0.8rem' }}>Receive daily summary reports</p>
                  </div>
                  <div style={{ width: '40px', height: '20px', background: 'var(--primary)', borderRadius: '10px', position: 'relative' }}>
                    <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', right: '2px', top: '2px' }}></div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ color: 'var(--text-dark)', marginBottom: '4px' }}>Two-Factor Authentication</h4>
                    <p style={{ color: 'var(--text-gray)', fontSize: '0.8rem' }}>Secure your account with 2FA</p>
                  </div>
                  <div style={{ width: '40px', height: '20px', background: 'var(--border-color)', borderRadius: '10px', position: 'relative' }}>
                    <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', left: '2px', top: '2px' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
