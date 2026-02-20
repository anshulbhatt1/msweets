import { useState } from 'react'

export default function Contact() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = e => {
        e.preventDefault()
        setSubmitted(true)
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
                <h1 className="font-display text-4xl font-bold text-brown-800 mb-3">Get in Touch</h1>
                <p className="text-brown-400 max-w-md mx-auto">
                    Have a question, a bulk order enquiry, or just want to say hi? We'd love to hear from you!
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
                {/* Contact Info */}
                <div>
                    <div className="space-y-6">
                        {[
                            { icon: '📍', title: 'Visit Us', content: '12, Sweet Lane, Bandra West\nMumbai, Maharashtra 400050' },
                            { icon: '📞', title: 'Call Us', content: '+91 98765 43210\nMon–Sat, 9am – 6pm' },
                            { icon: '📧', title: 'Email Us', content: 'hello@sweethaven.in\norders@sweethaven.in' },
                            { icon: '🕐', title: 'Working Hours', content: 'Mon–Sat: 9am – 7pm\nSunday: 10am – 5pm' }
                        ].map(c => (
                            <div key={c.title} className="flex gap-4">
                                <div className="w-12 h-12 bg-cream-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                                    {c.icon}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-brown-700 mb-1">{c.title}</h3>
                                    <p className="text-brown-500 text-sm whitespace-pre-line">{c.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-6 bg-gradient-to-br from-brown-300 to-brown-500 rounded-3xl text-white">
                        <h3 className="font-display text-xl font-bold mb-2">Bulk Orders? 🎁</h3>
                        <p className="text-white/80 text-sm">
                            Planning a corporate gifting, wedding, or event? We offer custom packaging and bulk pricing.
                            Call us or send an email with your requirements.
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="card">
                    {submitted ? (
                        <div className="text-center py-10">
                            <div className="text-6xl mb-4">✉️</div>
                            <h2 className="font-display text-2xl font-bold text-brown-800 mb-2">Message Sent!</h2>
                            <p className="text-brown-400">We'll get back to you within 24 hours. 🍰</p>
                            <button onClick={() => { setForm({ name: '', email: '', subject: '', message: '' }); setSubmitted(false) }}
                                className="btn-outline mt-6">Send Another</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <h2 className="font-display text-xl font-bold text-brown-800 mb-2">Send a Message</h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-brown-700 mb-1.5">Name</label>
                                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        required className="input" placeholder="Your name" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-brown-700 mb-1.5">Email</label>
                                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                        required className="input" placeholder="your@email.com" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brown-700 mb-1.5">Subject</label>
                                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                                    required className="input" placeholder="How can we help?" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brown-700 mb-1.5">Message</label>
                                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                    required rows={5} className="input resize-none" placeholder="Tell us more…" />
                            </div>
                            <button type="submit" className="btn-primary w-full">Send Message 💌</button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
