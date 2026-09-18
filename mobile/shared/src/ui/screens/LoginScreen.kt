package de.parndt.cooking_diary.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import de.parndt.cooking_diary.LocalApi
import de.parndt.cooking_diary.data.ApiException
import de.parndt.cooking_diary.data.SessionStore
import de.parndt.cooking_diary.resources.Res
import de.parndt.cooking_diary.resources.error_network
import de.parndt.cooking_diary.resources.login_create_account
import de.parndt.cooking_diary.resources.login_email
import de.parndt.cooking_diary.resources.login_failed
import de.parndt.cooking_diary.resources.login_name
import de.parndt.cooking_diary.resources.login_password
import de.parndt.cooking_diary.resources.login_register_submit
import de.parndt.cooking_diary.resources.login_server
import de.parndt.cooking_diary.resources.login_submit
import de.parndt.cooking_diary.resources.login_subtitle
import de.parndt.cooking_diary.resources.login_to_login
import de.parndt.cooking_diary.resources.login_to_register
import de.parndt.cooking_diary.resources.login_welcome
import de.parndt.cooking_diary.resources.logo
import de.parndt.cooking_diary.ui.Lucide
import de.parndt.cooking_diary.ui.components.AppTextField
import de.parndt.cooking_diary.ui.components.LIcon
import de.parndt.cooking_diary.ui.components.Pill
import de.parndt.cooking_diary.ui.components.PrimaryButton
import de.parndt.cooking_diary.ui.components.SoftCard
import de.parndt.cooking_diary.ui.theme.AppShapes
import de.parndt.cooking_diary.ui.theme.AppTheme
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.getString
import org.jetbrains.compose.resources.painterResource
import org.jetbrains.compose.resources.stringResource

@Composable
fun LoginScreen(store: SessionStore, onSignedIn: (userName: String) -> Unit) {
    val api = LocalApi.current
    val colors = AppTheme.colors
    val scope = rememberCoroutineScope()

    var registering by remember { mutableStateOf(false) }
    var server by remember { mutableStateOf(store.serverUrl) }
    var editingServer by remember { mutableStateOf(server.isBlank()) }
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val canSubmit = email.isNotBlank() && password.length >= 8 && server.isNotBlank() && (!registering || name.isNotBlank())

    fun submit() {
        if (!canSubmit || busy) return
        busy = true
        error = null
        store.serverUrl = server
        server = store.serverUrl
        scope.launch {
            try {
                val auth = if (registering) api.signUp(name, email, password) else api.signIn(email, password)
                store.token = auth.token
                store.userName = auth.user.name
                onSignedIn(auth.user.name)
            } catch (e: ApiException) {
                error = if (e.status == null) getString(Res.string.error_network) else (e.message ?: getString(Res.string.login_failed))
            } finally {
                busy = false
            }
        }
    }

    Box(
        Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    0f to colors.primary.copy(alpha = if (colors.isDark) 0.18f else 0.28f),
                    0.45f to colors.background,
                )
            )
    ) {
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .statusBarsPadding()
                .imePadding()
                .padding(horizontal = 24.dp, vertical = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(Modifier.height(32.dp))
            Image(
                painterResource(Res.drawable.logo),
                contentDescription = null,
                modifier = Modifier.size(88.dp).clip(AppShapes.card),
            )
            Spacer(Modifier.height(24.dp))
            Text(
                stringResource(if (registering) Res.string.login_create_account else Res.string.login_welcome),
                style = MaterialTheme.typography.headlineLarge,
            )
            Spacer(Modifier.height(6.dp))
            Text(
                stringResource(Res.string.login_subtitle),
                style = MaterialTheme.typography.bodyLarge,
                color = colors.mutedForeground,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            )
            Spacer(Modifier.height(28.dp))

            SoftCard(Modifier.fillMaxWidth(), contentPadding = androidx.compose.foundation.layout.PaddingValues(20.dp)) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    AnimatedVisibility(!editingServer) {
                        Pill(
                            text = server.removePrefix("https://").removePrefix("http://"),
                            icon = Lucide.Server,
                            onClick = { editingServer = true },
                        )
                    }
                    AnimatedVisibility(editingServer) {
                        AppTextField(
                            value = server,
                            onValueChange = { server = it },
                            label = stringResource(Res.string.login_server),
                            leadingIcon = Lucide.Server,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri, imeAction = ImeAction.Next),
                        )
                    }
                    AnimatedVisibility(registering) {
                        AppTextField(name, { name = it }, stringResource(Res.string.login_name), leadingIcon = Lucide.User)
                    }
                    AppTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = stringResource(Res.string.login_email),
                        leadingIcon = Lucide.Mail,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
                    )
                    AppTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = stringResource(Res.string.login_password),
                        leadingIcon = Lucide.Lock,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Go),
                        keyboardActions = KeyboardActions(onGo = { submit() }),
                        visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                        trailing = {
                            TextButton(onClick = { showPassword = !showPassword }) {
                                LIcon(if (showPassword) Lucide.EyeOff else Lucide.Eye, size = 18.dp, tint = colors.mutedForeground)
                            }
                        },
                    )
                    if (error != null) {
                        Text(error!!, color = colors.destructive, style = MaterialTheme.typography.bodyMedium)
                    }
                    Spacer(Modifier.height(4.dp))
                    PrimaryButton(
                        text = stringResource(if (registering) Res.string.login_register_submit else Res.string.login_submit),
                        onClick = ::submit,
                        enabled = canSubmit,
                        loading = busy,
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
            Spacer(Modifier.height(12.dp))
            TextButton(onClick = { registering = !registering; error = null }) {
                Text(
                    stringResource(if (registering) Res.string.login_to_login else Res.string.login_to_register),
                    color = colors.foreground,
                    style = MaterialTheme.typography.labelLarge,
                )
            }
        }
    }
}

