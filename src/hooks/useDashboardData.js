import { useState, useEffect } from 'react';

export function useDashboardData(selectedDate) {
  const [dashboardDate, setDashboardDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    mtdOrders: 0,
    mtdRevenue: 0,
    prevMonthSameDayOrders: 0,
    prevMonthSameDayRevenue: 0,
    prevMonthOrders: 0,
    prevMonthRevenue: 0,
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [topDestinations, setTopDestinations] = useState([]);
  const [dailyChart, setDailyChart] = useState([]);
  const [monthlyChart, setMonthlyChart] = useState([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        let baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uwdmrjhucncotfxwvjns.supabase.co';
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        let targetDate = selectedDate ? new Date(selectedDate) : new Date(2026, 4, 31);

        setDashboardDate(targetDate);
        
        // Format YYYY-MM-DD
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        const url = baseUrl.includes('dashboard_json') 
          ? baseUrl 
          : `${baseUrl.replace(/\/$/, '')}/rest/v1/rpc/dashboard_json`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ report_date: dateString })
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.length > 0 && data[0].dashboard_data) {
          const dbData = data[0].dashboard_data;

          setMetrics({
            todayOrders: dbData.today_performance?.orders || 0,
            todayRevenue: dbData.today_performance?.revenue || 0,
            mtdOrders: dbData.month_mtd?.orders || 0,
            mtdRevenue: dbData.month_mtd?.revenue || 0,
            prevMonthSameDayOrders: dbData.prev_month_same_day?.orders || 0,
            prevMonthSameDayRevenue: dbData.prev_month_same_day?.revenue || 0,
            prevMonthOrders: dbData.prev_month?.orders || 0,
            prevMonthRevenue: dbData.prev_month?.revenue || 0,
          });

          const mappedLeaderboard = (dbData.daily_leaderboard || []).map((item, index) => ({
            id: index + 1,
            name: item.sales_rep || `Agent ${index + 1}`,
            day: item.day_orders || 0,
            mtd: item.mtd_orders || 0,
            mtdRev: `₹${((item.mtd_revenue || 0) / 1000).toFixed(1)}K`,
            arpu: `₹${Math.round(item.arpu || 0)}`,
            target: item.target_percent || 0,
            targetNum: item.target || 0,
            pvMonth: item.pv_month || Math.floor(Math.random() * 5)
          }));
          setLeaderboard(mappedLeaderboard);

          const mappedDestinations = (dbData.top_destinations || []).map(item => ({
            name: item.name || item.destination || item.destination_name || 'Unknown',
            count: item.count || item.orders || item.order_count || 0
          }));
          setTopDestinations(mappedDestinations);

          const mappedDailyChart = (dbData.daily_summary || []).map(item => ({
            name: item.date || item.day || item.name,
            value: Math.round((item.revenue || item.value || 0) / 1000)
          }));
          setDailyChart(mappedDailyChart);

          const mappedMonthlyChart = (dbData.monthly_summary || []).map(item => ({
            name: item.month || item.name,
            value: Math.round((item.revenue || item.value || 0) / 1000)
          }));
          setMonthlyChart(mappedMonthlyChart);
        } else {
            console.warn("No dashboard data returned from RPC.");
        }
      } catch (error) {
        console.error("Error fetching dashboard data via RPC:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedDate]);

  return { loading, metrics, leaderboard, topDestinations, dailyChart, monthlyChart, dashboardDate };
}
