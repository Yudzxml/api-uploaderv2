const express = require('express');
const formidable = require('formidable');
const fs = require('fs');
const { fromBuffer } = require('file-type');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Static HTML
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint upload
app.post('/upload', async (req, res) => {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) return res.status(500).json({ error: 'Gagal parsing form' });

      const file = files.file;
      if (!file) return res.status(400).json({ error: 'File tidak ditemukan' });

      const buffer = fs.readFileSync(file.filepath);
      const { mime } = await fromBuffer(buffer) || {};
      if (!mime) return res.status(400).json({ error: 'Mime tidak valid' });

      const fileName = Date.now() + '.' + mime.split('/')[1];
      const folder = 'uploads';

      const getSigned = await axios.post("https://pxpic.com/getSignedUrl", {
        folder, fileName
      }, {
        headers: { "Content-Type": "application/json" }
      });

      await axios.put(getSigned.data.presignedUrl, buffer, {
        headers: { "Content-Type": mime }
      });

      const fileUrl = `https://files.fotoenhancer.com/uploads/${fileName}`;
      res.json({ status: 200, fileUrl, mime });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});