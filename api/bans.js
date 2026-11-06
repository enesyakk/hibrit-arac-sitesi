const { connectToDatabase } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { db } = await connectToDatabase();
    const col = db.collection('bans');

    if (req.method === 'GET') {
      const bans = await col.find({}).toArray();
      const map = {};
      bans.forEach(b => { map[b._id.toString()] = true; });
      return res.status(200).json(map);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { uid, by } = body;
      await col.updateOne({ _id: uid }, { $set: { at: new Date().toISOString(), by } }, { upsert: true });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
