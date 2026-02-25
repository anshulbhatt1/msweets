const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    change_amount: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        default: ''
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
