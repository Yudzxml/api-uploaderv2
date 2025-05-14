const formidable = require('formidable');
const { fromBuffer } = require('file-type');
const axios = require('axios');

// Vercel config to disable default body parser
module.exports.config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metode tidak diizinkan' });
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) {
        console.error('Error parsing form:', err);
        return res.status(500).json({ error: 'Gagal parsing form' });
      }

      const file = files.file;
      if (!file) {
        console.error('File tidak ditemukan');
        return res.status(400).json({ error: 'File tidak ditemukan' });
      }

      // Stream the file directly from request
      const buffer = await new Promise((resolve, reject) => {
        const chunks = [];
        file.file.stream.on('data', chunk => chunks.push(chunk));
        file.file.stream.on('end', () => resolve(Buffer.concat(chunks)));
        file.file.stream.on('error', (err) => reject(err));
      });

      const result = await fromBuffer(buffer);
      const mime = result?.mime;

      if (!mime) {
        console.error('Mime tidak valid');
        return res.status(400).json({ error: 'Mime tidak valid' });
      }

      const fileName = Date.now() + '.' + mime.split('/')[1];
      const folder = 'uploads';

      // Get the presigned URL
      const getSigned = await axios.post("https://pxpic.com/getSignedUrl", {
        folder, fileName
      }, {
        headers: { "Content-Type": "application/json" }
      });

      // Upload the file using the presigned URL
      await axios.put(getSigned.data.presignedUrl, buffer, {
        headers: { "Content-Type": mime }
      });

      const fileUrl = `https://files.fotoenhancer.com/uploads/${fileName}`;
      res.json({ status: 200, fileUrl, mime });
    } catch (e) {
      console.error('Error during upload process:', e);
      res.status(500).json({ error: e.message });
    }
  });
};