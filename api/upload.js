const fs = require('fs');
const axios = require('axios');
const { fromBuffer } = require('file-type');

module.exports.config = {
  api: {
    bodyParser: false, // Disable bodyParser from Vercel
  },
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metode tidak diizinkan' });
  }

  const chunks = [];

  // Menerima data chunk per chunk dari request
  req.on('data', chunk => {
    chunks.push(chunk); // Menyimpan chunk dalam array
  });

  req.on('error', (err) => {
    console.error('Error while receiving data:', err);
    return res.status(500).json({ error: 'Error receiving file data' });
  });

  req.on('end', async () => {
    try {
      const buffer = Buffer.concat(chunks); // Menggabungkan semua chunk menjadi buffer

      // Mendapatkan MIME type dari file menggunakan file-type
      const result = await fromBuffer(buffer);
      const mime = result?.mime;

      if (!mime) {
        return res.status(400).json({ error: 'Mime tidak valid' });
      }

      const fileName = Date.now() + '.' + mime.split('/')[1];
      const folder = 'uploads';

      // Mendapatkan URL signed untuk upload file
      const getSigned = await axios.post("https://pxpic.com/getSignedUrl", {
        folder, fileName
      }, {
        headers: { "Content-Type": "application/json" }
      });

      // Upload file ke server tujuan menggunakan URL signed
      await axios.put(getSigned.data.presignedUrl, buffer, {
        headers: { "Content-Type": mime }
      });

      const fileUrl = `https://files.fotoenhancer.com/uploads/${fileName}`;
      res.json({ status: 200, fileUrl, mime });

    } catch (e) {
      console.error("Error during file processing:", e);
      res.status(500).json({ error: e.message });
    }
  });
};