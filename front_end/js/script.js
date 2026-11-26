document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("alat-list")) {
    loadAlat();
    loadCategoriesDropdown();
  }
  if (document.getElementById("kategori-list")) {
    loadKategori();
  }
  if (document.getElementById("peminjaman-list")) {
    loadPeminjaman();
    loadAlatsDropdown();
  }
});

// 1. Memuat daftar alat (alat.html)
async function loadAlat() {
  const alatList = document.getElementById("alat-list");
  try {
    const response = await fetch("http://localhost:3000/api/alat");
    const result = await response.json();
    alatList.innerHTML = "";

    if (result && result.length > 0) {
      result.forEach((alat) => {
        alatList.innerHTML += `
          <tr class="hover:bg-gray-50 transition-colors">
            <td class="py-3 px-4 font-medium text-gray-900">${alat.name}</td>
            <td class="py-3 px-4 text-gray-600">${alat.kondisi || "-"}</td>
            <td class="py-3 px-4 text-gray-600">${alat.kategori}</td>
            <td class="py-3 px-4 text-gray-600">${alat.lokasi}</td>
            <td class="py-3 px-4 font-semibold ${alat.stok <= 0 ? 'text-rose-600' : 'text-gray-700'}">${alat.stok}</td>
            <td class="py-3 px-4 text-center space-x-2">
              <button onclick="editAlat(${alat.id})" class="text-indigo-600 hover:underline font-semibold text-xs cursor-pointer">Edit</button>
              <button onclick="hapusAlat(${alat.id})" class="text-rose-600 hover:underline font-semibold text-xs cursor-pointer">Hapus</button>
            </td>
          </tr>
        `;
      });
    } else {
      alatList.innerHTML = `<tr><td colspan="6" class="py-4 px-6 text-center text-gray-500">Belum ada data alat.</td></tr>`;
    }
  } catch (error) {
    alatList.innerHTML = `<tr><td colspan="6" class="py-4 px-6 text-center text-red-500">Gagal memuat data alat.</td></tr>`;
  }
}

// 2. Memuat daftar kategori (kategori_alat.html)
async function loadKategori() {
  const kategoriList = document.getElementById("kategori-list");
  try {
    const response = await fetch("http://localhost:3000/api/kategori_alat");
    const result = await response.json();
    kategoriList.innerHTML = "";

    if (result && result.length > 0) {
      let no = 1;
      result.forEach((kategori) => {
        kategoriList.innerHTML += `
          <tr class="hover:bg-gray-50 transition-colors">
            <td class="py-3 px-4 text-gray-900">${no++}</td>
            <td class="py-3 px-4 font-medium text-gray-900">${kategori.name}</td>
            <td class="py-3 px-4 text-gray-600">${kategori.description || "-"}</td>
            <td class="py-3 px-4 text-center space-x-2">
              <button onclick="editKategori(${kategori.id})" class="text-indigo-600 hover:underline font-semibold text-xs cursor-pointer">Edit</button>
              <button onclick="hapusKategori(${kategori.id})" class="text-rose-600 hover:underline font-semibold text-xs cursor-pointer">Hapus</button>
            </td>
          </tr>
        `;
      });
    } else {
      kategoriList.innerHTML = `<tr><td colspan="4" class="py-4 px-6 text-center text-gray-500">Belum ada data kategori.</td></tr>`;
    }
  } catch (error) {
    kategoriList.innerHTML = `<tr><td colspan="4" class="py-4 px-6 text-center text-red-500">Gagal memuat data kategori.</td></tr>`;
  }
}

// 3. Memuat daftar peminjaman (peminjam.html)
async function loadPeminjaman() {
  const peminjamanList = document.getElementById("peminjaman-list");
  try {
    const response = await fetch("http://localhost:3000/api/peminjaman");
    const result = await response.json();
    peminjamanList.innerHTML = "";

    if (result && result.length > 0) {
      result.forEach((pm) => {
        const tglPinjam = pm.tanggal_pinjam ? pm.tanggal_pinjam.split("T")[0] : "-";
        const tglKembali = pm.tanggal_kembali ? pm.tanggal_kembali.split("T")[0] : "-";

        peminjamanList.innerHTML += `
          <tr class="hover:bg-gray-50 transition-colors">
            <td class="py-3 px-4 font-medium text-gray-900">${pm.nama_peminjam}</td>
            <td class="py-3 px-4 font-semibold text-gray-600">${pm.nama_alat}</td>
            <td class="py-3 px-4 text-gray-600">${pm.status}</td>
            <td class="py-3 px-4 text-gray-600">${pm.kelas}</td>
            <td class="py-3 px-4 text-gray-600">${tglPinjam}</td>
            <td class="py-3 px-4 text-gray-600">${tglKembali}</td>
            <td class="py-3 px-4 text-gray-600">${pm.jumlah}</td>
            <td class="py-3 px-4 text-center space-x-2">
              <button onclick="editPeminjaman(${pm.id_peminjaman})" class="text-indigo-600 hover:underline font-semibold text-xs cursor-pointer">Edit</button>
              <button onclick="hapusPeminjaman(${pm.id_peminjaman})" class="text-rose-600 hover:underline font-semibold text-xs cursor-pointer">Hapus</button>
            </td>
          </tr>
        `;
      });
    } else {
      peminjamanList.innerHTML = `<tr><td colspan="8" class="py-4 px-6 text-center text-gray-500">Belum ada data peminjaman.</td></tr>`;
    }
  } catch (error) {
    peminjamanList.innerHTML = `<tr><td colspan="8" class="py-4 px-6 text-center text-red-500">Gagal memuat data peminjaman.</td></tr>`;
  }
}

// 4. Dropdown Kategori
async function loadCategoriesDropdown() {
  const kategoriSelect = document.getElementById("id-kategori");
  if (!kategoriSelect) return;
  try {
    const response = await fetch("http://localhost:3000/api/kategori_alat");
    const result = await response.json();
    kategoriSelect.innerHTML = '<option value="" disabled selected>-- Pilih Kategori --</option>';
    result.forEach((kategori) => {
      kategoriSelect.innerHTML += `<option value="${kategori.id}">${kategori.name}</option>`;
    });
  } catch (error) {
    kategoriSelect.innerHTML = '<option value="" disabled>Gagal memuat kategori</option>';
  }
}

// 5. Dropdown Alat (Menampilkan sisa stok & disable jika 0)
async function loadAlatsDropdown() {
  const alatSelect = document.getElementById("id-alat");
  if (!alatSelect) return;
  try {
    const response = await fetch("http://localhost:3000/api/alat");
    const result = await response.json();
    alatSelect.innerHTML = '<option value="" disabled selected>-- Pilih Alat --</option>';
    result.forEach((alat) => {
      const habis = Number(alat.stok) <= 0;
      alatSelect.innerHTML += `
        <option value="${alat.id}" ${habis ? "disabled" : ""}>
          ${alat.name} ${habis ? "(Stok Habis)" : `(Sisa Stok: ${alat.stok})`}
        </option>
      `;
    });
  } catch (error) {
    alatSelect.innerHTML = '<option value="" disabled>Gagal memuat alat</option>';
  }
}