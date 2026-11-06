const { connectToDatabase, ObjectId } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { db } = await connectToDatabase();
    const col = db.collection('notes');

    if (req.method === 'GET') {
      const notes = await col.find({}).sort({ createdAt: -1 }).limit(300).toArray();
      const mapped = notes.map(n => ({ ...n, id: n._id.toString() }));
      return res.status(200).json(mapped);
    }

    if (req.method === 'POST') {
      const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      data.createdAt = data.createdAt || new Date().toISOString();
      const result = await col.insertOne(data);
      return res.status(201).json({ id: result.insertedId.toString(), ...data });
    }

    if (req.method === 'DELETE') {
      const id = req.query.id || (req.body && req.body.id);
      if (!id) return res.status(400).json({ error: 'Missing id' });
      try {
        await col.deleteOne({ _id: new ObjectId(id) });
      } catch (e) {
        await col.deleteOne({ _id: id });
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Notes API error:', err);
    return res.status(500).json({ error: err.message });
  }
};
