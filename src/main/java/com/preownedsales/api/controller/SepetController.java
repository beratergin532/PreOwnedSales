package com.preownedsales.api.controller;

import com.preownedsales.api.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/sepet")
@CrossOrigin(origins = "*")
public class SepetController {

    @Autowired
    private ProductRepository productRepository;

    private static final Map<Integer, List<Map<String, Object>>> sepetHafizasi = new ConcurrentHashMap<>();
    private static final AtomicInteger cartItemIdGenerator = new AtomicInteger(1);

    @GetMapping("/{customerId}")
    public List<Map<String, Object>> getSepet(@PathVariable Integer customerId) {
        return sepetHafizasi.computeIfAbsent(customerId, k -> new ArrayList<>());
    }

    @PostMapping("/ekle")
    public List<Map<String, Object>> sepeteEkle(@RequestBody Map<String, Object> request) {
        try {
            Integer customerId = request.get("customerId") != null ? Integer.parseInt(request.get("customerId").toString()) : null;
            Integer productId = request.get("productId") != null ? Integer.parseInt(request.get("productId").toString()) : null;

            if (customerId != null && productId != null) {
                
                List<Map<String, Object>> tumUrunler = productRepository.findAllProductsCustom();
                Map<String, Object> secilenUrun = null;

                for (Map<String, Object> urun : tumUrunler) {
                 
                    Object dbIdObj = urun.get("id") != null ? urun.get("id") : urun.get("ID");
                    if (dbIdObj != null) {
                        Integer mevcutId = Integer.parseInt(dbIdObj.toString());
                        if (mevcutId.equals(productId)) {
                            secilenUrun = urun;
                            break;
                        }
                    }
                }

                if (secilenUrun != null) {
                    Map<String, Object> cartItem = new HashMap<>();
                    cartItem.put("cartItemId", cartItemIdGenerator.getAndIncrement());
                    cartItem.put("productId", productId);
                    
                    
                    cartItem.put("name", secilenUrun.get("name") != null ? secilenUrun.get("name") : secilenUrun.get("NAME"));
                    cartItem.put("price", secilenUrun.get("price") != null ? secilenUrun.get("price") : secilenUrun.get("PRICE"));
                    cartItem.put("image", secilenUrun.get("image") != null ? secilenUrun.get("image") : secilenUrun.get("IMAGE"));
                    
                    List<Map<String, Object>> sepet = sepetHafizasi.computeIfAbsent(customerId, k -> new ArrayList<>());
                    sepet.add(cartItem);
                    return sepet; 
                }
            }
        } catch (Exception e) {
            System.out.println("Sepete eklerken bir sorun oluştu: " + e.getMessage());
        }
    
        Integer safeId = request.get("customerId") != null ? Integer.parseInt(request.get("customerId").toString()) : 0;
        return sepetHafizasi.getOrDefault(safeId, new ArrayList<>());
    }

    @DeleteMapping("/sil/{cartItemId}")
    public void sepettenCikar(@PathVariable Integer cartItemId) {
        for (List<Map<String, Object>> sepet : sepetHafizasi.values()) {
            sepet.removeIf(item -> cartItemId.equals(item.get("cartItemId")));
        }
    }

    @DeleteMapping("/temizle/{customerId}")
    public void sepetiTemizle(@PathVariable Integer customerId) {
        sepetHafizasi.put(customerId, new ArrayList<>());
    }
}