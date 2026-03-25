package com.alhashimi.ai.chat.user;

import com.alhashimi.ai.chat.role.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, passwordEncoder);
    }

    private User buildUser(UUID id, String username, String email, Role role) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword("encoded");
        user.setRole(role);
        user.setEnabled(true);
        user.setForcePasswordChange(true);
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());
        return user;
    }

    @Test
    void createUser_withValidRequest_savesAndReturnsUserResponse() {
        CreateUserRequest request = new CreateUserRequest(
                "john", "john@example.com", "password123", Role.USER);

        when(userRepository.existsByUsername("john")).thenReturn(false);
        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");

        UUID savedId = UUID.randomUUID();
        User savedUser = buildUser(savedId, "john", "john@example.com", Role.USER);
        savedUser.setPassword("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        UserResponse response = userService.createUser(request);

        assertThat(response.username()).isEqualTo("john");
        assertThat(response.email()).isEqualTo("john@example.com");
        assertThat(response.role()).isEqualTo(Role.USER);
        assertThat(response.forcePasswordChange()).isTrue();

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User captured = captor.getValue();
        assertThat(captured.getPassword()).isEqualTo("encodedPassword");
        assertThat(captured.isForcePasswordChange()).isTrue();
    }

    @Test
    void createUser_withDuplicateUsername_throwsUsernameAlreadyExistsException() {
        CreateUserRequest request = new CreateUserRequest(
                "john", "john@example.com", "password123", Role.USER);

        when(userRepository.existsByUsername("john")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(UsernameAlreadyExistsException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void createUser_withDuplicateEmail_throwsEmailAlreadyExistsException() {
        CreateUserRequest request = new CreateUserRequest(
                "john", "john@example.com", "password123", Role.USER);

        when(userRepository.existsByUsername("john")).thenReturn(false);
        when(userRepository.existsByEmail("john@example.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(EmailAlreadyExistsException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void getUser_withValidId_returnsUserResponse() {
        UUID id = UUID.randomUUID();
        User user = buildUser(id, "alice", "alice@example.com", Role.MODERATOR);

        when(userRepository.findById(id)).thenReturn(Optional.of(user));

        UserResponse response = userService.getUser(id);

        assertThat(response.id()).isEqualTo(id);
        assertThat(response.username()).isEqualTo("alice");
        assertThat(response.role()).isEqualTo(Role.MODERATOR);
    }

    @Test
    void getUser_withInvalidId_throwsUserNotFoundException() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUser(id))
                .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void listUsers_returnsPaginatedUserPage() {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        List<User> users = List.of(
                buildUser(id1, "user1", "user1@example.com", Role.USER),
                buildUser(id2, "user2", "user2@example.com", Role.USER)
        );
        Page<User> page = new PageImpl<>(users, PageRequest.of(0, 20), 2);

        when(userRepository.findAll(any(Pageable.class))).thenReturn(page);

        UserPage result = userService.listUsers(0, 20);

        assertThat(result.content()).hasSize(2);
        assertThat(result.page()).isEqualTo(0);
        assertThat(result.size()).isEqualTo(20);
        assertThat(result.totalElements()).isEqualTo(2);
        assertThat(result.totalPages()).isEqualTo(1);
    }

    @Test
    void updateUser_withValidRequest_updatesFields() {
        UUID id = UUID.randomUUID();
        User user = buildUser(id, "bob", "bob@example.com", Role.USER);

        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserRequest request = new UpdateUserRequest(Role.MODERATOR, "newemail@example.com", false, "https://linkedin.com/in/bob");

        UserResponse response = userService.updateUser(id, request);

        assertThat(response.role()).isEqualTo(Role.MODERATOR);
        assertThat(response.email()).isEqualTo("newemail@example.com");
        assertThat(response.enabled()).isFalse();
        assertThat(response.linkedinUrl()).isEqualTo("https://linkedin.com/in/bob");
    }

    @Test
    void deleteUser_withValidId_deletesUser() {
        UUID id = UUID.randomUUID();
        User user = buildUser(id, "carol", "carol@example.com", Role.USER);

        when(userRepository.findById(id)).thenReturn(Optional.of(user));

        userService.deleteUser(id);

        verify(userRepository).delete(user);
    }
}
