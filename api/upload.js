const { connectToDatabase, GridFSBucket } = require('./_db');
const stream = require('stream');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { db } = await connectToDatabase();
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { name, base64 } = body || {};

    if (!base64) return res.status(400).json({ error: 'Dosya verisi eksik.' });

    const buffer = Buffer.from(base64, 'base64');
    const bucket = new GridFSBucket(db, { bucketName: 'pdfs' });

    const uploadStream = bucket.openUploadStream(name || 'document.pdf', {
      contentType: 'application/pdf'
    });

    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    await new Promise((resolve, reject) => {
      bufferStream.pipe(uploadStream)
        .on('finish', resolve)
        .on('error', reject);
    });

    const fileId = uploadStream.id.toString();
    const fileUrl = `/api/pdf?id=${fileId}`;

    return res.status(200).json({
      id: fileId,
      url: fileUrl,
      sizeBytes: buffer.length
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: err.message });
  }
};
