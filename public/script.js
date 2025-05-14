document.getElementById('uploadForm').addEventListener('submit', function (e) {
  e.preventDefault(); // Mencegah form untuk refresh halaman secara otomatis

  // Menyembunyikan tombol upload dan menampilkan loading
  document.getElementById('uploadBtn').style.display = 'none';
  document.getElementById('loading').style.display = 'block';

  // Ambil file yang dipilih dari input
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];

  // Validasi jika tidak ada file yang dipilih
  if (!file) {
    alert('Silakan pilih file untuk di-upload.');
    document.getElementById('loading').style.display = 'none';
    document.getElementById('uploadBtn').style.display = 'block';
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  // Lakukan upload ke server
  fetch('/api/upload', { // Sesuaikan URL endpoint dengan server Anda
    method: 'POST',
    body: formData,
  })
  .then(response => response.json())
  .then(data => {
    // Menyembunyikan elemen loading setelah upload selesai
    document.getElementById('loading').style.display = 'none';

    // Jika berhasil, tampilkan hasil URL
    if (data.fileUrl) {
      document.getElementById('result').style.display = 'block';
      document.getElementById('fileUrl').textContent = data.fileUrl;
      document.getElementById('copyBtn').style.display = 'block'; // Menampilkan tombol salin
    } else {
      alert('Terjadi kesalahan saat meng-upload file.');
      // Menampilkan tombol upload kembali jika gagal
      document.getElementById('uploadBtn').style.display = 'block';
    }
  })
  .catch(error => {
    // Menyembunyikan elemen loading jika terjadi error
    document.getElementById('loading').style.display = 'none';
    alert('Terjadi kesalahan pada server.');
    // Menampilkan tombol upload kembali jika terjadi kesalahan
    document.getElementById('uploadBtn').style.display = 'block';
  });
});

// Fungsi untuk menyalin URL ke clipboard
document.getElementById('copyBtn').addEventListener('click', function() {
  const urlText = document.getElementById('fileUrl').textContent;
  navigator.clipboard.writeText(urlText)
    .then(() => {
      alert('URL berhasil disalin ke clipboard!');
    })
    .catch(err => {
      alert('Gagal menyalin URL.');
    });
});