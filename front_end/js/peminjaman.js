const modalPm = document.getElementById("peminjaman-modal");
const formPm = document.getElementById("peminjaman-form");

// Fungsi menampilkan notifikasi toast denda (memanfaatkan #toast di peminjam.html)
function tampilkanNotifDenda(pesan) {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");

  if (!toast || !toastMessage) {
    alert(pesan);
    return;
  }

  toastMessage.textContent = pesan;
  toast.classList.remove("hidden", "bg-slate-900");
  toast.classList.add("bg-red-600");

  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.classList.add("hidden", "bg-slate-900");
    toast.classList.remove("bg-red-600");
  }, 5000);
}

// Fungsi cek status telat secara manual saat form disimpan
function cekStatusTelat(status, namaPeminjam = "") {
  if (!status) return false;

  const statusLower = status.trim().toLowerCase();
  if (statusLower.includes("telat") || statusLower.includes("terlambat")) {
    const infoNama = namaPeminjam ? ` atas nama ${namaPeminjam}` : "";
    const pesan = `Peminjaman${infoNama} berstatus TELAT! Harap bayar denda sebesar Rp 10.000.`;
    tampilkanNotifDenda(pesan);
    return true;
  }
  return false;
}

// 1. Buka Modal Tambah
document.getElementById("btn-open-peminjaman").addEventListener("click", () => {
  formPm.reset();
  document.getElementById("edit-pm-id").value = "";
  document.getElementById("modal-title").textContent = "Tambah Daftar Peminjam Baru";
  modalPm.classList.remove("hidden");
});

// Tutup Modal
const tutupModalPm = () => modalPm.classList.add("hidden");
document.getElementById("btn-close-peminjaman").addEventListener("click", tutupModalPm);
document.getElementById("btn-cancel-peminjaman").addEventListener("click", tutupModalPm);

// 2. Buka Modal Edit
async function editPeminjaman(id) {
  try {
    const response = await fetch(`http://localhost:3000/api/peminjaman/${id}`);
    const pm = await response.json();
    if (!response.ok) return alert(pm.message);

    document.getElementById("edit-pm-id").value = pm.id_peminjaman;
    document.getElementById("pm-name").value = pm.nama_peminjam;
    document.getElementById("pm-kelas").value = pm.kelas;
    document.getElementById("pm-status").value = pm.status;
    document.getElementById("pm-tanggal-pinjam").value = pm.tanggal_pinjam ? pm.tanggal_pinjam.split("T")[0] : "";
    document.getElementById("pm-tanggal-kembali").value = pm.tanggal_kembali ? pm.tanggal_kembali.split("T")[0] || null : "";
    document.getElementById("pm-jumlah").value = pm.jumlah;
    document.getElementById("id-alat").value = pm.id_alat;

    document.getElementById("modal-title").textContent = "Edit Data Peminjaman";
    modalPm.classList.remove("hidden");
  } catch (error) {
    alert("Gagal mengambil data peminjaman.");
  }
}

// 3. Simpan
formPm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const idEdit = document.getElementById("edit-pm-id").value;

  const payload = {
    nama_peminjam: document.getElementById("pm-name").value,
    kelas: document.getElementById("pm-kelas").value,
    status: document.getElementById("pm-status").value,
    tanggal_pinjam: document.getElementById("pm-tanggal-pinjam").value,
    tanggal_kembali: document.getElementById("pm-tanggal-kembali").value || null,
    jumlah: document.getElementById("pm-jumlah").value,
    id_alat: document.getElementById("id-alat").value,
  };

  const url = idEdit ? `http://localhost:3000/api/peminjaman/${idEdit}` : "http://localhost:3000/api/peminjaman";
  const method = idEdit ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      alert(idEdit ? "Data peminjam diperbarui!" : "Peminjaman berhasil & stok berkurang!");

      // Munculkan notif bayar denda 10.000 jika status yang diinput adalah Telat / Terlambat
      cekStatusTelat(payload.status, payload.nama_peminjam);

      tutupModalPm();
      loadPeminjaman();
      loadAlatsDropdown();
    } else {
      const err = await response.json();
      alert("Gagal: " + err.message);
    }
  } catch (error) {
    alert("Gagal terhubung ke server.");
  }
});

// 4. Hapus
async function hapusPeminjaman(id) {
  if (!confirm("Yakin ingin menghapus data peminjam ini?")) return;
  try {
    const response = await fetch(`http://localhost:3000/api/peminjaman/${id}`, { method: "DELETE" });
    if (response.ok) {
      alert("Data peminjaman berhasil dihapus!");
      loadPeminjaman();
    } else {
      const err = await response.json();
      alert("Gagal:" + err.message);
    }
  } catch (error) {
    alert("Gagal terhubung ke server.");
  }
}