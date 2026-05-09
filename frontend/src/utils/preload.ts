// Named import functions — used for both lazy() component creation
// and on-hover prefetch of lazy chunks.
// Calling any of these triggers the dynamic import(), which starts
// loading the chunk. React.lazy() will then find it already cached.

export const preload = {
  staffReceiveParcel: () => import('../components/StaffReceiveParcel'),
  staffDeliveryOut: () => import('../components/StaffDeliveryOut'),
  historyDashboard: () => import('../components/HistoryDashboard'),
  userList: () => import('../components/UserList'),
  residentMyParcels: () => import('../components/ResidentMyParcels'),
};
