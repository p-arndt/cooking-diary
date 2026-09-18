package de.parndt.cooking_diary.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import de.parndt.cooking_diary.LocalApi
import de.parndt.cooking_diary.resources.Res
import de.parndt.cooking_diary.resources.entry_add_photo
import de.parndt.cooking_diary.resources.entry_uploading
import de.parndt.cooking_diary.ui.Lucide
import de.parndt.cooking_diary.ui.theme.AppShapes
import de.parndt.cooking_diary.ui.theme.AppTheme
import io.github.vinceglb.filekit.FileKit
import io.github.vinceglb.filekit.ImageFormat
import io.github.vinceglb.filekit.compressImage
import io.github.vinceglb.filekit.dialogs.FileKitType
import io.github.vinceglb.filekit.dialogs.compose.rememberFilePickerLauncher
import io.github.vinceglb.filekit.nameWithoutExtension
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.stringResource

/**
 * Shows the current photo (or an "add photo" tile), lets the user pick an image, downsizes it to a JPEG
 * below the server's 5 MB limit and uploads it. Reports the server-relative URL via [onChange].
 */
@Composable
fun PhotoSlot(url: String?, onChange: (String?) -> Unit, modifier: Modifier = Modifier) {
    val api = LocalApi.current
    val colors = AppTheme.colors
    val scope = rememberCoroutineScope()
    var uploading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val launcher = rememberFilePickerLauncher(type = FileKitType.Image) { file ->
        if (file == null) return@rememberFilePickerLauncher
        scope.launch {
            uploading = true
            error = null
            try {
                val bytes = FileKit.compressImage(file, ImageFormat.JPEG, 82, 1600, 1600)
                onChange(api.uploadPhoto(bytes, "${file.nameWithoutExtension}.jpg", "image/jpeg"))
            } catch (e: Exception) {
                error = e.message
            } finally {
                uploading = false
            }
        }
    }

    Column(modifier, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Box(
            Modifier
                .fillMaxWidth()
                .aspectRatio(16f / 10f)
                .clip(AppShapes.card)
                .background(colors.secondary.copy(alpha = 0.6f))
                .border(2.dp, colors.border, AppShapes.card)
                .clickable(enabled = !uploading) { launcher.launch() },
            contentAlignment = Alignment.Center,
        ) {
            if (url != null) {
                MealImage(url, Modifier.fillMaxSize(), shape = AppShapes.card)
                Box(Modifier.align(Alignment.TopEnd).padding(10.dp)) {
                    CircleIconButton(Lucide.X, onClick = { onChange(null) }, size = 36.dp)
                }
            } else {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    IconBadge(Lucide.ImagePlus, tint = colors.primary, size = 52.dp)
                    Text(stringResource(Res.string.entry_add_photo), style = MaterialTheme.typography.labelLarge)
                }
            }
            if (uploading) {
                Box(Modifier.fillMaxSize().background(colors.background.copy(alpha = 0.7f)), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        CircularProgressIndicator(color = colors.primary)
                        Text(stringResource(Res.string.entry_uploading), style = MaterialTheme.typography.labelMedium)
                    }
                }
            }
        }
        error?.let { Text(it, color = colors.destructive, style = MaterialTheme.typography.bodySmall) }
    }
}
