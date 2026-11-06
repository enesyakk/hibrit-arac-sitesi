const { connectToDatabase } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { db } = await connectToDatabase();
    const col = db.collection('accounts');
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const action = req.query.action || body.action;

    if (req.method === 'GET' || action === 'list') {
      const members = await col.find({}).toArray();
      const map = {};
      members.forEach(m => {
        const id = m._id.toString();
        map[id] = { ...m, id };
      });
      return res.status(200).json(map);
    }

    if (action === 'set') {
      const { id, data } = body;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      await col.updateOne({ _id: id }, { $set: data }, { upsert: true });
      return res.status(200).json({ success: true });
    }

    if (action === 'delete') {
      const { id } = body;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      await col.deleteOne({ _id: id });
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({ error: err.message });
  }
};
