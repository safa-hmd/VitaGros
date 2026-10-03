package com.awd.user.controller;

import com.awd.user.entity.Role;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Arrays;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/roles")
@Tag(name = "Role")
public class RoleController {

    @GetMapping
    public List<Role> list() {
        return Arrays.asList(Role.values());
    }
}
