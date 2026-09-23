import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Download,
  Trash2,
  RefreshCw,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Radio,
  ExternalLink,
  Info
} from 'lucide-react';
import { AuditLogEntry } from '../types';
import { fetchAuditLogsApi, clearAuditLogsApi } from '../services/api';

interface AuditLogsPageProps {
  wsConnected?: boolean;
  onNavigateTab?: (tab: any) => void;
}

export const AuditLogsPage: React.FC<AuditLogsPageProps> = ({
  wsConnected = true,
  onNavigateTab,
}) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLogsApi({
        limit: 150,
        event: selectedFilter === 'ALL' ? undefined : selectedFilter,
        search: searchQuery || undefined,
      });
      setLogs(data.logs || []);
    } catch (err: any) {
      console.warn('Failed loading audit logs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [selectedFilter]);

  // Handle Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const showNotice = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3000);
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to purge all transaction and audit logs from the database?')) {
      return;
    }
    try {
      await clearAuditLogsApi();
      setLogs([]);
      showNotice('Audit logs purged successfully');
    } catch (err: any) {
      showNotice(err.message || 'Failed to clear logs');
    }
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `novaquant_audit_log_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice('Exported JSON audit log');
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Date', 'Event', 'Status', 'Action', 'Reason', 'IP', 'Metadata'];
    const rows = logs.map((l) => [
      l.id || '',
      l.timestamp,
      new Date(l.timestamp).toISOString(),
      `"${l.event}"`,
      `"${l.status}"`,
      `"${(l.action || '').replace(/"/g, '""')}"`,
      `"${(l.reason || '').replace(/"/g, '""')}"`,
      l.ip || '',
      `"${(l.metadata || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `novaquant_audit_log_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice('Exported CSV audit log');
  };

  // Metrics computation
  const metrics = useMemo(() => {
    const total = logs.length;
    const stopLossCount = logs.filter((l) => l.event.includes('STOP_LOSS')).length;
    const ordersCount = logs.filter((l) => l.event.includes('ORDER_PLACED') || l.event.includes('ORDER_FILLED')).length;
    const rejectedCount = logs.filter((l) => l.event.includes('REJECTED') || l.status === 'REJECTED').length;
    return { total, stopLossCount, ordersCount, rejectedCount };
  }, [logs]);

  const getEventBadge = (log: AuditLogEntry) => {
    const ev = log.event;
    if (ev.includes('STOP_LOSS')) {
      return {
        bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        icon: AlertTriangle,
        label: 'Stop-Loss Defense',
      };
    }
    if (ev.includes('TAKE_PROFIT')) {
      return {
        bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        icon: CheckCircle2,
        label: 'Take-Profit Liquidated',
      };
    }
    if (ev.includes('REJECTED')) {
      return {
        bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        icon: XCircle,
        label: 'Validation Blocked',
      };
    }
    if (ev.includes('ORDER_PLACED') || ev.includes('ORDER_FILLED')) {
      return {
        bg: 'bg-[#bf9b42]/20 text-[#f5e6b3] border-[#bf9b42]/50',
        icon: ArrowUpRight,
        label: 'Order Executed',
      };
    }
    if (ev.includes('EMERGENCY_STOP')) {
      return {
        bg: 'bg-red-600/30 text-red-300 border-red-500/50',
        icon: AlertTriangle,
        label: 'Emergency Breaker',
      };
    }
    return {
      bg: 'bg-slate-800 text-slate-300 border-slate-700',
      icon: Activity,
      label: log.event.replace(/_/g, ' '),
    };
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastNotice && (
        <div className="fixed top-5 right-5 z-50 rounded-xl border border-[#bf9b42]/50 bg-[#022824] px-4 py-2.5 text-xs font-semibold text-[#f5e6b3] shadow-xl">
          {toastNotice}
        </div>
      )}

      {/* Top Banner with WebSocket Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#bf9b42]/30 bg-[#033631]/90 p-5 shadow-lg backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#bf9b42]/20 text-[#bf9b42] border border-[#bf9b42]/40">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#f5e6b3] flex items-center gap-2">
                <span>Transaction &amp; Regulatory Audit</span>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border border-emerald-500/40 bg-emerald-950/70 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {wsConnected ? 'WS STREAM LIVE' : 'WS RECONNECTING'}
                </span>
              </h1>
              <p className="text-xs text-[#bf9b42]/80 mt-0.5">
                Cryptographically tracked record of real order executions, stop-loss protection liquidations, pre-flight risk checks, and system events.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => loadLogs()}
            className="flex items-center gap-1.5 rounded-xl border border-[#bf9b42]/40 bg-[#022824] px-3 py-2 text-xs font-semibold text-[#f5e6b3] hover:bg-[#04443e] transition-colors cursor-pointer"
            title="Refresh logs from database"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-[#bf9b42]/40 bg-[#022824] px-3 py-2 text-xs font-semibold text-[#f5e6b3] hover:bg-[#04443e] transition-colors cursor-pointer"
            title="Export CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 rounded-xl border border-[#bf9b42]/40 bg-[#022824] px-3 py-2 text-xs font-semibold text-[#f5e6b3] hover:bg-[#04443e] transition-colors cursor-pointer"
            title="Export JSON"
          >
            <Download className="h-3.5 w-3.5" />
            <span>JSON</span>
          </button>

          <button
            onClick={handleClearLogs}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/50 transition-colors cursor-pointer"
            title="Clear all logs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Purge</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-[#bf9b42]/30 bg-[#022824]/90 p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#bf9b42]/80 text-xs">
            <span>Total Audit Entries</span>
            <Activity className="h-4 w-4 text-[#bf9b42]" />
          </div>
          <div className="mt-2 font-mono text-xl font-bold text-[#f5e6b3]">
            {metrics.total}
          </div>
          <div className="text-[10px] text-[#bf9b42]/70 mt-0.5">Verified audit records</div>
        </div>

        <div className="rounded-xl border border-[#bf9b42]/30 bg-[#022824]/90 p-4 shadow-sm">
          <div className="flex items-center justify-between text-rose-300 text-xs">
            <span>Stop-Loss Defenses</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 font-mono text-xl font-bold text-rose-400">
            {metrics.stopLossCount}
          </div>
          <div className="text-[10px] text-rose-300/70 mt-0.5">Capital protection triggers</div>
        </div>

        <div className="rounded-xl border border-[#bf9b42]/30 bg-[#022824]/90 p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-300 text-xs">
            <span>Orders Routed</span>
            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 font-mono text-xl font-bold text-emerald-400">
            {metrics.ordersCount}
          </div>
          <div className="text-[10px] text-emerald-300/70 mt-0.5">Executed trade orders</div>
        </div>

        <div className="rounded-xl border border-[#bf9b42]/30 bg-[#022824]/90 p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-300 text-xs">
            <span>Risk Interceptions</span>
            <ShieldCheck className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 font-mono text-xl font-bold text-amber-400">
            {metrics.rejectedCount}
          </div>
          <div className="text-[10px] text-amber-300/70 mt-0.5">Unsafe orders intercepted</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-[#bf9b42]/30 bg-[#033631]/80 p-3 shadow-sm">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Logs' },
            { id: 'ORDER_PLACED', label: 'Orders' },
            { id: 'STOP_LOSS_TRIGGERED', label: 'Stop Loss' },
            { id: 'TAKE_PROFIT_TRIGGERED', label: 'Take Profit' },
            { id: 'ORDER_VALIDATION_REJECTED', label: 'Validation Rejections' },
            { id: 'STOP_LOSS_MODIFIED', label: 'SL Trailing' },
            { id: 'BOT_STATUS_CHANGED', label: 'Bot Status' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                selectedFilter === tab.id
                  ? 'bg-[#bf9b42] text-[#022824]'
                  : 'text-[#f5e6b3]/80 hover:bg-[#022824] hover:text-[#f5e6b3]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#bf9b42]/60" />
          <input
            type="text"
            placeholder="Search by action, reason, or pair..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#bf9b42]/30 bg-[#022824] pl-9 pr-3 py-1.5 text-xs text-[#f5e6b3] placeholder-[#bf9b42]/50 focus:border-[#bf9b42] focus:outline-none"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-[#bf9b42]/30 bg-[#033631]/80 shadow-lg overflow-hidden backdrop-blur-md">
        <div className="p-4 border-b border-[#bf9b42]/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-[#bf9b42] animate-pulse" />
            <h3 className="text-sm font-bold text-[#f5e6b3]">Real-time Transaction Event Ledger</h3>
          </div>
          <span className="text-xs text-[#bf9b42]/80">Showing {logs.length} logged records</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-[#bf9b42]/70">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#bf9b42]" />
            Loading real-time audit ledger...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#bf9b42]/70">
            <Info className="h-8 w-8 mx-auto mb-2 text-[#bf9b42]/60" />
            No audit records match the current filter or search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#bf9b42]/20 text-[#bf9b42]/70 bg-[#022824]/60">
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Event Type</th>
                  <th className="py-3 px-4 font-semibold">Action &amp; Target</th>
                  <th className="py-3 px-4 font-semibold">Institutional Reason &amp; Verification</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 text-right font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#bf9b42]/15">
                {logs.map((log, idx) => {
                  const badge = getEventBadge(log);
                  const Icon = badge.icon;
                  const dateStr = new Date(log.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });
                  const fullDate = new Date(log.timestamp).toLocaleDateString();

                  return (
                    <tr
                      key={log.id || idx}
                      className="hover:bg-[#022824]/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="py-3 px-4 font-mono text-[#bf9b42]/90 whitespace-nowrap">
                        <div className="font-bold text-[#f5e6b3]">{dateStr}</div>
                        <div className="text-[10px] text-[#bf9b42]/60">{fullDate}</div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold border ${badge.bg}`}
                        >
                          <Icon className="h-3 w-3" />
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-[#f5e6b3] max-w-[220px] truncate">
                          {log.action || log.event}
                        </div>
                        {log.ip && (
                          <div className="text-[10px] text-[#bf9b42]/60 font-mono">
                            IP: {log.ip}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-xs text-[#f5e6b3]/90 line-clamp-2 max-w-md">
                          {log.reason || 'Verification executed successfully.'}
                        </div>
                        {log.error && (
                          <div className="text-[11px] text-rose-400 mt-0.5">
                            Error: {log.error}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : log.status === 'WARNING'
                              ? 'bg-amber-500/20 text-amber-300'
                              : log.status === 'REJECTED' || log.status === 'FAILED'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="rounded-lg border border-[#bf9b42]/40 bg-[#022824] px-2.5 py-1 text-[11px] font-semibold text-[#f5e6b3] hover:bg-[#04443e] transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Modal Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-2xl border border-[#bf9b42]/40 bg-[#033631] p-6 shadow-2xl text-[#bf9b42]">
            <div className="flex items-center justify-between border-b border-[#bf9b42]/20 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#bf9b42]" />
                <h3 className="text-base font-bold text-[#f5e6b3]">Audit Log Details</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1 text-[#bf9b42]/70 hover:bg-[#022824] hover:text-[#f5e6b3] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#bf9b42]/20 bg-[#022824] p-3">
                  <span className="text-[10px] text-[#bf9b42]/70 uppercase font-semibold">Event Type</span>
                  <div className="font-mono font-bold text-[#f5e6b3] mt-0.5">{selectedLog.event}</div>
                </div>
                <div className="rounded-xl border border-[#bf9b42]/20 bg-[#022824] p-3">
                  <span className="text-[10px] text-[#bf9b42]/70 uppercase font-semibold">Status</span>
                  <div className="font-mono font-bold text-emerald-400 mt-0.5">{selectedLog.status}</div>
                </div>
              </div>

              <div className="rounded-xl border border-[#bf9b42]/20 bg-[#022824] p-3">
                <span className="text-[10px] text-[#bf9b42]/70 uppercase font-semibold">Timestamp</span>
                <div className="font-mono text-[#f5e6b3] mt-0.5">
                  {new Date(selectedLog.timestamp).toISOString()} ({selectedLog.timestamp})
                </div>
              </div>

              <div className="rounded-xl border border-[#bf9b42]/20 bg-[#022824] p-3">
                <span className="text-[10px] text-[#bf9b42]/70 uppercase font-semibold">Action &amp; Summary</span>
                <div className="text-[#f5e6b3] font-semibold mt-0.5">{selectedLog.action}</div>
                <p className="mt-1 text-[#f5e6b3]/80">{selectedLog.reason}</p>
              </div>

              {selectedLog.metadata && (
                <div className="rounded-xl border border-[#bf9b42]/20 bg-[#022824] p-3">
                  <span className="text-[10px] text-[#bf9b42]/70 uppercase font-semibold">Raw Metadata Payload</span>
                  <pre className="mt-1.5 max-h-48 overflow-y-auto rounded-lg bg-black/50 p-2.5 font-mono text-[11px] text-[#f5e6b3] whitespace-pre-wrap">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedLog.metadata), null, 2);
                      } catch {
                        return selectedLog.metadata;
                      }
                    })()}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-xl bg-[#bf9b42] px-4 py-2 text-xs font-bold text-[#022824] hover:bg-[#d4ad4e] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
