package com.preownedsales.api.model;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "Products")

public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ProductID")
    private Integer id;

    @Column(name = "ProductName", nullable = false, length = 150)
    private String name;

    @Column(name = "Price", nullable = false)
    private BigDecimal price;

    @Column(name = "ImageUrl", length = Integer.MAX_VALUE)
    private String image;

    @Column(name = "BrandID")
    private Integer brandId;

    @Column(name = "CategoryID")
    private Integer categoryId;

    @Column(name = "ConditionID")
    private Integer conditionId;
    
}
