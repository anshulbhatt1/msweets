import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

const CART_KEY = 'sh_cart'

const loadCart = () => {
    try {
        const saved = localStorage.getItem(CART_KEY)
        return saved ? JSON.parse(saved) : []
    } catch {
        return []
    }
}

const saveCart = (items) => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
}

export function CartProvider({ children }) {
    const [items, setItems] = useState(loadCart)

    // Persist to localStorage on every change
    useEffect(() => {
        saveCart(items)
    }, [items])

    const addItem = (product, quantity = 1) => {
        setItems(prev => {
            const existing = prev.find(i => i.id === product.id)
            if (existing) {
                const newQty = Math.min(existing.quantity + quantity, product.stock)
                return prev.map(i => i.id === product.id ? { ...i, quantity: newQty } : i)
            }
            return [...prev, { ...product, quantity: Math.min(quantity, product.stock) }]
        })
    }

    const updateItem = (productId, quantity) => {
        if (quantity <= 0) {
            removeItem(productId)
            return
        }
        setItems(prev =>
            prev.map(i => i.id === productId ? { ...i, quantity } : i)
        )
    }

    const removeItem = (productId) => {
        setItems(prev => prev.filter(i => i.id !== productId))
    }

    const clearCart = () => setItems([])

    const totalItems = items.reduce((s, i) => s + i.quantity, 0)
    const totalAmount = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0)
    const isEmpty = items.length === 0

    return (
        <CartContext.Provider value={{ items, addItem, updateItem, removeItem, clearCart, totalItems, totalAmount, isEmpty }}>
            {children}
        </CartContext.Provider>
    )
}

export const useCart = () => useContext(CartContext)
