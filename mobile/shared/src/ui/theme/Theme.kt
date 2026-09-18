package de.parndt.cooking_diary.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import de.parndt.cooking_diary.resources.Res
import de.parndt.cooking_diary.resources.plus_jakarta_sans_bold
import de.parndt.cooking_diary.resources.plus_jakarta_sans_extra_bold
import de.parndt.cooking_diary.resources.plus_jakarta_sans_medium
import de.parndt.cooking_diary.resources.plus_jakarta_sans_regular
import de.parndt.cooking_diary.resources.plus_jakarta_sans_semi_bold
import org.jetbrains.compose.resources.Font

/**
 * Design tokens mirrored from the web app's `src/app.css` (OKLCH values converted to sRGB),
 * so web and native share the same warm amber/tomato palette.
 */
@Immutable
data class AppColors(
    val background: Color,
    val foreground: Color,
    val card: Color,
    val primary: Color,
    val onPrimary: Color,
    val secondary: Color,
    val onSecondary: Color,
    val accent: Color,
    val accentVariant: Color,
    val muted: Color,
    val mutedForeground: Color,
    val border: Color,
    val destructive: Color,
    val teal: Color,
    val blue: Color,
    val plum: Color,
    val success: Color,
    /** Background of the floating tab bar: inverted in light mode, lifted card in dark mode. */
    val navBar: Color,
    val navBarContent: Color,
    val isDark: Boolean,
)

val LightAppColors = AppColors(
    background = Color(0xFFFAF6EE),
    foreground = Color(0xFF25170C),
    card = Color(0xFFFFFFFF),
    primary = Color(0xFFF6AF00),
    onPrimary = Color(0xFF231103),
    secondary = Color(0xFFF6EEDC),
    onSecondary = Color(0xFF31200E),
    accent = Color(0xFFF57050),
    accentVariant = Color(0xFFFF8A4B),
    muted = Color(0xFFF5F0E5),
    mutedForeground = Color(0xFF725F4E),
    border = Color(0xFFE9E4DA),
    destructive = Color(0xFFE62B34),
    teal = Color(0xFF52B9A7),
    blue = Color(0xFF55AEE8),
    plum = Color(0xFFBF85CD),
    success = Color(0xFF43B966),
    navBar = Color(0xFF25170C),
    navBarContent = Color(0xFFFAF6EE),
    isDark = false,
)

val DarkAppColors = AppColors(
    background = Color(0xFF110C08),
    foreground = Color(0xFFF6F2E7),
    card = Color(0xFF1D1711),
    primary = Color(0xFFF6AF00),
    onPrimary = Color(0xFF1B0E04),
    secondary = Color(0xFF2C251E),
    onSecondary = Color(0xFFF0EBDC),
    accent = Color(0xFFF87B5C),
    accentVariant = Color(0xFFFFB347),
    muted = Color(0xFF241E18),
    mutedForeground = Color(0xFFADA393),
    border = Color(0x14FFFFFF),
    destructive = Color(0xFFF94144),
    teal = Color(0xFF42CAB4),
    blue = Color(0xFF5CB4EF),
    plum = Color(0xFFCA94D6),
    success = Color(0xFF51C672),
    navBar = Color(0xFF1D1711),
    navBarContent = Color(0xFFF6F2E7),
    isDark = true,
)

val LocalAppColors = staticCompositionLocalOf { LightAppColors }

object AppTheme {
    val colors: AppColors
        @Composable get() = LocalAppColors.current
}

object AppShapes {
    val card = RoundedCornerShape(24.dp)
    val tile = RoundedCornerShape(20.dp)
    val image = RoundedCornerShape(16.dp)
    val field = RoundedCornerShape(16.dp)
    val pill = RoundedCornerShape(percent = 50)
}

private fun AppColors.toMaterial(): ColorScheme {
    val base = if (isDark) darkColorScheme() else lightColorScheme()
    return base.copy(
        primary = primary,
        onPrimary = onPrimary,
        primaryContainer = primary.copy(alpha = 0.15f),
        onPrimaryContainer = foreground,
        secondary = accent,
        onSecondary = Color.White,
        secondaryContainer = secondary,
        onSecondaryContainer = onSecondary,
        tertiary = teal,
        background = background,
        onBackground = foreground,
        surface = card,
        onSurface = foreground,
        surfaceVariant = muted,
        onSurfaceVariant = mutedForeground,
        surfaceContainerLowest = card,
        surfaceContainerLow = card,
        surfaceContainer = card,
        surfaceContainerHigh = card,
        surfaceContainerHighest = secondary,
        outline = border,
        outlineVariant = border,
        error = destructive,
        onError = Color.White,
    )
}

@Composable
private fun jakartaSans() = FontFamily(
    Font(Res.font.plus_jakarta_sans_regular, FontWeight.Normal),
    Font(Res.font.plus_jakarta_sans_medium, FontWeight.Medium),
    Font(Res.font.plus_jakarta_sans_semi_bold, FontWeight.SemiBold),
    Font(Res.font.plus_jakarta_sans_bold, FontWeight.Bold),
    Font(Res.font.plus_jakarta_sans_extra_bold, FontWeight.ExtraBold),
)

@Composable
private fun appTypography(): Typography {
    val family = jakartaSans()
    fun style(size: Int, weight: FontWeight, line: Int, spacing: Double = 0.0) = TextStyle(
        fontFamily = family,
        fontWeight = weight,
        fontSize = size.sp,
        lineHeight = line.sp,
        letterSpacing = spacing.sp,
    )
    return Typography(
        displaySmall = style(34, FontWeight.ExtraBold, 40, -0.8),
        headlineLarge = style(30, FontWeight.ExtraBold, 36, -0.6),
        headlineMedium = style(26, FontWeight.ExtraBold, 32, -0.5),
        headlineSmall = style(22, FontWeight.ExtraBold, 28, -0.4),
        titleLarge = style(20, FontWeight.Bold, 26, -0.3),
        titleMedium = style(16, FontWeight.Bold, 22, -0.2),
        titleSmall = style(14, FontWeight.Bold, 20),
        bodyLarge = style(16, FontWeight.Normal, 24),
        bodyMedium = style(14, FontWeight.Normal, 20),
        bodySmall = style(12, FontWeight.Normal, 16),
        labelLarge = style(14, FontWeight.SemiBold, 20),
        labelMedium = style(12, FontWeight.SemiBold, 16),
        labelSmall = style(11, FontWeight.SemiBold, 14, 0.2),
    )
}

@Composable
fun CookingDiaryTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    val colors = if (darkTheme) DarkAppColors else LightAppColors
    CompositionLocalProvider(LocalAppColors provides colors) {
        MaterialTheme(
            colorScheme = colors.toMaterial(),
            typography = appTypography(),
            shapes = Shapes(
                extraSmall = RoundedCornerShape(10.dp),
                small = RoundedCornerShape(14.dp),
                medium = RoundedCornerShape(20.dp),
                large = RoundedCornerShape(24.dp),
                extraLarge = RoundedCornerShape(32.dp),
            ),
        ) {
            // Text outside of Material surfaces would otherwise fall back to black, even in dark mode.
            CompositionLocalProvider(LocalContentColor provides colors.foreground, content = content)
        }
    }
}
