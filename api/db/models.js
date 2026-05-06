const mongoose = require('mongoose');

const SnapshotSchema = new mongoose.Schema({
  snapshotId: { type: String, required: true },
  timestamp: { type: String, required: true },
  source: { type: String, required: true },
  products: { type: Array, required: true },
});

const ChangeSchema = new mongoose.Schema({
  snapshotId: { type: mongoose.Schema.Types.ObjectId, required: true },
  source: { type: String, required: true },
  timestamp: { type: String, required: true },
  changes: { type: Array, required: true },
});

const Snapshot = mongoose.model('Snapshot', SnapshotSchema);
const Change = mongoose.model('Change', ChangeSchema);

module.exports = {
  Snapshot,
  Change,
};
