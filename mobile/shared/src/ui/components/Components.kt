package de.parndt.cooking_diary.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import coil3.compose.SubcomposeAsyncImage
import de.parndt.cooking_diary.LocalApi
import de.parndt.cooking_diary.resources.Res
import de.parndt.cooking_diary.resources.difficulty_easy
import de.parndt.cooking_diary.resources.difficulty_hard
import de.parndt.cooking_diary.resources.difficulty_medium
import de.parndt.cooking_diary.resources.retry
import de.parndt.cooking_diary.data.Difficulty
import de.parndt.cooking_diary.ui.Lucide
import de.parndt.cooking_diary.ui.theme.AppShapes
import de.parndt.cooking_diary.ui.theme.AppTheme
import org.jetbrains.compose.resources.stringResource

/** Warm-tinted soft elevation, the native counterpart of the web's `shadow-soft`. */
fun Modifier.softShadow(shape: Shape, elevation: Dp = 10.dp, dark: Boolean = false): Modifier =
    if (dark) this else shadow(
        elevation = elevation,
        shape = shape,
        ambientColor = Color(0xFF5A3A12).copy(alpha = 0.10f),
        spotColor = Color(0xFF5A3A12).copy(alpha = 0.14f),
    )

@Composable
fun SoftCard(
    modifier: Modifier = Modifier,
    shape: Shape = AppShapes.card,
    onClick: (() -> Unit)? = null,
    contentPadding: PaddingValues = PaddingValues(16.dp),
    content: @Composable ColumnScope.() -> Unit,
) {
    val colors = AppTheme.colors
    Column(
        modifier = modifier
            .softShadow(shape, dark = colors.isDark)
            .clip(shape)
            .background(colors.card)
            .border(1.dp, if (colors.isDark) colors.border else colors.border.copy(alpha = 0.6f), shape)
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(contentPadding),
        content = content,
    )
}

@Composable
fun LIcon(icon: ImageVector, modifier: Modifier = Modifier, size: Dp = 20.dp, tint: Color = Color.Unspecified) {
    Icon(
        imageVector = icon,
        contentDescription = null,
        modifier = modifier.size(size),
        tint = if (tint == Color.Unspecified) androidx.compose.material3.LocalContentColor.current else tint,
    )
}

@Composable
fun IconBadge(icon: ImageVector, tint: Color, modifier: Modifier = Modifier, size: Dp = 40.dp) {
    Box(
        modifier = modifier.size(size).clip(RoundedIconShape).background(tint.copy(alpha = 0.15f)),
        contentAlignment = Alignment.Center,
    ) {
        LIcon(icon, size = size * 0.48f, tint = tint)
    }
}

private val RoundedIconShape = androidx.compose.foundation.shape.RoundedCornerShape(14.dp)

@Composable
fun Pill(
    text: String,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    container: Color = AppTheme.colors.secondary,
    content: Color = AppTheme.colors.onSecondary,
    onClick: (() -> Unit)? = null,
) {
    Row(
        modifier = modifier
            .clip(AppShapes.pill)
            .background(container)
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(horizontal = 10.dp, vertical = 5.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        if (icon != null) LIcon(icon, size = 13.dp, tint = content)
        Text(text, style = MaterialTheme.typography.labelMedium, color = content, maxLines = 1)
    }
}

/** Toggleable pill used for categories and difficulty selection. */
@Composable
fun SelectablePill(
    text: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
) {
    val colors = AppTheme.colors
    Row(
        modifier = modifier
            .clip(AppShapes.pill)
            .background(if (selected) colors.primary else colors.card)
            .border(1.dp, if (selected) colors.primary else colors.border, AppShapes.pill)
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        if (selected) {
            LIcon(Lucide.Check, size = 14.dp, tint = colors.onPrimary)
        } else if (icon != null) {
            LIcon(icon, size = 14.dp, tint = colors.mutedForeground)
        }
        if (text.isNotEmpty()) Text(
            text,
            style = MaterialTheme.typography.labelLarge,
            color = if (selected) colors.onPrimary else colors.foreground,
        )
    }
}

@Composable
fun MealImage(
    url: String?,
    modifier: Modifier = Modifier,
    shape: Shape = AppShapes.image,
    iconSize: Dp = 32.dp,
    /** Picks a stable placeholder tint (e.g. from the meal title) so photo-less lists aren't monotone. */
    seed: String? = null,
) {
    val colors = AppTheme.colors
    val absolute = LocalApi.current.absoluteUrl(url)
    val palette = listOf(colors.primary, colors.accent, colors.teal, colors.plum, colors.blue)
    val tint = palette[(seed?.hashCode() ?: 0).mod(palette.size)]
    val placeholder = @Composable {
        Box(
            Modifier.fillMaxSize().background(
                Brush.linearGradient(listOf(tint.copy(alpha = 0.28f), tint.copy(alpha = 0.12f)))
            ),
            contentAlignment = Alignment.Center,
        ) {
            LIcon(Lucide.ChefHat, size = iconSize, tint = tint)
        }
    }
    Box(modifier.clip(shape).background(colors.secondary)) {
        if (absolute == null) {
            placeholder()
        } else {
            SubcomposeAsyncImage(
                model = absolute,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize(),
                loading = { Box(Modifier.fillMaxSize().background(colors.secondary)) },
                error = { placeholder() },
            )
        }
    }
}

@Composable
fun PrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    enabled: Boolean = true,
    loading: Boolean = false,
    container: Color = AppTheme.colors.primary,
    content: Color = AppTheme.colors.onPrimary,
) {
    Button(
        onClick = onClick,
        enabled = enabled && !loading,
        modifier = modifier.height(52.dp),
        shape = AppShapes.pill,
        colors = ButtonDefaults.buttonColors(
            containerColor = container,
            contentColor = content,
            disabledContainerColor = container.copy(alpha = 0.5f),
            disabledContentColor = content.copy(alpha = 0.7f),
        ),
        contentPadding = PaddingValues(horizontal = 22.dp),
        elevation = null,
    ) {
        if (loading) {
            CircularProgressIndicator(Modifier.size(20.dp), color = content, strokeWidth = 2.5.dp)
        } else {
            if (icon != null) {
                LIcon(icon, size = 18.dp)
                Spacer(Modifier.width(8.dp))
            }
            Text(text, style = MaterialTheme.typography.labelLarge)
        }
    }
}

@Composable
fun SecondaryButton(text: String, onClick: () -> Unit, modifier: Modifier = Modifier, icon: ImageVector? = null) {
    PrimaryButton(
        text = text,
        onClick = onClick,
        modifier = modifier,
        icon = icon,
        container = AppTheme.colors.secondary,
        content = AppTheme.colors.onSecondary,
    )
}

/** Circular icon button, e.g. back/menu buttons floating over hero images. */
@Composable
fun CircleIconButton(
    icon: ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    container: Color = AppTheme.colors.card,
    content: Color = AppTheme.colors.foreground,
    size: Dp = 44.dp,
    contentDescription: String? = null,
    elevated: Boolean = container.alpha == 1f,
) {
    Box(
        modifier = modifier
            .size(size)
            .then(if (elevated) Modifier.softShadow(CircleShape, elevation = 6.dp, dark = AppTheme.colors.isDark) else Modifier)
            .clip(CircleShape)
            .background(container)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Icon(icon, contentDescription = contentDescription, tint = content, modifier = Modifier.size(size * 0.45f))
    }
}

@Composable
fun SearchField(value: String, onValueChange: (String) -> Unit, placeholder: String, modifier: Modifier = Modifier) {
    val colors = AppTheme.colors
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(52.dp)
            .softShadow(AppShapes.pill, elevation = 6.dp, dark = colors.isDark)
            .clip(AppShapes.pill)
            .background(colors.card)
            .border(1.dp, colors.border, AppShapes.pill)
            .padding(horizontal = 18.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        LIcon(Lucide.Search, size = 20.dp, tint = colors.mutedForeground)
        Spacer(Modifier.width(12.dp))
        Box(Modifier.weight(1f)) {
            if (value.isEmpty()) {
                Text(placeholder, color = colors.mutedForeground, style = MaterialTheme.typography.bodyLarge, maxLines = 1)
            }
            BasicTextField(
                value = value,
                onValueChange = onValueChange,
                singleLine = true,
                textStyle = MaterialTheme.typography.bodyLarge.copy(color = colors.foreground),
                cursorBrush = SolidColor(colors.primary),
                modifier = Modifier.fillMaxWidth(),
            )
        }
        if (value.isNotEmpty()) {
            Box(Modifier.clip(CircleShape).clickable { onValueChange("") }.padding(6.dp)) {
                LIcon(Lucide.X, size = 16.dp, tint = colors.mutedForeground)
            }
        }
    }
}

@Composable
fun AppTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    singleLine: Boolean = true,
    minLines: Int = 1,
    leadingIcon: ImageVector? = null,
    placeholder: String? = null,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    keyboardActions: androidx.compose.foundation.text.KeyboardActions = androidx.compose.foundation.text.KeyboardActions.Default,
    visualTransformation: androidx.compose.ui.text.input.VisualTransformation =
        androidx.compose.ui.text.input.VisualTransformation.None,
    trailing: (@Composable () -> Unit)? = null,
) {
    val colors = AppTheme.colors
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        placeholder = placeholder?.let { { Text(it, color = colors.mutedForeground) } },
        modifier = modifier.fillMaxWidth(),
        singleLine = singleLine,
        minLines = minLines,
        shape = AppShapes.field,
        leadingIcon = leadingIcon?.let { { LIcon(it, size = 18.dp, tint = colors.mutedForeground) } },
        trailingIcon = trailing,
        keyboardOptions = keyboardOptions,
        keyboardActions = keyboardActions,
        visualTransformation = visualTransformation,
        colors = OutlinedTextFieldDefaults.colors(
            focusedContainerColor = colors.card,
            unfocusedContainerColor = colors.card,
            focusedBorderColor = colors.primary,
            unfocusedBorderColor = colors.border,
            focusedLabelColor = colors.foreground,
            cursorColor = colors.primary,
        ),
    )
}

@Composable
fun SectionTitle(text: String, modifier: Modifier = Modifier, trailing: @Composable RowScope.() -> Unit = {}) {
    Row(modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(text, style = MaterialTheme.typography.titleLarge, modifier = Modifier.weight(1f))
        trailing()
    }
}

/** Uppercase date divider used to group timeline entries, like the web timeline. */
@Composable
fun DateDivider(label: String, highlight: Boolean, modifier: Modifier = Modifier) {
    val colors = AppTheme.colors
    Row(modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        if (highlight) {
            Pill(label.uppercase(), container = colors.primary, content = colors.onPrimary)
        } else {
            Text(
                label.uppercase(),
                style = MaterialTheme.typography.labelMedium,
                color = colors.mutedForeground,
            )
        }
        Spacer(Modifier.width(12.dp))
        Box(Modifier.weight(1f).height(1.dp).background(colors.border))
    }
}

@Composable
fun LoadingState(modifier: Modifier = Modifier) {
    Box(modifier.fillMaxWidth().padding(48.dp), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = AppTheme.colors.primary, strokeWidth = 3.dp)
    }
}

@Composable
fun ErrorState(message: String, onRetry: () -> Unit, modifier: Modifier = Modifier) {
    EmptyState(
        icon = Lucide.X,
        message = message,
        modifier = modifier,
        action = { TextButton(onClick = onRetry) { Text(stringResource(Res.string.retry)) } },
    )
}

@Composable
fun EmptyState(
    icon: ImageVector,
    message: String,
    modifier: Modifier = Modifier,
    action: (@Composable () -> Unit)? = null,
) {
    val colors = AppTheme.colors
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(AppShapes.card)
            .border(2.dp, colors.border, AppShapes.card)
            .padding(horizontal = 24.dp, vertical = 40.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        IconBadge(icon, tint = colors.primary, size = 64.dp)
        Spacer(Modifier.height(16.dp))
        Text(
            message,
            style = MaterialTheme.typography.bodyMedium,
            color = colors.mutedForeground,
            textAlign = TextAlign.Center,
        )
        if (action != null) {
            Spacer(Modifier.height(12.dp))
            action()
        }
    }
}

@Composable
fun difficultyLabel(difficulty: String?): String? = when (Difficulty.fromApi(difficulty)) {
    Difficulty.Easy -> stringResource(Res.string.difficulty_easy)
    Difficulty.Medium -> stringResource(Res.string.difficulty_medium)
    Difficulty.Hard -> stringResource(Res.string.difficulty_hard)
    null -> null
}

@Composable
fun TitleText(text: String, modifier: Modifier = Modifier, style: TextStyle = MaterialTheme.typography.titleMedium, maxLines: Int = 1) {
    Text(text, modifier = modifier, style = style, maxLines = maxLines, overflow = TextOverflow.Ellipsis)
}

@Composable
fun StatTile(icon: ImageVector, tint: Color, value: String, label: String, modifier: Modifier = Modifier, compact: Boolean = false) {
    SoftCard(modifier, shape = AppShapes.tile, contentPadding = PaddingValues(if (compact) 12.dp else 14.dp)) {
        IconBadge(icon, tint = tint, size = if (compact) 30.dp else 36.dp)
        Spacer(Modifier.height(if (compact) 8.dp else 12.dp))
        Text(value, style = MaterialTheme.typography.headlineSmall, maxLines = 1)
        Text(label, style = MaterialTheme.typography.labelMedium, color = AppTheme.colors.mutedForeground, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

fun formatStat(value: Double): String {
    val rounded = kotlin.math.round(value * 10) / 10
    return if (rounded % 1.0 == 0.0) rounded.toInt().toString() else rounded.toString().replace('.', ',')
}
