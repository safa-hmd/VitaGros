package com.awd.user.security;

import com.awd.user.entity.Role;
import com.awd.user.entity.User;
import com.awd.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(request);

        String provider = request.getClientRegistration().getRegistrationId(); // google | github
        String email = oAuth2User.getAttribute("email");
        if (email == null) {
            email = oAuth2User.getAttribute("login") + "@" + provider + ".local";
        }

        String firstname;
        String lastname;
        if ("google".equals(provider)) {
            firstname = oAuth2User.getAttribute("given_name");
            lastname = oAuth2User.getAttribute("family_name");
        } else {
            String fullName = oAuth2User.getAttribute("name");
            if (fullName == null || fullName.isBlank()) {
                fullName = oAuth2User.getAttribute("login");
            }
            String[] parts = fullName.trim().split("\\s+", 2);
            firstname = parts[0];
            lastname = parts.length > 1 ? parts[1] : "-";
        }
        if (firstname == null || firstname.isBlank()) firstname = "-";
        if (lastname == null || lastname.isBlank()) lastname = "-";

        final String finalEmail = email;
        final String fn = firstname;
        final String ln = lastname;

        userRepository.findByEmail(finalEmail).orElseGet(() -> {
            User u = new User();
            u.setFirstname(fn);
            u.setLastname(ln);
            u.setEmail(finalEmail);
            u.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            u.setRole(Role.USER);
            return userRepository.save(u);
        });

        return oAuth2User;
    }
}