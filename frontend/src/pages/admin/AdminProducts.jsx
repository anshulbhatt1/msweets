import { useEffect, useState } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import api from '../../services/api'

const EMPTY_FORM = { name: '', description: '', price: '', stock: '', category_id: '', image_url: '', is_active: true }

// ── Predefined bakery categories to seed if table is empty ──
const DEFAULT_BAKERY_CATEGORIES = [
    { name: 'Cakes', description: 'Birthday, wedding, and celebration cakes' },
    { name: 'Cookies & Biscuits', description: 'Freshly baked cookies, biscuits, and rusks' },
    { name: 'Pastries', description: 'Puffs, croissants, danishes, and tarts' },
    { name: 'Breads', description: 'Artisan breads, sandwich loaves, buns, and rolls' },
    { name: 'Indian Sweets', description: 'Gulab jamun, rasgulla, barfi, laddu, and more' },
    { name: 'Dry Fruits & Nuts', description: 'Premium dry fruits, roasted nuts, and trail mixes' },
    { name: 'Chocolates', description: 'Handcrafted chocolates, truffles, and pralines' },
    { name: 'Ice Cream & Frozen', description: 'Ice creams, kulfis, popsicles, and frozen desserts' },
    { name: 'Beverages', description: 'Milkshakes, lassi, smoothies, and specialty drinks' },
    { name: 'Cupcakes & Muffins', description: 'Gourmet cupcakes, muffins, and brownies' },
    { name: 'Namkeen & Savoury', description: 'Namkeen, samosa, kachori, and savoury snacks' },
    { name: 'Festival Specials', description: 'Diwali, Holi, Rakhi, and seasonal specials' },
    { name: 'Gift Boxes', description: 'Curated gift hampers and combo boxes' },
]

export default function AdminProducts() {
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [toast, setToast] = useState('')

    // ── New‑category modal state ──
    const [showCatModal, setShowCatModal] = useState(false)
    const [catForm, setCatForm] = useState({ name: '', description: '' })
    const [catSaving, setCatSaving] = useState(false)
    const [catError, setCatError] = useState('')
    const [seeding, setSeeding] = useState(false)

    const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000) }

    // ── Load data ─────────────────────────────────────────────
    const load = async () => {
        setLoading(true)
        try {
            const [p, c] = await Promise.all([
                api.get('/admin/products'),
                api.get('/admin/categories')
            ])
            setProducts(p.data.products || [])
            const cats = c.data.categories || []
            setCategories(cats)

            // Auto-seed default bakery categories if the table is empty
            if (cats.length === 0) {
                await seedDefaultCategories()
            }
        } catch { }
        setLoading(false)
    }

    // ── Seed predefined categories ────────────────────────────
    const seedDefaultCategories = async () => {
        setSeeding(true)
        try {
            // Create all default categories in parallel
            await Promise.all(
                DEFAULT_BAKERY_CATEGORIES.map(cat =>
                    api.post('/admin/categories', cat).catch(() => null)
                )
            )
            // Reload categories
            const res = await api.get('/admin/categories')
            setCategories(res.data.categories || [])
            showToast('🎉 Default bakery categories added!')
        } catch {
            console.warn('Failed to seed default categories')
        }
        setSeeding(false)
    }

    useEffect(() => { load() }, [])

    // ── Product modal handlers ────────────────────────────────
    const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setError(''); setShowModal(true) }
    const openEdit = p => { setEditing(p); setForm({ name: p.name, description: p.description || '', price: p.price, stock: p.stock, category_id: p.category_id || '', image_url: p.image_url || '', is_active: p.is_active }); setError(''); setShowModal(true) }

    const handleSave = async e => {
        e.preventDefault()
        setError('')
        setSaving(true)
        try {
            if (editing) {
                await api.put(`/admin/products/${editing.id}`, form)
                showToast('Product updated!')
            } else {
                await api.post('/admin/products', form)
                showToast('Product created!')
            }
            setShowModal(false)
            load()
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save product.')
        }
        setSaving(false)
    }

    const handleToggle = async (p) => {
        try {
            await api.put(`/admin/products/${p.id}`, { is_active: !p.is_active })
            showToast(p.is_active ? 'Product deactivated.' : 'Product activated!')
            load()
        } catch { }
    }

    const handleDelete = async (id) => {
        if (!confirm('Deactivate this product?')) return
        try {
            await api.delete(`/admin/products/${id}`)
            showToast('Product deactivated.')
            load()
        } catch { }
    }

    // ── Category dropdown change handler ──────────────────────
    const handleCategoryChange = (e) => {
        const val = e.target.value
        if (val === '__ADD_NEW__') {
            // Open "Add New Category" modal
            setCatForm({ name: '', description: '' })
            setCatError('')
            setShowCatModal(true)
        } else {
            setForm(f => ({ ...f, category_id: val }))
        }
    }

    // ── Save new category ─────────────────────────────────────
    const handleSaveCategory = async (e) => {
        e.preventDefault()
        setCatError('')
        if (!catForm.name.trim()) {
            setCatError('Category name is required.')
            return
        }
        setCatSaving(true)
        try {
            const res = await api.post('/admin/categories', {
                name: catForm.name.trim(),
                description: catForm.description.trim() || null
            })
            const newCat = res.data.category
            // Add to local list and auto-select
            setCategories(prev => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)))
            setForm(f => ({ ...f, category_id: newCat.id }))
            setShowCatModal(false)
            showToast(`Category "${newCat.name}" created!`)
        } catch (err) {
            setCatError(err.response?.data?.error || 'Failed to create category.')
        }
        setCatSaving(false)
    }

    return (
        <div className="flex min-h-screen bg-cream-50">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto p-8">

                {/* Toast */}
                {toast && (
                    <div className="fixed top-6 right-6 z-50 bg-green-500 text-white px-5 py-3 rounded-2xl shadow-warm-lg animate-fade-in">
                        ✓ {toast}
                    </div>
                )}

                {/* Seeding indicator */}
                {seeding && (
                    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-brown-500 text-white px-5 py-3 rounded-2xl shadow-warm-lg animate-fade-in flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Setting up bakery categories…
                    </div>
                )}

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-brown-800">Products</h1>
                        <p className="text-brown-400 mt-1">{products.length} total products</p>
                    </div>
                    <button onClick={openCreate} className="btn-primary flex items-center gap-2">
                        <span>+</span> Add Product
                    </button>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-warm overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-cream-50 border-b border-cream-200">
                                    <th className="text-left px-5 py-4 text-sm font-semibold text-brown-600">Product</th>
                                    <th className="text-left px-4 py-4 text-sm font-semibold text-brown-600">Category</th>
                                    <th className="text-left px-4 py-4 text-sm font-semibold text-brown-600">Price</th>
                                    <th className="text-left px-4 py-4 text-sm font-semibold text-brown-600">Stock</th>
                                    <th className="text-left px-4 py-4 text-sm font-semibold text-brown-600">Status</th>
                                    <th className="text-right px-5 py-4 text-sm font-semibold text-brown-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-cream-100">
                                {products.map(p => (
                                    <tr key={p.id} className="hover:bg-cream-50 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                {p.image_url ? (
                                                    <img src={p.image_url} alt={p.name}
                                                        className="w-10 h-10 rounded-xl object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-cream-200 flex items-center justify-center text-lg">🍰</div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-brown-800 text-sm">{p.name}</p>
                                                    <p className="text-xs text-brown-400 line-clamp-1 max-w-[200px]">{p.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="badge badge-brown text-xs">{p.categories?.name || '—'}</span>
                                        </td>
                                        <td className="px-4 py-4 font-semibold text-brown-700">₹{p.price}</td>
                                        <td className="px-4 py-4">
                                            <span className={`badge text-xs ${p.stock === 0 ? 'badge-red' : p.stock < 10 ? 'badge-yellow' : 'badge-green'}`}>
                                                {p.stock}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <button onClick={() => handleToggle(p)}
                                                className={`badge cursor-pointer ${p.is_active ? 'badge-green' : 'badge-red'}`}>
                                                {p.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openEdit(p)}
                                                    className="p-2 text-brown-400 hover:text-brown-700 hover:bg-cream-100 rounded-lg transition-colors">
                                                    ✏️
                                                </button>
                                                <button onClick={() => handleDelete(p.id)}
                                                    className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {products.length === 0 && (
                            <div className="text-center py-16 text-brown-400">
                                <div className="text-4xl mb-3">🍰</div>
                                <p>No products yet. Add your first product!</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ════════════════════════════════════════════════ */}
                {/* Product Create/Edit Modal                       */}
                {/* ════════════════════════════════════════════════ */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-warm-lg max-h-screen overflow-y-auto animate-fade-in">
                            <h2 className="font-display text-2xl font-bold text-brown-800 mb-6">
                                {editing ? 'Edit Product' : 'Add New Product'}
                            </h2>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>
                            )}

                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-brown-700 mb-1.5">Product Name *</label>
                                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        required className="input" placeholder="e.g. Kaju Katli" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-brown-700 mb-1.5">Description</label>
                                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        rows={3} className="input resize-none" placeholder="Product description…" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-brown-700 mb-1.5">Price (₹) *</label>
                                        <input type="number" step="0.01" min="0" required
                                            value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                                            className="input" placeholder="299" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-brown-700 mb-1.5">Stock *</label>
                                        <input type="number" min="0" required
                                            value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                                            className="input" placeholder="50" />
                                    </div>
                                </div>

                                {/* ── Category picker with "Add New" option ── */}
                                <div>
                                    <label className="block text-sm font-medium text-brown-700 mb-1.5">Category *</label>
                                    <select
                                        value={form.category_id}
                                        onChange={handleCategoryChange}
                                        required
                                        className="input"
                                    >
                                        <option value="">Select category…</option>

                                        {/* Divider — existing categories */}
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}

                                        {/* Separator + "Add New" */}
                                        <option disabled>──────────────</option>
                                        <option value="__ADD_NEW__">＋ Add New Category…</option>
                                    </select>

                                    {/* Show currently selected category chip */}
                                    {form.category_id && form.category_id !== '__ADD_NEW__' && (
                                        <div className="mt-2 inline-flex items-center gap-1.5 bg-brown-50 text-brown-700 text-xs font-medium px-3 py-1.5 rounded-full border border-brown-200">
                                            🏷️ {categories.find(c => c.id === form.category_id)?.name || 'Selected'}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-brown-700 mb-1.5">Image URL</label>
                                    <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                                        className="input" placeholder="https://…" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" id="active" checked={form.is_active}
                                        onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                                        className="w-4 h-4 accent-brown-400" />
                                    <label htmlFor="active" className="text-sm font-medium text-brown-700">Active (visible to customers)</label>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                                    <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
                                        {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════════════ */}
                {/* Add New Category Modal                          */}
                {/* ════════════════════════════════════════════════ */}
                {showCatModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                        onClick={(e) => { if (e.target === e.currentTarget) setShowCatModal(false) }}>
                        <div className="bg-white rounded-3xl p-7 w-full max-w-md shadow-warm-lg animate-fade-in">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-xl">
                                    🏷️
                                </div>
                                <div>
                                    <h3 className="font-display text-xl font-bold text-brown-800">New Category</h3>
                                    <p className="text-xs text-brown-400">Add a custom category for your products</p>
                                </div>
                            </div>

                            {catError && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
                                    <span>⚠️</span> {catError}
                                </div>
                            )}

                            <form onSubmit={handleSaveCategory} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-brown-700 mb-1.5">Category Name *</label>
                                    <input
                                        value={catForm.name}
                                        onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                                        required
                                        className="input"
                                        placeholder="e.g. Sugar‑Free Specials"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-brown-700 mb-1.5">Description (optional)</label>
                                    <input
                                        value={catForm.description}
                                        onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))}
                                        className="input"
                                        placeholder="Short description of this category…"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button"
                                        onClick={() => setShowCatModal(false)}
                                        className="btn-secondary flex-1">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={catSaving}
                                        className="btn-primary flex-1 disabled:opacity-60 flex items-center justify-center gap-2">
                                        {catSaving ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Creating…
                                            </>
                                        ) : 'Create Category'}
                                    </button>
                                </div>
                            </form>

                            {/* Quick‑add existing default categories (if less than 3 exist) */}
                            {categories.length < 3 && (
                                <div className="mt-5 pt-4 border-t border-cream-200">
                                    <p className="text-xs text-brown-400 mb-2">Or quickly add all bakery defaults:</p>
                                    <button
                                        type="button"
                                        onClick={async () => { setShowCatModal(false); await seedDefaultCategories() }}
                                        className="text-sm text-brown-600 font-medium hover:text-brown-800 transition-colors flex items-center gap-1.5"
                                    >
                                        🍰 Add {DEFAULT_BAKERY_CATEGORIES.length} predefined bakery categories
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
