package com.preownedsales.api.service;

import com.preownedsales.api.model.Kullanici;
import com.preownedsales.api.repository.KullaniciRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class KullaniciService {

    @Autowired
    private KullaniciRepository kullaniciRepository;

    // Yeni kullanıcı kayıt (CRUD - Create)
    public Kullanici kayitEt(Kullanici kullanici) {
        return kullaniciRepository.save(kullanici);
    }

    // Kullanıcı giriş kontrolü (CRUD - Read)
    public Optional<Kullanici> girisYap(String email, String sifre) {
        Optional<Kullanici> kullaniciOpt = kullaniciRepository.findByEmail(email);
        
        if (kullaniciOpt.isPresent() && kullaniciOpt.get().getSifreHash().equals(sifre)) {
            return kullaniciOpt;
        }
        return Optional.empty(); 
    }
    //Profil Güncelleme (CRUD - Update)
    public Optional<Kullanici> profilGuncelle(String email, String yeniAdSoyad, String yeniSifre) {
        Optional<Kullanici> kullaniciOpt = kullaniciRepository.findByEmail(email);
        if (kullaniciOpt.isPresent()) {
            Kullanici k = kullaniciOpt.get();
            
            if (yeniAdSoyad != null && !yeniAdSoyad.trim().isEmpty()) {
                if (yeniAdSoyad.contains(" ")) {
                    k.setAd(yeniAdSoyad.substring(0, yeniAdSoyad.indexOf(" ")).trim());
                    k.setSoyad(yeniAdSoyad.substring(yeniAdSoyad.indexOf(" ") + 1).trim());
                } else {
                    k.setAd(yeniAdSoyad.trim());
                    k.setSoyad("");
                }
            }
            
            if (yeniSifre != null && !yeniSifre.isEmpty()) k.setSifreHash(yeniSifre);
            kullaniciRepository.save(k);
            return Optional.of(k);
        }
        return Optional.empty();
    }
}