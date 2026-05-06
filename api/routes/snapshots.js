const express = require('express');
const Joi = require('joi');
const { Snapshot, Change } = require('../db/models');
const { compareSnapshots } = require('../services/diff');

const router = express.Router();

const productSchema = Joi.object({
  id: Joi.string().required(),
  title: Joi.string().required(),
  price: Joi.number().positive().required(),
  currency: Joi.string().length(3).required(),
  url: Joi.string().uri().required(),
  available: Joi.boolean().required(),
});

const snapshotSchema = Joi.object({
  snapshotId: Joi.string().required(),
  timestamp: Joi.string().isoDate().required(),
  source: Joi.string().uri().required(),
  products: Joi.array().items(productSchema).min(1).required(),
});

router.post('/snapshots', async (req, res) => {
  const { error, value } = snapshotSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payload',
      details: error.details.map(d => d.message)
    });
  }

  const payload = value;
  try {
    const previous = await Snapshot.findOne().sort({ timestamp: -1 }).lean();
    const snapshot = await Snapshot.create(payload);
    const changes = compareSnapshots(previous?.products || [], payload.products);

    await Change.create({
      snapshotId: snapshot._id,
      source: payload.source,
      timestamp: payload.timestamp,
      changes,
    });

    res.json({
      success: true,
      snapshotId: snapshot._id,
      receivedAt: new Date().toISOString(),
      productsReceived: payload.products.length,
      comparison: {
        new: changes.filter((c) => c.type === 'new').length,
        removed: changes.filter((c) => c.type === 'removed').length,
        priceChanges: changes.filter((c) => c.type === 'price').length,
      },
    });
  } catch (error) {
    console.error('POST /snapshots error', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


router.get('/changes', async (req, res) => {
  const { since, type } = req.query;
  const filter = {};

  if (type) {
    filter['changes.type'] = type;
  }

  if (since) {
    filter.timestamp = { $gte: new Date(since) };
  }

  try {
    const records = await Change.find(filter).lean();
    const changes = records.flatMap((record) => record.changes);
    res.json({ success: true, changes });
  } catch (error) {
    console.error('GET /changes error', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
