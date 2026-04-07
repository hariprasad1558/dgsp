const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema({
  department: { type: String, required: true },
  rec_ids: { type: [Number], required: true },
  month: { type: String, default: 'General' },
}, { timestamps: true });

allocationSchema.index({ department: 1, month: 1 }, { unique: true });

const Allocation = mongoose.model('Allocation', allocationSchema, 'allocations');

module.exports = Allocation;
