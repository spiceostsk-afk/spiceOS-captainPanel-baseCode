import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase, isMockMode } from '../lib/supabase';
import { useRestaurant } from '../context/useRestaurant';
import { printKOT } from '../lib/printKOT';
import { isNetworkError } from '../lib/networkError';
import { 
  Utensils, 
  Coffee, 
  Soup, 
  Pizza, 
  IceCream, 
  Salad, 
  Clock, 
  Plus, 
  Trash2,
  ChevronRight,
  Beef,
  Croissant,
  Wine,
  Sandwich,
  ArrowLeft
} from 'lucide-react';
import './MenuCatalog.css';

// Map category names to icons
const CATEGORY_ICONS = {
  'Beverages': Coffee,
  'Drinks': Coffee,
  'Desserts': IceCream,
  'Sweets': IceCream,
  'Main Course': Beef,
  'Mains': Beef,
  'Pizza & Pasta': Pizza,
  'Pizza': Pizza,
  'Pasta': Pizza,
  'Soups': Soup,
  'Starters': Salad,
  'Appetizers': Salad,
  'Snacks': Sandwich,
  'Bakery': Croissant,
  'Cocktails': Wine,
};

const getCategoryIcon = (name) => {
  if (!name) return Utensils;
  const match = Object.keys(CATEGORY_ICONS).find(k => name.toLowerCase().includes(k.toLowerCase()));
  return match ? CATEGORY_ICONS[match] : Utensils;
};

// Fallback gradient placeholder as data URI
const FOOD_PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect width='400' height='200' fill='%23F9EBE0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='48' opacity='0.35'%3E%F0%9F%8D%BD%EF%B8%8F%3C/text%3E%3C/svg%3E`;

const MENU_CACHE_KEY = 'cached_menu_data';

const MOCK_CATEGORIES = [
  { id: 'cat-1', category_name: 'Starters' },
  { id: 'cat-2', category_name: 'Main Course' },
  { id: 'cat-3', category_name: 'Desserts' },
  { id: 'cat-4', category_name: 'Beverages' }
];

const MOCK_MENU_ITEMS = [
  { id: 'item-1', category_id: 'cat-1', item_name: 'Truffle Fries', price: 12.00, description: 'Crispy golden fries drizzled with aromatic white truffle oil and grated parmesan.', is_available: true },
  { id: 'item-2', category_id: 'cat-1', item_name: 'Garden Salad', price: 14.00, description: 'Fresh mixed greens, cherry tomatoes, cucumbers, honey mustard vinaigrette.', is_available: true },
  { id: 'item-3', category_id: 'cat-1', item_name: 'Calamari', price: 18.00, description: 'Lightly battered calamari rings served with house garlic aioli.', is_available: true },
  { id: 'item-4', category_id: 'cat-2', item_name: 'Wagyu Beef Burger', price: 28.00, description: 'Juicy Wagyu beef patty, cheddar, brioche bun, house sauce, served with fries.', is_available: true },
  { id: 'item-5', category_id: 'cat-2', item_name: 'Truffle Linguine', price: 32.00, description: 'Linguine pasta in creamy black truffle sauce with wild mushrooms.', is_available: true },
  { id: 'item-6', category_id: 'cat-2', item_name: 'Ribeye Steak', price: 45.00, description: '250g grilled USDA prime ribeye steak with red wine reduction.', is_available: true },
  { id: 'item-7', category_id: 'cat-2', item_name: 'Margherita Pizza', price: 22.00, description: 'San Marzano tomatoes, fresh mozzarella, fresh basil, extra virgin olive oil.', is_available: true },
  { id: 'item-8', category_id: 'cat-3', item_name: 'Tiramisu', price: 10.00, description: 'Classic Italian dessert with coffee-dipped ladyfingers, mascarpone cream.', is_available: true },
  { id: 'item-9', category_id: 'cat-3', item_name: 'Chocolate Souffle', price: 12.00, description: 'Warm chocolate souffle with a molten center, served with vanilla gelato.', is_available: true },
  { id: 'item-10', category_id: 'cat-4', item_name: 'House Lemonade', price: 6.00, description: 'Freshly squeezed lemon juice, mint leaves, dash of simple syrup.', is_available: true },
  { id: 'item-11', category_id: 'cat-4', item_name: 'Espresso', price: 4.00, description: 'Rich and intense double shot of house blend espresso.', is_available: true },
  { id: 'item-12', category_id: 'cat-4', item_name: 'Red Wine Glass', price: 14.00, description: 'Premium cabernet sauvignon with notes of dark berries.', is_available: true }
];

const MenuCatalog = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('sessionId');
  const tableId = searchParams.get('tableId');

  const { createOrder, tables } = useRestaurant();

  const [activeCategory, setActiveCategory] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usingCachedMenu, setUsingCachedMenu] = useState(false);
  // React state updates are batched/async, so two clicks dispatched in the
  // same tick (e.g. a real fast double-tap) can both read a stale
  // isSubmitting=false before either re-render lands. A ref mutates
  // synchronously, so the second call always sees the first call's guard.
  const submittingRef = useRef(false);

  // Find table info
  const selectedTable = tables.find(t => t.dbId === tableId || t.id === tableId);

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    if (isMockMode) {
      setCategories(MOCK_CATEGORIES);
      setMenuItems(MOCK_MENU_ITEMS);
      if (MOCK_CATEGORIES.length > 0) setActiveCategory(MOCK_CATEGORIES[0].id);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: catsData, error: catsError } = await supabase
        .from('menu_categories')
        .select('*')
        .order('category_name');
      if (catsError) throw catsError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true);
      if (itemsError) throw itemsError;

      setCategories(catsData);
      setMenuItems(itemsData);
      if (catsData.length > 0) setActiveCategory(catsData[0].id);
      setUsingCachedMenu(false);

      // Cache the last known-good menu so the page still has something to
      // show if the next visit happens to be offline.
      localStorage.setItem(MENU_CACHE_KEY, JSON.stringify({ categories: catsData, items: itemsData }));
    } catch (error) {
      console.error('Error fetching menu data:', error);
      if (isNetworkError(error)) {
        const cached = localStorage.getItem(MENU_CACHE_KEY);
        if (cached) {
          try {
            const { categories: cachedCats, items: cachedItems } = JSON.parse(cached);
            setCategories(cachedCats || []);
            setMenuItems(cachedItems || []);
            if (cachedCats?.length > 0) setActiveCategory(cachedCats[0].id);
            setUsingCachedMenu(true);
          } catch (parseErr) {
            console.error('Error reading cached menu:', parseErr);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const addToOrder = (item) => {
    const existing = orderItems.find(i => i.id === item.id);
    if (existing) {
      setOrderItems(orderItems.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setOrderItems([...orderItems, { 
        id: item.id, 
        name: item.item_name, 
        price: item.price, 
        notes: '', 
        qty: 1 
      }]);
    }
  };

  const updateQty = (id, delta) => {
    setOrderItems(orderItems.map(i => {
      if (i.id === id) {
        const newQty = Math.max(0, i.qty + delta);
        return newQty === 0 ? null : { ...i, qty: newQty };
      }
      return i;
    }).filter(Boolean));
  };

  const updateNote = (id, notes) => {
    setOrderItems(orderItems.map(i => (i.id === id ? { ...i, notes } : i)));
  };

  const clearOrder = () => {
    if (window.confirm('Clear entire order?')) {
      setOrderItems([]);
    }
  };

  const handlePlaceOrder = async () => {
    if (orderItems.length === 0 || submittingRef.current) return;
    submittingRef.current = true;

    const targetTableId = tableId || (tables.length > 0 ? tables[0].dbId : null);
    if (!targetTableId) {
      alert("No table selected. Please choose a table from the Dashboard first.");
      submittingRef.current = false;
      return;
    }

    setIsSubmitting(true);
    try {
      setLoading(true);
      const result = await createOrder(targetTableId, orderItems);
      if (result.success) {
        // Combine any item-level notes into a single remark for the KOT
        const combinedNote = orderItems
          .map((i) => i.notes)
          .filter((n) => n && n.trim().length > 0)
          .join('; ');
        // Auto-print KOT immediately after a successful order
        const printed = printKOT({
          tableId: selectedTable?.id || tableId,
          sessionId: sessionId || (selectedTable?.sessionId),
          kotNumber: result.kot?.kotNumber,
          items: orderItems,
          guestName: selectedTable?.guest,
          section: selectedTable?.section,
          orderNote: combinedNote,
        });
        setOrderItems([]);
        if (!printed) {
          alert('Order placed, but the KOT print window was blocked by your browser. Please allow pop-ups for this site and use Reprint KOT from the table detail panel to send it to the kitchen.');
        }
        navigate('/');
      } else {
        alert('Error creating order: ' + result.error);
      }
    } catch (error) {
      alert('Error creating order: ' + error.message);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  const subtotal = orderItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const filteredItems = menuItems.filter(item => {
    return item.category_id === activeCategory;
  });

  if (loading && categories.length === 0) return <div className="loading-state">Loading menu...</div>;

  return (
    <div className="menu-view-container" id="menu-selection-page">
      {/* Header */}
      <div className="menu-view__header">
        <button className="menu-view__back-btn" onClick={() => navigate('/')} id="btn-back-dashboard">
          <ArrowLeft size={20} />
        </button>
        <div className="menu-view__title-group">
          <h1>Menu Selection</h1>
          <p>
            {selectedTable ? `Ordering for Table ${selectedTable.id} (${selectedTable.guest || 'Walk-in'})` : 'Select a table to start ordering'}
          </p>
        </div>
        {usingCachedMenu && (
          <div className="menu-view__offline-banner" id="menu-offline-banner">
            Offline — showing menu from last sync. Item availability may be out of date.
          </div>
        )}
      </div>

      <div className="menu-view">
        {/* Categories */}
        <div className="category-sidebar" id="category-sidebar">
          {categories.map((cat) => {
            const IconComponent = getCategoryIcon(cat.category_name);
            return (
              <div 
                key={cat.id} 
                className={`category-item ${activeCategory === cat.id ? 'category-item--active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
                id={`cat-item-${cat.id}`}
              >
                <div className="cat-icon-box">
                  <IconComponent size={22} />
                </div>
                <span>{cat.category_name}</span>
              </div>
            );
          })}
        </div>

        {/* Catalog Items */}
        <div className="catalog-area">
          <div className="catalog-header">
            <h2 className="section-title">Dishes & Drinks</h2>
            <div className="catalog-filters">
              {['All', 'Vegetarian', 'Spicy'].map(filter => (
                <button 
                  key={filter} 
                  className={`filter-btn ${activeFilter === filter ? 'filter-btn--active' : ''}`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="menu-grid" id="menu-items-grid">
            {filteredItems.map((item) => (
              <div key={item.id} className="food-card" id={`food-card-${item.id}`}>
                <div className="food-image-container">
                  <img 
                    src={FOOD_PLACEHOLDER} 
                    alt={item.item_name}
                  />
                  <div className="price-badge">${Number(item.price).toFixed(2)}</div>
                </div>
                <div className="food-info">
                  <h3>{item.item_name}</h3>
                  <p className="food-desc">{item.description || 'Freshly prepared with care.'}</p>
                  <div className="food-footer">
                    <div className="prep-time">
                      <Clock size={14} />
                      <span>15 mins</span>
                    </div>
                    <button className="add-btn" onClick={() => addToOrder(item)} id={`btn-add-food-${item.id}`}>
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className="empty-order-msg">No items in this category.</div>
            )}
          </div>
        </div>

        {/* Order Basket */}
        <div className="order-panel" id="order-basket-panel">
          <div className="order-header">
            <div>
              <h3>Current Order</h3>
              <p>Items added: {orderItems.reduce((acc, i) => acc + i.qty, 0)}</p>
            </div>
            <button className="clear-btn" onClick={clearOrder} id="btn-clear-basket">Clear All</button>
          </div>

          <div className="order-items">
            {orderItems.map((item, i) => (
              <div key={i} className="order-item" id={`basket-item-${item.id}`}>
                <div className="item-main">
                  <div className="item-details">
                    <h4>{item.name}</h4>
                  </div>
                  <div className="item-price">${(item.price * item.qty).toFixed(2)}</div>
                </div>
                <input
                  type="text"
                  className="item-note-input"
                  placeholder="Special instruction (e.g. no onions)..."
                  value={item.notes}
                  onChange={(e) => updateNote(item.id, e.target.value)}
                  id={`input-note-${item.id}`}
                />
                <div className="item-controls">
                  <div className="qty-picker">
                    <button onClick={() => updateQty(item.id, -1)} id={`btn-dec-qty-${item.id}`}>-</button>
                    <span>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} id={`btn-inc-qty-${item.id}`}>+</button>
                  </div>
                  <button className="delete-item" onClick={() => updateQty(item.id, -item.qty)} id={`btn-delete-item-${item.id}`} title="Remove Item">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {orderItems.length === 0 && (
              <div className="empty-order-msg">Your order is empty.</div>
            )}
          </div>

          <div className="order-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Tax (10%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button
              className="create-order-btn"
              onClick={handlePlaceOrder}
              disabled={orderItems.length === 0 || isSubmitting}
              id="btn-place-order"
              style={{ opacity: (orderItems.length === 0 || isSubmitting) ? 0.5 : 1, cursor: (orderItems.length === 0 || isSubmitting) ? 'not-allowed' : 'pointer' }}
            >
              {isSubmitting ? 'Placing Order...' : 'Place Order'} <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuCatalog;
