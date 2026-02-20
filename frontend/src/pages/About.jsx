export default function About() {
    return (
        <div>
            {/* Hero */}
            <section className="py-20 text-center"
                style={{ background: 'linear-gradient(135deg, #fdf0e0, #fae0d0)' }}>
                <div className="max-w-3xl mx-auto px-4">
                    <div className="text-6xl mb-6">🧁</div>
                    <h1 className="font-display text-5xl font-bold text-brown-800 mb-4">Our Story</h1>
                    <p className="text-brown-500 text-lg leading-relaxed">
                        Sweet Haven was born out of a grandmother's kitchen and a family recipe passed down through three generations.
                        We believe that every sweet treat carries a memory, a celebration, and a moment of pure joy.
                    </p>
                </div>
            </section>

            {/* Values */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="font-display text-3xl font-bold text-brown-800 text-center mb-10">Why Choose Sweet Haven?</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: '🌿', title: 'Pure Ingredients', desc: 'No preservatives. No artificial colours. Just natural goodness.' },
                            { icon: '👩‍🍳', title: 'Handcrafted', desc: 'Made by skilled artisans following traditional recipes.' },
                            { icon: '🚚', title: 'Fast Delivery', desc: 'Fresh from our kitchen to your door in under 24 hours.' },
                            { icon: '💝', title: 'Made with Love', desc: 'Every piece is crafted with care and attention to detail.' }
                        ].map(v => (
                            <div key={v.title} className="card text-center hover:shadow-warm-lg transition-shadow">
                                <div className="text-4xl mb-4">{v.icon}</div>
                                <h3 className="font-semibold text-brown-700 mb-2">{v.title}</h3>
                                <p className="text-brown-400 text-sm leading-relaxed">{v.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="py-16" style={{ background: 'linear-gradient(135deg, #fdf8f0, #faf0e0)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="font-display text-3xl font-bold text-brown-800 text-center mb-10">Meet the Team</h2>
                    <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
                        {[
                            { name: 'Meera Sharma', role: 'Founder & Head Chef', emoji: '👩‍🍳' },
                            { name: 'Arjun Patel', role: 'Chocolatier', emoji: '🍫' },
                            { name: 'Sunita Rao', role: 'Pastry Artist', emoji: '🎂' }
                        ].map(m => (
                            <div key={m.name} className="card text-center hover:shadow-warm-lg transition-shadow">
                                <div className="w-20 h-20 bg-gradient-to-br from-brown-200 to-brown-400 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                                    {m.emoji}
                                </div>
                                <h3 className="font-semibold text-brown-800">{m.name}</h3>
                                <p className="text-brown-400 text-sm">{m.role}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}
