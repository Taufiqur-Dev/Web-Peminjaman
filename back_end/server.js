require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db.js");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ============================================================================
// 1. ENDPOINT ALAT
// ============================================================================

/** [GET] Semua alat + nama kategori */
app.get("/api/alat", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.id_alat AS id,
        a.nama_alat AS name,
        a.kondisi,
        a.lokasi,
        a.stok,
        a.id_kategori,
        COALESCE(c.nama_kategori, 'Tanpa Kategori') AS kategori
      FROM alat a
      LEFT JOIN kategori_alat c ON a.id_kategori = c.id_kategori
      ORDER BY a.id_alat ASC
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Gagal mengambil alat:", error.message);
    res.status(500).json({ message: "Terjadi kesalahan server saat mengambil data alat." });
  }
});

/** [GET by ID] Detail satu alat */
app.get("/api/alat/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Gagal memuat data: ID alat tidak valid." });
  }

  try {
    const result = await pool.query("SELECT * FROM alat WHERE id_alat = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Data alat tidak ditemukan di sistem." });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server saat mengambil detail alat." });
  }
});

/** [POST] Tambah alat baru */
app.post("/api/alat", async (req, res) => {
  const { nama_alat, kondisi, lokasi, stok, id_kategori } = req.body;
  const parsedStok = Number(stok);

  if (!nama_alat || !nama_alat.trim()) {
    return res.status(400).json({ message: "Gagal menambahkan data: Nama alat wajib diisi dan tidak boleh kosong." });
  }
  if (!id_kategori) {
    return res.status(400).json({ message: "Gagal menambahkan data: Kategori alat harus dipilih." });
  }
  if (stok === undefined || stok === null || stok === "" || isNaN(parsedStok)) {
    return res.status(400).json({ message: "Gagal menambahkan data: Input stok harus berupa angka yang valid." });
  }
  if (parsedStok < 0) {
    return res.status(400).json({ message: "Gagal menambahkan data: Stok tidak boleh bernilai negatif (minimal 0)." });
  }

  try {
    const cekKategori = await pool.query("SELECT id_kategori FROM kategori_alat WHERE id_kategori = $1", [id_kategori]);
    if (cekKategori.rows.length === 0) {
      return res.status(400).json({ message: "Gagal menambahkan data: Kategori yang dipilih tidak ditemukan di database." });
    }

    const maxIdRes = await pool.query("SELECT COALESCE(MAX(id_alat), 0) + 1 AS next_id FROM alat");
    const nextId = maxIdRes.rows[0].next_id;

    const result = await pool.query(
      `INSERT INTO alat (id_alat, nama_alat, kondisi, lokasi, stok, id_kategori)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nextId, nama_alat.trim(), kondisi ? kondisi.trim() : "", lokasi ? lokasi.trim() : "", parsedStok, id_kategori]
    );

    res.status(201).json({ message: "Berhasil! Data alat baru telah ditambahkan.", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Gagal menambahkan data karena gangguan server: " + error.message });
  }
});

/** [PUT] Edit alat */
app.put("/api/alat/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nama_alat, kondisi, lokasi, stok, id_kategori } = req.body;
  const parsedStok = Number(stok);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Gagal memperbarui data: ID alat tidak valid." });
  }
  if (!nama_alat || !nama_alat.trim()) {
    return res.status(400).json({ message: "Gagal memperbarui data: Nama alat tidak boleh dikosongkan." });
  }
  if (!id_kategori) {
    return res.status(400).json({ message: "Gagal memperbarui data: Kategori alat wajib dipilih." });
  }
  if (stok === undefined || stok === null || stok === "" || isNaN(parsedStok)) {
    return res.status(400).json({ message: "Gagal memperbarui data: Jumlah stok harus berupa angka." });
  }
  if (parsedStok < 0) {
    return res.status(400).json({ message: "Gagal memperbarui data: Input stok tidak sesuai karena bernilai negatif." });
  }

  try {
    const cekKategori = await pool.query("SELECT id_kategori FROM kategori_alat WHERE id_kategori = $1", [id_kategori]);
    if (cekKategori.rows.length === 0) {
      return res.status(400).json({ message: "Gagal memperbarui data: Kategori tujuan tidak ditemukan atau sudah dihapus." });
    }

    const result = await pool.query(
      `UPDATE alat
       SET nama_alat = $1, kondisi = $2, lokasi = $3, stok = $4, id_kategori = $5
       WHERE id_alat = $6 RETURNING *`,
      [nama_alat.trim(), kondisi ? kondisi.trim() : "", lokasi ? lokasi.trim() : "", parsedStok, id_kategori, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Gagal memperbarui data: Alat tidak ditemukan." });
    }
    res.status(200).json({ message: "Berhasil! Data alat telah diperbarui.", data: result.rows[0] });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({ message: "Gagal memperbarui data: Terjadi konflik relasi dengan kategori." });
    }
    res.status(500).json({ message: "Gagal memperbarui data alat karena kesalahan server." });
  }
});

/** [DELETE] Hapus alat */
app.delete("/api/alat/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Gagal menghapus data: ID alat tidak valid." });
  }

  try {
    const cekRelasi = await pool.query(
      "SELECT COUNT(*) AS total FROM peminjaman WHERE id_alat = $1",
      [id]
    );
    const jumlahPinjam = Number(cekRelasi.rows[0].total);

    if (jumlahPinjam > 0) {
      return res.status(409).json({
        message: `Gagal menghapus alat! Alat ini masih terhubung dengan ${jumlahPinjam} data peminjaman. Selesaikan atau hapus data peminjaman terkait terlebih dahulu.`,
      });
    }

    const result = await pool.query("DELETE FROM alat WHERE id_alat = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Gagal menghapus: Data alat sudah tidak ada atau tidak ditemukan." });
    }
    res.status(200).json({ message: "Berhasil! Data alat telah dihapus.", data: result.rows[0] });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        message: "Gagal menghapus alat! Data masih terkunci karena sedang dipinjam atau tercatat dalam riwayat peminjaman.",
      });
    }
    res.status(500).json({ message: "Gagal menghapus alat karena kesalahan server." });
  }
});

// ============================================================================
// 2. ENDPOINT KATEGORI ALAT 
// ============================================================================

/** [GET] Semua kategori */
app.get("/api/kategori_alat", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id_kategori AS id, nama_kategori AS name, deskripsi AS description
      FROM kategori_alat
      ORDER BY id_kategori ASC
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data kategori." });
  }
});

/** [GET by ID] Detail satu kategori */
app.get("/api/kategori_alat/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Gagal memuat data: ID kategori tidak valid." });
  }

  try {
    const result = await pool.query("SELECT * FROM kategori_alat WHERE id_kategori = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Data kategori tidak ditemukan." });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil detail kategori." });
  }
});

/** [POST] Tambah kategori */
app.post("/api/kategori_alat", async (req, res) => {
  const { nama_kategori, deskripsi } = req.body;
  if (!nama_kategori || !nama_kategori.trim()) {
    return res.status(400).json({ message: "Gagal menambahkan kategori: Nama kategori wajib diisi." });
  }

  try {
    const maxIdRes = await pool.query("SELECT COALESCE(MAX(id_kategori), 0) + 1 AS next_id FROM kategori_alat");
    const nextId = maxIdRes.rows[0].next_id;

    const result = await pool.query(
      `INSERT INTO kategori_alat (id_kategori, nama_kategori, deskripsi) 
       VALUES ($1, $2, $3) RETURNING *`,
      [nextId, nama_kategori.trim(), deskripsi ? deskripsi.trim() : ""]
    );
    res.status(201).json({ message: "Berhasil! Kategori baru telah ditambahkan.", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Gagal menambahkan kategori: " + error.message });
  }
});

/** [PUT] Edit kategori */
app.put("/api/kategori_alat/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nama_kategori, deskripsi } = req.body;

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Gagal memperbarui kategori: ID tidak valid." });
  }
  if (nama_kategori !== undefined && !nama_kategori.trim()) {
    return res.status(400).json({ message: "Gagal memperbarui kategori: Nama kategori tidak boleh kosong." });
  }

  try {
    const result = await pool.query(
      `UPDATE kategori_alat 
       SET nama_kategori = COALESCE($1, nama_kategori), deskripsi = COALESCE($2, deskripsi) 
       WHERE id_kategori = $3 RETURNING *`,
      [nama_kategori ? nama_kategori.trim() : null, deskripsi !== undefined ? deskripsi.trim() : null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Gagal memperbarui: Kategori tidak ditemukan." });
    }
    res.status(200).json({ message: "Berhasil! Data kategori diperbarui.", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui kategori karena gangguan server." });
  }
});

/** [DELETE] Hapus kategori */
app.delete("/api/kategori_alat/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Gagal menghapus kategori: ID kategori tidak valid." });
  }

  try {
    const cekRelasi = await pool.query(
      "SELECT COUNT(*) AS total FROM alat WHERE id_kategori = $1",
      [id]
    );
    const jumlahAlat = Number(cekRelasi.rows[0].total);

    if (jumlahAlat > 0) {
      return res.status(409).json({
        message: `Gagal menghapus kategori! Kategori ini masih digunakan oleh ${jumlahAlat} data alat. Pindahkan atau hapus alat terkait terlebih dahulu.`,
      });
    }

    const result = await pool.query("DELETE FROM kategori_alat WHERE id_kategori = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Gagal menghapus: Kategori tidak ditemukan." });
    }
    res.status(200).json({ message: "Berhasil! Kategori telah dihapus.", data: result.rows[0] });
  } catch (error) {
    if (error.code === "23001" || error.code === "23503") {
      return res.status(409).json({
        message: "Gagal menghapus kategori! Kategori ini masih berelasi dengan data alat yang terdaftar.",
      });
    }
    res.status(500).json({ message: "Gagal menghapus kategori karena kesalahan server." });
  }
});

// ============================================================================
// 3. ENDPOINT PEMINJAMAN 
// ============================================================================

/** [GET] Semua peminjaman + nama alat */
app.get("/api/peminjaman", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, COALESCE(a.nama_alat, 'Alat Dihapus') AS nama_alat
      FROM peminjaman p
      LEFT JOIN alat a ON p.id_alat = a.id_alat
      ORDER BY p.id_peminjaman ASC
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data peminjaman." });
  }
});

/** [GET by ID] Detail satu peminjaman */
app.get("/api/peminjaman/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Gagal memuat data: ID peminjaman tidak valid." });
  }

  try {
    const result = await pool.query("SELECT * FROM peminjaman WHERE id_peminjaman = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Data peminjaman tidak ditemukan." });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil detail peminjaman." });
  }
});

/** [POST] Tambah peminjaman */
app.post("/api/peminjaman", async (req, res) => {
  const { nama_peminjam, status, kelas, tanggal_pinjam, tanggal_kembali, jumlah, id_alat } = req.body;
  const qty = Number(jumlah);

  if (!nama_peminjam || !nama_peminjam.trim()) {
    return res.status(400).json({ message: "Gagal menambahkan peminjaman: Nama peminjam wajib diisi." });
  }
  if (!id_alat) {
    return res.status(400).json({ message: "Gagal menambahkan peminjaman: Silakan pilih alat yang akan dipinjam." });
  }
  if (!tanggal_pinjam) {
    return res.status(400).json({ message: "Gagal menambahkan peminjaman: Tanggal pinjam wajib diisi." });
  }
  if (jumlah === undefined || jumlah === null || jumlah === "" || isNaN(qty)) {
    return res.status(400).json({ message: "Gagal menambahkan peminjaman: Jumlah pinjam harus berupa angka." });
  }
  if (qty <= 0) {
    return res.status(400).json({
      message: qty < 0
        ? "Gagal menambahkan peminjaman: Jumlah pinjam tidak boleh angka negatif."
        : "Gagal menambahkan peminjaman: Jumlah pinjam minimal harus 1 unit.",
    });
  }

  try {
    const cekAlat = await pool.query("SELECT nama_alat, stok FROM alat WHERE id_alat = $1", [id_alat]);
    if (cekAlat.rows.length === 0) {
      return res.status(404).json({ message: "Gagal menambahkan peminjaman: Alat yang dipilih tidak ditemukan di inventaris." });
    }

    const { nama_alat, stok } = cekAlat.rows[0];
    if (stok < qty) {
      return res.status(400).json({
        message: stok === 0
          ? `Gagal meminjam: Stok alat "${nama_alat}" saat ini habis (0).`
          : `Gagal meminjam: Jumlah pinjam (${qty}) melebihi sisa stok "${nama_alat}" yang tersedia (${stok}).`,
      });
    }

    const maxIdRes = await pool.query("SELECT COALESCE(MAX(id_peminjaman), 0) + 1 AS next_id FROM peminjaman");
    const nextId = maxIdRes.rows[0].next_id;

    const result = await pool.query(
      `INSERT INTO peminjaman (id_peminjaman, nama_peminjam, status, kelas, tanggal_pinjam, tanggal_kembali, jumlah, id_alat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        nextId,
        nama_peminjam.trim(),
        status ? status.trim() : "Dipinjam",
        kelas ? kelas.trim() : "",
        tanggal_pinjam,
        tanggal_kembali || null,
        qty,
        id_alat,
      ]
    );

    res.status(201).json({ message: "Berhasil! Data peminjaman telah dicatat.", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Gagal menambahkan peminjaman karena gangguan server: " + error.message });
  }
});

/** [PUT] Edit data peminjaman */
app.put("/api/peminjaman/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nama_peminjam, status, kelas, tanggal_pinjam, tanggal_kembali, jumlah, id_alat } = req.body;
  const qty = Number(jumlah);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Gagal memperbarui peminjaman: ID transaksi tidak valid." });
  }
  if (!nama_peminjam || !nama_peminjam.trim()) {
    return res.status(400).json({ message: "Gagal memperbarui peminjaman: Nama peminjam tidak boleh kosong." });
  }
  if (!id_alat) {
    return res.status(400).json({ message: "Gagal memperbarui peminjaman: Alat wajib dipilih." });
  }
  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({
      message: qty < 0
        ? "Gagal memperbarui data: Jumlah pinjam tidak sesuai karena bernilai negatif."
        : "Gagal memperbarui data: Jumlah pinjam minimal 1 unit.",
    });
  }

  try {
    const cekPeminjamanLama = await pool.query(
      "SELECT jumlah, status, id_alat FROM peminjaman WHERE id_peminjaman = $1",
      [id]
    );
    if (cekPeminjamanLama.rows.length === 0) {
      return res.status(404).json({ message: "Gagal memperbarui: Data peminjaman tidak ditemukan." });
    }

    const dataLama = cekPeminjamanLama.rows[0];

    const cekAlat = await pool.query("SELECT nama_alat, stok FROM alat WHERE id_alat = $1", [id_alat]);
    if (cekAlat.rows.length === 0) {
      return res.status(400).json({ message: "Gagal memperbarui data: Alat yang dipilih tidak ditemukan atau telah dihapus." });
    }

    const { nama_alat, stok } = cekAlat.rows[0];
    const statusBaru = status ? status.trim().toLowerCase() : "dipinjam";

    if (statusBaru !== "dikembalikan") {
      const selisihPinjam = Number(dataLama.id_alat) === Number(id_alat)
        ? qty - Number(dataLama.jumlah)
        : qty;

      if (selisihPinjam > 0 && stok < selisihPinjam) {
        return res.status(400).json({
          message: `Gagal memperbarui data: Tambahan pinjaman (${selisihPinjam}) melebihi sisa stok "${nama_alat}" yang tersedia (${stok}).`,
        });
      }
    }

    const result = await pool.query(
      `UPDATE peminjaman
       SET nama_peminjam = $1, status = $2, kelas = $3, tanggal_pinjam = $4, tanggal_kembali = $5, jumlah = $6, id_alat = $7
       WHERE id_peminjaman = $8 RETURNING *`,
      [
        nama_peminjam.trim(),
        status ? status.trim() : "Dipinjam",
        kelas ? kelas.trim() : "",
        tanggal_pinjam,
        tanggal_kembali || null,
        qty,
        id_alat,
        id,
      ]
    );

    res.status(200).json({ message: "Berhasil! Data peminjaman telah diperbarui.", data: result.rows[0] });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({ message: "Gagal memperbarui data: Terjadi kesalahan relasi dengan data alat." });
    }
    res.status(500).json({ message: "Gagal memperbarui data peminjaman karena kesalahan server." });
  }
});

/** [DELETE] Hapus data peminjaman */
app.delete("/api/peminjaman/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Gagal menghapus data: ID peminjaman tidak valid." });
  }

  try {
    const cekStatus = await pool.query("SELECT status, nama_peminjam FROM peminjaman WHERE id_peminjaman = $1", [id]);
    if (cekStatus.rows.length === 0) {
      return res.status(404).json({ message: "Gagal menghapus: Data peminjaman tidak ditemukan." });
    }

    if (cekStatus.rows[0].status && cekStatus.rows[0].status.toLowerCase() === "dipinjam") {
      return res.status(409).json({
        message: `Gagal menghapus! Barang masih berstatus "Dipinjam" oleh ${cekStatus.rows[0].nama_peminjam}. Ubah status menjadi "Dikembalikan" terlebih dahulu sebelum menghapus riwayat.`,
      });
    }

    const result = await pool.query("DELETE FROM peminjaman WHERE id_peminjaman = $1 RETURNING *", [id]);
    res.status(200).json({ message: "Berhasil! Riwayat peminjaman telah dihapus.", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus data peminjaman karena kesalahan server." });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});

module.exports = app;