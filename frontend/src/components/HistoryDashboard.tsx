import React, { useState, useEffect } from 'react';
import { User, Parcel } from '../types';
import { parcelsAPI } from '../utils/api';
import ImageModal from './ImageModal';

interface StaffDeliveryOutProps {
  user: User;
  onLogout: () => void;
}

const HistoryDashboard: React.FC<StaffDeliveryOutProps> = ({ user, onLogout }) => {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    room_number: '',
    start_date: '',
    end_date: '',
  });
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0,
  });
  const [selectedImage, setSelectedImage] = useState<{url: string; title: string} | null>(null);

  useEffect(() => {
    loadParcels();
  }, [filters, pagination.limit, pagination.offset]);

  const loadParcels = async () => {
    setLoading(true);
    try {
      const response = await parcelsAPI.getHistory({
        ...filters,
        limit: pagination.limit,
        offset: pagination.offset,
      });
      
      if (response.success) {
        setParcels(response.parcels);
        setPagination(prev => ({ ...prev, total: response.total }));
      }
    } catch (error) {
      console.error('Error loading parcels history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
    setPagination(prev => ({ ...prev, offset: 0 })); // Reset to first page
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, offset: 0 }));
    loadParcels();
  };

  const handleResetFilters = () => {
    setFilters({
      room_number: '',
      start_date: '',
      end_date: '',
    });
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    return status === 'pending' 
      ? 'bg-yellow-100 text-yellow-800' 
      : 'bg-green-100 text-green-800';
  };

  const getStatusText = (status: string) => {
    return status === 'pending' ? 'รอรับ' : 'รับแล้ว';
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 sm:py-4 space-y-2 sm:space-y-0">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">iCondo</h1>
              <p className="text-xs sm:text-sm text-gray-500">ประวัติพัสดุ</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <span className="text-xs sm:text-sm text-gray-600 truncate max-w-[200px] sm:max-w-none">
                {user.username} ({user.role === 'staff' ? 'เจ้าหน้าที่' : 'ผู้อาศัย'})
              </span>
              <button
                onClick={onLogout}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-2 sm:space-x-6 lg:space-x-8 overflow-x-auto">
            {user.role === 'staff' && (
              <>
                <button
                  className="text-blue-100 py-3 px-2 sm:px-3 lg:px-4 rounded-t-md font-medium text-xs sm:text-sm hover:text-white whitespace-nowrap flex-shrink-0"
                  onClick={() => window.location.href = '/receive-parcel'}
                >
                  รับพัสดุ
                </button>
                <button
                  className="text-blue-100 py-3 px-2 sm:px-3 lg:px-4 rounded-t-md font-medium text-xs sm:text-sm hover:text-white whitespace-nowrap flex-shrink-0"
                  onClick={() => window.location.href = '/delivery-out'}
                >
                  ส่งมอบพัสดุ
                </button>
              </>
            )}
            <button
              className="text-white py-3 px-2 sm:px-3 lg:px-4 rounded-t-md font-medium text-xs sm:text-sm bg-blue-700 whitespace-nowrap flex-shrink-0"
            >
              ประวัติ
            </button>
            {user.role === 'staff' && (
              <button
                className="text-blue-100 py-3 px-2 sm:px-3 lg:px-4 rounded-t-md font-medium text-xs sm:text-sm hover:text-white whitespace-nowrap flex-shrink-0"
                onClick={() => window.location.href = '/users'}
              >
                จัดการผู้ใช้
              </button>
            )}
            {user.role === 'resident' && (
              <button
                className="text-blue-100 py-3 px-2 sm:px-3 lg:px-4 rounded-t-md font-medium text-xs sm:text-sm hover:text-white whitespace-nowrap flex-shrink-0"
                onClick={() => window.location.href = '/my-parcels'}
              >
                พัสดุของฉัน
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">ค้นหาพัสดุ</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {user.role === 'staff' && (
              <div>
                <label htmlFor="room_number" className="block text-sm font-medium text-gray-700">
                  หมายเลขห้อง
                </label>
                <input
                  id="room_number"
                  name="room_number"
                  type="text"
                  value={filters.room_number}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="เช่น 101"
                />
              </div>
            )}
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                วันที่เริ่มต้น
              </label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                value={filters.start_date}
                onChange={handleFilterChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                วันที่สิ้นสุด
              </label>
              <input
                id="end_date"
                name="end_date"
                type="date"
                value={filters.end_date}
                onChange={handleFilterChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={handleSearch}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ค้นหา
              </button>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                รีเซ็ต
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">ทั้งหมด</dt>
                  <dd className="text-lg font-medium text-gray-900">{pagination.total}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">รอรับ</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {parcels.filter(p => p.status === 'pending').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">รับแล้ว</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {parcels.filter(p => p.status === 'collected').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Parcels Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  รายการพัสดุ
                </h3>
                <p className="mt-2 text-sm text-gray-700">
                  แสดง {parcels.length} รายการ จากทั้งหมด {pagination.total} รายการ
                </p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
              </div>
            ) : parcels.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่พบข้อมูล</h3>
                <p className="mt-1 text-sm text-gray-500">ไม่มีพัสดุที่ตรงกับเงื่อนไขการค้นหา</p>
              </div>
            ) : (
              <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                    <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              หมายเลขห้อง
                            </th>
                            <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              เลขพัสดุ
                            </th>
                            <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ผู้รับ
                            </th>
                            <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ขนส่ง
                            </th>
                            <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              เจ้าหน้าที่รับ
                            </th>
                            <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              เจ้าหน้าที่ส่ง
                            </th>
                            <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              วันที่รับ
                            </th>
                            <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              วันที่ส่งมอบ
                            </th>
                            <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              สถานะ
                            </th>
                            <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              รูปภาพ
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {parcels.map((parcel) => (
                            <tr key={parcel.id}>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                <span className="block sm:hidden text-xs text-gray-500 mb-1">ห้อง:</span>
                                {parcel.room_number || '-'}
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                                <span className="block sm:hidden text-xs text-gray-500 mb-1">เลขพัสดุ:</span>
                                <span className="block truncate max-w-[100px] sm:max-w-none">{parcel.tracking_number}</span>
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                <span className="block sm:hidden text-xs text-gray-500 mb-1">ผู้รับ:</span>
                                {parcel.resident_name || '-'}
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                <span className="block sm:hidden text-xs text-gray-500 mb-1">ขนส่ง:</span>
                                {parcel.carrier_name}
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                <span className="block sm:hidden text-xs text-gray-500 mb-1">รับโดย:</span>
                                {parcel.staff_in_name || '-'}
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                <span className="block sm:hidden text-xs text-gray-500 mb-1">ส่งโดย:</span>
                                {parcel.staff_out_name || '-'}
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                <span className="block sm:hidden text-xs text-gray-500 mb-1">รับเมื่อ:</span>
                                {formatDate(parcel.created_at)}
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                <span className="block sm:hidden text-xs text-gray-500 mb-1">ส่งเมื่อ:</span>
                                {parcel.collected_at ? formatDate(parcel.collected_at) : '-'}
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                <span className="block sm:hidden text-xs text-gray-500 mb-1">สถานะ:</span>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(parcel.status)}`}>
                                  {getStatusText(parcel.status)}
                                </span>
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                <span className="block sm:hidden text-xs text-gray-500 mb-1">รูปภาพ:</span>
                                <div className="flex gap-2">
                                  {parcel.photo_in_path && (
                                    <button
                                      onClick={() => setSelectedImage({
                                        url: parcel.photo_in_path!,
                                        title: `รูปรับพัสดุ - ${parcel.tracking_number}`
                                      })}
                                      className="relative group"
                                      title="รูปถ่ายตอนรับพัสดุ"
                                    >
                                      <img
                                        src={parcel.photo_in_path!}
                                        alt="Receive photo"
                                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded border-2 border-blue-200 cursor-pointer hover:border-blue-400 transition-colors"
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                      </div>
                                    </button>
                                  )}
                                  {parcel.photo_out_path && (
                                    <button
                                      onClick={() => setSelectedImage({
                                        url: parcel.photo_out_path!,
                                        title: `รูปส่งมอบพัสดุ - ${parcel.tracking_number}`
                                      })}
                                      className="relative group"
                                      title="รูปถ่ายตอนส่งมอบพัสดุ"
                                    >
                                      <img
                                        src={parcel.photo_out_path!}
                                        alt="Delivery photo"
                                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded border-2 border-green-200 cursor-pointer hover:border-green-400 transition-colors"
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                      </div>
                                    </button>
                                  )}
                                  {!parcel.photo_in_path && !parcel.photo_out_path && (
                                    <span className="text-gray-400 text-xs">ไม่มีรูปภาพ</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setPagination(prev => ({ 
                          ...prev, 
                          offset: Math.max(0, prev.offset - prev.limit) 
                        }))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        ก่อนหน้า
                      </button>
                      <button
                        onClick={() => setPagination(prev => ({ 
                          ...prev, 
                          offset: prev.offset + prev.limit 
                        }))}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        ถัดไป
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          แสดงรายการที่ <span className="font-medium">{pagination.offset + 1}</span> ถึง{' '}
                          <span className="font-medium">
                            {Math.min(pagination.offset + pagination.limit, pagination.total)}
                          </span>{' '}
                          จากทั้งหมด <span className="font-medium">{pagination.total}</span> รายการ
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => setPagination(prev => ({ 
                              ...prev, 
                              offset: Math.max(0, prev.offset - prev.limit) 
                            }))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          >
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            หน้า {currentPage} จาก {totalPages}
                          </span>
                          <button
                            onClick={() => setPagination(prev => ({ 
                              ...prev, 
                              offset: prev.offset + prev.limit 
                            }))}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          >
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={!!selectedImage}
        imageUrl={selectedImage?.url || null}
        title={selectedImage?.title}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
};

export default HistoryDashboard;
