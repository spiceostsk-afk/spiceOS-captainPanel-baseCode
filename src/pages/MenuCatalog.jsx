import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase, isMockMode } from '../lib/supabase';
import { useRestaurant } from '../context/useRestaurant';
import { printKOT } from '../lib/printKOT';
import { isNetworkError } from '../lib/networkError';
import { Plus, Minus, Trash2, ChevronRight, ArrowLeft, Search, Users } from 'lucide-react';
import './MenuCatalog.css';

const MENU_CACHE_KEY = 'cached_menu_data';

const TAX_RATE = 0.1;

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const MOCK_CATEGORIES = [
  { id: 'cat-1', category_name: 'Starters' },
  { id: 'cat-2', category_name: 'Main Course' },
  { id: 'cat-3', category_name: 'Desserts' },
  { id: 'cat-4', category_name: 'Beverages' },
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
  { id: 'item-12', category_id: 'cat-4', item_name: 'Red Wine Glass', price: 14.00, description: 'Premium cabernet sauvignon with notes of dark berries.', is_available: true },
];

const MenuCatalog = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('sessionId');
  const tableId = searchParams.get('tableId');

  const { createOrder, tables } = useRestaurant();

  const [activeCategory, setActiveCategory] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [dishSearch, setDishSearch] = useState('');
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

  const selectedTable = tables.find((t) => t.dbId === tableId || t.id === tableId);

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

      // Fetch everything, including 86'd dishes — a captain needs to see what's
      // off so they can tell the guest, rather than the item silently vanishing.
      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*');
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
    const existing = orderItems.find((i) => i.id === item.id);
    if (existing) {
      setOrderItems(orderItems.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i)));
    } else {
      setOrderItems([...orderItems, {
        id: item.id,
        name: item.item_name,
        price: item.price,
        notes: '',
        qty: 1,
      }]);
    }
  };

  const updateQty = (id, delta) => {
    setOrderItems(orderItems.map((i) => {
      if (i.id === id) {
        const newQty = Math.max(0, i.qty + delta);
        return newQty === 0 ? null : { ...i, qty: newQty };
      }
      return i;
    }).filter(Boolean));
  };

  const updateNote = (id, notes) => {
    setOrderItems(orderItems.map((i) => (i.id === id ? { ...i, notes } : i)));
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
      alert('No table selected. Please choose a table from the floor first.');
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

  const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  const cartCount = orderItems.reduce((acc, i) => acc + i.qty, 0);

  const q = dishSearch.trim().toLowerCase();
  const filteredItems = menuItems.filter((item) => {
    if (item.category_id !== activeCategory) return false;
    if (activeFilter === 'Available' && item.is_available === false) return false;
    if (activeFilter === 'Off menu' && item.is_available !== false) return false;
    if (!q) return true;
    return (item.item_name || '').toLowerCase().includes(q);
  });

  const qtyOf = (id) => orderItems.find((i) => i.id === id)?.qty || 0;

  if (loading && categories.length === 0) {
    return <div className="loading-container">Loading menu…</div>;
  }

  return (
    <div className="take-order" id="menu-selection-page">
      {/* ---- Header ---- */}
      <div className="take-order__header">
        <button className="take-order__back" onClick={() => navigate('/')} id="btn-back-dashboard">
          <ArrowLeft size={18} />
        </button>
        <div className="take-order__title">
          {selectedTable ? `Table ${selectedTable.id} · Order` : 'Menu selection'}
        </div>
        {selectedTable && (
          <span className="take-order__guest">
            <Users size={14} />
            {selectedTable.guest || 'Walk-in'} · {selectedTable.seated || 0} guests
          </span>
        )}
      </div>

      {usingCachedMenu && (
        <div className="take-order__offline" id="menu-offline-banner">
          Offline — showing the menu from your last sync. Item availability may be out of date.
        </div>
      )}

      <div className="take-order__body">
        {/* ---- Dish picker ---- */}
        <div className="take-order__picker">
          <div className="take-order__cats" id="category-sidebar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`take-order__cat ${activeCategory === cat.id ? 'is-active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
                id={`cat-item-${cat.id}`}
              >
                {cat.category_name}
              </button>
            ))}
          </div>

          <div className="take-order__filters">
            <div className="take-order__segmented">
              {['All', 'Available', 'Off menu'].map((filter) => (
                <button
                  key={filter}
                  className={activeFilter === filter ? 'is-active' : ''}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="take-order__search">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search dishes…"
                value={dishSearch}
                onChange={(e) => setDishSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="take-order__grid" id="menu-items-grid">
            {filteredItems.map((item) => {
              const qty = qtyOf(item.id);
              const off = item.is_available === false;
              return (
                <div
                  key={item.id}
                  className={`dish ${qty > 0 ? 'dish--in-cart' : ''} ${off ? 'dish--off' : ''}`}
                  id={`food-card-${item.id}`}
                  onClick={() => !off && addToOrder(item)}
                  title={off ? 'This dish is off the menu right now' : undefined}
                >
                  <div className="dish__name">
                    {item.item_name}
                    {off && <span className="dish__off-pill">Off menu</span>}
                  </div>
                  {item.description && <div className="dish__desc">{item.description}</div>}

                  <div className="dish__foot">
                    <span className="dish__price tnum">{inr(item.price)}</span>

                    {off ? (
                      <span className="dish__off-note">Unavailable</span>
                    ) : qty > 0 ? (
                      <div className="dish__stepper" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => updateQty(item.id, -1)} id={`btn-dec-dish-${item.id}`}>
                          <Minus size={13} />
                        </button>
                        <span className="tnum">{qty}</span>
                        <button
                          className="is-primary"
                          onClick={() => addToOrder(item)}
                          id={`btn-inc-dish-${item.id}`}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    ) : (
                      <span className="dish__add" id={`btn-add-food-${item.id}`}>
                        <Plus size={16} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="take-order__empty">
                {q ? `No dish matches “${dishSearch.trim()}”.` : 'No items in this category.'}
              </div>
            )}
          </div>
        </div>

        {/* ---- Cart ---- */}
        <div className="take-order__cart" id="order-basket-panel">
          <div className="cart__head">
            <div>
              <div className="cart__title">Current order</div>
              <div className="cart__sub">{cartCount} item{cartCount === 1 ? '' : 's'}</div>
            </div>
            <button className="cart__clear" onClick={clearOrder} id="btn-clear-basket">
              Clear all
            </button>
          </div>

          <div className="cart__items">
            {orderItems.map((item) => (
              <div key={item.id} className="cart__row" id={`basket-item-${item.id}`}>
                <div className="cart__row-top">
                  <span className="cart__row-name">{item.name}</span>
                  <span className="cart__row-price tnum">{inr(item.price * item.qty)}</span>
                </div>

                <input
                  type="text"
                  className="cart__note"
                  placeholder="Special instruction (e.g. no onions)…"
                  value={item.notes}
                  onChange={(e) => updateNote(item.id, e.target.value)}
                  id={`input-note-${item.id}`}
                />

                <div className="cart__row-controls">
                  <div className="cart__stepper">
                    <button onClick={() => updateQty(item.id, -1)} id={`btn-dec-qty-${item.id}`}>
                      <Minus size={13} />
                    </button>
                    <span className="tnum">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} id={`btn-inc-qty-${item.id}`}>
                      <Plus size={13} />
                    </button>
                  </div>
                  <button
                    className="cart__delete"
                    onClick={() => updateQty(item.id, -item.qty)}
                    id={`btn-delete-item-${item.id}`}
                    title="Remove item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}

            {orderItems.length === 0 && (
              <div className="take-order__empty">Your order is empty.</div>
            )}
          </div>

          <div className="cart__summary">
            <div className="cart__sum-row"><span>Subtotal</span><b className="tnum">{inr(subtotal)}</b></div>
            <div className="cart__sum-row"><span>Tax (10%)</span><b className="tnum">{inr(tax)}</b></div>
            <div className="cart__sum-row cart__sum-row--total">
              <span>Total</span><span className="tnum">{inr(total)}</span>
            </div>

            <div className="cart__actions">
              <button className="cart__back" onClick={() => navigate('/')}>
                Back to floor
              </button>
              <button
                className="cart__send"
                onClick={handlePlaceOrder}
                disabled={orderItems.length === 0 || isSubmitting}
                id="btn-place-order"
              >
                {isSubmitting ? 'Sending…' : 'Send to kitchen (KOT)'}
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuCatalog;
