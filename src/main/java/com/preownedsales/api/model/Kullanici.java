package com.preownedsales.api.model;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "Kullanicilar")

public class Kullanici {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "KullaniciID")
    private Integer id;

    @Column(name = "Ad", nullable = false, length = 50)
    private String ad;

    @Column(name = "Soyad", nullable = false, length = 50)
    private String soyad;

    @Column(name = "Email", nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "SifreHash", nullable = false, length = 256)
    private String sifreHash;

    @Column(name = "Telefon", length = 20)
    private String telefon;

    @Column(name = "KayitTarihi", updatable = false)
    private LocalDateTime kayitTarihi = LocalDateTime.now();
    
}
