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
                "john", "john@example.com","John", "Doe", "password123", Role.USER);

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
                "john", "john@example.com", "John", "Doe", "password123", Role.USER);

        when(userRepository.existsByUsername("john")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(UsernameAlreadyExistsException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void createUser_withDuplicateEmail_throwsEmailAlreadyExistsException() {
        CreateUserRequest request = new CreateUserRequest(
                "john", "john@example.com", "John", "Doe", "password123", Role.USER);

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
        User user = buildUser(id1, "user1", "user1@example.com", Role.USER);
        Page<User> userPage = new PageImpl<>(List.of(user), PageRequest.of(0, 20), 1);

        when(userRepository.findAll(any(Pageable.class))).thenReturn(userPage);

        Page<UserResponse> result = userService.listUsers(0, 20);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    @Test
    void updateUser_withValidRequest_updatesFields() {
        UUID id = UUID.randomUUID();
        User user = buildUser(id, "bob", "bob@example.com", Role.USER);

        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserRequest request = new UpdateUserRequest(null, Role.MODERATOR, "newemail@example.com", null, null, false, "https://linkedin.com/in/bob");

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

    @Test
    void updateAvatar_withValidId_setsProfilePicturePathAndSaves() {
        UUID id = UUID.randomUUID();
        User user = User.builder().username("john").email("john@example.com")
            .password("encoded").role(Role.USER).build();
        user.setId(id);
        String newPath = "/uploads/avatars/john.jpg";

        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserResponse response = userService.updateAvatar(id, newPath);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getProfilePicturePath()).isEqualTo(newPath);
    }

    @Test
    void resetPassword_withValidRequest_encodesPasswordAndSetsFlag() {
        UUID id = UUID.randomUUID();
        User user = new User();
        user.setId(id);
        ResetPasswordRequest request = new ResetPasswordRequest("newPassword123");

        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newPassword123")).thenReturn("encodedNewPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);

        userService.resetPassword(id, request);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getPassword()).isEqualTo("encodedNewPassword");
        assertThat(captor.getValue().isForcePasswordChange()).isTrue();
    }

    @Test
    void resetPassword_withInvalidUserId_throwsUserNotFoundException() {
        UUID id = UUID.randomUUID();
        ResetPasswordRequest request = new ResetPasswordRequest("newPassword123");

        when(userRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.resetPassword(id, request))
                .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void updateUser_withPartialRequest_onlyUpdatesNonNullFields() {
        UUID id = UUID.randomUUID();
        User user = User.builder().username("john").email("original@example.com")
            .password("encoded").role(Role.USER).build();
        user.setId(id);

        // Only update linkedinUrl — all other fields are null
        UpdateUserRequest request = new UpdateUserRequest(null, null, null, null, null, null, "https://linkedin.com/in/john");

        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserResponse response = userService.updateUser(id, request);

        // Email and role should be unchanged
        assertThat(response.email()).isEqualTo("original@example.com");
        assertThat(response.role()).isEqualTo(Role.USER);
        assertThat(response.linkedinUrl()).isEqualTo("https://linkedin.com/in/john");
    }

    @Test
    void updateProfile_withNewUniqueUsernameAndEmail_updatesAndReturns() {
        UUID id = UUID.randomUUID();
        User user = new User();
        user.setId(id);
        user.setUsername("oldname");
        user.setEmail("old@example.com");
        UpdateProfileRequest request = new UpdateProfileRequest("newname", "new@example.com", null, null);

        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(userRepository.existsByUsername("newname")).thenReturn(false);
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserResponse result = userService.updateProfile(id, request);

        assertThat(result.username()).isEqualTo("newname");
        assertThat(result.email()).isEqualTo("new@example.com");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateProfile_withSameUsernameAndEmail_doesNotCheckDuplicates() {
        UUID id = UUID.randomUUID();
        User user = new User();
        user.setId(id);
        user.setUsername("samename");
        user.setEmail("same@example.com");
        UpdateProfileRequest request = new UpdateProfileRequest("samename", "same@example.com", null, null);

        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserResponse result = userService.updateProfile(id, request);

        assertThat(result.username()).isEqualTo("samename");
        verify(userRepository, never()).existsByUsername(any());
        verify(userRepository, never()).existsByEmail(any());
    }

    @Test
    void updateProfile_withTakenUsername_throwsUsernameAlreadyExistsException() {
        UUID id = UUID.randomUUID();
        User user = new User();
        user.setId(id);
        user.setUsername("oldname");
        user.setEmail("old@example.com");
        UpdateProfileRequest request = new UpdateProfileRequest("taken", "old@example.com", null, null);

        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(userRepository.existsByUsername("taken")).thenReturn(true);

        assertThatThrownBy(() -> userService.updateProfile(id, request))
                .isInstanceOf(UsernameAlreadyExistsException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void updateUser_withTakenUsername_throwsUsernameAlreadyExistsException() {
        UUID id = UUID.randomUUID();
        User user = buildUser(id, "alice", "alice@example.com", Role.USER);

        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(userRepository.existsByUsername("bob")).thenReturn(true);

        assertThatThrownBy(() -> userService.updateUser(id, new UpdateUserRequest("bob", null, null, null, null, null, null)))
                .isInstanceOf(UsernameAlreadyExistsException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void updateUser_withSameUsername_doesNotThrow() {
        UUID id = UUID.randomUUID();
        User user = buildUser(id, "alice", "alice@example.com", Role.USER);

        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.updateUser(id, new UpdateUserRequest("alice", null, null, null, null, null, null));

        verify(userRepository, never()).existsByUsername(anyString());
    }

    @Test
    void updateUser_withFreeUsername_updatesUsername() {
        UUID id = UUID.randomUUID();
        User user = buildUser(id, "alice", "alice@example.com", Role.USER);

        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(userRepository.existsByUsername("carol")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.updateUser(id, new UpdateUserRequest("carol", null, null, null, null, null, null));

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getUsername()).isEqualTo("carol");
    }

    @Test
    void updateProfile_withTakenEmail_throwsEmailAlreadyExistsException() {
        UUID id = UUID.randomUUID();
        User user = new User();
        user.setId(id);
        user.setUsername("oldname");
        user.setEmail("old@example.com");
        UpdateProfileRequest request = new UpdateProfileRequest("oldname", "taken@example.com", null, null);

        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.updateProfile(id, request))
                .isInstanceOf(EmailAlreadyExistsException.class);
        verify(userRepository, never()).save(any());
    }
}
