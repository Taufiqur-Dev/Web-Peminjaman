const modalAlat = document.getElementById("alat-modal");
const formAlat = document.getElementById("alat-form");

// Buka Modal Tambah
document.getElementById("btn-open-alat").addEventListener("click", () => {
  formAlat.reset();
  document.getElementById("edit-alat-id").value = "";
  document.getElementById("modal-title").textContent = "Tambah Alat Baru";
  modalAlat.classList.remove("hidden");
});

// Tutup Modal
const tutupModalAlat = () => modalAlat.classList.add("hidden");
document.getElementById("btn-close-alat").addEventListener("click", tutupModalAlat);
document.getElementById("btn-cancel-alat").addEventListener("click", tutupModalAlat);

// Buka Modal Edit (Ambil data via GET by ID)
async function editAlat(id) {
  try {
    const response = await fetch(`http://localhost:3000/api/alat/${id}`);
    const alat = await response.json();

    if (!response.ok) return alert(alat.message);

    document.getElementById("edit-alat-id").value = alat.id_alat;
    document.getElementById("alat-name").value = alat.nama_alat;
    document.getElementById("alat-kondisi").value = alat.kondisi || "";
    document.getElementById("id-kategori").value = alat.id_kategori;
    document.getElementById("alat-lokasi").value = alat.lokasi;
    document.getElementById("alat-stok").value = alat.stok;

    document.getElementById("modal-title").textContent = "Edit Data Alat";
    modalAlat.classList.remove("hidden");
  } catch (error) {
    alert("Gagal mengambil data alat dari server. ");
  }
}

// Simpan
formAlat.addEventListener("submit", async (e) => {
  e.preventDefault();
  const idEdit = document.getElementById("edit-alat-id").value;

  const payload = {
    nama_alat: document.getElementById("alat-name").value,
    kondisi: document.getElementById("alat-kondisi").value,
    id_kategori: document.getElementById("id-kategori").value,
    lokasi: document.getElementById("alat-lokasi").value,
    stok: document.getElementById("alat-stok").value,
  };

  const url = idEdit ? `http://localhost:3000/api/alat/${idEdit}` : "http://localhost:3000/api/alat";
  const method = idEdit ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      alert(idEdit ? "Alat berhasil diperbarui!" : "Alat berhasil ditambahkan!");
      tutupModalAlat();
      loadAlat();
    } else {
      const err = await response.json();
      alert("Gagal: " + err.message);
    }
  } catch (error) {
    alert("Gagal terhubung ke server.");
  }
});

// Hapus 
async function hapusAlat(id) {
  if (!confirm("Yakin ingin menghapus alat ini?")) return;
  try {
    const response = await fetch(`http://localhost:3000/api/alat/${id}`, { method: "DELETE" });
    if (response.ok) {
      alert("Alat berhasil dihapus!");
      loadAlat();
    } else {
      const err = await response.json();
      alert("Gagal:" + err.message);
    }
  } catch (error) {
    alert("Gagal terhubung ke server.");
  }
}