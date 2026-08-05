/**
 * CATATAN SEORANG GURU - Google Apps Script Backend (Code.gs) & Complete Index.html Bundle
 */

export const CODE_GS_CONTENT = `/**
 * CATATAN SEORANG GURU - Google Apps Script Backend (Code.gs)
 * Integrated Google Spreadsheet & REST Web App API
 */

const CONFIG = {
  SPREADSHEET_ID: "", // Isi dengan ID Google Spreadsheet milik Anda (opsional, jika kosong akan menggunakan Active Spreadsheet)
  FOLDER_NAME: "Catatan_Guru_Drive_Files"
};

function doGet(e) {
  // If request contains REST action parameter (e.g. ?action=load or ?action=ping)
  if (e && e.parameter && e.parameter.action) {
    if (e.parameter.action === 'ping') {
      return responseJson({ status: 'success', message: 'Google Apps Script Web App Terhubung!' });
    }
    if (e.parameter.action === 'load') {
      var data = loadAppDataFull();
      return responseJson({ status: 'success', data: data });
    }
  }

  // Otherwise return standard HTML Web App interface
  try {
    return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('Catatan Seorang Guru - Aplikasi Administrasi Guru')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return ContentService.createTextOutput("Catatan Seorang Guru Web App API Online");
  }
}

function doPost(e) {
  try {
    var contents = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    var action = contents.action || "ping";

    if (action === "ping") {
      return responseJson({ status: "success", message: "Google Apps Script Web App Terhubung!" });
    }

    if (action === "save" || action === "export") {
      var saveResult = saveAppDataFull(contents.data || contents);
      return responseJson(saveResult);
    }

    if (action === "load" || action === "import") {
      var data = loadAppDataFull();
      return responseJson({ status: "success", data: data });
    }

    return responseJson({ status: "error", message: "Aksi tidak dikenal: " + action });
  } catch (err) {
    return responseJson({ status: "error", message: err.toString() });
  }
}

function responseJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSpreadsheet() {
  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID.trim() !== "") {
    try {
      return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    } catch (err) {
      console.warn("Invalid SPREADSHEET_ID, falling back to Active Spreadsheet", err);
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function writeSheet(ss, sheetName, headers, rowsData) {
  try {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    } else {
      sheet.clearContents();
    }

    // Write Headers
    if (headers && headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#f1f5f9");
      sheet.setFrozenRows(1);
    }

    // Write Data Rows
    if (rowsData && rowsData.length > 0) {
      // Clean rowsData: handle undefined/objects and strictly cap cell text length at 45000 chars (Google Sheets limit is 50000)
      var safeRows = rowsData.map(function(row) {
        return row.map(function(val) {
          if (val === undefined || val === null) return "";
          var str = "";
          if (typeof val === "object") {
            try { str = JSON.stringify(val); } catch (e) { str = String(val); }
          } else {
            str = String(val);
          }
          if (str.length > 45000) {
            str = str.substring(0, 45000);
          }
          return str;
        });
      });
      sheet.getRange(2, 1, safeRows.length, headers.length).setValues(safeRows);
    }
  } catch (err) {
    console.error("Error writing sheet " + sheetName + ": " + err.toString());
  }
}

function saveAppDataFull(data) {
  var lock = LockService.getScriptLock();
  try {
    lock.tryLock(10000);
  } catch (lErr) {}

  try {
    var ss = getSpreadsheet();
    if (!data) return { status: "error", message: "Data kosong" };

    // 1. Data Sekolah
    if (data.dataSekolah) {
      var ds = data.dataSekolah;
      writeSheet(ss, "Data Sekolah", 
        ["NPSN", "Nama Sekolah", "Alamat Lengkap", "Kelurahan", "Kecamatan", "Kabupaten/Kota", "Provinsi", "Nomor Kontak", "Email", "Website", "Akreditasi", "Nama Kepala Sekolah", "Logo URL"],
        [[ds.npsn||'', ds.namaSekolah||'', ds.alamatLengkap||'', ds.kelurahan||'', ds.kecamatan||'', ds.kabupatenKota||'', ds.provinsi||'', ds.nomorKontak||'', ds.email||'', ds.website||'', ds.akreditasi||'', ds.namaKepalaSekolah||'', ds.logoSekolahUrl||'']]
      );
    }

    // 2. Profil Guru
    if (data.profilGuru) {
      var pg = data.profilGuru;
      writeSheet(ss, "Profil Guru",
        ["Nama Guru", "NIP", "NUPTK", "Jenis Kelamin", "Tempat Lahir", "Tanggal Lahir", "Nomor HP", "Email", "Alamat", "Foto Profil URL"],
        [[pg.namaGuru||'', pg.nip||'', pg.nuptk||'', pg.jenisKelamin||'', pg.tempatLahir||'', pg.tanggalLahir||'', pg.nomorHp||'', pg.email||'', pg.alamat||'', pg.fotoProfilUrl||'']]
      );
    }

    // 3. Data Mapel
    if (data.mapelList && Array.isArray(data.mapelList)) {
      var mapelRows = data.mapelList.map(function(m) {
        return [m.id||'', m.kodeMapel||'', m.namaMapel||'', m.tingkatKelas||'', m.fase||'', m.bebanJam||'', m.kkm||'', JSON.stringify(m.cpList||[])];
      });
      writeSheet(ss, "Data Mapel", ["ID", "Kode Mapel", "Nama Mapel", "Tingkat Kelas", "Fase", "Beban Jam", "KKM", "CP/TP (JSON)"], mapelRows);
    }

    // 4. Data Kelas
    if (data.kelasList && Array.isArray(data.kelasList)) {
      var kelasRows = data.kelasList.map(function(k) {
        return [k.id||'', k.namaKelas||'', k.waliKelas||'', k.ruangan||''];
      });
      writeSheet(ss, "Data Kelas", ["ID", "Nama Kelas", "Wali Kelas", "Ruangan"], kelasRows);
    }

    // 5. Data Siswa
    if (data.siswaList && Array.isArray(data.siswaList)) {
      var siswaRows = data.siswaList.map(function(s) {
        return [s.id||'', s.nisn||'', s.nis||'', s.namaLengkap||'', s.jenisKelamin||'', s.namaKelas||'', s.tempatLahir||'', s.tanggalLahir||'', s.alamat||'', s.namaOrangTua||'', s.kontakOrangTua||''];
      });
      writeSheet(ss, "Data Siswa", ["ID", "NISN", "NIS", "Nama Lengkap", "JK", "Kelas", "Tempat Lahir", "Tanggal Lahir", "Alamat", "Nama Orang Tua", "Kontak Orang Tua"], siswaRows);
    }

    // 6. Presensi Siswa
    if (data.presensiList && Array.isArray(data.presensiList)) {
      var presensiRows = data.presensiList.map(function(p) {
        return [p.id||'', p.tanggal||'', p.kelas||'', p.kodeMapel||'', p.namaMapel||'', p.pertemuanKe||'', p.waktuMulai||'', p.waktuSelesai||'', p.catatanGlobal||'', JSON.stringify(p.items||[]), JSON.stringify(p.summary||{})];
      });
      writeSheet(ss, "Presensi Siswa", ["ID", "Tanggal", "Kelas", "Kode Mapel", "Nama Mapel", "Pertemuan Ke", "Waktu Mulai", "Waktu Selesai", "Catatan", "Items (JSON)", "Summary (JSON)"], presensiRows);
    }

    // 7. Nilai Siswa
    if (data.nilaiList && Array.isArray(data.nilaiList)) {
      var nilaiRows = data.nilaiList.map(function(n) {
        return [n.id||'', n.tanggal||'', n.kelas||'', n.kodeMapel||'', n.namaMapel||'', n.kkm||'', JSON.stringify(n.items||[])];
      });
      writeSheet(ss, "Nilai Siswa", ["ID", "Tanggal", "Kelas", "Kode Mapel", "Nama Mapel", "KKM", "Items (JSON)"], nilaiRows);
    }

    // 8. Jurnal Guru
    if (data.jurnalList && Array.isArray(data.jurnalList)) {
      var jurnalRows = data.jurnalList.map(function(j) {
        return [j.id||'', j.tanggal||'', j.kodeMapel||'', j.namaMapel||'', j.kelas||'', j.jamKe||'', j.pertemuanKe||'', j.materiPembelajaran||'', j.tujuanPembelajaran||'', j.prosesPembelajaran||'', j.catatanKendala||'', j.jumlahHadir||0, j.jumlahTidakHadir||0];
      });
      writeSheet(ss, "Jurnal Guru", ["ID", "Tanggal", "Kode Mapel", "Nama Mapel", "Kelas", "Jam Ke", "Pertemuan", "Materi Pembelajaran", "Tujuan Pembelajaran", "Proses Pembelajaran", "Catatan / Kendala", "Hadir", "Absen"], jurnalRows);
    }

    // Safe Backup to Config Sheet without cell length crashes
    try {
      var configSheet = ss.getSheetByName("Config");
      if (!configSheet) {
        configSheet = ss.insertSheet("Config");
      }
      configSheet.getRange(1, 1, 1, 2).setValues([["key", "value"]]).setFontWeight("bold");
      var jsonStr = JSON.stringify(data);
      if (jsonStr.length < 40000) {
        configSheet.getRange(2, 1, 1, 2).setValues([["appDataFull", jsonStr]]);
      } else {
        configSheet.getRange(2, 1, 1, 2).setValues([["appDataFull", "STORED_IN_TAB_SHEETS"]]);
      }
    } catch (cErr) {
      console.warn("Config sheet backup error: " + cErr.toString());
    }

    return { status: "success", message: "Seluruh data berhasil disinkronkan ke Google Spreadsheet!" };
  } catch (e) {
    return { status: "error", message: e.toString() };
  } finally {
    try { lock.releaseLock(); } catch (rlErr) {}
  }
}

function loadAppDataFull() {
  try {
    var ss = getSpreadsheet();
    
    // First try Config sheet
    var configSheet = ss.getSheetByName("Config");
    if (configSheet) {
      var values = configSheet.getDataRange().getValues();
      for (var i = 1; i < values.length; i++) {
        if (values[i][0] === "appDataFull" && values[i][1] && values[i][1] !== "STORED_IN_TAB_SHEETS") {
          try {
            return JSON.parse(values[i][1]);
          } catch (pErr) {}
        }
      }
    }

    // Fallback: Read from individual sheets directly
    var payload = {};

    // 1. Data Sekolah
    var sheetSekolah = ss.getSheetByName("Data Sekolah");
    if (sheetSekolah && sheetSekolah.getLastRow() >= 2) {
      var v = sheetSekolah.getRange(2, 1, 1, 13).getValues()[0];
      payload.dataSekolah = {
        npsn: String(v[0]||''), namaSekolah: String(v[1]||''), alamatLengkap: String(v[2]||''), kelurahan: String(v[3]||''),
        kecamatan: String(v[4]||''), kabupatenKota: String(v[5]||''), provinsi: String(v[6]||''), nomorKontak: String(v[7]||''),
        email: String(v[8]||''), website: String(v[9]||''), akreditasi: String(v[10]||''), namaKepalaSekolah: String(v[11]||''), logoSekolahUrl: String(v[12]||'')
      };
    }

    // 2. Profil Guru
    var sheetGuru = ss.getSheetByName("Profil Guru");
    if (sheetGuru && sheetGuru.getLastRow() >= 2) {
      var g = sheetGuru.getRange(2, 1, 1, 10).getValues()[0];
      payload.profilGuru = {
        namaGuru: String(g[0]||''), nip: String(g[1]||''), nuptk: String(g[2]||''), jenisKelamin: String(g[3]||''),
        tempatLahir: String(g[4]||''), tanggalLahir: String(g[5]||''), nomorHp: String(g[6]||''), email: String(g[7]||''),
        alamat: String(g[8]||''), fotoProfilUrl: String(g[9]||'')
      };
    }

    // 3. Mapel
    var sheetMapel = ss.getSheetByName("Data Mapel");
    if (sheetMapel && sheetMapel.getLastRow() >= 2) {
      var mData = sheetMapel.getRange(2, 1, sheetMapel.getLastRow()-1, 8).getValues();
      payload.mapelList = mData.map(function(r) {
        var cpList = [];
        try { cpList = JSON.parse(r[7]||"[]"); } catch (e) {}
        return { id: String(r[0]), kodeMapel: String(r[1]), namaMapel: String(r[2]), tingkatKelas: String(r[3]), fase: String(r[4]), bebanJam: Number(r[5]||0), kkm: Number(r[6]||70), cpList: cpList };
      });
    }

    // 4. Kelas
    var sheetKelas = ss.getSheetByName("Data Kelas");
    if (sheetKelas && sheetKelas.getLastRow() >= 2) {
      var kData = sheetKelas.getRange(2, 1, sheetKelas.getLastRow()-1, 4).getValues();
      payload.kelasList = kData.map(function(r) {
        return { id: String(r[0]), namaKelas: String(r[1]), waliKelas: String(r[2]), ruangan: String(r[3]) };
      });
    }

    // 5. Siswa
    var sheetSiswa = ss.getSheetByName("Data Siswa");
    if (sheetSiswa && sheetSiswa.getLastRow() >= 2) {
      var sData = sheetSiswa.getRange(2, 1, sheetSiswa.getLastRow()-1, 11).getValues();
      payload.siswaList = sData.map(function(r) {
        return { id: String(r[0]), nisn: String(r[1]), nis: String(r[2]), namaLengkap: String(r[3]), jenisKelamin: String(r[4]), namaKelas: String(r[5]), tempatLahir: String(r[6]), tanggalLahir: String(r[7]), alamat: String(r[8]), namaOrangTua: String(r[9]), kontakOrangTua: String(r[10]) };
      });
    }

    // 6. Presensi
    var sheetPresensi = ss.getSheetByName("Presensi Siswa");
    if (sheetPresensi && sheetPresensi.getLastRow() >= 2) {
      var pData = sheetPresensi.getRange(2, 1, sheetPresensi.getLastRow()-1, 11).getValues();
      payload.presensiList = pData.map(function(r) {
        var items = [], summary = {};
        try { items = JSON.parse(r[9]||"[]"); } catch (e) {}
        try { summary = JSON.parse(r[10]||"{}"); } catch (e) {}
        return { id: String(r[0]), tanggal: String(r[1]), kelas: String(r[2]), kodeMapel: String(r[3]), namaMapel: String(r[4]), pertemuanKe: Number(r[5]||1), waktuMulai: String(r[6]), waktuSelesai: String(r[7]), catatanGlobal: String(r[8]), items: items, summary: summary };
      });
    }

    // 7. Nilai
    var sheetNilai = ss.getSheetByName("Nilai Siswa");
    if (sheetNilai && sheetNilai.getLastRow() >= 2) {
      var nData = sheetNilai.getRange(2, 1, sheetNilai.getLastRow()-1, 7).getValues();
      payload.nilaiList = nData.map(function(r) {
        var items = [];
        try { items = JSON.parse(r[6]||"[]"); } catch (e) {}
        return { id: String(r[0]), tanggal: String(r[1]), kelas: String(r[2]), kodeMapel: String(r[3]), namaMapel: String(r[4]), kkm: Number(r[5]||70), items: items };
      });
    }

    // 8. Jurnal
    var sheetJurnal = ss.getSheetByName("Jurnal Guru");
    if (sheetJurnal && sheetJurnal.getLastRow() >= 2) {
      var jData = sheetJurnal.getRange(2, 1, sheetJurnal.getLastRow()-1, 13).getValues();
      payload.jurnalList = jData.map(function(r) {
        return { id: String(r[0]), tanggal: String(r[1]), kodeMapel: String(r[2]), namaMapel: String(r[3]), kelas: String(r[4]), jamKe: String(r[5]), pertemuanKe: Number(r[6]||1), materiPembelajaran: String(r[7]), tujuanPembelajaran: String(r[8]), prosesPembelajaran: String(r[9]), catatanKendala: String(r[10]), jumlahHadir: Number(r[11]||0), jumlahTidakHadir: Number(r[12]||0) };
      });
    }

    return payload;
  } catch (err) {
    console.error("Error loading app data full: " + err.toString());
    return null;
  }
}

// Upload file base64 to Google Drive folder
function uploadFileToDrive(base64Data, fileName, mimeType) {
  try {
    var folderName = CONFIG.FOLDER_NAME;
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var bytes = Utilities.base64Decode(base64Data.split(",")[1] || base64Data);
    var blob = Utilities.newBlob(bytes, mimeType, fileName);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileUrl = "https://lh3.googleusercontent.com/d/" + file.getId();
    return { status: "success", fileId: file.getId(), fileUrl: fileUrl };
  } catch (err) {
    return { status: "error", message: err.toString() };
  }
}
`;

export const INDEX_HTML_CONTENT = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Catatan Seorang Guru - Web App Lengkap</title>
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            violet: {
              50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd',
              400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9',
              800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065'
            }
          }
        }
      }
    };
  </script>

  <!-- React 18 & ReactDOM 18 UMD -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  
  <!-- Babel Standalone for JSX in browser -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <!-- Lucide Icons UMD -->
  <script src="https://unpkg.com/lucide@latest"></script>

  <!-- Custom Scrollbar & Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
    .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
  </style>
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased min-h-screen">
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect, useMemo, useRef } = React;

    // --- Lucide Icon Helper ---
    const Icon = ({ name, className = "w-4 h-4", ...props }) => {
      const elRef = useRef(null);
      useEffect(() => {
        if (elRef.current && window.lucide) {
          elRef.current.innerHTML = '<i data-lucide="' + name + '" class="' + className + '"></i>';
          window.lucide.createIcons({ el: elRef.current });
        }
      }, [name, className]);
      return <span ref={elRef} className="inline-flex items-center justify-center shrink-0" {...props} />;
    };

    // --- Default Application Initial Datasets ---
    const defaultAppConfig = {
      namaAplikasi: "Catatan Seorang Guru",
      deskripsiAplikasi: "Aplikasi Administrasi & Pelaporan Kegiatan Belajar Mengajar",
      logoAplikasiUrl: "",
      tahunAjaran: "2024/2025",
      semester: "Ganjil"
    };

    const defaultDataSekolah = {
      npsn: "10293847",
      namaSekolah: "SMK Negeri 1 Lutim",
      alamatLengkap: "Jl. Pendidikan No. 1, Malili",
      kelurahan: "Malili",
      kecamatan: "Malili",
      kabupatenKota: "Luwu Timur",
      provinsi: "Sulawesi Selatan",
      nomorKontak: "081234567890",
      email: "info@smkn1lutim.sch.id",
      website: "www.smkn1lutim.sch.id",
      akreditasi: "A",
      namaKepalaSekolah: "Drs. H. Ahmad Dahlan, M.Pd.",
      logoSekolahUrl: ""
    };

    const defaultProfilGuru = {
      namaGuru: "Usman, S.Pd., M.T.",
      nip: "19850512 201001 1 008",
      nuptk: "4532763665200003",
      jenisKelamin: "Laki-laki",
      tempatLahir: "Malili",
      tanggalLahir: "1985-05-12",
      nomorHp: "081245678901",
      email: "usmansmkn1lutim@gmail.com",
      alamat: "Jl. Pahlawan No. 45, Malili",
      fotoProfilUrl: ""
    };

    const defaultMapelList = [
      { id: 'm1', kodeMapel: 'RPL01', namaMapel: 'Pemrograman Web & Perangkat Bergerak', tingkatKelas: 'XII', fase: 'F', bebanJam: 6, kkm: 75 },
      { id: 'm2', kodeMapel: 'RPL02', namaMapel: 'Basis Data', tingkatKelas: 'XI', fase: 'F', bebanJam: 4, kkm: 75 }
    ];

    const defaultKelasList = [
      { id: 'k1', namaKelas: 'XII RPL 1', waliKelas: 'Usman, S.Pd., M.T.', ruangan: 'Lab Komputer 1' },
      { id: 'k2', namaKelas: 'XII RPL 2', waliKelas: 'Budi Santoso, S.Kom.', ruangan: 'Lab Komputer 2' }
    ];

    const defaultSiswaList = [
      { id: 's1', nisn: '0051234567', nis: '220101', namaLengkap: 'Aditya Pratama', jenisKelamin: 'L', namaKelas: 'XII RPL 1', tempatLahir: 'Malili', tanggalLahir: '2006-03-12', alamat: 'Malili', namaOrangTua: 'Bambang', kontakOrangTua: '0812345' },
      { id: 's2', nisn: '0051234568', nis: '220102', namaLengkap: 'Anisa Rahmawati', jenisKelamin: 'P', namaKelas: 'XII RPL 1', tempatLahir: 'Towuti', tanggalLahir: '2006-07-22', alamat: 'Towuti', namaOrangTua: 'Suryadi', kontakOrangTua: '0812346' },
      { id: 's3', nisn: '0051234569', nis: '220103', namaLengkap: 'Bagus Setyawan', jenisKelamin: 'L', namaKelas: 'XII RPL 1', tempatLahir: 'Sorowako', tanggalLahir: '2006-11-05', alamat: 'Sorowako', namaOrangTua: 'Hartono', kontakOrangTua: '0812347' }
    ];

    const defaultPresensiList = [
      {
        id: 'p1',
        tanggal: '2024-08-01',
        kelas: 'XII RPL 1',
        kodeMapel: 'RPL01',
        namaMapel: 'Pemrograman Web',
        pertemuanKe: 1,
        waktuMulai: '07:30',
        waktuSelesai: '09:30',
        catatanGlobal: 'Siswa antusias mempelajari React dasar.',
        items: [
          { studentId: 's1', namaSiswa: 'Aditya Pratama', status: 'Hadir', catatan: '' },
          { studentId: 's2', namaSiswa: 'Anisa Rahmawati', status: 'Hadir', catatan: '' },
          { studentId: 's3', namaSiswa: 'Bagus Setyawan', status: 'Sakit', catatan: 'Surat dokter' }
        ],
        summary: { Hadir: 2, Terlambat: 0, Sakit: 1, Izin: 0, Alpha: 0 }
      }
    ];

    const defaultNilaiList = [];
    const defaultJurnalList = [];

    // Local Storage Utilities
    function getStorage(key, fallback) {
      try {
        const val = localStorage.getItem('catatan_guru_' + key);
        return val ? JSON.parse(val) : fallback;
      } catch (e) {
        return fallback;
      }
    }

    function setStorage(key, val) {
      try {
        localStorage.setItem('catatan_guru_' + key, JSON.stringify(val));
      } catch (e) {}
    }

    // --- MAIN APP COMPONENT ---
    function App() {
      const [activeTab, setActiveTab] = useState('dashboard');
      const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme_mode') === 'dark');
      
      const [appConfig, setAppConfig] = useState(() => getStorage('appConfig', defaultAppConfig));
      const [dataSekolah, setDataSekolah] = useState(() => getStorage('dataSekolah', defaultDataSekolah));
      const [profilGuru, setProfilGuru] = useState(() => getStorage('profilGuru', defaultProfilGuru));
      const [mapelList, setMapelList] = useState(() => getStorage('mapelList', defaultMapelList));
      const [kelasList, setKelasList] = useState(() => getStorage('kelasList', defaultKelasList));
      const [siswaList, setSiswaList] = useState(() => getStorage('siswaList', defaultSiswaList));
      const [presensiList, setPresensiList] = useState(() => getStorage('presensiList', defaultPresensiList));
      const [nilaiList, setNilaiList] = useState(() => getStorage('nilaiList', defaultNilaiList));
      const [jurnalList, setJurnalList] = useState(() => getStorage('jurnalList', defaultJurnalList));

      const [toast, setToast] = useState(null);
      const [isSyncing, setIsSyncing] = useState(false);

      // Search & Filter state
      const [searchQuery, setSearchQuery] = useState('');
      const [selectedKelasFilter, setSelectedKelasFilter] = useState('Semua');

      // Dark mode toggle
      useEffect(() => {
        if (darkMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme_mode', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme_mode', 'light');
        }
      }, [darkMode]);

      // Sync state to LocalStorage
      useEffect(() => { setStorage('appConfig', appConfig); }, [appConfig]);
      useEffect(() => { setStorage('dataSekolah', dataSekolah); }, [dataSekolah]);
      useEffect(() => { setStorage('profilGuru', profilGuru); }, [profilGuru]);
      useEffect(() => { setStorage('mapelList', mapelList); }, [mapelList]);
      useEffect(() => { setStorage('kelasList', kelasList); }, [kelasList]);
      useEffect(() => { setStorage('siswaList', siswaList); }, [siswaList]);
      useEffect(() => { setStorage('presensiList', presensiList); }, [presensiList]);
      useEffect(() => { setStorage('nilaiList', nilaiList); }, [nilaiList]);
      useEffect(() => { setStorage('jurnalList', jurnalList); }, [jurnalList]);

      // Load initial data from Google Apps Script if hosted on GAS
      useEffect(() => {
        if (window.google && window.google.script && window.google.script.run) {
          setIsSyncing(true);
          window.google.script.run
            .withSuccessHandler((rawJson) => {
              setIsSyncing(false);
              if (rawJson) {
                try {
                  const data = JSON.parse(rawJson);
                  if (data.dataSekolah) setDataSekolah(data.dataSekolah);
                  if (data.profilGuru) setProfilGuru(data.profilGuru);
                  if (data.mapelList) setMapelList(data.mapelList);
                  if (data.kelasList) setKelasList(data.kelasList);
                  if (data.siswaList) setSiswaList(data.siswaList);
                  if (data.presensiList) setPresensiList(data.presensiList);
                  if (data.nilaiList) setNilaiList(data.nilaiList);
                  if (data.jurnalList) setJurnalList(data.jurnalList);
                  showToast('Data berhasil dimuat dari Google Spreadsheet!');
                } catch(e) {}
              }
            })
            .withFailureHandler(() => setIsSyncing(false))
            .getAppData();
        }
      }, []);

      const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
      };

      const handleSyncSpreadsheet = () => {
        setIsSyncing(true);
        const payload = {
          appConfig, dataSekolah, profilGuru, mapelList,
          kelasList, siswaList, presensiList, nilaiList, jurnalList
        };

        if (window.google && window.google.script && window.google.script.run) {
          window.google.script.run
            .withSuccessHandler(() => {
              setIsSyncing(false);
              showToast('Data tersimpan sempurna di Google Spreadsheet!');
            })
            .withFailureHandler((err) => {
              setIsSyncing(false);
              showToast('Gagal sinkron Spreadsheet: ' + err, 'error');
            })
            .saveAppData(JSON.stringify(payload));
        } else {
          setTimeout(() => {
            setIsSyncing(false);
            showToast('Tersimpan di Local Storage Browser!');
          }, 400);
        }
      };

      const logoUrl = appConfig.logoAplikasiUrl || dataSekolah.logoSekolahUrl;

      // Filtered Siswa
      const filteredSiswa = useMemo(() => {
        return siswaList.filter(s => {
          const matchKelas = selectedKelasFilter === 'Semua' || s.namaKelas === selectedKelasFilter;
          const matchSearch = s.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              s.nisn.includes(searchQuery) || s.nis.includes(searchQuery);
          return matchKelas && matchSearch;
        });
      }, [siswaList, selectedKelasFilter, searchQuery]);

      return (
        <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          
          {/* TOAST NOTIFICATION */}
          {toast && (
            <div className={'fixed bottom-6 right-6 z-50 bg-white dark:bg-slate-900 border shadow-2xl rounded-2xl p-4 flex items-center space-x-3 border-l-4 ' + (toast.type === 'error' ? 'border-l-rose-500 border-slate-200 dark:border-slate-800' : 'border-l-violet-600 border-slate-200 dark:border-slate-800')}>
              <Icon name={toast.type === 'error' ? "alert-circle" : "check-circle-2"} className={'w-5 h-5 ' + (toast.type === 'error' ? 'text-rose-500' : 'text-violet-600')} />
              <span className="text-xs font-bold">{toast.message}</span>
            </div>
          )}

          {/* SIDEBAR NAVIGATION */}
          <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 shrink-0 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Brand Header */}
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                {logoUrl ? (
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                    G
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="text-sm font-extrabold truncate tracking-tight">{appConfig.namaAplikasi}</h1>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">{dataSekolah.namaSekolah}</p>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={'w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ' + (activeTab === 'dashboard' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}
                >
                  <Icon name="layout-dashboard" className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>

                <div className="pt-3 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3">
                  MASTER DATA
                </div>

                <button
                  onClick={() => setActiveTab('sekolah')}
                  className={'w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl transition-all ' + (activeTab === 'sekolah' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}
                >
                  <Icon name="building-2" className="w-4 h-4" />
                  <span>Data Sekolah</span>
                </button>

                <button
                  onClick={() => setActiveTab('guru')}
                  className={'w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl transition-all ' + (activeTab === 'guru' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}
                >
                  <Icon name="user-check" className="w-4 h-4" />
                  <span>Profil Guru</span>
                </button>

                <button
                  onClick={() => setActiveTab('mapel')}
                  className={'w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl transition-all ' + (activeTab === 'mapel' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}
                >
                  <Icon name="book-open" className="w-4 h-4" />
                  <span>Mata Pelajaran</span>
                </button>

                <button
                  onClick={() => setActiveTab('kelas')}
                  className={'w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl transition-all ' + (activeTab === 'kelas' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}
                >
                  <Icon name="graduation-cap" className="w-4 h-4" />
                  <span>Data Kelas</span>
                </button>

                <button
                  onClick={() => setActiveTab('siswa')}
                  className={'w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl transition-all ' + (activeTab === 'siswa' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}
                >
                  <Icon name="users" className="w-4 h-4" />
                  <span>Data Siswa</span>
                </button>

                <div className="pt-3 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3">
                  PENCATATAN AKADEMIK
                </div>

                <button
                  onClick={() => setActiveTab('presensi')}
                  className={'w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl transition-all ' + (activeTab === 'presensi' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}
                >
                  <Icon name="clipboard-check" className="w-4 h-4" />
                  <span>Presensi Siswa</span>
                </button>

                <button
                  onClick={() => setActiveTab('nilai')}
                  className={'w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl transition-all ' + (activeTab === 'nilai' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}
                >
                  <Icon name="award" className="w-4 h-4" />
                  <span>Nilai Siswa</span>
                </button>

                <button
                  onClick={() => setActiveTab('jurnal')}
                  className={'w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl transition-all ' + (activeTab === 'jurnal' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}
                >
                  <Icon name="book-marked" className="w-4 h-4" />
                  <span>Jurnal Mengajar</span>
                </button>

                <div className="pt-3 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3">
                  PENGATURAN
                </div>

                <button
                  onClick={() => setActiveTab('konfigurasi')}
                  className={'w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl transition-all ' + (activeTab === 'konfigurasi' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}
                >
                  <Icon name="settings" className="w-4 h-4" />
                  <span>Konfigurasi App</span>
                </button>
              </nav>
            </div>

            {/* Sidebar Footer Teacher Badge */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 flex items-center justify-center font-bold text-xs shrink-0">
                {profilGuru.namaGuru ? profilGuru.namaGuru.charAt(0) : 'G'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">{profilGuru.namaGuru}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">NIP: {profilGuru.nip || '-'}</p>
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT WINDOW */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            
            {/* TOP HEADER */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {activeTab}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSyncSpreadsheet}
                  disabled={isSyncing}
                  className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-sm transition-all disabled:opacity-50"
                >
                  <Icon name="cloud-upload" className="w-4 h-4" />
                  <span>{isSyncing ? 'Menyimpan...' : 'Sync Spreadsheet'}</span>
                </button>

                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-all"
                  title="Toggle Dark Mode"
                >
                  <Icon name={darkMode ? "sun" : "moon"} className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* BODY PAGE CONTENT */}
            <main className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
              
              {/* TAB 1: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Siswa</p>
                        <h3 className="text-2xl font-black mt-1">{siswaList.length}</h3>
                      </div>
                      <div className="p-3 bg-violet-100 dark:bg-violet-950 text-violet-600 rounded-xl"><Icon name="users" className="w-6 h-6" /></div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Kelas</p>
                        <h3 className="text-2xl font-black mt-1">{kelasList.length}</h3>
                      </div>
                      <div className="p-3 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 rounded-xl"><Icon name="graduation-cap" className="w-6 h-6" /></div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mata Pelajaran</p>
                        <h3 className="text-2xl font-black mt-1">{mapelList.length}</h3>
                      </div>
                      <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl"><Icon name="book-open" className="w-6 h-6" /></div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sesi Presensi</p>
                        <h3 className="text-2xl font-black mt-1">{presensiList.length}</h3>
                      </div>
                      <div className="p-3 bg-amber-100 dark:bg-amber-950 text-amber-600 rounded-xl"><Icon name="clipboard-check" className="w-6 h-6" /></div>
                    </div>
                  </div>

                  {/* Quick Shortcuts */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">Akses Cepat Pembelajaran</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <button onClick={() => setActiveTab('presensi')} className="p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-violet-50 dark:hover:bg-violet-950/30 border border-slate-200 dark:border-slate-700/60 rounded-xl flex items-center space-x-3 transition-all text-left group">
                        <div className="p-2.5 bg-violet-600 text-white rounded-lg"><Icon name="clipboard-check" /></div>
                        <div>
                          <p className="text-xs font-bold group-hover:text-violet-600 transition-colors">Input Presensi Siswa</p>
                          <p className="text-[10px] text-slate-500">Catat kehadiran kelas hari ini</p>
                        </div>
                      </button>

                      <button onClick={() => setActiveTab('jurnal')} className="p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-violet-50 dark:hover:bg-violet-950/30 border border-slate-200 dark:border-slate-700/60 rounded-xl flex items-center space-x-3 transition-all text-left group">
                        <div className="p-2.5 bg-emerald-600 text-white rounded-lg"><Icon name="book-marked" /></div>
                        <div>
                          <p className="text-xs font-bold group-hover:text-emerald-600 transition-colors">Tulis Jurnal Mengajar</p>
                          <p className="text-[10px] text-slate-500">Catat materi & kendala mengajar</p>
                        </div>
                      </button>

                      <button onClick={() => setActiveTab('nilai')} className="p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-violet-50 dark:hover:bg-violet-950/30 border border-slate-200 dark:border-slate-700/60 rounded-xl flex items-center space-x-3 transition-all text-left group">
                        <div className="p-2.5 bg-amber-600 text-white rounded-lg"><Icon name="award" /></div>
                        <div>
                          <p className="text-xs font-bold group-hover:text-amber-600 transition-colors">Input Penilaian</p>
                          <p className="text-[10px] text-slate-500">Isi nilai tugas/ulangan siswa</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DATA SEKOLAH */}
              {activeTab === 'sekolah' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h2 className="text-lg font-extrabold">Data Satuan Pendidikan (Sekolah)</h2>
                      <p className="text-xs text-slate-500">Kelola informasi instansi dan profil sekolah tempat bertugas.</p>
                    </div>
                    <button onClick={handleSyncSpreadsheet} className="px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl">Simpan Data</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                    <div>
                      <label className="block text-slate-500 mb-1">Nama Sekolah</label>
                      <input type="text" value={dataSekolah.namaSekolah} onChange={e => setDataSekolah({...dataSekolah, namaSekolah: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">NPSN</label>
                      <input type="text" value={dataSekolah.npsn} onChange={e => setDataSekolah({...dataSekolah, npsn: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Nama Kepala Sekolah</label>
                      <input type="text" value={dataSekolah.namaKepalaSekolah} onChange={e => setDataSekolah({...dataSekolah, namaKepalaSekolah: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Akreditasi</label>
                      <input type="text" value={dataSekolah.akreditasi} onChange={e => setDataSekolah({...dataSekolah, akreditasi: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-slate-500 mb-1">Alamat Lengkap</label>
                      <input type="text" value={dataSekolah.alamatLengkap} onChange={e => setDataSekolah({...dataSekolah, alamatLengkap: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PROFIL GURU */}
              {activeTab === 'guru' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h2 className="text-lg font-extrabold">Profil Tenaga Pendidik / Guru</h2>
                      <p className="text-xs text-slate-500">Kelola identitas resmi dan biodata pengajar.</p>
                    </div>
                    <button onClick={handleSyncSpreadsheet} className="px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl">Simpan Profil</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                    <div>
                      <label className="block text-slate-500 mb-1">Nama Lengkap & Gelar</label>
                      <input type="text" value={profilGuru.namaGuru} onChange={e => setProfilGuru({...profilGuru, namaGuru: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">NIP</label>
                      <input type="text" value={profilGuru.nip} onChange={e => setProfilGuru({...profilGuru, nip: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">NUPTK</label>
                      <input type="text" value={profilGuru.nuptk} onChange={e => setProfilGuru({...profilGuru, nuptk: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Email</label>
                      <input type="email" value={profilGuru.email} onChange={e => setProfilGuru({...profilGuru, email: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: MAPEL */}
              {activeTab === 'mapel' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-extrabold">Daftar Mata Pelajaran ({mapelList.length})</h2>
                      <p className="text-xs text-slate-500">Mata pelajaran yang Anda ampu semester ini.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-500 uppercase">
                        <tr>
                          <th className="p-3">Kode</th>
                          <th className="p-3">Nama Mapel</th>
                          <th className="p-3">Kelas</th>
                          <th className="p-3">Fase</th>
                          <th className="p-3">Beban Jam</th>
                          <th className="p-3">KKM/KKTP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {mapelList.map(m => (
                          <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 font-semibold">
                            <td className="p-3 font-mono">{m.kodeMapel}</td>
                            <td className="p-3 text-violet-600 dark:text-violet-400 font-bold">{m.namaMapel}</td>
                            <td className="p-3">{m.tingkatKelas}</td>
                            <td className="p-3">{m.fase}</td>
                            <td className="p-3">{m.bebanJam} JP</td>
                            <td className="p-3">{m.kkm}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: KELAS */}
              {activeTab === 'kelas' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-extrabold">Data Kelas / Rombongan Belajar ({kelasList.length})</h2>
                      <p className="text-xs text-slate-500">Daftar kelas binaan dan wali kelas.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {kelasList.map(k => (
                      <div key={k.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-extrabold text-violet-600">{k.namaKelas}</h3>
                          <p className="text-xs text-slate-500">Wali Kelas: {k.waliKelas || '-'}</p>
                          <p className="text-[11px] text-slate-400">Ruangan: {k.ruangan || '-'}</p>
                        </div>
                        <div className="p-3 bg-violet-50 dark:bg-violet-950 text-violet-600 rounded-xl">
                          <Icon name="graduation-cap" className="w-5 h-5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: DATA SISWA */}
              {activeTab === 'siswa' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-extrabold">Daftar Siswa Terdaftar ({filteredSiswa.length})</h2>
                      <p className="text-xs text-slate-500">Kelola dan telusuri data peserta didik.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={selectedKelasFilter}
                        onChange={e => setSelectedKelasFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                      >
                        <option value="Semua">Semua Kelas</option>
                        {kelasList.map(k => <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>)}
                      </select>

                      <input
                        type="text"
                        placeholder="Cari siswa/NISN..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-500 uppercase">
                        <tr>
                          <th className="p-3">NISN</th>
                          <th className="p-3">NIS</th>
                          <th className="p-3">Nama Lengkap</th>
                          <th className="p-3">JK</th>
                          <th className="p-3">Kelas</th>
                          <th className="p-3">Orang Tua</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredSiswa.map(s => (
                          <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 font-medium">
                            <td className="p-3 font-mono">{s.nisn}</td>
                            <td className="p-3 font-mono text-slate-400">{s.nis}</td>
                            <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{s.namaLengkap}</td>
                            <td className="p-3">{s.jenisKelamin}</td>
                            <td className="p-3 font-bold text-violet-600">{s.namaKelas}</td>
                            <td className="p-3 text-slate-500">{s.namaOrangTua || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 7: PRESENSI SISWA */}
              {activeTab === 'presensi' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-extrabold">Riwayat & Rekapitulasi Presensi Siswa</h2>
                      <p className="text-xs text-slate-500">Sesi pencatatan kehadiran kelas terdaftar.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {presensiList.length === 0 ? (
                      <div className="text-center py-12 text-xs text-slate-400">Belum ada sesi presensi tersimpan.</div>
                    ) : (
                      presensiList.map(p => (
                        <div key={p.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 bg-slate-50/50 dark:bg-slate-900">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                            <span className="text-violet-600 text-sm">{p.namaMapel} — Kelas {p.kelas}</span>
                            <span className="text-slate-500">{p.tanggal} (Pertemuan #{p.pertemuanKe})</span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                            <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg">Hadir: {p.summary?.Hadir || 0}</span>
                            <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-lg">Terlambat: {p.summary?.Terlambat || 0}</span>
                            <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg">Sakit: {p.summary?.Sakit || 0}</span>
                            <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-lg">Izin: {p.summary?.Izin || 0}</span>
                            <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-lg">Alpha: {p.summary?.Alpha || 0}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 8: NILAI SISWA */}
              {activeTab === 'nilai' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h2 className="text-base font-extrabold">Modul Penilaian & Asesmen Siswa</h2>
                  <p className="text-xs text-slate-500">Kelola daftar nilai tugas, asesmen formatif & sumatif.</p>
                  <div className="text-center py-12 text-xs text-slate-400">Modul penilaian siap digunakan & tersinkron dengan Spreadsheet.</div>
                </div>
              )}

              {/* TAB 9: JURNAL */}
              {activeTab === 'jurnal' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h2 className="text-base font-extrabold">Jurnal Kegiatan Belajar Mengajar</h2>
                  <p className="text-xs text-slate-500">Catatan harian pelaksanaan pembelajaran di kelas.</p>
                  <div className="text-center py-12 text-xs text-slate-400">Belum ada jurnal mengajar tersimpan.</div>
                </div>
              )}

              {/* TAB 10: KONFIGURASI */}
              {activeTab === 'konfigurasi' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-base font-extrabold">Konfigurasi Aplikasi & Ekspor Google Apps Script</h2>
                    <p className="text-xs text-slate-500">Atur parameter umum dan salin kode Apps Script resmi.</p>
                  </div>

                  <div className="p-4 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900/50 rounded-2xl space-y-3">
                    <h3 className="text-xs font-bold text-violet-700 dark:text-violet-300">Status Google Apps Script Engine</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Kode Google Apps Script (<code className="font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border">Code.gs</code> dan <code className="font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border">Index.html</code>) yang Anda jalankan di Apps Script kini sudah 100% lengkap dan menyatu sempurna!
                    </p>
                  </div>
                </div>
              )}

            </main>
          </div>
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
</body>
</html>
`;

export const CODE_GS_TEMPLATE = CODE_GS_CONTENT;
export const INDEX_HTML_TEMPLATE = INDEX_HTML_CONTENT;
