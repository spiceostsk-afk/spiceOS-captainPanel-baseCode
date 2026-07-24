import React, { useEffect, useState } from 'react';
import { useRestaurant } from '../context/useRestaurant';
import { Calendar, DollarSign, ClipboardList, Utensils, Bell, FileText, RefreshCw, Clock, Download } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import './Reports.css';

function Reports() {
  const { shiftReports, fetchShiftReports, loading } = useRestaurant();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchShiftReports();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchShiftReports();
    setIsRefreshing(false);
  };

  const handleExportCsv = () => {
    if (shiftReports.length === 0) return;
    const headers = ['Shift Date', 'Shift Start', 'Shift End', 'Captain', 'Duration', 'Tables Served', 'Orders', 'Waiter Calls', 'Total Revenue'];
    const rows = shiftReports.map((r) => [
      formatDate(r.shift_end),
      formatTime(r.shift_start),
      formatTime(r.shift_end),
      r.captain_name || 'Julian Rossi',
      calculateDuration(r.shift_start, r.shift_end),
      r.total_tables_served,
      r.total_orders,
      r.total_waiter_calls,
      parseFloat(r.total_revenue || 0).toFixed(2),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shift-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const calculateDuration = (startIso, endIso) => {
    if (!startIso || !endIso) return '--';
    const start = new Date(startIso);
    const end = new Date(endIso);
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m`;
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hrs}h ${mins}m`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '--';
    const date = new Date(isoString);
    return date.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Cumulative Metrics
  const totalShifts = shiftReports.length;
  const totalRevenue = shiftReports.reduce((sum, r) => sum + parseFloat(r.total_revenue || 0), 0);
  const totalTables = shiftReports.reduce((sum, r) => sum + parseInt(r.total_tables_served || 0), 0);
  const totalOrders = shiftReports.reduce((sum, r) => sum + parseInt(r.total_orders || 0), 0);

  return (
    <div className="reports-page" id="reports-page">
      {/* Header */}
      <div className="reports-header">
        <div>
          <h1 className="page-title">Shift Reports & History</h1>
          <p className="page-subtitle">View and audit finalized shift logs and revenue reports</p>
        </div>
        <div className="reports-header__actions">
          <button
            className="reports-export-btn"
            onClick={handleExportCsv}
            disabled={shiftReports.length === 0}
            title="Export shift history as CSV"
            id="btn-reports-export"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button
            className="reports-refresh-btn"
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            title="Refresh History"
            id="btn-reports-refresh"
          >
            <RefreshCw className={isRefreshing ? 'animate-spin' : ''} size={16} />
            <span>Sync History</span>
          </button>
        </div>
      </div>

      {/* Cumulative Stats Grid */}
      <div className="reports-stats-grid">
        <StatCard 
          label="Shifts Audited" 
          value={totalShifts} 
          icon={FileText} 
          variant="total" 
          id="stat-shifts-count"
        />
        <StatCard 
          label="Cumulative Revenue" 
          value={`$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          icon={DollarSign} 
          variant="available" 
          id="stat-cumulative-revenue"
        />
        <StatCard 
          label="Total Tables Seated" 
          value={totalTables} 
          icon={ClipboardList} 
          variant="occupied" 
          id="stat-total-tables"
        />
        <StatCard 
          label="Total Orders Processed" 
          value={totalOrders} 
          icon={Utensils} 
          variant="waiting" 
          id="stat-total-orders"
        />
      </div>

      {/* Table Section */}
      <div className="reports-table-container">
        <div className="reports-table-header">
          <h3>Shift History Logs</h3>
          <span className="reports-badge">{totalShifts} {totalShifts === 1 ? 'Report' : 'Reports'}</span>
        </div>

        {loading && shiftReports.length === 0 ? (
          <div className="reports-loading">
            <RefreshCw className="animate-spin text-primary" size={32} />
            <p>Loading historical records...</p>
          </div>
        ) : shiftReports.length === 0 ? (
          <div className="reports-empty-state">
            <div className="empty-icon-container">
              <FileText size={48} />
            </div>
            <h4>No Shift Reports Found</h4>
            <p>Once you end an active shift and submit the stats, the generated report log will appear here.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Shift Date</th>
                  <th>Shift Time range</th>
                  <th>Captain</th>
                  <th>Duration</th>
                  <th>Tables</th>
                  <th>Orders</th>
                  <th>Calls</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {shiftReports.map((report) => (
                  <tr key={report.id || report.created_at}>
                    <td className="font-semibold text-primary-dark">
                      {formatDate(report.shift_end)}
                    </td>
                    <td>
                      <div className="shift-time-range">
                        <span>{formatTime(report.shift_start)}</span>
                        <span className="arrow">➜</span>
                        <span>{formatTime(report.shift_end)}</span>
                      </div>
                    </td>
                    <td>{report.captain_name || 'Julian Rossi'}</td>
                    <td>
                      <span className="duration-pill">
                        <Clock size={12} />
                        {calculateDuration(report.shift_start, report.shift_end)}
                      </span>
                    </td>
                    <td>{report.total_tables_served}</td>
                    <td>{report.total_orders}</td>
                    <td>{report.total_waiter_calls}</td>
                    <td className="font-bold text-revenue">
                      ${parseFloat(report.total_revenue || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
