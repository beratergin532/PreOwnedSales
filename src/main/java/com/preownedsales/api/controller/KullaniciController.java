package com.preownedsales.api.controller;

import com.preownedsales.api.model.Kullanici;
import com.preownedsales.api.service.KullaniciService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class KullaniciController {

    @Autowired
    private KullaniciService kullaniciService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Kullanici yeniKullanici = new Kullanici();
            String adSoyad = request.get("adSoyad");
            if (adSoyad != null && adSoyad.contains(" ")) {
                yeniKullanici.setAd(adSoyad.substring(0, adSoyad.indexOf(" ")).trim());
                yeniKullanici.setSoyad(adSoyad.substring(adSoyad.indexOf(" ") + 1).trim());
            } else if (adSoyad != null) {
                yeniKullanici.setAd(adSoyad.trim());
                yeniKullanici.setSoyad("");
            } else {
                yeniKullanici.setAd("İsim");
                yeniKullanici.setSoyad("Soyisim");
            }
            yeniKullanici.setEmail(request.get("email"));
            yeniKullanici.setSifreHash(request.get("sifre")); 

            kullaniciService.kayitEt(yeniKullanici);
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        String email = request.get("email");
        String sifre = request.get("sifre");

        Optional<Kullanici> kullaniciOpt = kullaniciService.girisYap(email, sifre);

        if (kullaniciOpt.isPresent()) {
            Kullanici k = kullaniciOpt.get();
            response.put("id", k.getId());
            response.put("ad", k.getAd());
            response.put("soyad", k.getSoyad());
            response.put("Email", k.getEmail());
            return ResponseEntity.ok(response);
        } else {
            response.put("error", "E-posta veya şifre hatalı.");
            return ResponseEntity.status(401).body(response);
        }
    }

    // CRUD - UPDATE: Kullanıcı profil güncelleme
    @PostMapping("/kullanici/guncelle")
    public ResponseEntity<?> profilGuncelle(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            String email = request.get("email");
            String yeniAdSoyad = request.get("adSoyad");

            
            Optional<Kullanici> guncellenen = kullaniciService.profilGuncelle(email, yeniAdSoyad, null);

            if (guncellenen.isPresent()) {
                Kullanici k = guncellenen.get();
                response.put("success", true);
                response.put("ad", k.getAd());
                response.put("soyad", k.getSoyad());
                return ResponseEntity.ok(response);
            } else {
                response.put("error", "Kullanıcı profil bilgisi güncellenemedi.");
                return ResponseEntity.status(404).body(response);
            }
        } catch (Exception e) {
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}