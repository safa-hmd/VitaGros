package com.awd.produit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@EnableDiscoveryClient
@SpringBootApplication
public class ProduitApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProduitApplication.class, args);
    }
}
