package com.awd.user.repository;

import com.awd.user.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findFirstByEmailIgnoreCase(String email);
}
