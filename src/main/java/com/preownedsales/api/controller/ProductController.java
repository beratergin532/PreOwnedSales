package com.preownedsales.api.controller;

import com.preownedsales.api.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") 
public class ProductController {

    @Autowired
    private ProductService productService;

    
    @GetMapping("/urunler")
    public List<Map<String, Object>> getUrunler() {
        return productService.getAllProductsWithDetails();
    }
}