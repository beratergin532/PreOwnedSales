package com.preownedsales.api.repository;

import com.preownedsales.api.model.Kullanici;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface KullaniciRepository extends JpaRepository<Kullanici, Integer> {
    
    Optional<Kullanici> findByEmail(String email);
}