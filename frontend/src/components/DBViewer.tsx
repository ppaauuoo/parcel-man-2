import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { dbViewerAPI } from '../utils/api';

interface Props {
  user: User;
  onLogout: () => void;
}

interface TableInfo {
  name: string;
  rowCount: number;
}

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

const DBViewer: React.FC<Props> = ({ user, onLogout }) => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState<{ columns?: string[]; rows?: Record<string, unknown>[]; rowCount?: number; error?: string } | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'query'>('browse');
  const limit = 100;

  // Load table list
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await dbViewerAPI.getTables();
        if (res.success) {
          setTables(res.tables);
          if (res.tables.length > 0 && !selectedTable) {
            setSelectedTable(res.tables[0].name);
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load tables');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load table data when selection changes
  const loadTableData = useCallback(async (tableName: string, off: number) => {
    try {
      setLoadingData(true);
      setError('');
      const res = await dbViewerAPI.getTableDetail(tableName, limit, off);
      if (res.success) {
        setColumns(res.schema);
        setRows(res.rows);
        setTotalRows(res.total);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load table data');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadTableData(selectedTable, offset);
    }
  }, [selectedTable, offset, loadTableData]);

  const handleTableClick = (name: string) => {
    setSelectedTable(name);
    setOffset(0);
    setQueryResult(null);
  };

  const handleQuery = async () => {
    if (!query.trim()) return;
    setQueryLoading(true);
    setQueryResult(null);
    try {
      const res = await dbViewerAPI.runQuery(query.trim());
      setQueryResult(res);
    } catch (err: any) {
      setQueryResult({ error: err.response?.data?.error || 'Query failed' });
    } finally {
      setQueryLoading(false);
    }
  };

  const totalPages = Math.ceil(totalRows / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
              🗄️ DB Viewer
            </h1>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">
                {user.username}
              </span>
              <button
                onClick={onLogout}
                className="px-3 py-1.5 text-xs sm:text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('browse')}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'browse'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📋 Browse Tables
            </button>
            <button
              onClick={() => setActiveTab('query')}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'query'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🔍 Run SQL
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        {activeTab === 'browse' ? (
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Sidebar — table list */}
            <div className="w-full lg:w-56 shrink-0">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tables
                </div>
                {loading ? (
                  <div className="p-4 text-center text-sm text-gray-400">Loading...</div>
                ) : (
                  <ul className="divide-y divide-gray-100 max-h-[60vh] lg:max-h-[70vh] overflow-y-auto">
                    {tables.map((t) => (
                      <li key={t.name}>
                        <button
                          onClick={() => handleTableClick(t.name)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors flex justify-between items-center ${
                            selectedTable === t.name ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                          }`}
                        >
                          <span className="truncate">{t.name}</span>
                          <span className="text-xs text-gray-400 ml-2 shrink-0">{t.rowCount}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Main — table data */}
            <div className="flex-1 min-w-0">
              {!selectedTable ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">
                  Select a table from the sidebar
                </div>
              ) : loadingData ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">
                  Loading...
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* Table header */}
                  <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-2 sm:gap-3">
                    <h2 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                      {selectedTable}
                    </h2>
                    <span className="text-xs text-gray-500">
                      {totalRows} rows
                    </span>
                    {/* Column badges */}
                    <div className="flex flex-wrap gap-1 ml-auto w-full sm:w-auto mt-1 sm:mt-0">
                      {columns.map((c) => (
                        <span
                          key={c.name}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-mono ${
                            c.pk ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {c.pk && '🔑 '}{c.name}
                          <span className="text-gray-400">{c.type}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Data table */}
                  <div className="overflow-x-auto">
                    {rows.length === 0 ? (
                      <div className="p-8 text-center text-gray-400">No data</div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            {columns.map((c) => (
                              <th
                                key={c.name}
                                className="px-2 sm:px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                              >
                                {c.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {rows.map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                              {columns.map((c) => (
                                <td
                                  key={c.name}
                                  className="px-2 sm:px-4 py-2 whitespace-nowrap text-gray-700 max-w-[200px] sm:max-w-xs truncate"
                                  title={String(row[c.name] ?? '')}
                                >
                                  {row[c.name] === null ? (
                                    <span className="text-gray-300 italic">NULL</span>
                                  ) : typeof row[c.name] === 'string' &&
                                    String(row[c.name]).startsWith('data:image') ? (
                                    <span className="text-blue-500 text-[10px]">[base64 image]</span>
                                  ) : (
                                    String(row[c.name])
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-500">
                        Page {currentPage} of {totalPages}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setOffset((o) => Math.max(0, o - limit))}
                          disabled={offset === 0}
                          className="px-2 sm:px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition-colors"
                        >
                          ← Prev
                        </button>
                        <button
                          onClick={() => setOffset((o) => (currentPage < totalPages ? o + limit : o))}
                          disabled={currentPage >= totalPages}
                          className="px-2 sm:px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition-colors"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* SQL Query Tab */
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 text-sm">Run SQL Query</h2>
              <p className="text-xs text-gray-500 mt-0.5">SELECT and PRAGMA only</p>
            </div>
            <div className="p-4">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="SELECT * FROM parcels LIMIT 10;"
                className="w-full h-28 sm:h-32 px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleQuery();
                  }
                }}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">Ctrl+Enter to run</span>
                <button
                  onClick={handleQuery}
                  disabled={queryLoading || !query.trim()}
                  className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-40 transition-colors"
                >
                  {queryLoading ? 'Running...' : '▶ Run'}
                </button>
              </div>
            </div>

            {/* Query result */}
            {queryResult && (
              <div className="border-t border-gray-200">
                {queryResult.error ? (
                  <div className="p-4 text-sm text-red-600 bg-red-50">
                    ❌ {queryResult.error}
                  </div>
                ) : (
                  <div>
                    <div className="px-4 py-2 bg-green-50 border-b border-gray-200 text-xs text-green-700">
                      ✅ {queryResult.rowCount} row{queryResult.rowCount !== 1 ? 's' : ''} returned
                    </div>
                    <div className="overflow-x-auto">
                      {queryResult.rows && queryResult.rows.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              {queryResult.columns?.map((col) => (
                                <th
                                  key={col}
                                  className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                                >
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {queryResult.rows.map((row, i) => (
                              <tr key={i} className="hover:bg-gray-50">
                                {queryResult.columns?.map((col) => (
                                  <td
                                    key={col}
                                    className="px-3 py-2 whitespace-nowrap text-gray-700 max-w-[200px] truncate"
                                    title={String(row[col] ?? '')}
                                  >
                                    {row[col] === null ? (
                                      <span className="text-gray-300 italic">NULL</span>
                                    ) : (
                                      String(row[col])
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-4 text-center text-gray-400">Query returned no rows</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DBViewer;
