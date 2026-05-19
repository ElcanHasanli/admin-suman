'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('users');
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    todayOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const customersRes = await fetch('http://localhost:5001/api/customers', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const ordersRes = await fetch('http://localhost:5001/api/orders', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        const customersData = await customersRes.json();
        const ordersData = await ordersRes.json();

        setCustomers(customersData);
        setOrders(ordersData);

        // Calculate stats
        const completedOrders = ordersData.filter((o: any) => o.status === 'completed');
        const totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + (o.price || 0), 0);

        setStats({
          totalCustomers: customersData.length,
          totalOrders: ordersData.length,
          todayOrders: completedOrders.length,
          totalRevenue: totalRevenue,
        });
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '280px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          padding: '24px 20px',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          position: 'fixed',
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>💧</div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 4px 0', color: '#1f2937' }}>
            SuMan
          </h1>
          <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
            Admin Panel
          </p>
        </div>

        {/* User Info */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            marginBottom: '24px',
            borderLeft: '3px solid #3b82f6',
          }}
        >
          <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
            Daxil olmuş:
          </p>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937', margin: '0 0 2px 0' }}>
            {user.name}
          </p>
          <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0, wordBreak: 'break-all' }}>
            {user.email}
          </p>
        </div>

        {/* Navigation */}
        <nav style={{ marginBottom: '32px' }}>
          {[
            { id: 'dashboard', label: '📊 İdarə Paneli' },
            { id: 'customers', label: '👥 Müştərilər' },
            { id: 'orders', label: '📦 Sifarişlər' },
            { id: 'history', label: '📈 Tarixçə' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                padding: '11px 14px',
                marginBottom: '6px',
                backgroundColor: activeTab === item.id ? '#f3f4f6' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                borderLeft: activeTab === item.id ? '3px solid #3b82f6' : '3px solid transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeTab === item.id ? '600' : '500',
                color: activeTab === item.id ? '#1f2937' : '#6b7280',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '11px 14px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fecaca';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#fee2e2';
          }}
        >
          🚪 Çıxış
        </button>
      </aside>

      {/* Main Content */}
      <main
        style={{
          marginLeft: '280px',
          flex: 1,
          padding: '32px',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#1f2937' }}>
            {activeTab === 'dashboard' && 'İdarə Paneli'}
            {activeTab === 'customers' && 'Müştərilər'}
            {activeTab === 'orders' && 'Sifarişlər'}
            {activeTab === 'history' && 'Tarixçə'}
          </h1>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Stats Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
                marginBottom: '32px',
              }}
            >
              <StatCard title="Aktiv Müştərilər" value={stats.totalCustomers} icon="👥" color="#3b82f6" />
              <StatCard title="Cəmi Sifarişlər" value={stats.totalOrders} icon="📦" color="#8b5cf6" />
              <StatCard title="Tamamlanmış" value={stats.todayOrders} icon="✅" color="#10b981" />
              <StatCard title="Ümumi Gəlir" value={`₼${stats.totalRevenue.toFixed(2)}`} icon="💰" color="#f59e0b" />
            </div>

            {/* Dashboard Message */}
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '24px',
                textAlign: 'center',
                color: '#6b7280',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              }}
            >
              <p>Hoş gəldiniz! Müştərilər, Sifarişlər və Tarixçə bölümlərini ziyarət edin.</p>
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div>
            {/* Add Button */}
            <div style={{ marginBottom: '20px' }}>
              <button
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                }}
              >
                ➕ Yeni Müştəri
              </button>
            </div>

            {/* Table */}
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse' as const,
                  fontSize: '13px',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>
                      Ad Soyad
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>
                      Telefon
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>
                      Ünvan
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>
                      Aktiv Bidon
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>
                      Borc
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
                        Yüklənir...
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
                        Müştəri tapılmadı
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer: any) => (
                      <tr
                        key={customer.id}
                        style={{ borderBottom: '1px solid #e5e7eb' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <td style={{ padding: '12px 16px', color: '#1f2937', fontWeight: '500' }}>
                          {customer.name} {customer.surname}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#1f2937' }}>
                          {customer.phone}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                          {customer.address}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#1f2937', fontWeight: '600' }}>
                          {customer.active_bidons}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#ef4444', fontWeight: '600' }}>
                          ₼{typeof customer.debt === 'string' ? parseFloat(customer.debt).toFixed(2) : customer.debt.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            {/* Add Button */}
            <div style={{ marginBottom: '20px' }}>
              <button
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                }}
              >
                ➕ Yeni Sifariş
              </button>
            </div>

            {/* Table */}
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse' as const,
                  fontSize: '13px',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>
                      Müştəri
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>
                      Kuryer
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>
                      Bidon
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>
                      Status
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>
                      Qiymət
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
                        Sifariş tapılmadı
                      </td>
                    </tr>
                  ) : (
                    orders.map((order: any) => (
                      <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px 16px', color: '#1f2937', fontWeight: '500' }}>
                          {order.name}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#1f2937' }}>
                          {order.courier_name || '-'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#1f2937' }}>
                          {order.bidons_count}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor: order.status === 'completed' ? '#dcfce7' : '#fef3c7',
                              color: order.status === 'completed' ? '#166534' : '#92400e',
                            }}
                          >
                            {order.status === 'completed' ? '✓ Tamamlandı' : '⏳ Gözləyən'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#1f2937', fontWeight: '600' }}>
                          ₼{order.price ? order.price.toFixed(2) : '0.00'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              color: '#6b7280',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            }}
          >
            📊 Tarixçə funksiyası hazırlanır...
          </div>
        )}
      </main>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
        borderTop: `3px solid ${color}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 8px 0', fontWeight: '500' }}>
            {title}
          </p>
          <p style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
            {value}
          </p>
        </div>
        <div style={{ fontSize: '28px' }}>{icon}</div>
      </div>
    </div>
  );
}