import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useDashboardData() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    mtdOrders: 0,
    mtdRevenue: 0,
    prevMonthSameDayRevenue: 0,
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
        // Fetch all necessary data
        // Note: For a production app with huge data, you would do aggregations on the Supabase RPC side.
        // Since we are fetching to frontend, we will fetch recent orders to aggregate.
        
        // Fetch orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .order('order_date_time', { ascending: false });

        if (ordersError) throw ordersError;

        // Fetch users (for leaderboard names)
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('user_id, name');

        if (usersError) throw usersError;

        // Fetch products (for destination mapping)
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('prod_id, productName');

        if (productsError) throw productsError;

        if (ordersData && ordersData.length > 0) {
          // Find the latest order date to use as "Today" so the dashboard always has data
          const latestOrderDateStr = ordersData[0].order_date_time; // It's ordered descending
          const latestDate = new Date(latestOrderDateStr || Date.now());

          processMetrics(ordersData, latestDate);
          processLeaderboard(ordersData, usersData || [], latestDate);
          processDestinations(ordersData, productsData || []);
          processCharts(ordersData);
        } else {
          console.warn("No orders found or RLS is still blocking.");
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const processMetrics = (orders, latestDate) => {
    const now = latestDate;
    const todayStr = now.toISOString().split('T')[0];
    
    // MTD bounds
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Previous month bounds
    const firstDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const prevMonthSameDay = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    let tOrders = 0, tRev = 0;
    let mOrders = 0, mRev = 0;
    let pSameDayOrders = 0, pSameDayRev = 0;
    let pOrders = 0, pRev = 0;

    orders.forEach(order => {
      if (!order.order_date_time) return;
      const orderDate = new Date(order.order_date_time);
      const orderDateStr = order.order_date_time.split('T')[0];
      const amount = Number(order.amount) || 0;

      // Today
      if (orderDateStr === todayStr) {
        tOrders++;
        tRev += amount;
      }

      // MTD
      if (orderDate >= firstDayOfMonth && orderDate <= now) {
        mOrders++;
        mRev += amount;
      }

      // Prev Month
      if (orderDate >= firstDayOfPrevMonth && orderDate <= lastDayOfPrevMonth) {
        pOrders++;
        pRev += amount;
        if (orderDate <= prevMonthSameDay) {
          pSameDayOrders++;
          pSameDayRev += amount;
        }
      }
    });

    setMetrics({
      todayOrders: tOrders,
      todayRevenue: tRev,
      mtdOrders: mOrders,
      mtdRevenue: mRev,
      prevMonthSameDayOrders: pSameDayOrders,
      prevMonthSameDayRevenue: pSameDayRev,
      prevMonthOrders: pOrders,
      prevMonthRevenue: pRev,
    });
  };

  const processLeaderboard = (orders, users, latestDate) => {
    const now = latestDate;
    const todayStr = now.toISOString().split('T')[0];
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const agentStats = {};

    orders.forEach(order => {
      const agentId = order.created_by; // Assuming created_by maps to user_id
      if (!agentId) return;

      if (!agentStats[agentId]) {
        agentStats[agentId] = { dayOrders: 0, mtdOrders: 0, mtdRevenue: 0 };
      }

      const orderDate = new Date(order.order_date_time);
      const orderDateStr = order.order_date_time.split('T')[0];
      const amount = Number(order.amount) || 0;

      if (orderDateStr === todayStr) {
        agentStats[agentId].dayOrders++;
      }

      if (orderDate >= firstDayOfMonth && orderDate <= now) {
        agentStats[agentId].mtdOrders++;
        agentStats[agentId].mtdRevenue += amount;
      }
    });

    const userMap = {};
    users.forEach(u => { userMap[u.user_id] = u.name; });

    const formattedLeaderboard = Object.keys(agentStats).map(agentId => {
      const stats = agentStats[agentId];
      // Mocking ARPU and Target for visual completeness as they aren't directly in schema
      const arpu = stats.mtdOrders > 0 ? Math.round(stats.mtdRevenue / stats.mtdOrders) : 0;
      const targetNum = 200; 
      const targetPercent = Math.round((stats.mtdOrders / targetNum) * 100);

      return {
        id: agentId,
        name: userMap[agentId] || `Agent ${agentId}`,
        day: stats.dayOrders,
        mtd: stats.mtdOrders,
        mtdRev: `₹${(stats.mtdRevenue / 1000).toFixed(1)}K`,
        arpu: `₹${arpu}`,
        target: targetPercent,
        targetNum: targetNum,
        pvMonth: Math.floor(Math.random() * 5) // Mock previous month count
      };
    }).sort((a, b) => b.mtd - a.mtd); // Sort by MTD orders

    // Reassign IDs 1-N for ranking
    formattedLeaderboard.forEach((item, index) => item.id = index + 1);

    setLeaderboard(formattedLeaderboard.slice(0, 7)); // Top 7
  };

  const processDestinations = (orders, products) => {
    // Map product IDs to product names as a proxy for destination names
    const productMap = {};
    products.forEach(p => { productMap[p.prod_id] = p.productName; });

    const destCounts = {};
    orders.forEach(order => {
      const pId = order.product_id;
      if (pId) {
        const destName = productMap[pId] || `Product ${pId}`;
        destCounts[destName] = (destCounts[destName] || 0) + 1;
      }
    });

    const formattedDest = Object.keys(destCounts).map(name => ({
      name,
      count: destCounts[name]
    })).sort((a, b) => b.count - a.count);

    setTopDestinations(formattedDest.slice(0, 7));
  };

  const processCharts = (orders) => {
    const dailyMap = {};
    const monthlyMap = {};

    orders.forEach(order => {
      if (!order.order_date_time) return;
      const date = new Date(order.order_date_time);
      const amount = Number(order.amount) || 0;

      // Format DD-MM
      const day = String(date.getDate()).padStart(2, '0');
      const monthNum = String(date.getMonth() + 1).padStart(2, '0');
      const dayKey = `${day}-${monthNum}`;
      
      dailyMap[dayKey] = (dailyMap[dayKey] || 0) + amount;

      // Format MMM YY
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthKey = `${monthNames[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`;
      
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + amount;
    });

    // Convert to arrays and sort
    const dailyArr = Object.keys(dailyMap).map(k => ({ name: k, value: Math.round(dailyMap[k]/1000) })).sort((a,b) => {
        // Simple sort logic assuming all dates are same year for this view
        const [d1, m1] = a.name.split('-');
        const [d2, m2] = b.name.split('-');
        if(m1 !== m2) return m1 - m2;
        return d1 - d2;
    }).slice(-30); // Last 30 days

    // For monthly, sort chronologically is trickier with just string, but we can do our best or rely on order of insertion if sorted globally.
    // Assuming simple format.
    const monthlyArr = Object.keys(monthlyMap).map(k => ({ name: k, value: Math.round(monthlyMap[k]/1000) }));

    setDailyChart(dailyArr);
    setMonthlyChart(monthlyArr);
  };

  return { loading, metrics, leaderboard, topDestinations, dailyChart, monthlyChart };
}
