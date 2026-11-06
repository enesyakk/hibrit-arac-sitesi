const { connectToDatabase, ObjectId, GridFSBucket } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).send('Dosya ID eksik.');

  try {
    const { db } = await connectToDatabase();
    const bucket = new GridFSBucket(db, { bucketName: 'pdfs' });

    let fileId;
    try {
      fileId = new ObjectId(id);
    } catch(e) {
      return res.status(400).send('Geçersiz dosya ID.');
    }

    const files = await db.collection('pdfs.files').find({ _id: fileId }).toArray();
    if (!files.length) return res.status(404).send('PDF bulunamadı.');

    const file = files[0];
    res.setHeader('Content-Type', file.contentType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.filename)}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.pipe(res);
  } catch (err) {
    console.error('PDF fetch error:', err);
    return res.status(500).send('Dosya okuma hatası: ' + err.message);
  }
};
