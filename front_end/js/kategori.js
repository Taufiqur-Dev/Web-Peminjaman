const modalKat = document.getElementById("kategori-modal");
const formKat = document.getElementById("kategori-form");

// Buka Modal Tambah
document.getElementById("btn-open-kategori").addEventListener("click", () => {
  formKat.reset();
  document.getElementById("edit_kat_id").value = "";
  document.getElementById("cat-modal-title").textContent = "Tambah Kategori Baru";
  modalKat.classList.remove("hidden");
});

// Tutup Modal
const tutupModalKat = () => modalKat.classList.add("hidden");
document.getElementById("btn-close-kategori").addEventListener("click", tutupModalKat);
document.getElementById("btn-cancel-kategori").addEventListener("click", tutupModalKat);

// Buka Modal Edit (Ambil data via GET by ID)
async function editKategori(id) {
  try {
    const response = await fetch(`http://localhost:3000/api/kategori_alat/${id}`);
    const kat = await response.json();

    if (!response.ok) return alert(kat.message);

    document.getElementById("edit_kat_id").value = kat.id_kategori;
    document.getElementById("kat-name").value = kat.nama_kategori;
    document.getElementById("kat-description").value = kat.deskripsi || "";

    document.getElementById("cat-modal-title").textContent = "Edit Kategori";
    modalKat.classList.remove("hidden");
  } catch (error) {
    alert("Gagal mengambil data kategori.");
  }
}

// Simpan 
formKat.addEventListener("submit", async (e) => {
  e.preventDefault();
  const idEdit = document.getElementById("edit_kat_id").value;

  const payload = {
    nama_kategori: document.getElementById("kat-name").value,
    deskripsi: document.getElementById("kat-description").value,
  };

  const url = idEdit ? `http://localhost:3000/api/kategori_alat/${idEdit}` : "http://localhost:3000/api/kategori_alat";
  const method = idEdit ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      alert(idEdit ? "Kategori berhasil diperbarui!" : "Kategori berhasil ditambahkan!");
      tutupModalKat();
      loadKategori();
    } else {
      const err = await response.json();
      alert("Gagal:masih ada data alat yang di gunakan" + err.message);
    }
  } catch (error) {
    alert("Gagal terhubung ke server.");
  }
});

// Hapus 
async function hapusKategori(id) {
  if (!confirm("Yakin ingin menghapus kategori ini?")) return;
  try {
    const response = await fetch(`http://localhost:3000/api/kategori_alat/${id}`, { method: "DELETE" });
    if (response.ok) {
      alert("Kategori berhasil dihapus!");
      loadKategori();
    } else {
      const err = await response.json();
      alert("Gagal: " + err.message);
    }
  } catch (error) {
    alert("Gagal terhubung ke server.");
  }
}