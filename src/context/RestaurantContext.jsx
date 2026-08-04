import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isMockMode } from '../lib/supabase';
import {
  tables as mockTables,
  waitlistData as mockWaitlistData
} from '../data/mockData';

const RestaurantContext = createContext();
export { RestaurantContext };

const defaultMockSections = [
  { id: 1, section_name: 'Darbar Area' },
  { id: 2, section_name: 'Terrace' },
  { id: 3, section_name: 'Lounge Bar' },
  { id: 4, section_name: 'VIP Cabin' }
];

// Flattens a table's KOT batches into a merged, name+price grouped list of
// active (non-cancelled) items. Used for subtotal/card display everywhere
// that doesn't need KOT-level granularity.
const flattenKots = (kots = []) => {
  const merged = [];
  kots.forEach((kot) => {
    (kot.items || []).forEach((item) => {
      if (item.cancelled) return;
      const existing = merged.find((m) => m.name === item.name && m.price === item.price);
      if (existing) {
        existing.qty += item.qty;
      } else {
        merged.push({ name: item.name, qty: item.qty, price: item.price, note: item.notes || '' });
      }
    });
  });
  return merged;
};

const makeItemId = () => 'item-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

const loadMockData = () => {
  let tables = localStorage.getItem('mock_tables');
  if (tables) {
    tables = JSON.parse(tables);
    let needsUpdate = false;
    tables = tables.map(t => {
      if (t.status === 'occupied' && (!t.kots || !t.sessionId)) {
        needsUpdate = true;
        const numGuests = t.seated || 4;
        const defaultKots = t.kots || [{
          id: 'kot-seed-' + t.id,
          kotNumber: 1,
          createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
          items: [
            { id: makeItemId(), name: 'Wagyu Beef Burger', qty: Math.max(1, Math.floor(numGuests / 2)), price: 28.00, notes: 'Medium Rare', cancelled: false, cancelReason: null },
            { id: makeItemId(), name: 'Truffle Linguine', qty: Math.max(1, Math.ceil(numGuests / 2)), price: 32.00, notes: 'Extra Parmesan', cancelled: false, cancelReason: null },
            { id: makeItemId(), name: 'House Lemonade', qty: numGuests || 1, price: 6.00, notes: 'Chilled', cancelled: false, cancelReason: null }
          ]
        }];
        return {
          ...t,
          sessionId: t.sessionId || 'session-' + t.id,
          kots: defaultKots,
          orders: flattenKots(defaultKots)
        };
      }
      return t;
    });
    if (needsUpdate) {
      localStorage.setItem('mock_tables', JSON.stringify(tables));
    }
  } else {
    tables = mockTables.map(t => {
      const isOccupied = t.status === 'occupied';
      const numGuests = t.seated || 4;
      const defaultKots = isOccupied ? [{
        id: 'kot-seed-' + t.id,
        kotNumber: 1,
        createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
        items: [
          { id: makeItemId(), name: 'Wagyu Beef Burger', qty: Math.max(1, Math.floor(numGuests / 2)), price: 28.00, notes: 'Medium Rare', cancelled: false, cancelReason: null },
          { id: makeItemId(), name: 'Truffle Linguine', qty: Math.max(1, Math.ceil(numGuests / 2)), price: 32.00, notes: 'Extra Parmesan', cancelled: false, cancelReason: null },
          { id: makeItemId(), name: 'House Lemonade', qty: numGuests || 1, price: 6.00, notes: 'Chilled', cancelled: false, cancelReason: null }
        ]
      }] : [];
      return {
        ...t,
        dbId: t.id,
        startedAt: isOccupied ? new Date(Date.now() - 45 * 60 * 1000).toISOString() : null,
        sessionId: isOccupied ? 'session-' + t.id : null,
        phone: null,
        mergedInto: null,
        billDiscount: null,
        kots: defaultKots,
        orders: flattenKots(defaultKots)
      };
    });
    localStorage.setItem('mock_tables', JSON.stringify(tables));
  }

  let waitlist = localStorage.getItem('mock_waitlist');
  if (waitlist) {
    waitlist = JSON.parse(waitlist);
  } else {
    waitlist = mockWaitlistData.map(item => {
      const waitTimeMins = parseInt(item.waitTime) || 15;
      let notes = '';
      if (item.id === 1) notes = 'Prefers window booth view';
      if (item.id === 2) notes = 'Allergy: peanuts. Celebration dinner';
      if (item.id === 3) notes = 'Wheelchair access required';
      return {
        ...item,
        addedAt: new Date(Date.now() - waitTimeMins * 60 * 1000).toISOString(),
        notes
      };
    });
    localStorage.setItem('mock_waitlist', JSON.stringify(waitlist));
  }

  let waiterCalls = localStorage.getItem('mock_waiter_calls');
  if (waiterCalls) {
    waiterCalls = JSON.parse(waiterCalls);
  } else {
    waiterCalls = [
      {
        id: 'wc-1',
        table_id: 'T-01',
        table_number: '01',
        customer_name: 'Sarah J.',
        notes: 'Need extra napkins',
        request_type: 'Need extra napkins',
        request_status: 'pending',
        is_sos: false,
        created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString()
      },
      {
        id: 'wc-2',
        table_id: 'T-05',
        table_number: '05',
        customer_name: 'Mark V.',
        notes: 'Requesting check',
        request_type: 'Requesting check',
        request_status: 'pending',
        is_sos: false,
        created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString()
      },
      {
        id: 'wc-3',
        table_id: 'T-01',
        table_number: '01',
        customer_name: 'Sarah J.',
        notes: 'SOS: Service is extremely slow',
        request_type: 'SOS: Service is extremely slow',
        request_status: 'pending',
        is_sos: true,
        created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString()
      }
    ];
    localStorage.setItem('mock_waiter_calls', JSON.stringify(waiterCalls));
  }

  const sections = defaultMockSections;

  return { tables, waitlist, waiterCalls, sections };
};

export function RestaurantProvider({ children }) {
  const [tables, setTables] = useState([]);
  const [waitingList, setWaitingList] = useState([]);
  const [sections, setSections] = useState([]);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCustomerSim, setShowCustomerSim] = useState(false);
  const [shiftStart, setShiftStart] = useState(() => {
    const saved = localStorage.getItem('shift_start');
    if (saved) return saved;
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    localStorage.setItem('shift_start', fourHoursAgo);
    return fourHoursAgo;
  });
  const [isShiftActive, setIsShiftActive] = useState(() => {
    const active = localStorage.getItem('is_shift_active');
    return active === 'true';
  });
  const [shiftReports, setShiftReports] = useState([]);
  const [resolvedCalls, setResolvedCalls] = useState([]);

  const startShift = () => {
    const nowIso = new Date().toISOString();
    localStorage.setItem('shift_start', nowIso);
    localStorage.setItem('is_shift_active', 'true');
    setShiftStart(nowIso);
    setIsShiftActive(true);

    if (isMockMode) {
      localStorage.setItem('mock_past_tables_served', '0');
      localStorage.setItem('mock_past_revenue', '0.00');
      localStorage.setItem('mock_past_orders_count', '0');
      localStorage.setItem('mock_past_calls_count', '0');

      const tablesData = mockTables.map(t => ({
        ...t,
        dbId: t.id,
        status: 'available',
        guest: null,
        phone: null,
        seated: 0,
        startedAt: null,
        time: '--',
        sessionId: null,
        mergedInto: null,
        billDiscount: null,
        kots: [],
        orders: []
      }));
      localStorage.setItem('mock_tables', JSON.stringify(tablesData));
      localStorage.setItem('mock_waiter_calls', JSON.stringify([]));
      localStorage.setItem('mock_waitlist', JSON.stringify([]));
    }
    fetchData();
  };

  const fetchShiftReports = async () => {
    if (isMockMode) {
      try {
        const reports = JSON.parse(localStorage.getItem('mock_shift_reports') || '[]');
        reports.sort((a, b) => new Date(b.created_at || b.shift_end) - new Date(a.created_at || a.shift_end));
        setShiftReports(reports);
      } catch (err) {
        console.error('Error fetching mock shift reports:', err);
      }
    } else {
      try {
        const { data, error: fetchError } = await supabase
          .from('shift_reports')
          .select('*')
          .order('shift_end', { ascending: false });
        if (fetchError) throw fetchError;
        setShiftReports(data || []);
      } catch (err) {
        console.error('Error fetching real shift reports:', err);
        setError(err.message);
      }
    }
  };

  const fetchResolvedCalls = async () => {
    if (isMockMode) {
      try {
        const waiterCallsData = JSON.parse(localStorage.getItem('mock_waiter_calls') || '[]');
        const resolved = waiterCallsData.filter(c => c.request_status === 'completed');
        resolved.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
        setResolvedCalls(resolved);
      } catch (err) {
        console.error('Error fetching mock resolved waiter calls:', err);
      }
    } else {
      try {
        const { data, error: fetchError } = await supabase
          .from('waiter_calls')
          .select(`
            *,
            restaurant_tables (
              table_number
            )
          `)
          .eq('request_status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(50);
        if (fetchError) throw fetchError;
        setResolvedCalls(mapWaiterCalls(data || []));
      } catch (err) {
        console.error('Error fetching real resolved waiter calls:', err);
        setError(err.message);
      }
    }
  };

  const generateShiftReport = async () => {
    if (isMockMode) {
      const activeTables = tables.filter(t => t.status === 'occupied' || t.status === 'payment');
      const mockPastTablesCount = parseInt(localStorage.getItem('mock_past_tables_served') || '4');
      const totalTablesServed = activeTables.length + mockPastTablesCount;

      let activeRevenue = activeTables.reduce((acc, t) => {
        const tableTotal = t.orders?.reduce((sum, o) => sum + (o.price * o.qty), 0) || 0;
        return acc + tableTotal;
      }, 0);
      const mockPastRevenue = parseFloat(localStorage.getItem('mock_past_revenue') || '345.50');
      const totalRevenue = activeRevenue + mockPastRevenue;

      const activeOrdersCount = activeTables.reduce((acc, t) => acc + (t.orders?.length || 0), 0);
      const mockPastOrdersCount = parseInt(localStorage.getItem('mock_past_orders_count') || '12');
      const totalOrders = activeOrdersCount + mockPastOrdersCount;

      const activeCallsCount = waiterCalls.length;
      const mockPastCallsCount = parseInt(localStorage.getItem('mock_past_calls_count') || '8');
      const totalWaiterCalls = activeCallsCount + mockPastCallsCount;

      const breakdown = activeTables.map(t => ({
        table: t.id,
        revenue: parseFloat(((t.orders || []).reduce((s, o) => s + o.price * o.qty, 0)).toFixed(2)),
        orders: (t.orders || []).length
      })).sort((a, b) => b.revenue - a.revenue);

      return {
        captain_name: 'Julian Rossi',
        shift_start: shiftStart,
        shift_end: new Date().toISOString(),
        total_tables_served: totalTablesServed,
        total_orders: totalOrders,
        total_revenue: parseFloat(totalRevenue.toFixed(2)),
        total_waiter_calls: totalWaiterCalls,
        breakdown
      };
    } else {
      try {
        const startIso = new Date(shiftStart).toISOString();
        const endIso = new Date().toISOString();

        const { data: sessions, error: sessionsError } = await supabase
          .from('customer_sessions')
          .select('id')
          .gte('started_at', startIso);
        if (sessionsError) throw sessionsError;
        const totalTablesServed = sessions?.length || 0;

        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('total, table_id, restaurant_tables ( table_number )')
          .gte('created_at', startIso);
        if (ordersError) throw ordersError;

        const totalOrders = ordersData?.length || 0;
        const totalRevenue = ordersData?.reduce((sum, o) => sum + parseFloat(o.total || 0), 0) || 0;

        const breakdownMap = {};
        (ordersData || []).forEach(o => {
          const label = o.restaurant_tables?.table_number
            ? `T-${String(o.restaurant_tables.table_number).padStart(2, '0')}`
            : 'Unknown';
          if (!breakdownMap[label]) breakdownMap[label] = { table: label, revenue: 0, orders: 0 };
          breakdownMap[label].revenue += parseFloat(o.total || 0);
          breakdownMap[label].orders += 1;
        });
        const breakdown = Object.values(breakdownMap)
          .map(b => ({ ...b, revenue: parseFloat(b.revenue.toFixed(2)) }))
          .sort((a, b) => b.revenue - a.revenue);

        const { count: totalWaiterCalls, error: callsError } = await supabase
          .from('waiter_calls')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startIso);
        if (callsError) throw callsError;

        return {
          captain_name: 'Julian Rossi',
          shift_start: startIso,
          shift_end: endIso,
          total_tables_served: totalTablesServed,
          total_orders: totalOrders,
          total_revenue: parseFloat(totalRevenue.toFixed(2)),
          total_waiter_calls: totalWaiterCalls || 0,
          breakdown
        };
      } catch (err) {
        console.error('Error compiling real shift report:', err);
        const activeTables = tables.filter(t => t.status === 'occupied' || t.status === 'payment');
        const totalRevenue = activeTables.reduce((acc, t) => {
          return acc + (t.orders?.reduce((sum, o) => sum + (o.price * o.qty), 0) || 0);
        }, 0);
        return {
          captain_name: 'Julian Rossi',
          shift_start: shiftStart,
          shift_end: new Date().toISOString(),
          total_tables_served: activeTables.length,
          total_orders: activeTables.reduce((acc, t) => acc + (t.orders?.length || 0), 0),
          total_revenue: parseFloat(totalRevenue.toFixed(2)),
          total_waiter_calls: waiterCalls.length,
          breakdown: activeTables.map(t => ({
            table: t.id,
            revenue: parseFloat(((t.orders || []).reduce((s, o) => s + o.price * o.qty, 0)).toFixed(2)),
            orders: (t.orders || []).length
          }))
        };
      }
    }
  };

  const endShift = async (reportData) => {
    if (isMockMode) {
      try {
        const reports = JSON.parse(localStorage.getItem('mock_shift_reports') || '[]');
        reports.push({
          ...reportData,
          id: 'report-' + Date.now(),
          created_at: new Date().toISOString()
        });
        localStorage.setItem('mock_shift_reports', JSON.stringify(reports));

        const nowIso = new Date().toISOString();
        localStorage.setItem('shift_start', nowIso);
        localStorage.setItem('is_shift_active', 'false');
        setShiftStart(nowIso);
        setIsShiftActive(false);

        localStorage.setItem('mock_past_tables_served', '0');
        localStorage.setItem('mock_past_revenue', '0.00');
        localStorage.setItem('mock_past_orders_count', '0');
        localStorage.setItem('mock_past_calls_count', '0');

        const data = loadMockData();
        data.tables = data.tables.map(t => ({
          ...t,
          status: 'available',
          guest: null,
          phone: null,
          seated: 0,
          startedAt: null,
          time: '--',
          sessionId: null,
          mergedInto: null,
          billDiscount: null,
          kots: [],
          orders: []
        }));
        data.waiterCalls = [];
        data.waitlist = [];
        localStorage.setItem('mock_tables', JSON.stringify(data.tables));
        localStorage.setItem('mock_waiter_calls', JSON.stringify(data.waiterCalls));
        localStorage.setItem('mock_waitlist', JSON.stringify(data.waitlist));

        await fetchData();
        return { success: true };
      } catch (err) {
        console.error('Error ending shift in mock mode:', err);
        return { success: false, error: err.message };
      }
    }

    try {
      const { breakdown, ...reportColumns } = reportData;
      const { error: insertError } = await supabase
        .from('shift_reports')
        .insert([{ ...reportColumns, breakdown: breakdown || [] }]);

      if (insertError) throw insertError;

      const nowIso = new Date().toISOString();
      localStorage.setItem('shift_start', nowIso);
      localStorage.setItem('is_shift_active', 'false');
      setShiftStart(nowIso);
      setIsShiftActive(false);

      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error ending shift:', err);
      return { success: false, error: err.message };
    }
  };

  const fetchData = async () => {
    if (isMockMode) {
      try {
        setLoading(true);
        const data = loadMockData();

        const now = new Date();
        const updatedTables = data.tables.map(t => {
          if (t.startedAt) {
            const start = new Date(t.startedAt);
            const diffMins = Math.floor((now - start) / 60000);
            let timeStr = '--';
            if (diffMins < 60) {
              timeStr = `${diffMins} mins`;
            } else {
              const hrs = Math.floor(diffMins / 60);
              const mins = diffMins % 60;
              timeStr = `${hrs}h ${mins}m`;
            }
            return { ...t, time: timeStr };
          }
          return t;
        });

        const updatedWaitlist = data.waitlist.map((item, index) => {
          const addedAt = new Date(item.addedAt);
          const diffMins = Math.floor((now - addedAt) / 60000);
          return {
            ...item,
            waitTime: `${diffMins}m`,
            isNext: index === 0
          };
        });

        const activeCalls = data.waiterCalls.filter(c => c.request_status === 'pending');

        updatedTables.forEach(t => {
          t.pendingCalls = activeCalls.filter(c => c.table_id === t.dbId);
          t.hasPendingCall = t.pendingCalls.length > 0;
          t.mergedTableIds = updatedTables.filter(o => o.mergedInto === t.dbId).map(o => o.dbId);
        });

        setTables(updatedTables);
        setWaitingList(updatedWaitlist);
        setSections(data.sections);
        setWaiterCalls(activeCalls);
      } catch (err) {
        console.error('Error fetching mock data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);

      // Fetch Tables with current sessions
      const { data: tablesData, error: tablesError } = await supabase
        .from('restaurant_tables')
        .select(`
          *,
          restaurant_sections (section_name),
          customer_sessions (
            id,
            customer_name,
            phone_number,
            guest_count,
            session_status,
            started_at,
            server_name,
            orders (
              id,
              order_status,
              created_at,
              order_items (
                id,
                quantity,
                item_price,
                notes,
                is_cancelled,
                cancel_reason,
                menu_items (
                  item_name
                )
              )
            )
          )
        `)
        .order('table_number');

      if (tablesError) throw tablesError;

      // Fetch Waiting List
      const { data: waitlistData, error: waitlistError } = await supabase
        .from('waiting_list')
        .select('*')
        .eq('queue_status', 'waiting')
        .order('added_at');

      if (waitlistError) throw waitlistError;

      // Fetch Sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('restaurant_sections')
        .select('*');

      if (sectionsError) throw sectionsError;

      // Fetch Waiter Calls with joined restaurant_tables to get table_number
      const { data: callsData, error: callsError } = await supabase
        .from('waiter_calls')
        .select(`
          *,
          restaurant_tables (
            table_number
          )
        `)
        .eq('request_status', 'pending')
        .order('created_at', { ascending: false });

      if (callsError) throw callsError;

      const mappedTables = mapTables(tablesData);
      const mappedCalls = mapWaiterCalls(callsData);

      mappedTables.forEach(t => {
        t.pendingCalls = mappedCalls.filter(c => c.table_id === t.dbId);
        t.hasPendingCall = t.pendingCalls.length > 0;
        t.mergedTableIds = mappedTables.filter(o => o.mergedInto === t.dbId).map(o => o.dbId);
      });

      setTables(mappedTables);
      setWaitingList(mapWaitingList(waitlistData));
      setSections(sectionsData);
      setWaiterCalls(mappedCalls);
      setError(null);
    } catch (err) {
      console.error('Error fetching restaurant data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const mapWaitingList = (data) => {
    return data.map((item, index) => {
      const addedAt = new Date(item.added_at);
      const now = new Date();
      const diffMins = Math.floor((now - addedAt) / 60000);

      return {
        id: item.id,
        name: item.customer_name,
        people: item.guest_count,
        waitTime: `${diffMins}m`,
        preference: item.preferred_section || 'No Preference',
        isNext: index === 0,
        suggestion: null,
        addedAt: item.added_at,
        notes: item.notes || item.special_notes || item.remarks || ''
      };
    });
  };

  const mapTables = (supabaseTables) => {
    return supabaseTables.map(t => {
      const activeSession = t.customer_sessions?.find(s => s.session_status === 'active');

      const kots = [];
      if (activeSession && activeSession.orders) {
        activeSession.orders.forEach((order, idx) => {
          const items = (order.order_items || []).map(oi => ({
            id: oi.id,
            name: oi.menu_items?.item_name || 'Unknown Item',
            qty: oi.quantity,
            price: oi.item_price,
            notes: oi.notes || '',
            cancelled: !!oi.is_cancelled,
            cancelReason: oi.cancel_reason || null
          }));
          kots.push({
            id: order.id,
            kotNumber: idx + 1,
            createdAt: order.created_at,
            items
          });
        });
        kots.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }

      return {
        id: `T-${t.table_number.toString().padStart(2, '0')}`,
        dbId: t.id,
        status: t.status,
        guest: activeSession ? activeSession.customer_name : null,
        phone: activeSession ? activeSession.phone_number : null,
        time: activeSession ? formatWaitTime(activeSession.started_at) : '--',
        capacity: t.capacity,
        seated: activeSession ? activeSession.guest_count : 0,
        section: t.restaurant_sections?.section_name || 'General',
        server: activeSession?.server_name || null,
        sessionId: activeSession ? activeSession.id : null,
        mergedInto: t.merged_into || null,
        billDiscount: (t.bill_discount_type && t.bill_discount_value)
          ? { type: t.bill_discount_type, value: parseFloat(t.bill_discount_value) }
          : null,
        kots,
        orders: flattenKots(kots),
      };
    });
  };

  const mapWaiterCalls = (calls) => {
    return calls.map(call => {
      const isSos = call.is_sos ||
                    (call.notes && call.notes.includes('SOS:')) ||
                    (call.customer_name && call.customer_name.includes('SOS:')) ||
                    false;
      return {
        ...call,
        table_number: call.restaurant_tables?.table_number || 'General',
        request_type: call.notes || 'Call Waiter',
        is_sos: isSos
      };
    });
  };

  const formatWaitTime = (startedAt) => {
    if (!startedAt) return '--';
    const start = new Date(startedAt);
    const now = new Date();
    const diffMs = now - start;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins} mins`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  // Initial load + realtime subscriptions
  useEffect(() => {
    fetchData();

    if (isMockMode) {
      const interval = setInterval(() => {
        fetchData();
      }, 15000);
      return () => clearInterval(interval);
    }

    // Realtime — subscribe only to the tables the captain panel reflects, not the
    // whole public schema. RLS already filters rows to this tenant; scoping the
    // channel to specific tables avoids needless fan-out from unrelated tables.
    const RT_TABLES = [
      'restaurant_tables', 'customer_sessions', 'waiter_calls',
      'orders', 'order_items', 'waiting_list',
    ];
    let channel = supabase.channel('restaurant_changes');
    RT_TABLES.forEach((table) => {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => fetchData(),
      );
    });
    const tablesSubscription = channel.subscribe();

    return () => {
      supabase.removeChannel(tablesSubscription);
    };
  }, []);

  const stats = {
    totalTables: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    waiting: waitingList.length,
  };

  // ---- Table / Session Actions ----

  const assignTable = async (tableDbId, customerData) => {
    if (isMockMode) {
      try {
        const { customerName, phoneNumber, numberOfPeople, arrivalStatus, waitlistId, waiter } = customerData;
        const data = loadMockData();

        data.tables = data.tables.map(t => {
          if (t.dbId === tableDbId) {
            return {
              ...t,
              status: arrivalStatus === 'seated' ? 'occupied' : 'reserved',
              guest: customerName,
              phone: phoneNumber || null,
              seated: parseInt(numberOfPeople),
              startedAt: new Date().toISOString(),
              time: '0 mins',
              sessionId: 'session-' + t.id,
              server: waiter || null,
              mergedInto: null,
              billDiscount: null,
              kots: [],
              orders: []
            };
          }
          return t;
        });

        if (waitlistId) {
          data.waitlist = data.waitlist.filter(item => item.id !== waitlistId);
        }

        localStorage.setItem('mock_tables', JSON.stringify(data.tables));
        localStorage.setItem('mock_waitlist', JSON.stringify(data.waitlist));

        fetchData();
        return { success: true };
      } catch (err) {
        console.error('Error assigning table in mock mode:', err);
        return { success: false, error: err.message };
      }
    }

    const { customerName, phoneNumber, numberOfPeople, arrivalStatus, waitlistId, waiter } = customerData;
    const sessionId = makeId();

    try {
      const insertData = {
        id: sessionId,
        table_id: tableDbId,
        customer_name: customerName,
        phone_number: phoneNumber,
        guest_count: parseInt(numberOfPeople),
        session_status: 'active'
      };
      if (waiter) insertData.server_name = waiter;

      const { error: sessionError } = await supabase
        .from('customer_sessions')
        .upsert([insertData], { onConflict: 'id' });
      if (sessionError) throw sessionError;

      const { error: tableError } = await supabase
        .from('restaurant_tables')
        .update({ status: arrivalStatus === 'seated' ? 'occupied' : 'reserved' })
        .eq('id', tableDbId);
      if (tableError) throw tableError;

      if (waitlistId) {
        await supabase.from('waiting_list').delete().eq('id', waitlistId);
      }

      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error assigning table:', err);
      return { success: false, error: err.message };
    }
  };

  const assignWaiter = async (sessionId, serverName) => {
    if (isMockMode) {
      try {
        const data = loadMockData();
        data.tables = data.tables.map(t => t.sessionId === sessionId ? { ...t, server: serverName } : t);
        localStorage.setItem('mock_tables', JSON.stringify(data.tables));
        fetchData();
        return { success: true };
      } catch (err) {
        console.error('Error assigning waiter in mock mode:', err);
        return { success: false, error: err.message };
      }
    }

    try {
      const { error } = await supabase
        .from('customer_sessions')
        .update({ server_name: serverName })
        .eq('id', sessionId);
      if (error) throw error;
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error assigning waiter:', err);
      return { success: false, error: err.message };
    }
  };

  const addToWaitlist = async (customerData) => {
    if (isMockMode) {
      try {
        const data = loadMockData();
        const newEntry = {
          id: 'wl-' + Date.now(),
          name: customerData.customerName,
          people: parseInt(customerData.numberOfPeople),
          waitTime: '0m',
          preference: customerData.preference || 'No Preference',
          isNext: data.waitlist.length === 0,
          suggestion: null,
          addedAt: new Date().toISOString(),
          notes: customerData.specialNote || ''
        };

        data.waitlist.push(newEntry);
        localStorage.setItem('mock_waitlist', JSON.stringify(data.waitlist));

        fetchData();
        return { success: true };
      } catch (err) {
        console.error('Error adding to waitlist in mock mode:', err);
        return { success: false, error: err.message };
      }
    }

    try {
      const id = makeId();
      const { error } = await supabase
        .from('waiting_list')
        .upsert([{
          id,
          customer_name: customerData.customerName,
          phone_number: customerData.phoneNumber,
          guest_count: parseInt(customerData.numberOfPeople),
          preferred_section: customerData.preference,
          queue_status: 'waiting'
        }], { onConflict: 'id' });
      if (error) throw error;
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error adding to waitlist:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Add a table to the floor. `section` is the section *name* the captain
   * picked; we resolve it to an id so the new table lands in the right area.
   */
  const createTable = async ({ tableNumber, capacity, section }) => {
    const number = parseInt(tableNumber, 10);
    const seats = parseInt(capacity, 10) || 2;
    if (!number || Number.isNaN(number)) {
      return { success: false, error: 'A table number is required.' };
    }
    if (tables.some((t) => t.id === `T-${String(number).padStart(2, '0')}`)) {
      return { success: false, error: `Table ${number} already exists.` };
    }

    if (isMockMode) {
      try {
        const data = loadMockData();
        data.tables.push({
          id: `T-${String(number).padStart(2, '0')}`,
          dbId: 'tbl-' + Date.now(),
          status: 'available',
          guest: null,
          phone: null,
          time: '--',
          capacity: seats,
          seated: 0,
          section: section || 'General',
          server: null,
          sessionId: null,
          mergedInto: null,
          billDiscount: null,
          kots: [],
          orders: [],
        });
        localStorage.setItem('mock_tables', JSON.stringify(data.tables));
        fetchData();
        return { success: true };
      } catch (err) {
        console.error('Error creating table in mock mode:', err);
        return { success: false, error: err.message };
      }
    }

    try {
      let sectionId = null;
      if (section) {
        const { data: sec } = await supabase
          .from('restaurant_sections')
          .select('id')
          .eq('section_name', section)
          .maybeSingle();
        sectionId = sec?.id || null;
      }

      const payload = { table_number: number, capacity: seats, status: 'available' };
      if (sectionId) payload.section_id = sectionId;

      const { error } = await supabase.from('restaurant_tables').insert([payload]);
      if (error) throw error;
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error creating table:', err);
      return { success: false, error: err.message };
    }
  };

  /** Drop a party from the queue — they left, or were seated elsewhere. */
  const removeFromWaitlist = async (waitlistId) => {
    if (isMockMode) {
      try {
        const data = loadMockData();
        const next = data.waitlist.filter((w) => w.id !== waitlistId);
        localStorage.setItem('mock_waitlist', JSON.stringify(next));
        fetchData();
        return { success: true };
      } catch (err) {
        console.error('Error removing from waitlist in mock mode:', err);
        return { success: false, error: err.message };
      }
    }

    try {
      const { error } = await supabase
        .from('waiting_list')
        .update({ queue_status: 'cancelled' })
        .eq('id', waitlistId);
      if (error) throw error;
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error removing from waitlist:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Bump a party to the front of the queue. There is no priority column, so
   * this reorders locally for the current session rather than pretending to
   * persist something the schema cannot hold.
   */
  const pinWaitlistEntry = (waitlistId) => {
    setWaitingList((prev) => {
      const idx = prev.findIndex((w) => w.id === waitlistId);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [entry] = next.splice(idx, 1);
      next.unshift(entry);
      return next.map((w, i) => ({ ...w, isNext: i === 0 }));
    });
  };

  const createWaiterCall = async (callData) => {
    if (isMockMode) {
      try {
        const { tableNumber, customerName, message, is_sos } = callData;
        const data = loadMockData();

        let resolvedTableId = null;
        if (tableNumber && tableNumber.length === 36) {
          resolvedTableId = tableNumber;
        } else if (tableNumber) {
          const cleanSearchNum = String(tableNumber).replace(/^T-/, '').replace(/^0+/, '').trim();
          const found = data.tables.find(t => {
            const cleanTableNum = String(t.id).replace(/^T-/, '').replace(/^0+/, '').trim();
            return cleanTableNum === cleanSearchNum;
          });
          if (found) resolvedTableId = found.dbId;
        }

        if (!resolvedTableId && data.tables.length > 0) {
          resolvedTableId = data.tables[0].dbId;
        }

        const notesValue = is_sos ? (message.startsWith('SOS:') ? message : `SOS: ${message || 'Waiter Complain'}`) : (message || 'Call Waiter');
        const newCall = {
          id: 'wc-' + Date.now(),
          table_id: resolvedTableId,
          table_number: resolvedTableId ? String(resolvedTableId).replace(/^T-/, '') : 'General',
          customer_name: customerName || 'Guest',
          notes: notesValue,
          request_type: notesValue,
          request_status: 'pending',
          is_sos: !!is_sos,
          created_at: new Date().toISOString()
        };

        data.waiterCalls.push(newCall);
        localStorage.setItem('mock_waiter_calls', JSON.stringify(data.waiterCalls));

        fetchData();
        return { success: true };
      } catch (err) {
        console.error('Error creating waiter call in mock mode:', err);
        return { success: false, error: err.message };
      }
    }

    const { tableNumber, customerName, message, is_sos } = callData;

    let resolvedTableId = null;
    if (tableNumber && tableNumber.length === 36) {
      resolvedTableId = tableNumber;
    } else if (tableNumber) {
      const cleanSearchNum = String(tableNumber).replace(/^T-/, '').replace(/^0+/, '').trim();
      const found = tables.find(t => {
        const cleanTableNum = String(t.id).replace(/^T-/, '').replace(/^0+/, '').trim();
        return cleanTableNum === cleanSearchNum;
      });
      if (found) resolvedTableId = found.dbId;
    }

    if (!resolvedTableId && tables.length > 0) {
      resolvedTableId = tables[0].dbId;
    }

    const notesValue = is_sos ? (message.startsWith('SOS:') ? message : `SOS: ${message || 'Waiter Complain'}`) : (message || 'Call Waiter');
    const id = makeId();

    try {
      const { error } = await supabase
        .from('waiter_calls')
        .upsert([{
          id,
          table_id: resolvedTableId,
          customer_name: customerName || 'Guest',
          notes: notesValue,
          request_status: 'pending'
        }], { onConflict: 'id' });
      if (error) throw error;
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error creating waiter call:', err);
      return { success: false, error: err.message };
    }
  };

  const freeTable = async (tableDbId) => {
    if (isMockMode) {
      try {
        const data = loadMockData();
        const cascadeIds = data.tables.filter(t => t.mergedInto === tableDbId).map(t => t.dbId);
        const idsToFree = new Set([tableDbId, ...cascadeIds]);

        data.tables = data.tables.map(t => {
          if (idsToFree.has(t.dbId)) {
            return {
              ...t,
              status: 'available',
              guest: null,
              phone: null,
              seated: 0,
              startedAt: null,
              time: '--',
              sessionId: null,
              mergedInto: null,
              billDiscount: null,
              kots: [],
              orders: []
            };
          }
          return t;
        });

        localStorage.setItem('mock_tables', JSON.stringify(data.tables));

        fetchData();
        return { success: true };
      } catch (err) {
        console.error('Error freeing table in mock mode:', err);
        return { success: false, error: err.message };
      }
    }

    const cascadeIds = tables.filter(t => t.mergedInto === tableDbId).map(t => t.dbId);
    const allIds = [tableDbId, ...cascadeIds];

    try {
      const { error: sessionError } = await supabase
        .from('customer_sessions')
        .update({ session_status: 'completed', ended_at: new Date().toISOString() })
        .in('table_id', allIds)
        .eq('session_status', 'active');
      if (sessionError) throw sessionError;

      const { error: tableError } = await supabase
        .from('restaurant_tables')
        .update({ status: 'available', merged_into: null, bill_discount_type: null, bill_discount_value: 0 })
        .in('id', allIds);
      if (tableError) throw tableError;

      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error freeing table:', err);
      return { success: false, error: err.message };
    }
  };

  const markBilling = async (tableDbId, discount = null) => {
    if (isMockMode) {
      try {
        const data = loadMockData();

        data.tables = data.tables.map(t => {
          if (t.dbId === tableDbId) {
            return { ...t, status: 'payment', billDiscount: discount };
          }
          return t;
        });

        localStorage.setItem('mock_tables', JSON.stringify(data.tables));

        fetchData();
        return { success: true };
      } catch (err) {
        console.error('Error marking billing in mock mode:', err);
        return { success: false, error: err.message };
      }
    }

    try {
      const { error } = await supabase
        .from('restaurant_tables')
        .update({
          status: 'payment',
          bill_discount_type: discount?.type || null,
          bill_discount_value: discount?.value || 0
        })
        .eq('id', tableDbId);
      if (error) throw error;
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error marking billing:', err);
      return { success: false, error: err.message };
    }
  };

  const createOrder = async (tableDbId, orderItems) => {
    if (isMockMode) {
      try {
        const data = loadMockData();
        let blocked = false;
        let newKot = null;

        data.tables = data.tables.map(t => {
          if (t.dbId !== tableDbId) return t;
          if (t.status === 'payment') {
            blocked = true;
            return t;
          }

          const existingKots = t.kots || [];
          newKot = {
            id: 'kot-' + Date.now(),
            kotNumber: existingKots.length + 1,
            createdAt: new Date().toISOString(),
            items: orderItems.map(item => ({
              id: makeItemId(),
              name: item.name,
              qty: item.qty,
              price: item.price,
              notes: item.notes || '',
              cancelled: false,
              cancelReason: null
            }))
          };
          const updatedKots = [...existingKots, newKot];

          return {
            ...t,
            status: 'occupied',
            kots: updatedKots,
            orders: flattenKots(updatedKots)
          };
        });

        if (blocked) {
          return { success: false, error: 'This table has already been sent for billing. Free it or contact admin before adding more items.' };
        }

        localStorage.setItem('mock_tables', JSON.stringify(data.tables));
        fetchData();
        return { success: true, kot: newKot };
      } catch (err) {
        console.error('Error creating order in mock mode:', err);
        return { success: false, error: err.message };
      }
    }

    const targetTable = tables.find(t => t.dbId === tableDbId);
    if (!targetTable) return { success: false, error: 'Table not found.' };
    if (targetTable.status === 'payment') {
      return { success: false, error: 'This table has already been sent for billing. Free it or contact admin before adding more items.' };
    }
    const validSessionId = targetTable?.sessionId;
    if (!validSessionId) {
      return { success: false, error: 'No active session found for this table. Please seat a guest first.' };
    }

    const orderId = makeId();
    const subtotal = orderItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    const itemsWithIds = orderItems.map(item => ({ ...item, orderItemId: makeId() }));

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .upsert([{ id: orderId, session_id: validSessionId, order_status: 'preparing', subtotal, tax, total, table_id: tableDbId }], { onConflict: 'id' })
        .select()
        .single();
      if (orderError) throw orderError;

      const orderItemsToInsert = itemsWithIds.map(item => ({
        id: item.orderItemId,
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.qty,
        item_price: item.price,
        total_price: item.price * item.qty,
        notes: item.notes || null
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .upsert(orderItemsToInsert, { onConflict: 'id' });
      if (itemsError) throw itemsError;

      await fetchData();
      return {
        success: true,
        kot: { id: order.id, createdAt: order.created_at, items: orderItems }
      };
    } catch (err) {
      console.error('Error creating order:', err);
      return { success: false, error: err.message };
    }
  };

  const cancelOrderItem = async (tableDbId, itemId, reason) => {
    if (!reason || !reason.trim()) {
      return { success: false, error: 'A cancellation reason is required.' };
    }

    if (isMockMode) {
      try {
        const data = loadMockData();
        let cancelledItem = null;

        data.tables = data.tables.map(t => {
          if (t.dbId !== tableDbId) return t;
          const kots = (t.kots || []).map(k => ({
            ...k,
            items: (k.items || []).map(item => {
              if (item.id === itemId) {
                cancelledItem = { ...item, cancelled: true, cancelReason: reason, cancelledAt: new Date().toISOString() };
                return cancelledItem;
              }
              return item;
            })
          }));
          return { ...t, kots, orders: flattenKots(kots) };
        });

        if (!cancelledItem) return { success: false, error: 'Item not found.' };

        localStorage.setItem('mock_tables', JSON.stringify(data.tables));
        fetchData();
        return { success: true, item: cancelledItem };
      } catch (err) {
        console.error('Error cancelling item in mock mode:', err);
        return { success: false, error: err.message };
      }
    }

    try {
      const { data: updated, error } = await supabase
        .from('order_items')
        .update({ is_cancelled: true, cancel_reason: reason, cancelled_at: new Date().toISOString() })
        .eq('id', itemId)
        .select('*, menu_items ( item_name )')
        .single();
      if (error) throw error;
      await fetchData();
      return {
        success: true,
        item: { name: updated.menu_items?.item_name, qty: updated.quantity, price: updated.item_price, cancelReason: reason }
      };
    } catch (err) {
      console.error('Error cancelling item:', err);
      return { success: false, error: err.message };
    }
  };

  const mergeTables = async (primaryDbId, secondaryDbId) => {
    if (primaryDbId === secondaryDbId) {
      return { success: false, error: 'Cannot merge a table with itself.' };
    }
    const primary = tables.find(t => t.dbId === primaryDbId);
    const secondary = tables.find(t => t.dbId === secondaryDbId);
    if (!primary || !secondary) return { success: false, error: 'Table not found.' };
    if (primary.status !== 'occupied' || secondary.status !== 'occupied') {
      return { success: false, error: 'Both tables must be occupied to merge.' };
    }
    if (primary.mergedInto || secondary.mergedInto) {
      return { success: false, error: 'One of these tables is already part of a merge.' };
    }

    if (isMockMode) {
      try {
        const data = loadMockData();
        data.tables = data.tables.map(t => t.dbId === secondaryDbId ? { ...t, mergedInto: primaryDbId } : t);
        localStorage.setItem('mock_tables', JSON.stringify(data.tables));
        fetchData();
        return { success: true };
      } catch (err) {
        console.error('Error merging tables in mock mode:', err);
        return { success: false, error: err.message };
      }
    }

    try {
      const { error } = await supabase
        .from('restaurant_tables')
        .update({ merged_into: primaryDbId })
        .eq('id', secondaryDbId);
      if (error) throw error;
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error merging tables:', err);
      return { success: false, error: err.message };
    }
  };

  const unmergeTable = async (secondaryDbId) => {
    if (isMockMode) {
      try {
        const data = loadMockData();
        data.tables = data.tables.map(t => t.dbId === secondaryDbId ? { ...t, mergedInto: null } : t);
        localStorage.setItem('mock_tables', JSON.stringify(data.tables));
        fetchData();
        return { success: true };
      } catch (err) {
        console.error('Error un-merging table in mock mode:', err);
        return { success: false, error: err.message };
      }
    }

    try {
      const { error } = await supabase
        .from('restaurant_tables')
        .update({ merged_into: null })
        .eq('id', secondaryDbId);
      if (error) throw error;
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error un-merging table:', err);
      return { success: false, error: err.message };
    }
  };

  const transferTable = async (sourceDbId, targetDbId) => {
    if (sourceDbId === targetDbId) {
      return { success: false, error: 'Source and destination tables are the same.' };
    }
    const source = tables.find(t => t.dbId === sourceDbId);
    const target = tables.find(t => t.dbId === targetDbId);
    if (!source || !target) return { success: false, error: 'Table not found.' };
    if (target.status !== 'available') {
      return { success: false, error: 'Destination table must be available.' };
    }
    if (source.mergedInto) {
      return { success: false, error: 'Un-merge this table before transferring it.' };
    }

    if (isMockMode) {
      try {
        const data = loadMockData();
        data.tables = data.tables.map(t => {
          if (t.dbId === targetDbId) {
            return {
              ...t,
              status: source.status,
              guest: source.guest,
              phone: source.phone,
              seated: source.seated,
              startedAt: source.startedAt,
              time: source.time,
              sessionId: source.sessionId,
              kots: source.kots,
              orders: source.orders,
              billDiscount: source.billDiscount
            };
          }
          if (t.dbId === sourceDbId) {
            return {
              ...t,
              status: 'available',
              guest: null,
              phone: null,
              seated: 0,
              startedAt: null,
              time: '--',
              sessionId: null,
              kots: [],
              orders: [],
              billDiscount: null
            };
          }
          if (t.mergedInto === sourceDbId) {
            return { ...t, mergedInto: targetDbId };
          }
          return t;
        });
        localStorage.setItem('mock_tables', JSON.stringify(data.tables));
        fetchData();
        return { success: true };
      } catch (err) {
        console.error('Error transferring table in mock mode:', err);
        return { success: false, error: err.message };
      }
    }

    try {
      if (source.sessionId) {
        const { error: sessionError } = await supabase
          .from('customer_sessions')
          .update({ table_id: targetDbId })
          .eq('id', source.sessionId);
        if (sessionError) throw sessionError;
      }

      const { error: ordersError } = await supabase
        .from('orders')
        .update({ table_id: targetDbId })
        .eq('table_id', sourceDbId);
      if (ordersError) throw ordersError;

      const { error: targetError } = await supabase
        .from('restaurant_tables')
        .update({
          status: source.status,
          bill_discount_type: source.billDiscount?.type || null,
          bill_discount_value: source.billDiscount?.value || 0
        })
        .eq('id', targetDbId);
      if (targetError) throw targetError;

      const { error: sourceError } = await supabase
        .from('restaurant_tables')
        .update({ status: 'available', bill_discount_type: null, bill_discount_value: 0 })
        .eq('id', sourceDbId);
      if (sourceError) throw sourceError;

      const { error: cascadeError } = await supabase
        .from('restaurant_tables')
        .update({ merged_into: targetDbId })
        .eq('merged_into', sourceDbId);
      if (cascadeError) throw cascadeError;

      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error transferring table:', err);
      return { success: false, error: err.message };
    }
  };

  const completeWaiterCall = async (callId) => {
    if (isMockMode) {
      try {
        const data = loadMockData();
        data.waiterCalls = data.waiterCalls.map(c => {
          if (c.id === callId) {
            return { ...c, request_status: 'completed', completed_at: new Date().toISOString() };
          }
          return c;
        });
        localStorage.setItem('mock_waiter_calls', JSON.stringify(data.waiterCalls));
        fetchData();
        fetchResolvedCalls();
      } catch (err) {
        console.error('Error completing waiter call in mock mode:', err);
      }
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('waiter_calls')
        .update({ request_status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', callId);
      if (error) throw error;
      await fetchData();
      await fetchResolvedCalls();
      return { success: true };
    } catch (err) {
      console.error('Error completing waiter call:', err);
      return { success: false, error: err.message };
    }
  };

  return (
    <RestaurantContext.Provider value={{
      tables,
      waitingList,
      sections,
      stats,
      loading,
      error,
      waiterCalls,
      showCustomerSim,
      setShowCustomerSim,
      shiftStart,
      generateShiftReport,
      endShift,
      isShiftActive,
      startShift,
      shiftReports,
      fetchShiftReports,
      resolvedCalls,
      fetchResolvedCalls,
      refresh: fetchData,
      assignTable,
      assignWaiter,
      addToWaitlist,
      removeFromWaitlist,
      pinWaitlistEntry,
      createTable,
      createWaiterCall,
      freeTable,
      markBilling,
      createOrder,
      cancelOrderItem,
      mergeTables,
      unmergeTable,
      transferTable,
      completeWaiterCall
    }}>
      {children}
    </RestaurantContext.Provider>
  );
}

// useRestaurant hook is in ./useRestaurant.js
