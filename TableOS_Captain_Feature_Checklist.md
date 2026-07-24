# TableOS — Captain Panel Feature Checklist

> Audited against current code on `main` (commit `36ef8bd`). Notes include file:line refs. Billing routes to admin — verified captain-side only, as scoped.

---

## 1. SESSION & TABLE ASSIGNMENT

- [x] Captain can see all tables and their status (free / active / waiting) — `TableCard.jsx`, `TableGrid.jsx`, statuses: available/occupied/reserved/cleaning/payment
- [x] Captain can assign a customer to a table — `RestaurantContext.jsx:657` `assignTable`, wired via `AssignTableModal.jsx`
- [~] Captain can see customer name + number on each active table — name shown everywhere (`table.guest`); phone number is collected in `AssignTableModal.jsx:139` and sent to `assignTable`, but it's never persisted on the mock table object (`RestaurantContext.jsx:657-691`) and never mapped back out in `mapTables` (`RestaurantContext.jsx:563-597`) — so it's captured on intake and then lost. No UI ever displays it.
- [x] Table status updates in real time (Supabase Realtime) — `RestaurantContext.jsx:637-643`, subscribes to `restaurant_tables`, `customer_sessions`, `waiting_list`, `waiter_calls`. (Mock mode instead polls every 15s, `RestaurantContext.jsx:630-635` — fine for demo, not real realtime.)
- [x] Free table option works — `freeTable` (`RestaurantContext.jsx:892`), button in `TableDetailPanel.jsx:230`
- [~] Freeing a table clears its session/order state correctly — real-mode is correct (closes `customer_sessions`, `mapTables` only reads `active` sessions so orders disappear). **Mock mode bug:** `freeTable` (`RestaurantContext.jsx:892-919`) resets `status/guest/seated/startedAt/time` but never clears `orders` or `sessionId` — stale order data lingers in localStorage until the table is reassigned.
- [ ] Merge table → two tables combine into one — not implemented anywhere in the codebase
- [ ] Merged tables share one combined order/bill — depends on the above; missing
- [ ] Un-merge / split back — missing
- [~] Table transfer — move an order from one table to another — UI stub only: "Move Table" button exists (`TableDetailPanel.jsx:221-224`, `id="btn-move-table"`) but has **no `onClick` handler**. Does nothing when clicked.

---

## 2. WAITING LIST

- [~] When all tables full, new customer goes to waiting list — adding to waitlist is always a manual captain action (`AssignTableModal` "Add to Waitlist" flow); there's no automatic detection of "all tables full" that forces/suggests waitlist
- [x] Captain can see the waiting list — `WaitingList.jsx`, `WaitlistPreview.jsx`
- [ ] When a table frees, waiting customer auto-assigned — `freeTable` (`RestaurantContext.jsx:892`) has zero interaction with the waitlist; assignment is always manual
- [x] Waiting list order is correct (first in, first out) — sorted by `added_at` (`RestaurantContext.jsx:498`), `isNext` = index 0 (`RestaurantContext.jsx:431-439`, `:543-561`)
- [x] Captain can manually assign a waiting customer to a specific table — table selector dropdown in `AssignTableModal.jsx:74-95`, filtered to available tables only

---

## 3. WAITER CALLS & SOS

- [x] Customer "Call Waiter" shows on captain panel — `createWaiterCall` (`RestaurantContext.jsx:804`) → rendered in `PriorityCallsList.jsx`, `Notifications.jsx`, `NotificationToast.jsx`
- [x] Call shows which table it came from — `table_number` mapped and displayed in all three call-list components
- [~] Captain can acknowledge / clear the call — works for normal calls (`completeWaiterCall`, `RestaurantContext.jsx:1107`). **By design, SOS calls are explicitly locked from the captain side** — `PriorityCallsList.jsx:61-67`, `Notifications.jsx:157-163` show a `Lock` icon with "Only client can resolve this SOS call." That's a deliberate product decision, not a bug, but it means this item is only half-true on the captain panel.
- [x] Multiple simultaneous calls from different tables all show — calls render as a list, no single-call assumption anywhere
- [x] SOS / complaint visible to the right panel — distinct red styling, pulsing alert icon, "SOS" badge in all three call surfaces
- [~] SOS resolution flow works (resolved from customer panel) — only verifiable via the in-repo `CustomerSimulator.jsx:46-52`, which calls the same `completeWaiterCall`. The real customer-facing app isn't part of this repo, so the actual resolution path (and its auth/RLS) can't be confirmed from here.
- [x] Cleared calls disappear from the active list — `fetchData` filters to `request_status === 'pending'` only (`RestaurantContext.jsx:441`, `:518`)

---

## 4. ORDER CREATION & KOT

- [x] Captain can open full menu to create an order for a table — `MenuCatalog.jsx`, navigated to from table card / detail panel "Create Order"
- [x] Menu shows categories and items correctly — category sidebar + item grid, `MenuCatalog.jsx:226-292`
- [x] Add item to order, set quantity — `addToOrder`/`updateQty`, `MenuCatalog.jsx:130-153`
- [x] Remove item before KOT — qty down to 0 removes the line, plus explicit trash button (`MenuCatalog.jsx:320`)
- [ ] Add special instruction / note per item — the `notes` field exists on the order-item object (`MenuCatalog.jsx:139`) but there is **no input field anywhere** to actually type one. The basket only ever displays `item.notes || 'No notes'` read-only (`MenuCatalog.jsx:310`). Field exists in the model, not reachable from the UI.
- [x] Generate KOT button works — labeled "Place Order" but functionally is KOT generation: `handlePlaceOrder` → `createOrder` → `printKOT` (`MenuCatalog.jsx:161-198`)
- [~] KOT prints to kitchen printer — `printKOT.js` opens a browser window and calls `window.print()` against whatever the OS default printer is; there's no direct thermal/ESC-POS or networked kitchen-printer integration. If the popup is blocked, it just `console.warn`s (`printKOT.js:207-210`) with no UI feedback to the captain.
- [x] KOT shows table number, items, quantities, notes, timestamp — all present in the ticket template (`printKOT.js:160-202`)
- [x] Second KOT on same table (customer orders more later) works — re-entering the menu and placing another order merges into the table and prints a fresh ticket for the new items
- [~] Multiple KOTs accumulate against the same table — items accumulate into one flat merged `orders` array (`createOrder`, `RestaurantContext.jsx:988-1028`), which is fine for billing totals, but there's no concept of distinct KOT records — you can't see "KOT #1 vs KOT #2" or what was sent when.
- [x] KOT cannot be generated empty (blocked if no items) — early return + disabled button (`MenuCatalog.jsx:162`, `:347`)
- [ ] Rapid double-tap on Generate KOT does NOT create duplicate KOTs — the "Place Order" button is only disabled when the basket is empty, not while the async `createOrder`/`printKOT` call is in flight (`MenuCatalog.jsx:344-351`). A fast double-click can fire `handlePlaceOrder` twice before the basket clears.

---

## 5. KOT EDITING / CANCELLATION

- [~] Edit order after KOT (add item → new KOT) — "adding more" works (re-enter menu, place another order, it merges), but there's no way to edit a quantity that was already sent, and no tracked diff between "what was on KOT 1" vs "what's new"
- [ ] Cancel an item after KOT printed — no such control exists anywhere once `createOrder` has run; `TableDetailPanel` only displays the order list read-only
- [ ] Cancelled item triggers a cancellation print to kitchen — missing (depends on cancellation existing at all)
- [ ] Cancellation requires a reason — missing
- [ ] Reprint KOT option — missing, no reprint button/action anywhere

---

## 6. BILLING (routes to admin — verified captain side only)

- [x] "Generate Bill" / "Mark as Billing" button exists on active table — `markBilling`, button in `TableDetailPanel.jsx:225-228`
- [~] Marking for billing pulls all KOTs for that table together — there's no real "pull together" step; it works only because `createOrder` already merges every order into one flat array per table, so by accident there's one list to bill from rather than a deliberate aggregation step
- [~] Bill correctly sums all items across multiple KOTs — the subtotal math itself is correct (`TableDetailPanel.jsx:44`, sums `qty * price`), but this is a subtotal only, not a finished bill
- [ ] GST / tax shows on the bill — `MenuCatalog`'s basket shows a 10% tax line before ordering (`MenuCatalog.jsx:201,337`), but there is **no bill view at all** once a table is marked for billing — `TableDetailPanel` only ever shows "Subtotal," never tax
- [ ] Discount can be applied — no discount field/control anywhere in the app
- [~] Bill routes / appears on admin panel (current behavior – OK for now) — captain side correctly flips table status to `'payment'`; the actual admin-side rendering isn't part of this repo and couldn't be verified from here
- [x] After marking for billing, table status changes appropriately — status → `payment`, reflected in `TableCard`/`TableGrid` badges
- [~] Captain cannot add items to a table already sent for billing — enforced only at the UI layer (the "Create Order" button is hidden once status isn't `'occupied'`, e.g. `TableDetailPanel.jsx:209`, `TableCard.jsx:121`). There's no guard in `createOrder` itself. Worse, in mock mode `createOrder` (`RestaurantContext.jsx:988-1019`) sets the table's status back to `'occupied'` on every call — so if you do reach the menu for a `'payment'` table (e.g. by URL), placing an order silently un-bills it.
- [~] Bill total is mathematically correct (verify with calculator) — the arithmetic that exists (`subtotal`, `tax = subtotal * 0.1`, `total`) is correct, but since there's no final bill screen combining subtotal + tax + (absent) discount at billing time, "the bill total" as a finished artifact doesn't really exist captain-side to verify end-to-end

---

## 7. END SHIFT & REPORTS

- [x] End Shift button works — `TopBar.jsx:86-93` → `generateShiftReport` → `EndShiftModal`
- [x] Shift report generates — `generateShiftReport` (`RestaurantContext.jsx:255`), real and mock paths, with a fallback on Supabase error
- [x] Report shows total sales for the shift — `total_revenue`
- [x] Report shows order count — `total_orders`
- [ ] Report shows breakdown (by table / by captain) — only flat aggregate totals; `captain_name` is hardcoded to `'Julian Rossi'` everywhere (`RestaurantContext.jsx:277,313,328`, `Sidebar`/`mockData.js:221-225`) — no multi-captain attribution, no per-table breakdown
- [~] After ending shift, next shift starts clean — in **mock mode**, `endShift` (`RestaurantContext.jsx:340-384`) fully resets tables/calls/waitlist for the demo. In **real mode**, `endShift` only inserts the `shift_reports` row and resets the local `shift_start`/`isShiftActive` flags — it does **not** touch `restaurant_tables`/`customer_sessions` at all, so currently-seated tables/orders just carry over into the next shift. That's arguably correct restaurant behavior (you shouldn't evict diners because a shift ended), but it doesn't match "starts clean."
- [~] Report is exportable / viewable later — viewable: yes, `Reports.jsx` lists full history from `shift_reports`. Exportable: no CSV/PDF export action exists.

---

## 8. REAL-TIME & MULTI-USER

- [~] Two captains logged in at once → no data collision — there is **no auth/login system at all** (single hardcoded `captainInfo`, `mockData.js:221-225`); every device just reads/writes the same shared Supabase tables with no per-user identity, locking, or conflict resolution. "No collision" only holds in the loose sense that there's no optimistic-locking conflict to surface — there's also no captain-level attribution to know who did what.
- [x] Table status syncs across devices in real time — covered by the realtime channel (`RestaurantContext.jsx:637-643`)
- [x] Waiter calls sync in real time — same channel includes `waiter_calls`
- [ ] Order changes reflect across captain devices instantly — the realtime subscription only listens to `restaurant_tables`, `customer_sessions`, `waiting_list`, `waiter_calls` (`RestaurantContext.jsx:639-642`). It does **not** listen to `orders` or `order_items`. Placing a new KOT on an already-occupied table (no session/table-status change) won't push to other devices — they'd need to hit "Sync" manually.

---

## 9. ERROR HANDLING & EDGE CASES

- [~] Printer offline → graceful error, order not lost — the order itself is safe (it's written via `createOrder` before `printKOT` ever runs, `MenuCatalog.jsx:172-187`), but if the print popup is blocked there's only a `console.warn` (`printKOT.js:207-210`) — the captain gets no visible error at all.
- [~] Internet drop → data persists, reconnects (Supabase) — relies entirely on the default `@supabase/supabase-js` client/channel reconnect behavior; there's no offline write queue, so any action attempted mid-outage just surfaces a raw `alert(result.error)` (e.g. `TableDashboard.jsx:47,58,65`) with no retry.
- [~] Loading states on all buttons (no double-submit) — inconsistent. Good examples: `EndShiftModal` (`:188`, spinner + disabled while submitting), `Notifications`/`Reports` refresh buttons, `CustomerSimulator` send buttons (`isSending`). Missing on: "Place Order" in `MenuCatalog` (sets `loading` state but never disables the submit button on it), `freeTable`/`markBilling` in `TableDetailPanel`, table assignment in `TableDashboard`.
- [x] Empty states handled (no tables, no orders, no calls) — "No customers currently waiting" (`WaitingList.jsx:83`), "All calls resolved" (`PriorityCallsList.jsx:84-86`), "Your order is empty" (`MenuCatalog.jsx:327`), "No items ordered yet" (`TableDetailPanel.jsx:181`), "No History Yet" (`Notifications.jsx:230-233`)
- [x] Cannot assign customer to an already-occupied table — clicking an occupied/reserved table opens the detail panel, not the assign modal (`TableDashboard.jsx:22-31`); the waitlist-assignment table dropdown is filtered to `status === 'available'` only (`AssignTableModal.jsx:86`)
- [ ] Cannot merge a table with itself — N/A / missing, since merge doesn't exist at all to guard

---

## KNOWN GAPS TO DECIDE ON (product decisions, current state for context)

- [ ] Payment mode capture (cash/UPI/card) — missing, no field anywhere in the order/session model
- [ ] Split payment — missing, no payment-splitting logic exists
- [ ] Void bill flow — missing; once a table is `'payment'`, there's no documented way to un-bill it (other than the mock-mode `createOrder` side-effect bug noted in §6) — no void action, no audit log
- [ ] NCKOT (complimentary food) — missing, no comp/NC flag on orders or items
- [ ] Service charge toggle — missing; only a hardcoded flat 10% "tax" exists (`MenuCatalog.jsx:201`), no separate configurable service charge
- [ ] Kitchen Display Screen (KDS) — printed KOT only, via browser print dialog (`printKOT.js`); no KDS screen/queue exists

---

## SUMMARY SCORE

| Section | Total | Done | Partial | Missing |
|---------|-------|------|---------|---------|
| Session & Tables | 10 | 4 | 3 | 3 |
| Waiting List | 5 | 3 | 1 | 1 |
| Waiter Calls & SOS | 7 | 5 | 2 | 0 |
| Order & KOT | 12 | 8 | 2 | 2 |
| KOT Editing | 5 | 0 | 1 | 4 |
| Billing | 9 | 2 | 5 | 2 |
| End Shift & Reports | 7 | 4 | 2 | 1 |
| Real-time / Multi-user | 4 | 2 | 1 | 1 |
| Error Handling | 6 | 2 | 3 | 1 |
| **Total** | **65** | **30** | **20** | **15** |

**Launch blockers (Missing, in Order/KOT/Billing/Tables per your own rule):**
- Table merge / un-merge / transfer (§1) — entirely absent, "Move Table" button is dead UI
- Per-item special instructions have no input (§4) — field exists, UI doesn't
- Double-tap protection on "Generate KOT" (§4) — real duplicate-order risk
- KOT cancellation, cancellation reason, cancellation print, reprint (§5) — entire section is unimplemented
- GST/tax and discount on the actual bill (§6) — no bill view exists once a table is marked for billing
- Order-level realtime sync across devices (§8) — `orders`/`order_items` aren't subscribed to

Everything else (waitlist auto-assign, shift breakdown by table/captain, export, offline queueing, multi-captain identity) is prioritizable but not a hard blocker.
