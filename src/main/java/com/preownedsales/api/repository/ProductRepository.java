package com.preownedsales.api.repository;

import com.preownedsales.api.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Map;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {
    
    @Query(value = "SELECT p.ProductID as id, p.ProductName as name, p.Price as price, p.ImageUrl as image, " +
                   "b.BrandName as brand, c.CategoryName as category, co.ConditionName as condition " +
                   "FROM Products p " +
                   "LEFT JOIN Brands b ON p.BrandID = b.BrandID " +
                   "LEFT JOIN Categories c ON p.CategoryID = c.CategoryID " +
                   "LEFT JOIN Conditions co ON p.ConditionID = co.ConditionID", nativeQuery = true)
    List<Map<String, Object>> findAllProductsCustom();
}