# PreOwnedSales — Full-Stack E-Ticaret Portfolyo Projesi 💎

Bu proje, lüks ikinci el ürünlerin güvenli satışı ve dijital orijinallik sertifikasyonu mantığı üzerine kurgulanmış bir **e-ticaret Proof-of-Concept (Kavram Kanıtı)** çalışmasıdır. 

İnternet ve Web Programlama ile İleri Java derslerindeki akademik gelişim sürecimi yansıtması amacıyla geliştirilmiştir. Gömülü frontend arayüzü, **Java Spring Boot API** backend katmanı ve ilişkisel **MS SQL Server** veritabanı altyapısıyla bütünleşik (Full-Stack) bir yapı sunar.

> 🎯 **Projenin Amacı:** Bir e-ticaret sisteminin arayüzden veritabanı tetikleyicilerine kadar uzanan tüm veri akışını yönetmek, çoklu iş parçacığı (multi-threading) ortamında güvenli sepet yönetimini deneyimlemek ve veritabanı seviyesinde optimizasyon yöntemlerini (T-SQL) uygulamaktır.

---

## 🛠️ Uygulanan Mühendislik ve Tasarım Çözümleri

### 1. Backend & Mimari (Java Spring Boot)
* **Thread-Safe Bellek Yönetimi:** Dinamik sepet operasyonlarında veri tutarlılığını sağlamak ve olası yarış durumlarının (race conditions) önüne geçmek amacıyla Spring Boot katmanında `ConcurrentHashMap` ve `AtomicInteger` yapıları kullanılmıştır.
* **Göreceli (Relative) API Entegrasyonu:** Ön yüzde kullanılan JavaScript Fetch mekanizması ile Java REST denetleyicileri (`RestController`) arasındaki veri köprüleri entegre edilmiştir.

### 2. Veritabanı Tasarımı & İş Mantığı (MS SQL Server / T-SQL)
* **İlişkisel Veri Modeli:** Kullanıcı, Ürün, Ekspertiz Kartı, Sipariş ve Sertifika tabloları arasında Foreign Key ilişkileri kurularak tutarlı bir şema kurgulanmıştır.
* **Transaction ve Stored Procedure:** Sipariş oluşturma, stok kontrolü ve ürün durumunu "Satıldı" olarak güncelleme adımları, veri bütünlüğünü (ACID) korumak adına tek bir `BEGIN TRANSACTION / COMMIT` bloğu içerisinde `sp_SiparisOlustur` prosedürü ile yönetilmiştir.
* **Otomasyon (Trigger):** `SiparisDetay` tablosuna başarılı bir satın alım kaydı girdiğinde tetiklenen `tg_DijitalSertifikaOlustur` tetikleyicisi, arka planda otomatik olarak `NEWID()` tabanlı benzersiz bir kriptografik sertifika kodu üretir.
* **Sorgu Performansı (İndeksleme):** Marka ve kategori bazlı filtreleme operasyonlarının maliyetini optimize etmek amacıyla ilgili kolonlar üzerinde `NONCLUSTERED INDEX` yapıları kurgulanmıştır.

---

## 💻 Kullanılan Teknolojiler
* **Frontend:** HTML5, CSS3, Bootstrap 5, Vanilla JavaScript (Fetch API)
* **Backend:** Java 21, Spring Boot, Spring Data JPA, Lombok
* **Veritabanı:** Microsoft SQL Server (T-SQL, Stored Procedures, Triggers, Non-Clustered Indexes)

---

### 💡 Mühendislik Notu
*Bu proje ticari bir product olma amacından ziyade, lisans eğitimimin 3. yılı sonunda edindiğim kurumsal yazılım geliştirme, ilişkisel veritabanı programlama ve veri akışı yönetimi yetkinliklerimi sergilemek üzere hazırlanmış başarılı bir mühendislik prototipidir.*

---

# PreOwnedSales — Full-Stack E-Commerce Portfolio Project 💎

This project is an e-commerce **Proof-of-Concept (PoC)** focused on the secure resale and digital authenticity certification of luxury second-hand items. 

Developed to showcase my academic progress across Internet & Web Programming and Advanced Java courses, the platform features an embedded frontend interface, a **Java Spring Boot API** backend, and a relational **MS SQL Server** database layer to deliver a cohesive Full-Stack architecture[cite: 1, 2, 4].

> 🎯 **Project Goal:** To implement and manage end-to-end data flow from the user interface down to database triggers, ensure thread-safe shopping cart state management in concurrent environments, and apply database-level optimization strategies (T-SQL)[cite: 2, 4].

---

## 🛠️ Implemented Engineering & Architecture Solutions

### 1. Backend & Architecture (Java Spring Boot)
* **Thread-Safe State Management:** Utilized enterprise Java structures like `ConcurrentHashMap` and `AtomicInteger` within the Spring Boot layer to prevent race conditions and maintain data consistency during dynamic cart operations[cite: 2].
* **Relative API Integration:** Integrated custom front-end JavaScript Fetch pipelines natively with Java `RestController` endpoints to handle asynchronous web requests cleanly without hardcoded domain bindings[cite: 2].

### 2. Database Design & Business Logic (MS SQL Server / T-SQL)
* **Relational Schema:** Designed a normalized schema establishing explicit Foreign Key constraints across Users, Products, Expertise Details, Orders, and Digital Certificates[cite: 4].
* **Transactional Stored Procedures:** Enveloped complex order placement, stock verification, and product state updates inside a robust database-level `BEGIN TRANSACTION / COMMIT` block via `sp_SiparisOlustur` to guarantee strict ACID compliance[cite: 4].
* **Automated Logic (Triggers):** Implemented an `AFTER INSERT` database trigger (`tg_DijitalSertifikaOlustur`) that fires immediately upon successful order details insertion, automatically generating a unique cryptographic authenticity certificate utilizing MS SQL's `NEWID()`[cite: 4].
* **Query Optimization (Indexing):** Structured `NONCLUSTERED INDEX` patterns on highly queried fields like Brand and Category to drastically optimize lookup performance and reduce server cost[cite: 4].

---

## 💻 Tech Stack
* **Frontend:** HTML5, CSS3, Bootstrap 5, Vanilla JavaScript (Fetch API)[cite: 1, 2]
* **Backend:** Java 21, Spring Boot, Spring Data JPA, Lombok[cite: 2, 4]
* **Database:** Microsoft SQL Server (T-SQL, Stored Procedures, Triggers, Non-Clustered Indexes)[cite: 4]

---

### 💡 Engineering Note
*This repository serves as a technical engineering prototype demonstrating my proficiency in enterprise backend engineering, relational database programming, and full-stack data orchestration achieved by the end of my 3rd year in Software Engineering.*
