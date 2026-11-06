const { connectToDatabase } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { db } = await connectToDatabase();
    const col = db.collection('likes');

    if (req.method === 'GET') {
      const likes = await col.find({}).toArray();
      return res.status(200).json(likes);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { id, note, uid, remove } = body;
      if (remove) {
        await col.deleteOne({ _id: id });
      } else {
        await col.updateOne({ _id: id }, { $set: { note, uid, at: new Date().toISOString() } }, { upsert: true });
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
