
USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'PreOwnedSalesDB')
BEGIN
    ALTER DATABASE PreOwnedSalesDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE PreOwnedSalesDB;
END
GO

CREATE DATABASE PreOwnedSalesDB
    COLLATE Turkish_CI_AS;   
GO

USE PreOwnedSalesDB;
GO

CREATE TABLE Kullanicilar (
    KullaniciID      INT            NOT NULL IDENTITY(1,1),
    Ad               NVARCHAR(50)   NOT NULL,
    Soyad            NVARCHAR(50)   NOT NULL,
    Email            NVARCHAR(150)  NOT NULL,
    SifreHash        NVARCHAR(256)  NOT NULL,   
    Telefon          NVARCHAR(20)   NULL,
    Adres            NVARCHAR(500)  NULL,
    KayitTarihi      DATETIME2      NOT NULL DEFAULT GETDATE(),
    SonGirisTarihi   DATETIME2      NULL,
    AktifMi          BIT            NOT NULL DEFAULT 1,
    Rol              NVARCHAR(20)   NOT NULL DEFAULT 'Musteri'   
        CONSTRAINT CHK_Kullanici_Rol CHECK (Rol IN ('Admin', 'Musteri')),

    CONSTRAINT PK_Kullanicilar PRIMARY KEY (KullaniciID),
    CONSTRAINT UQ_Kullanicilar_Email UNIQUE (Email)
);
GO

CREATE TABLE Urunler (
    UrunID           INT             NOT NULL IDENTITY(1,1),
    UrunAdi          NVARCHAR(200)   NOT NULL,
    Marka            NVARCHAR(100)   NOT NULL,
    Model            NVARCHAR(100)   NULL,
    Kategori         NVARCHAR(50)    NOT NULL,   
    Fiyat            DECIMAL(12,2)   NOT NULL,
    Aciklama         NVARCHAR(MAX)   NULL,
    GorselURL        NVARCHAR(500)   NULL,
    EklenmeTarihi    DATETIME2       NOT NULL DEFAULT GETDATE(),
    Durum            NVARCHAR(20)    NOT NULL DEFAULT 'Aktif'
        CONSTRAINT CHK_Urun_Durum CHECK (Durum IN ('Aktif', 'Satildi', 'Arsivde')),
    SaticiID         INT             NOT NULL,   

    CONSTRAINT PK_Urunler PRIMARY KEY (UrunID),
    CONSTRAINT FK_Urunler_Satici FOREIGN KEY (SaticiID)
        REFERENCES Kullanicilar(KullaniciID)
);
GO

CREATE NONCLUSTERED INDEX IX_Urunler_Marka
    ON Urunler (Marka)
    INCLUDE (UrunAdi, Fiyat, Durum);

CREATE NONCLUSTERED INDEX IX_Urunler_Kategori_Fiyat
    ON Urunler (Kategori, Fiyat)
    INCLUDE (UrunAdi, Marka, Durum);

CREATE NONCLUSTERED INDEX IX_Urunler_Durum
    ON Urunler (Durum)
    INCLUDE (UrunID, UrunAdi, Marka, Fiyat);

CREATE NONCLUSTERED INDEX IX_Urunler_EklenmeTarihi
    ON Urunler (EklenmeTarihi DESC);
GO

CREATE TABLE EkspertizDetay (
    EkspertizID      INT            NOT NULL IDENTITY(1,1),
    UrunID           INT            NOT NULL,       
    EkspertizTarihi  DATETIME2      NOT NULL DEFAULT GETDATE(),
    EkspertizFirmasi NVARCHAR(100)  NOT NULL,
    Uzman            NVARCHAR(100)  NOT NULL,
    OrijinallikNotu  NVARCHAR(MAX)  NULL,
    FizikselDurum    NVARCHAR(20)   NOT NULL
        CONSTRAINT CHK_Ekspertiz_Durum CHECK (FizikselDurum IN (
            'Mint', 'Cok Iyi', 'Iyi', 'Orta', 'Yıpranmış'
        )),
    EkspertizPuani   TINYINT        NOT NULL
        CONSTRAINT CHK_Ekspertiz_Puan CHECK (EkspertizPuani BETWEEN 1 AND 10),
    BelgeDosyaURL    NVARCHAR(500)  NULL,

    CONSTRAINT PK_EkspertizDetay PRIMARY KEY (EkspertizID),
    CONSTRAINT FK_Ekspertiz_Urun FOREIGN KEY (UrunID)
        REFERENCES Urunler(UrunID) ON DELETE CASCADE,
    CONSTRAINT UQ_Ekspertiz_Urun UNIQUE (UrunID)   
);
GO

CREATE TABLE Siparisler (
    SiparisID        INT            NOT NULL IDENTITY(1,1),
    KullaniciID      INT            NOT NULL,
    SiparisTarihi    DATETIME2      NOT NULL DEFAULT GETDATE(),
    ToplamTutar      DECIMAL(12,2)  NOT NULL,
    SiparisDurumu    NVARCHAR(20)   NOT NULL DEFAULT 'Beklemede'
        CONSTRAINT CHK_Siparis_Durum CHECK (SiparisDurumu IN (
            'Beklemede', 'OdemeBekleniyor', 'Onaylandi',
            'Kargoda', 'Teslim Edildi', 'Iptal', 'Iade'
        )),
    OdemeTuru        NVARCHAR(30)   NOT NULL DEFAULT 'KrediKarti',
    TeslimatAdresi   NVARCHAR(500)  NOT NULL,
    KargoTakipNo     NVARCHAR(100)  NULL,
    Notlar           NVARCHAR(MAX)  NULL,

    CONSTRAINT PK_Siparisler PRIMARY KEY (SiparisID),
    CONSTRAINT FK_Siparis_Kullanici FOREIGN KEY (KullaniciID)
        REFERENCES Kullanicilar(KullaniciID)
);
GO

CREATE TABLE SiparisDetay (
    SiparisDetayID   INT            NOT NULL IDENTITY(1,1),
    SiparisID        INT            NOT NULL,
    UrunID           INT            NOT NULL,
    BirimFiyat       DECIMAL(12,2)  NOT NULL,   
    Miktar           TINYINT        NOT NULL DEFAULT 1,
        CONSTRAINT CHK_SiparisDetay_Miktar CHECK (Miktar >= 1),

    CONSTRAINT PK_SiparisDetay PRIMARY KEY (SiparisDetayID),
    CONSTRAINT FK_SiparisDetay_Siparis FOREIGN KEY (SiparisID)
        REFERENCES Siparisler(SiparisID) ON DELETE CASCADE,
    CONSTRAINT FK_SiparisDetay_Urun FOREIGN KEY (UrunID)
        REFERENCES Urunler(UrunID),
    CONSTRAINT UQ_SiparisDetay_UrunPerSiparis UNIQUE (SiparisID, UrunID)
);
GO

CREATE TABLE DijitalSertifikalar (
    SertifikaID      INT            NOT NULL IDENTITY(1,1),
    UrunID           INT            NOT NULL,        
    KullaniciID      INT            NOT NULL,        
    SiparisID        INT            NOT NULL,
    SertifikaKodu    NVARCHAR(50)   NOT NULL,        
    OlusturmaTarihi  DATETIME2      NOT NULL DEFAULT GETDATE(),
    QRKodu           NVARCHAR(MAX)  NULL,            
    SertifikaDurumu  NVARCHAR(20)   NOT NULL DEFAULT 'Aktif'
        CONSTRAINT CHK_Sertifika_Durum CHECK (SertifikaDurumu IN ('Aktif', 'Iptal', 'Devredildi')),
    AktifMi          BIT            NOT NULL DEFAULT 1,

    CONSTRAINT PK_DijitalSertifikalar PRIMARY KEY (SertifikaID),
    CONSTRAINT FK_Sertifika_Urun FOREIGN KEY (UrunID)
        REFERENCES Urunler(UrunID),
    CONSTRAINT FK_Sertifika_Kullanici FOREIGN KEY (KullaniciID)
        REFERENCES Kullanicilar(KullaniciID),
    CONSTRAINT FK_Sertifika_Siparis FOREIGN KEY (SiparisID)
        REFERENCES Siparisler(SiparisID),
    CONSTRAINT UQ_Sertifika_Urun UNIQUE (UrunID),   
    CONSTRAINT UQ_Sertifika_Kod UNIQUE (SertifikaKodu)
);
GO

CREATE OR ALTER PROCEDURE sp_SiparisOlustur
    @KullaniciID     INT,
    @UrunIDList      NVARCHAR(MAX),    
    @TeslimatAdresi  NVARCHAR(500),
    @OdemeTuru       NVARCHAR(30) = 'KrediKarti'
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;   

    DECLARE @YeniSiparisID  INT;
    DECLARE @ToplamTutar    DECIMAL(12,2) = 0;
    DECLARE @HataMesaji     NVARCHAR(500);

    CREATE TABLE #GeciciUrunler (UrunID INT);

    INSERT INTO #GeciciUrunler (UrunID)
    SELECT value FROM STRING_SPLIT(@UrunIDList, ',') WHERE LTRIM(RTRIM(value)) <> '';

    BEGIN TRY
        BEGIN TRANSACTION;

        
        IF NOT EXISTS (SELECT 1 FROM Kullanicilar WHERE KullaniciID = @KullaniciID AND AktifMi = 1)
        BEGIN
            RAISERROR('Geçersiz veya pasif kullanıcı.', 16, 1);
            RETURN;
        END

        
        IF EXISTS (
            SELECT 1 FROM #GeciciUrunler gu
            LEFT JOIN Urunler u ON gu.UrunID = u.UrunID
            WHERE u.UrunID IS NULL OR u.Durum <> 'Aktif'
        )
        BEGIN
            RAISERROR('Bir veya daha fazla ürün mevcut değil ya da satışta değil.', 16, 1);
            RETURN;
        END

        SELECT @ToplamTutar = SUM(u.Fiyat)
        FROM Urunler u WITH (UPDLOCK, ROWLOCK)
        INNER JOIN #GeciciUrunler gu ON u.UrunID = gu.UrunID;

       
        INSERT INTO Siparisler (KullaniciID, ToplamTutar, SiparisDurumu, OdemeTuru, TeslimatAdresi)
        VALUES (@KullaniciID, @ToplamTutar, 'Onaylandi', @OdemeTuru, @TeslimatAdresi);

        SET @YeniSiparisID = SCOPE_IDENTITY();

        
        INSERT INTO SiparisDetay (SiparisID, UrunID, BirimFiyat, Miktar)
        SELECT @YeniSiparisID, gu.UrunID, u.Fiyat, 1
        FROM #GeciciUrunler gu
        INNER JOIN Urunler u ON gu.UrunID = u.UrunID;

      
        UPDATE Urunler
        SET Durum = 'Satildi'
        WHERE UrunID IN (SELECT UrunID FROM #GeciciUrunler);

        COMMIT TRANSACTION;

        SELECT
            s.SiparisID,
            s.KullaniciID,
            s.ToplamTutar,
            s.SiparisDurumu,
            s.SiparisTarihi,
            COUNT(sd.SiparisDetayID) AS UrunSayisi
        FROM Siparisler s
        INNER JOIN SiparisDetay sd ON s.SiparisID = sd.SiparisID
        WHERE s.SiparisID = @YeniSiparisID
        GROUP BY s.SiparisID, s.KullaniciID, s.ToplamTutar, s.SiparisDurumu, s.SiparisTarihi;

        PRINT 'Sipariş başarıyla oluşturuldu. SiparisID: ' + CAST(@YeniSiparisID AS NVARCHAR);

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        SET @HataMesaji = 'HATA [' + CAST(ERROR_NUMBER() AS NVARCHAR) + ']: ' + ERROR_MESSAGE();
        RAISERROR(@HataMesaji, 16, 1);
    END CATCH

    DROP TABLE IF EXISTS #GeciciUrunler;
END;
GO

CREATE OR ALTER TRIGGER tg_DijitalSertifikaOlustur
ON SiparisDetay
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO DijitalSertifikalar
        (UrunID, KullaniciID, SiparisID, SertifikaKodu, SertifikaDurumu, AktifMi)
    SELECT
        i.UrunID,
        s.KullaniciID,
        i.SiparisID,

        'POS-' + CAST(YEAR(GETDATE()) AS NVARCHAR) + '-' +
            UPPER(LEFT(REPLACE(CAST(NEWID() AS NVARCHAR(36)), '-', ''), 8)),
        'Aktif',
        1
    FROM inserted i
    INNER JOIN Siparisler s ON i.SiparisID = s.SiparisID
    
    WHERE NOT EXISTS (
        SELECT 1 FROM DijitalSertifikalar d
        WHERE d.UrunID = i.UrunID
    );
END;
GO


INSERT INTO Kullanicilar (Ad, Soyad, Email, SifreHash, Rol)
VALUES (N'Admin', N'PreOwnedSales', 'admin@preownedsales.com',
        '$argon2id$v=19$m=65536,t=3,p=4$EXAMPLE_HASH', 'Admin');

INSERT INTO Kullanicilar (Ad, Soyad, Email, SifreHash, Telefon, Adres)
VALUES (N'Ayşe', N'Kaya', 'ayse@example.com',
        '$argon2id$v=19$m=65536,t=3,p=4$EXAMPLE_HASH2',
        '+90 532 000 0001', N'Nişantaşı, İstanbul');

INSERT INTO Urunler (UrunAdi, Marka, Model, Kategori, Fiyat, Aciklama, SaticiID)
VALUES
(N'Timeless Flap Bag', 'Chanel', N'Classic Medium', 'Canta',  85000.00,
 N'2021 model, full set, kart dahil. Deri: Siyah Lambskin.', 1),
(N'Monogram Speedy 30',  'Louis Vuitton', 'Speedy 30', 'Canta', 22000.00,
 N'2020 model, az kullanılmış. Monogram canvas, hakiki deri trim.', 1),
(N'Royal Oak 15400',     'Audemars Piguet', 'Royal Oak', 'Saat', 420000.00,
 N'2019 üretim, servis görmüş, box & papers tam.', 1);

INSERT INTO EkspertizDetay (UrunID, EkspertizFirmasi, Uzman, OrijinallikNotu, FizikselDurum, EkspertizPuani)
VALUES
(1, N'LuxVerify Istanbul', N'Merve Çelik',
 N'Orijinallik doğrulandı. Seri numarası Chanel kayıtlarıyla eşleşmektedir.', 'Cok Iyi', 9),
(2, N'LuxVerify Istanbul', N'Merve Çelik',
 N'Orijinallik doğrulandı. Küçük köşe aşınması mevcut.', 'Iyi', 8),
(3, N'Swiss Time Expert', N'Ahmet Yılmaz',
 N'Tamamen orijinal. AP servis geçmişi mevcuttur. Hareket mükemmel.', 'Mint', 10);

EXEC sp_SiparisOlustur
    @KullaniciID    = 2,
    @UrunIDList     = '2',
    @TeslimatAdresi = N'Nişantaşı Mah. Abdi İpekçi Cad. No:1 Şişli/İstanbul',
    @OdemeTuru      = 'KrediKarti';

SELECT 'Kullanicilar' AS Tablo, COUNT(*) AS Kayit FROM Kullanicilar
UNION ALL
SELECT 'Urunler',           COUNT(*) FROM Urunler
UNION ALL
SELECT 'EkspertizDetay',    COUNT(*) FROM EkspertizDetay
UNION ALL
SELECT 'Siparisler',        COUNT(*) FROM Siparisler
UNION ALL
SELECT 'SiparisDetay',      COUNT(*) FROM SiparisDetay
UNION ALL
SELECT 'DijitalSertifikalar', COUNT(*) FROM DijitalSertifikalar;
GO
