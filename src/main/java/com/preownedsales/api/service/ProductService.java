package com.preownedsales.api.service;

import com.preownedsales.api.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    public List<Map<String, Object>> getAllProductsWithDetails() {
        return productRepository.findAllProductsCustom();
    }
}