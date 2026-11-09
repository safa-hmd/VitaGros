
package com.awd.livraison.dto;

import java.time.LocalDate;

public record OrderDTO(
        Long id,
        Long userId,
        LocalDate orderDate,
        String status
) {
}
