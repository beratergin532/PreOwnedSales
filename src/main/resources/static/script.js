var urunler = []; 
var sepet = [];
var aktifKullanici = null;
var aktifUrunId = null;
var debounceTimeout = null;

var simulasyonSiparisler = [
    { sipNo: '#POS-2025-00143', tarih: '14 Mart 2025', urunId: 1, urunAdi: 'Louis Vuitton — Neverfull MM Monogram Canvas', tutar: '285.000 ₺', durum: 'Teslim Edildi', sertifikaNo: 'LUX-CERT-7A3F91B2E4' },
    { sipNo: '#POS-2024-00891', tarih: '28 Eylül 2024', urunId: 3, urunAdi: 'Hermès — Carrée 90 Soie', tutar: '125.000 ₺', durum: 'Teslim Edildi', sertifikaNo: 'LUX-CERT-2C8D45F0A1' }
];

document.addEventListener('DOMContentLoaded', async function() {
    const oturum = localStorage.getItem('aktifOturum');
    if (oturum) {
        aktifKullanici = JSON.parse(oturum);
        try {
            const res = await fetch('/api/sepet/' + aktifKullanici.id);
            const data = await res.json();
            sepet = Array.isArray(data) ? data : [];
            var sepetBadge = document.getElementById('sepetSayi');
            if (sepetBadge) sepetBadge.innerText = sepet.length;
        } catch(e) { console.error("Sepet hatası:", e); }
    }
    
    navbarGuncelle();

    fetch('/api/urunler')
        .then(res => res.json())
        .then(data => {
            urunler = data.map(u => ({
                ...u,
                id: u.id,
                name: u.name,
                brand: u.brand,
                price: u.price,
                image: u.image,
                condition: u.condition || 'Az Kullanılmış',
                category: u.category || 'Çanta',
                authenticityScore: Math.floor(Math.random() * 5) + 95,
                expertNotes: uzmanNotuUret(u.category, u.brand),
                scoreBreakdown: { "Dikiş Kalitesi": "10/10", "Materyal Orijinalliği": "10/10", "Donanım Durumu": "9/10" },
                reviews: JSON.parse(localStorage.getItem('yorumlar_' + u.id)) || [],
                material: (u.category === 'Çanta' || u.category === 'Ayakkabı') ? 'Deri' : (u.category === 'Eşarp' ? 'İpek' : 'Kumaş')
            }));
            goster(urunler);
        })
        .catch(err => {
            var liste = document.getElementById('liste');
            if(liste) liste.innerHTML = '<div class="col-12 text-center text-danger py-5">Sunucu bağlantı hatası.</div>';
        });

    var maxFiyatEl = document.getElementById('maxFiyat');
    if (maxFiyatEl) {
        maxFiyatEl.addEventListener('input', function() {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(function() { filtrele(); }, 200);
        });
    }

    var btnCheckoutIleri = document.getElementById('btnCheckoutIleri');
    if (btnCheckoutIleri) {
        btnCheckoutIleri.addEventListener('click', islemCheckoutAdim);
    }

    var kartNoInput = document.getElementById('kartNo');
    if(kartNoInput) {
        kartNoInput.addEventListener('input', function(e) {
            var val = e.target.value.replace(/\D/g, '').substring(0, 16);
            e.target.value = val !== '' ? val.match(/.{1,4}/g).join(' ') : '';
        });
    }

    var kartSktInput = document.getElementById('kartSkt');
    if(kartSktInput) {
        kartSktInput.setAttribute('maxlength', '7');
        kartSktInput.addEventListener('input', function(e) {
            var val = e.target.value.replace(/\D/g, '').substring(0, 4);
            if (val.length >= 3) {
                e.target.value = val.substring(0, 2) + ' / ' + val.substring(2, 4);
            } else if (val.length >= 1) {
                e.target.value = val;
            } else {
                e.target.value = '';
            }
        });
    }
});

/* VİTRİN VE ARAYÜZ */
function navbarGuncelle() {
    var alani = document.getElementById('navGirisAlani');
    if (!alani) return;
    
    if (aktifKullanici && aktifKullanici.adSoyad && !aktifKullanici.adSoyad.includes('undefined')) {
        var ilkIsim = aktifKullanici.adSoyad.split(' ')[0];
        alani.innerHTML = `
            <div class="dropdown">
                <button class="btn-profil-nav dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    <i class="bi bi-person"></i><span>${ilkIsim}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end luxury-dropdown">
                    <li><a class="dropdown-item" href="#" onclick="hesapAyarlariAc('profil'); return false;"><i class="bi bi-person-badge"></i>Hesabım</a></li>
                    <li><a class="dropdown-item" href="#" onclick="hesapAyarlariAc('siparisler'); return false;"><i class="bi bi-box-seam"></i>Siparişlerim</a></li>
                    <li><a class="dropdown-item" href="#" onclick="hesapAyarlariAc('favoriler'); return false;"><i class="bi bi-heart"></i>Favorilerim</a></li>
                    <li><a class="dropdown-item" href="#" onclick="sertifikalarAc(); return false;"><i class="bi bi-patch-check"></i>Dijital Sertifikalarım</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item luxury-dropdown-cikis" href="#" onclick="cikisYap(); return false;"><i class="bi bi-box-arrow-right"></i>Çıkış Yap</a></li>
                </ul>
            </div>`;
    } else {
        alani.innerHTML = '<a href="#" class="btn-giris-nav" data-bs-toggle="modal" data-bs-target="#authModal"><i class="bi bi-person"></i>Giriş Yap</a>';
    }
}

function goster(gosterilecekUrunler) {
    var urunlerGrid = document.getElementById('liste'); 
    var urunSayisiEl = document.getElementById('urunSayisi'); 
    var sonucYokEl = document.getElementById('sonucYok');

    if (!urunlerGrid) return;

    if (!gosterilecekUrunler || gosterilecekUrunler.length === 0) {
        urunlerGrid.innerHTML = '';
        if(urunSayisiEl) urunSayisiEl.innerHTML = '0 ürün listeleniyor';
        if(sonucYokEl) sonucYokEl.classList.remove('d-none');
        return;
    }

    if(sonucYokEl) sonucYokEl.classList.add('d-none');
    if(urunSayisiEl) urunSayisiEl.innerHTML = gosterilecekUrunler.length + ' ürün listeleniyor';

    var html = '';
    gosterilecekUrunler.forEach(function(u) {
        var urunKondisyon = u.condition || 'Belirtilmemiş';
        var kondisyonSinif = 'badge-used';
        if (urunKondisyon === 'Etiketli' || urunKondisyon === 'Mint' || urunKondisyon === 'Yeni Gibi') kondisyonSinif = 'badge-new';
        else if (urunKondisyon === 'Vintage') kondisyonSinif = 'badge-vintage';

        var tooltipIcerik = '<div style="text-align:left;font-size:0.75rem;"><strong style="color:#D4AF37;font-size:0.72rem;letter-spacing:1px;">EKSPERTİZ KIRILIMLARI</strong><hr style="border-color:#444;margin:4px 0;">';
        tooltipIcerik += '<div style="display:flex;justify-content:space-between;gap:12px;"><span style="color:#ccc;">Dikiş Kalitesi</span><span style="color:#D4AF37;font-weight:700;">10/10</span></div>';
        tooltipIcerik += '<div style="display:flex;justify-content:space-between;gap:12px;"><span style="color:#ccc;">Materyal Orijinalliği</span><span style="color:#D4AF37;font-weight:700;">10/10</span></div>';
        tooltipIcerik += '<div style="display:flex;justify-content:space-between;gap:12px;"><span style="color:#ccc;">Donanım Durumu</span><span style="color:#D4AF37;font-weight:700;">9/10</span></div></div>';

        var fiyatStr = (u.price || 0).toLocaleString('tr-TR') + ' ₺';

        html += '<div class="col-md-4 col-sm-6"><div class="urun-kart urun-kart-animate">';
        html += '<div class="urun-kart-img-wrapper"><img src="' + u.image + '" loading="lazy" onclick="detayGoster(' + u.id + ')" title="İncele">';
        html += '<span class="kart-kondisyon-badge condition-badge ' + kondisyonSinif + '">' + urunKondisyon + '</span>';
        html += '<span class="kart-skor-badge" data-bs-toggle="tooltip" data-bs-html="true" data-bs-placement="left" data-bs-custom-class="ekspertiz-tooltip" title="' + tooltipIcerik.replace(/"/g, '&quot;') + '">✓ ' + u.authenticityScore + '/100</span>';
        html += '<button class="vitrin-favori-btn" onclick="event.stopPropagation(); this.classList.toggle(\'aktif\'); bildirimGoster(\'Favoriler güncellendi.\', \'success\');" title="Favorilere Ekle"><i class="bi bi-heart"></i></button></div>';
        html += '<div class="urun-kart-body"><p class="urun-marka">' + (u.brand || 'Butik') + '</p><p class="urun-isim">' + u.name + '</p><p class="urun-detay-bilgi">Standart &nbsp;·&nbsp; ' + urunKondisyon + '</p><div class="yildiz-row"><i class="bi bi-star-fill gold-text"></i><i class="bi bi-star-fill gold-text"></i><i class="bi bi-star-fill gold-text"></i><i class="bi bi-star-fill gold-text"></i><i class="bi bi-star-fill gold-text"></i> <small class="text-muted">(Onaylı)</small></div><p class="urun-fiyat">' + fiyatStr + '</p></div>';
        html += '<div class="urun-kart-footer"><button class="btn-detay" onclick="detayGoster(' + u.id + ')">İNCELE</button><button class="btn-sepet" onclick="sepeteEkleKart(' + u.id + ')" title="Sepete Ekle"><i class="bi bi-bag-plus"></i></button></div>';
        html += '</div></div>';
    });

    urunlerGrid.innerHTML = html; 

    if (typeof bootstrap !== 'undefined') {
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) { return new bootstrap.Tooltip(tooltipTriggerEl); });
    }
}

/* FİLTRELEME & ARAMA */
function aramaYap() {
    var metin = document.getElementById('aramaInput').value.toLowerCase().trim();
    if (metin === '') { goster(urunler); return; }
    var filtrelenmis = urunler.filter(u => 
        (u.name || '').toLowerCase().includes(metin) || 
        (u.brand || '').toLowerCase().includes(metin) || 
        (u.material || '').toLowerCase().includes(metin) || 
        (u.category || '').toLowerCase().includes(metin)
    );
    goster(filtrelenmis);
}

function filtrele() {
    var seciliMarka = document.getElementById('marka').value;
    var maxFiyat = parseInt(document.getElementById('maxFiyat').value, 10);
    var siralama = document.getElementById('siralama').value;
    
    var matDeri = document.getElementById('mat_deri').checked;
    var matIpek = document.getElementById('mat_ipek').checked;
    var matKumas = document.getElementById('mat_kumas').checked;
    
    var konEtiketli = document.getElementById('kon_etiketli').checked;
    var konAz = document.getElementById('kon_az').checked;
    var konVintage = document.getElementById('kon_vintage').checked;

    var katCanta = document.getElementById('kat_canta') ? document.getElementById('kat_canta').checked : false;
    var katAyakkabi = document.getElementById('kat_ayakkabi') ? document.getElementById('kat_ayakkabi').checked : false;
    var katDisgiyim = document.getElementById('kat_disgiyim') ? document.getElementById('kat_disgiyim').checked : false;
    var katAksesuar = document.getElementById('kat_aksesuar') ? document.getElementById('kat_aksesuar').checked : false;
    var katEsarp = document.getElementById('kat_esarp') ? document.getElementById('kat_esarp').checked : false;

    var herhangiMateryal = matDeri || matIpek || matKumas;
    var herhangiKondisyon = konEtiketli || konAz || konVintage;
    var herhangiKategori = katCanta || katAyakkabi || katDisgiyim || katAksesuar || katEsarp;

    var filtrelenmis = [];
    for (var i = 0; i < urunler.length; i++) {
        var u = urunler[i];
        var gecti = true;
        
        if (seciliMarka !== '' && u.brand !== seciliMarka) gecti = false;
        if (u.price > maxFiyat) gecti = false;
        
        if (herhangiMateryal) {
            var urunMateryal = u.material || 'Deri';
            var matEslesti = false;
            if (matDeri && urunMateryal.includes('Deri')) matEslesti = true;
            if (matIpek && urunMateryal.includes('İpek')) matEslesti = true;
            if (matKumas && urunMateryal.includes('Kumaş')) matEslesti = true;
            if (!matEslesti) gecti = false;
        }
        if (herhangiKondisyon) {
            var konEslesti = false;
            if (konEtiketli && (u.condition === 'Etiketli' || u.condition === 'Mint')) konEslesti = true;
            if (konAz && (u.condition === 'Az Kullanılmış' || u.condition === 'Çok İyi')) konEslesti = true;
            if (konVintage && (u.condition === 'Vintage' || u.condition === 'İyi')) konEslesti = true;
            if (!konEslesti) gecti = false;
        }
        if (herhangiKategori) {
            var katEslesti = false;
            if (katCanta && u.category === 'Çanta') katEslesti = true;
            if (katAyakkabi && u.category === 'Ayakkabı') katEslesti = true;
            if (katDisgiyim && u.category === 'Dış Giyim') katEslesti = true;
            if (katAksesuar && (u.category === 'Aksesuar' || u.category === 'Saat')) katEslesti = true;
            if (katEsarp && u.category === 'Eşarp') katEslesti = true;
            if (!katEslesti) gecti = false;
        }

        if (gecti) filtrelenmis.push(u);
    }

    var siralanmis = filtrelenmis.slice();
    if (siralama === 'fiyat_artan') siralanmis.sort((a, b) => a.price - b.price);
    else if (siralama === 'fiyat_azalan') siralanmis.sort((a, b) => b.price - a.price);
    
    goster(siralanmis);
}

function filtreleriSifirla() {
    document.getElementById('marka').value = '';
    document.getElementById('siralama').value = 'default';
    document.getElementById('maxFiyat').value = 250000;
    var fiyatGosterEl = document.getElementById('fiyatGoster');
    if(fiyatGosterEl) fiyatGosterEl.innerText = '250.000 ₺';
    
    document.getElementById('mat_deri').checked = false;
    document.getElementById('mat_ipek').checked = false;
    document.getElementById('mat_kumas').checked = false;
    document.getElementById('kon_etiketli').checked = false;
    document.getElementById('kon_az').checked = false;
    document.getElementById('kon_vintage').checked = false;
    if (document.getElementById('kat_canta')) {
        ['kat_canta', 'kat_ayakkabi', 'kat_disgiyim', 'kat_aksesuar', 'kat_esarp'].forEach(id => {
            var el = document.getElementById(id);
            if(el) el.checked = false;
        });
    }
    
    var aramaEl = document.getElementById('aramaInput');
    if (aramaEl) aramaEl.value = '';
    goster(urunler);
}

function footerFiltrele(tip, deger) {
    filtreleriSifirla();
    if (tip === 'marka') { document.getElementById('marka').value = deger; filtrele(); } 
    else if (tip === 'kategori') {
        var kategoriFiltre = urunler.filter(function(u) { return u.category === deger; });
        goster(kategoriFiltre);
    }
    setTimeout(function() {
        var listeEl = document.getElementById('liste');
        if (listeEl) listeEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
}

/* ÜRÜN DETAY MODALI */
function detayGoster(id) {
    var urun = urunler.find(p => p.id === id);
    if (!urun) return;
    aktifUrunId = id;

    document.getElementById('modalUrunAdi').innerText = urun.brand + ' — ' + urun.name;

    document.getElementById('modalGorsel').innerHTML = `
        <div class="modal-galeri">
            <img src="${urun.image}" class="modal-galeri-ana">
            <div class="modal-galeri-thumbs mt-2">
                <img src="${urun.image}" class="galeri-thumb aktif">
                <img src="${urun.image}" class="galeri-thumb">
                <img src="${urun.image}" class="galeri-thumb">
            </div>
        </div>`;

    var ekstraOzellikHtml = '';
    if (urun.category === 'Ayakkabı') {
        ekstraOzellikHtml = `<div class="urun-ozellik-satir"><span class="urun-ozellik-label">Numara</span><span class="urun-ozellik-deger">42 (Tek Stok)</span></div><div class="urun-ozellik-satir"><span class="urun-ozellik-label">Kumaş ve Bakım</span><span class="urun-ozellik-deger">%85 Dana Derisi, %15 Kauçuk Taban</span></div>`;
    } else if (urun.category === 'Çanta') {
        ekstraOzellikHtml = `<div class="urun-ozellik-satir"><span class="urun-ozellik-label">Boyutlar (Y x G x D)</span><span class="urun-ozellik-deger">35 x 25 x 18 cm</span></div><div class="urun-ozellik-satir"><span class="urun-ozellik-label">Materyal</span><span class="urun-ozellik-deger">%100 Orijinal Deri</span></div>`;
    } else {
        ekstraOzellikHtml = `<div class="urun-ozellik-satir"><span class="urun-ozellik-label">Beden</span><span class="urun-ozellik-deger">Standart Beden</span></div><div class="urun-ozellik-satir"><span class="urun-ozellik-label">Kumaş ve Bakım</span><span class="urun-ozellik-deger">Kuru temizleme önerilir.</span></div>`;
    }

    var kodUretici = 'POS' + urun.id + 'X' + new Date().getFullYear();
    document.getElementById('urunOzellikler').innerHTML = `
        <div class="urun-ozellik-baslik mt-4"><i class="bi bi-card-text me-1 gold-text"></i>Ürün Özellikleri & Detaylar</div>
        <div class="urun-ozellik-grid">
            <div class="urun-ozellik-satir"><span class="urun-ozellik-label">Kategori</span><span class="urun-ozellik-deger">${urun.category}</span></div>
            ${ekstraOzellikHtml}
            <div class="urun-ozellik-satir"><span class="urun-ozellik-label">Ürün Kodu</span><span class="urun-ozellik-deger font-mono" style="font-size:0.75rem;">${kodUretici}</span></div>
        </div>`;

    var kondisyonSinif = (urun.condition === 'Vintage') ? 'badge-vintage' : (urun.condition === 'Az Kullanılmış' ? 'badge-used' : 'badge-new');
    document.getElementById('modalFiyat').innerHTML = '<div class="modal-fiyat-kutu"><div><small style="font-size:0.6rem;letter-spacing:1.5px;color:#888;display:block;">SATIŞ FİYATI</small><span class="modal-fiyat-rakam">' + urun.price.toLocaleString('tr-TR') + ' ₺</span></div><span class="condition-badge ' + kondisyonSinif + '">' + urun.condition + '</span></div>';

    var kiriilimHtml = '';
    for (var kriter in urun.scoreBreakdown) {
        kiriilimHtml += '<div class="ekspertiz-bilgi-satir"><span>' + kriter + '</span><span>' + urun.scoreBreakdown[kriter] + '</span></div>';
    }

    document.getElementById('modalEkspertiz').innerHTML = `
        <div class="ekspertiz-kart">
            <p class="ekspertiz-kart-baslik"><i class="bi bi-patch-check me-2"></i>Dijital Orijinallik &amp; Kondisyon Kartı</p>
            <div class="d-flex align-items-start gap-3">
                <div class="ekspertiz-skor-daire"><span class="ekspertiz-skor-sayi">${urun.authenticityScore}</span><span class="ekspertiz-skor-label">/ 100</span></div>
                <div class="flex-grow-1">
                    <div class="ekspertiz-bilgi-satir"><span>Marka</span><span>${urun.brand}</span></div>
                    <div class="ekspertiz-bilgi-satir"><span>Materyal</span><span>${urun.material}</span></div>
                    <div class="ekspertiz-bilgi-satir"><span>Kondisyon</span><span>${urun.condition}</span></div>
                    ${kiriilimHtml}
                </div>
            </div>
            <div class="uzman-notu"><i class="bi bi-quote me-1 gold-text"></i><strong style="color:#444;font-style:normal;">Uzman Notu:</strong> ${urun.expertNotes}</div>
        </div>`;

    yorumlariGuncelle(urun);
    yorumFormuGuncelle(id);
    benzerUrunleriGoster(urun);

    document.getElementById('yorumGonderBtn').setAttribute('onclick', 'yorumEkle(' + id + ')');
    var modal = new bootstrap.Modal(document.getElementById('urunModal'));
    modal.show();
}

function benzerUrunleriGoster(aktifUrun) {
    var benzerBolum = document.getElementById('benzerUrunlerBolum');
    var oneriler = urunler.filter(u => u.id !== aktifUrun.id && (u.brand === aktifUrun.brand || u.category === aktifUrun.category)).slice(0, 2);
    
    if (oneriler.length === 0) { benzerBolum.innerHTML = ''; return; }

    var html = '<div class="benzer-urunler-bolum mt-2"><h6 class="section-title mb-3"><i class="bi bi-stars me-2 gold-text"></i>Benzer Ürünler</h6><div class="row g-2">';
    oneriler.forEach(o => {
        html += `<div class="col-6"><div class="benzer-kart" onclick="detayGoster(${o.id})"><img src="${o.image}" class="benzer-kart-img"><div class="benzer-kart-bilgi"><p class="benzer-marka">${o.brand}</p><p class="benzer-isim">${o.name}</p><p class="benzer-fiyat">${o.price.toLocaleString('tr-TR')} ₺</p><span class="benzer-skor">✓ ${o.authenticityScore}/100</span></div></div></div>`;
    });
    html += '</div></div>';
    benzerBolum.innerHTML = html;
}

function yorumlariGuncelle(urun) {
    var yorumlarDiv = document.getElementById('modalYorumlar');
    if (!urun.reviews || urun.reviews.length === 0) {
        yorumlarDiv.innerHTML = '<p class="text-muted small fst-italic py-2"><i class="bi bi-chat-dots me-1"></i>Henüz yorum yapılmamış. İlk yorumu siz yazın!</p>';
        return;
    }
    var html = '';
    urun.reviews.forEach(y => {
        var yildizlar = '';
        for (var s = 1; s <= 5; s++) { yildizlar += (s <= parseInt(y.rating)) ? '★' : '☆'; }
        var verifiedHtml = y.verified ? '<div class="verified-badge"><i class="bi bi-patch-check-fill"></i>Doğrulanmış Alıcı</div>' : '';
        html += `<div class="yorum-kart"><div class="yorum-kart-header"><div>${verifiedHtml}<span class="yorum-kullanici"><i class="bi bi-person-circle me-1 gold-text"></i>${y.username}</span></div><span class="yorum-tarih">${y.date}</span></div><div class="yildiz-row" style="font-size:0.82rem;">${yildizlar}</div><p class="yorum-yorum mb-0 mt-1">${y.comment}</p></div>`;
    });
    yorumlarDiv.innerHTML = html;
}

function yorumFormuGuncelle(urunId) {
    var loginUyari = document.getElementById('yorumLoginUyari');
    var verifiedUyari = document.getElementById('yorumVerifiedUyari');
    var formAlani = document.getElementById('yorumFormAlani');
    var kullaniciInp = document.getElementById('yorumKullanici');

    loginUyari.style.display = 'none'; verifiedUyari.style.display = 'none'; formAlani.style.display = 'block';
    kullaniciInp.removeAttribute('readonly'); kullaniciInp.value = '';
    document.getElementById('yorumPuan').value = '5'; document.getElementById('yorumMetin').value = '';

    if (!aktifKullanici) { loginUyari.style.display = 'block'; formAlani.style.display = 'none'; return; }

    var satinAldi = simulasyonSiparisler.some(s => s.urunId === urunId);
    if (!satinAldi) { verifiedUyari.style.display = 'block'; formAlani.style.display = 'none'; return; }

    kullaniciInp.value = aktifKullanici.adSoyad;
    kullaniciInp.setAttribute('readonly', 'readonly');
}

function yorumEkle(id) {
    if (!aktifKullanici) return;
    var puan = document.getElementById('yorumPuan').value;
    var metin = document.getElementById('yorumMetin').value;
    if (metin.trim() === '') { bildirimGoster('Lütfen yorum alanını doldurunuz.', 'error'); return; }

    var yeniYorum = { username: aktifKullanici.adSoyad, rating: parseInt(puan), comment: metin, date: new Date().toLocaleDateString('tr-TR'), verified: true };
    var u = urunler.find(x => x.id === id);
    if(u) {
        u.reviews.push(yeniYorum);
        localStorage.setItem('yorumlar_' + id, JSON.stringify(u.reviews));
        yorumlariGuncelle(u);
    }
    document.getElementById('yorumPuan').value = '5'; document.getElementById('yorumMetin').value = '';
    bildirimGoster('Yorumunuz başarıyla eklendi.', 'success');
}

/* SEPET  */
function sepeteEkleKart(id) {
    if (!aktifKullanici) { bildirimGoster('Ürün eklemek için giriş yapmalısınız.', 'error'); return; }
    
    
    var sayac = document.getElementById('sepetSayi');
    if(sayac) sayac.innerText = parseInt(sayac.innerText || 0) + 1;
    
    fetch('/api/sepet/ekle', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ customerId: aktifKullanici.id, productId: id })
    })
    .then(res => res.json())
    .then(() => fetch('/api/sepet/' + aktifKullanici.id))
    .then(res => res.json())
    .then(data => {
       
        sepet = Array.isArray(data) ? data : [];
        if(sayac) sayac.innerText = sepet.length; 
        sepetModalYenile();
        bildirimGoster('Ürün başarıyla sepete eklendi.', 'success');
    })
    .catch(err => {
        console.error(err);
        if(sayac) sayac.innerText = sepet.length; 
        bildirimGoster('Ürün sepete eklenemedi.', 'error');
    });
}

function sepeteEkle() {
    if (aktifUrunId !== null) {
        sepeteEkleKart(aktifUrunId);
        var uModal = bootstrap.Modal.getInstance(document.getElementById('urunModal'));
        if(uModal) uModal.hide();
    }
}

function sepetModalAc() {
    var icerikDiv = document.getElementById('sepetIcerik');
    var footerDiv = document.getElementById('sepetFooter');

    if (sepet.length === 0) {
        icerikDiv.innerHTML = '<div class="text-center py-5"><i class="bi bi-bag-x fs-1 gold-text d-block mb-3"></i><p>Sepetiniz şu an boş.</p></div>';
        footerDiv.innerHTML = '<button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Kataloğa Dön</button>';
    } else {
        sepetModalYenile();
        footerDiv.innerHTML = '<button type="button" class="btn btn-outline-danger btn-sm me-auto" onclick="sepetTemizle()"><i class="bi bi-trash3 me-1"></i>Sepeti Temizle</button><button type="button" class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal">Alışverişe Devam</button><button type="button" class="btn btn-gold btn-sm" onclick="alisverisiTamamla()"><i class="bi bi-credit-card me-1"></i>Alışverişi Tamamla</button>';
    }
    new bootstrap.Modal(document.getElementById('sepetModal')).show();
}

function sepetModalYenile() {
    var icerikDiv = document.getElementById('sepetIcerik');
    if (!icerikDiv) return;
    if (!Array.isArray(sepet)) sepet = [];

    if (sepet.length === 0) {
        icerikDiv.innerHTML = '<div class="text-center py-5"><i class="bi bi-bag-x fs-1 gold-text d-block mb-3"></i><p>Sepetiniz şu an boş.</p></div>';
        return;
    }

    var html = '<div class="sepet-liste">';
    var toplam = 0;
    sepet.forEach(s => {
        var fiyat = parseFloat(s.price) || 0;
        toplam += fiyat;
        html += `<div class="sepet-satir">
                    <img src="${s.image}" class="sepet-img" style="width:60px; height:60px;">
                    <div class="sepet-satir-bilgi">
                        <p class="sepet-isim" style="margin-bottom:0.2rem;">${s.name}</p>
                        <p class="sepet-fiyat">${fiyat.toLocaleString('tr-TR')} ₺</p>
                    </div>
                    <button class="sepet-cikar-btn ms-auto" onclick="sepettenCikar(${s.cartItemId})" title="Ürünü Çıkar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>`;
    });
    html += `</div><div class="mt-3 text-end"><strong class="gold-text fs-5">Toplam: ${toplam.toLocaleString('tr-TR')} ₺</strong></div>`;
    icerikDiv.innerHTML = html;
}

// TEKİL ÜRÜN SİL
function sepettenCikar(cartItemId) {
    if (!aktifKullanici) return;
    
    fetch('/api/sepet/sil/' + cartItemId, { method: 'DELETE' }) // 1. Başın /api ekledik
.then(res => { 
    if (!res.ok) throw new Error('Silinemedi');
    return fetch('/api/sepet/' + aktifKullanici.id); // 3. Baştaki hatalı linki sildip /api yaptık
})
    .then(res => res.json())
    .then(data => {
        sepet = Array.isArray(data) ? data : [];
        document.getElementById('sepetSayi').innerText = sepet.length; 
        sepetModalYenile();
        bildirimGoster('Ürün sepetten çıkarıldı.', 'success');
    })
    .catch(err => {
        console.error(err);
        bildirimGoster('Ürün silinemedi, veritabanı bağlantısını kontrol et.', 'error');
    });
}

function sepetTemizle() {
    if (!aktifKullanici) return;
    fetch('/api/sepet/temizle/' + aktifKullanici.id, { method: 'DELETE' })
    .then(() => {
        sepet = [];
        document.getElementById('sepetSayi').innerText = '0';
        sepetModalYenile();
        document.getElementById('sepetFooter').innerHTML = '<button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Kataloğa Dön</button>';
        bildirimGoster('Sepet temizlendi.', 'success');
    })
    .catch(err => bildirimGoster('Sepet temizlenemedi.', 'error'));
}

/* KULLANICI GİRİŞİ / KAYDI */
async function girisYap(email, sifre) {
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email, sifre })
        });
        const data = await res.json();
        
        if (data.error) {
            bildirimGoster(data.error, 'error');
        } else {
            aktifKullanici = { id: data.id, adSoyad: data.ad + ' ' + data.soyad, email: data.Email };
            localStorage.setItem('aktifOturum', JSON.stringify(aktifKullanici));
            
            const sepetRes = await fetch('/api/sepet/' + aktifKullanici.id);
            const sepetData = await sepetRes.json();
            sepet = Array.isArray(sepetData) ? sepetData : [];
            document.getElementById('sepetSayi').innerText = sepet.length;
            
            navbarGuncelle();
            var modal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
            if (modal) modal.hide();
            bildirimGoster('Hoş geldiniz, ' + aktifKullanici.adSoyad, 'success');
        }
    } catch (err) { bildirimGoster('Sunucu bağlantısı kurulamadı.', 'error'); }
}

function cikisYap() { 
    aktifKullanici = null; localStorage.removeItem('aktifOturum'); 
    sepet = []; document.getElementById('sepetSayi').innerText = '0';
    navbarGuncelle(); bildirimGoster('Çıkış yapıldı.', 'success'); 
}

function kayitOl(adSoyad, email, sifre) {
    fetch('/api/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adSoyad, email, sifre })
    })
    .then(r => r.json())
    .then(d => {
        if(d.error) bildirimGoster(d.error, 'error');
        else {
            bildirimGoster('Kayıt başarılı!', 'success');
            setTimeout(() => document.getElementById('giris-tab').click(), 1000);
        }
    }).catch(e => bildirimGoster('Sunucu hatası', 'error'));
}

/* DASHBOARD VE DİĞER MODALLAR */
function dashboardSekme(sekmeId) {
    var paneller = document.querySelectorAll('.dashboard-panel');
    paneller.forEach(panel => panel.style.display = 'none');
    
    var hedefPanel = document.getElementById('dashPanel_' + sekmeId);
    if(hedefPanel) hedefPanel.style.display = 'block';
    
    var butonlar = document.querySelectorAll('.dashboard-nav-item');
    butonlar.forEach(btn => btn.classList.remove('aktif'));
    
    var aktifButon = document.getElementById('btnTab_' + sekmeId);
    if(aktifButon) aktifButon.classList.add('aktif');
}

function hesapAyarlariAc(sekme) {
    if (aktifKullanici) {
        var hesapAdEl = document.getElementById('hesapAdSoyad'); 
        var hesapEmailEl = document.getElementById('hesapEmail');
        if (hesapAdEl) hesapAdEl.value = aktifKullanici.adSoyad || '';
        if (hesapEmailEl) hesapEmailEl.value = aktifKullanici.email || '';
    }
    new bootstrap.Modal(document.getElementById('hesapAyarlariModal')).show();
    setTimeout(() => { dashboardSekme(sekme); }, 150);
}

function sertifikalarAc() { new bootstrap.Modal(document.getElementById('sertifikalarModal')).show(); }
function kvkkModalAc() { new bootstrap.Modal(document.getElementById('kvkkModal')).show(); }
function cerezModalAc() { new bootstrap.Modal(document.getElementById('cerezModal')).show(); }

function sifreGosterGizle(id, btn) { 
    var i=document.getElementById(id); 
    i.type = (i.type==='password')?'text':'password'; 
    btn.querySelector('i').className = (i.type==='password')?'bi bi-eye':'bi bi-eye-slash'; 
}

function bildirimGoster(mesaj, tip) {
    var eskiBildirim = document.getElementById('bildirimKutu');
    if (eskiBildirim) { document.body.removeChild(eskiBildirim); }
    var div = document.createElement('div');
    div.id = 'bildirimKutu';
    var renk = tip === 'error' ? '#c62828' : '#D4AF37'; 
    var ikon = tip === 'error' ? 'bi-exclamation-circle' : 'bi-check-circle';
    div.style.cssText = `position:fixed; bottom:24px; right:24px; z-index:9999; background:#111; color:#fff; padding:14px 20px; border-left:3px solid ${renk}; border-radius:3px; font-size:0.82rem; font-family:"Jost",sans-serif; box-shadow:0 6px 25px rgba(0,0,0,0.35); animation:fadeInUp 0.3s ease;`;
    div.innerHTML = `<i class="bi ${ikon} me-2" style="color:${renk};"></i>` + mesaj;
    document.body.appendChild(div);
    setTimeout(() => { 
    if (div.parentNode) { 
        div.parentNode.removeChild(div); 
    } 
}, 2800);
}

function sifremiUnuttum(email) {
    if (email.trim() === '') { bildirimGoster('Lütfen e-posta adresinizi giriniz.', 'error'); return; }
    bildirimGoster('Şifre sıfırlama bağlantısı gönderildi.', 'success');
}

/* CHECKOUT SÜRECİ VE KART GÜVENLİK DOĞRULAMASI */
function alisverisiTamamla() {
    if (sepet.length === 0) { bildirimGoster('Sepetiniz boş.', 'error'); return; }
    var sm = bootstrap.Modal.getInstance(document.getElementById('sepetModal'));
    if (sm) sm.hide();
    
    
    document.getElementById('checkoutAdim1').style.display = 'block';
    document.getElementById('checkoutAdim2').style.display = 'none';
    document.getElementById('checkoutAdim3').style.display = 'none';
    document.querySelector('.checkout-sag-sidebar').style.display = 'block';
    
    document.querySelector('.checkout-step-item[data-adim="1"]').className = 'checkout-step-item aktif';
    document.querySelector('.checkout-step-item[data-adim="2"]').className = 'checkout-step-item';
    document.querySelector('.checkout-step-item[data-adim="3"]').className = 'checkout-step-item';
    
    var ileriBtn = document.getElementById('btnCheckoutIleri');
    if(ileriBtn) ileriBtn.innerHTML = '<i class="bi bi-arrow-right-circle-fill me-2"></i>Ödemeye Geç';
    
    checkoutAdresleriDoldur(); 
    new bootstrap.Modal(document.getElementById('checkoutModal')).show();
}
function checkoutAdresleriDoldur() {
    var adresListesi = document.getElementById('checkoutAdresListesi');
    var formKutu = document.querySelector('.checkout-adres-form-kutu');
    if(!adresListesi) return;

    adresListesi.innerHTML = `
        <div class="checkout-adres-kart secili" onclick="adresSec(this)">
            <div class="checkout-secim-ikon"></div>
            <p class="checkout-adres-kart-baslik mb-1">Ev Adresim <span class="adres-varsayilan-badge ms-2" style="font-size:0.5rem; padding: 2px 4px;">Varsayılan</span></p>
            <p class="checkout-adres-metin">Altunizade Mah. Kısıklı Cad. No:14<br>Üsküdar / İstanbul</p>
        </div>
        <button class="btn btn-outline-gold btn-sm mt-2 w-100" onclick="document.getElementById('checkoutAdresListesi').style.display = 'none'; document.querySelector('.checkout-adres-form-kutu').style.display = 'block';"><i class="bi bi-plus me-1"></i>Farklı Bir Adres Gir</button>
    `;
    adresListesi.style.display = 'block';
    if(formKutu) formKutu.style.display = 'none';
}

function adresSec(element) {
    document.querySelectorAll('.checkout-adres-kart').forEach(k => k.classList.remove('secili'));
    element.classList.add('secili');
}

function yeniAdresiKaydet() {
    bildirimGoster('Yeni adres başarıyla kaydedildi.', 'success');
    checkoutAdresleriDoldur(); 
}

function islemCheckoutAdim() {
    var aktifAdim = document.querySelector('.checkout-step-item.aktif').getAttribute('data-adim');
    
    
    if (aktifAdim == "1") {
        document.getElementById('checkoutAdim1').style.display = 'none';
        document.getElementById('checkoutAdim2').style.display = 'block';
        document.querySelector('.checkout-step-item[data-adim="1"]').classList.replace('aktif', 'tamamlandi');
        document.querySelector('.checkout-step-item[data-adim="2"]').classList.add('aktif');
        document.getElementById('btnCheckoutIleri').innerHTML = '<i class="bi bi-lock-fill me-2"></i>Siparişi Onayla';
    } 
    
    
    else if (aktifAdim == "2") {
        var kartAd = document.getElementById('kartAd');
        var kartNo = document.getElementById('kartNo');
        var kartSkt = document.getElementById('kartSkt');
        var kartCvv = document.getElementById('kartCvv');
        
        var inputs = [kartAd, kartNo, kartSkt, kartCvv];
        var bosAlanVar = false;
        inputs.forEach(inp => { if(inp) inp.style.borderColor = 'var(--gray-mid)'; });

        // 1. Boş Alan Kontrolü
        inputs.forEach(inp => { 
            if(inp && inp.value.trim() === '') {
                inp.style.borderColor = '#c62828';
                bosAlanVar = true;
            }
        });

        if (bosAlanVar) {
            bildirimGoster('Lütfen tüm kart bilgilerini doldurun.', 'error');
            return;
        }

        //  Kart Numarası Kontrolü (16 Hane & Luhn Algoritması)
        var kartNoVal = kartNo.value.replace(/\s/g, '');
        if (kartNoVal.length !== 16 || isNaN(kartNoVal) || /^(.)\1+$/.test(kartNoVal)) {
            kartNo.style.borderColor = '#c62828';
            bildirimGoster('Geçersiz kart numarası!', 'error');
            return;
        }

        var luhnToplam = 0;
        var ciftMi = false;
        for (var i = kartNoVal.length - 1; i >= 0; i--) {
            var rakam = parseInt(kartNoVal.charAt(i), 10);
            if (ciftMi) {
                rakam *= 2;
                if (rakam > 9) rakam -= 9;
            }
            luhnToplam += rakam;
            ciftMi = !ciftMi;
        }
        if (luhnToplam % 10 !== 0) {
            kartNo.style.borderColor = '#c62828';
            bildirimGoster('Geçersiz kart numarası! (Luhn hatası)', 'error');
            return;
        }

       
        var sktVal = kartSkt.value.replace(/\s/g, '').split('/');
        if (sktVal.length !== 2 || sktVal[0].length !== 2 || sktVal[1].length !== 2) {
            kartSkt.style.borderColor = '#c62828';
            bildirimGoster('Geçersiz tarih formatı (AA / YY)', 'error');
            return;
        }

        var ay = parseInt(sktVal[0]), yil = parseInt(sktVal[1]) + 2000;
        var bugun = new Date();
        if (ay < 1 || ay > 12 || yil < bugun.getFullYear() || (yil === bugun.getFullYear() && ay < (bugun.getMonth() + 1))) {
            kartSkt.style.borderColor = '#c62828';
            bildirimGoster('Kartın son kullanma tarihi geçmiş veya geçersiz!', 'error');
            return;
        }

       
        if (kartCvv.value.trim().length !== 3 || isNaN(kartCvv.value.trim())) {
            kartCvv.style.borderColor = '#c62828';
            bildirimGoster('CVV 3 haneli bir rakam olmalıdır.', 'error');
            return;
        }

        
        document.getElementById('checkoutAdim2').style.display = 'none';
        document.querySelector('.checkout-sag-sidebar').style.display = 'none';
        document.getElementById('checkoutAdim3').style.display = 'block';
        document.querySelector('.checkout-step-item[data-adim="2"]').classList.replace('aktif', 'tamamlandi');
        document.querySelector('.checkout-step-item[data-adim="3"]').classList.add('aktif');
        
        
        var sipNoRastgele = Math.floor(10000 + Math.random() * 90000);
        var onaySipNoEl = document.querySelector('.onay-siparis-no');
        if(onaySipNoEl) onaySipNoEl.innerText = '#POS-' + new Date().getFullYear() + '-' + sipNoRastgele;

        sepetTemizle(); 
    }
}

function hesaplaOrtalama(reviews) {
    if (!reviews || reviews.length === 0) return 0;
    var toplam = 0;
    for (var i = 0; i < reviews.length; i++) { toplam += parseInt(reviews[i].rating); }
    return Math.round(toplam / reviews.length);
}

function initTooltips() {
    var tooltipElemanlari = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    for (var i = 0; i < tooltipElemanlari.length; i++) {
        var eskiTooltip = bootstrap.Tooltip.getInstance(tooltipElemanlari[i]);
        if (eskiTooltip) { eskiTooltip.dispose(); }
        new bootstrap.Tooltip(tooltipElemanlari[i]);
    }
}
function uzmanNotuUret(kategori, marka) {
    if (kategori === 'Çanta') {
        if (marka === 'Louis Vuitton') return "Monogram kanvas yüzeyde herhangi bir deformasyon bulunmamaktadır. Köşe biye derilerinde zamana bağlı çok hafif bal rengi (patina) oluşumu gözlemlenmiş olup, donanım parlaklığı ilk günkü gibidir. %100 Orijinallik garantisiyle onaylanmıştır.";
        if (marka === 'Chanel') return "Kapitone dikiş aralıkları ve CC kilit mekanizması marka standartlarıyla birebir uyuşmaktadır. Deri yüzeyinde kuruma veya çizik yoktur, formunu kusursuz korumaktadır.";
        return "Dış yüzey materyali ve iç astar kondisyonu mükemmel durumdadır. Fermuar ve metal donanımlarda oksitlenme yoktur, uzmanlarımızca kondisyonu yüksek bulunmuştur.";
    } 
    else if (kategori === 'Ayakkabı') {
        return "Taban kondisyonu oldukça iyi durumdadır, dış mekanda çok az giyilmiştir. Deri kısımlarda kırılma veya form kaybı gözlemlenmemiştir. Hijyen ve orijinallik kontrollerinden geçmiştir.";
    }
    else if (kategori === 'Eşarp' || kategori === 'Aksesuar') {
        return "İpek dokusunda çekme, iplik kaçması veya leke bulunmamaktadır. Kenar el dikişleri (hand-rolled) tamamen orijinaldir ve formunu korumaktadır.";
    }
    return "Uzmanlarımız tarafından fiziksel kontrolleri sağlanmış olup, donanım, dikiş ve materyal kalitesi marka standartlarına uygundur. Kullanıma bağlı belirgin bir kusuru yoktur.";
}

async function hesapBilgileriniKaydet() {
    if (!aktifKullanici) return;
    
    var yeniAdSoyad = document.getElementById('hesapAdSoyad').value;
    
    if (yeniAdSoyad.trim() === '') {
        bildirimGoster('İsim alanı boş bırakılamır.', 'error');
        return;
    }

    try {
        const res = await fetch('/api/kullanici/guncelle', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                email: aktifKullanici.email, 
                adSoyad: yeniAdSoyad 
            })
        });
        const data = await res.json();
        
        if (data.error) {
            bildirimGoster(data.error, 'error');
        } else {
          
            aktifKullanici.adSoyad = data.ad + ' ' + data.soyad;
            localStorage.setItem('aktifOturum', JSON.stringify(aktifKullanici));
            
           
            navbarGuncelle();
            bildirimGoster('Profil bilgileriniz başarıyla güncellendi.', 'success');
            
            
            var modal = bootstrap.Modal.getInstance(document.getElementById('hesapAyarlariModal'));
            if (modal) modal.hide();
        }
    } catch (err) {
        bildirimGoster('Güncelleme sırasında sunucu bağlantı hatası oluştu.', 'error');
    }
}