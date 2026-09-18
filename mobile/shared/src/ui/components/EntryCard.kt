package de.parndt.cooking_diary.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import de.parndt.cooking_diary.data.Entry
import de.parndt.cooking_diary.resources.Res
import de.parndt.cooking_diary.resources.delete
import de.parndt.cooking_diary.resources.edit
import de.parndt.cooking_diary.ui.Lucide
import de.parndt.cooking_diary.ui.theme.AppShapes
import de.parndt.cooking_diary.ui.theme.AppTheme
import org.jetbrains.compose.resources.stringResource

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun EntryCard(
    entry: Entry,
    onClick: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = AppTheme.colors
    var menuOpen by remember { mutableStateOf(false) }
    SoftCard(modifier.fillMaxWidth(), onClick = onClick, contentPadding = PaddingValues(12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            MealImage(entry.photoUrl, Modifier.size(80.dp), shape = AppShapes.image, seed = entry.meal?.title)
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f)) {
                TitleText(entry.meal?.title.orEmpty())
                val categories = entry.meal?.categories.orEmpty()
                if (categories.isNotEmpty()) {
                    Spacer(Modifier.height(6.dp))
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        categories.take(3).forEach { Pill(it.name) }
                    }
                }
                if (!entry.notes.isNullOrBlank()) {
                    Spacer(Modifier.height(6.dp))
                    Text(
                        entry.notes,
                        style = MaterialTheme.typography.bodyMedium,
                        color = colors.mutedForeground,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
            Box(Modifier.align(Alignment.Top)) {
                IconButton(onClick = { menuOpen = true }, modifier = Modifier.size(36.dp)) {
                    LIcon(Lucide.MoreVertical, size = 18.dp, tint = colors.mutedForeground)
                }
                DropdownMenu(
                    expanded = menuOpen,
                    onDismissRequest = { menuOpen = false },
                    shape = AppShapes.tile,
                    containerColor = colors.card,
                ) {
                    DropdownMenuItem(
                        text = { Text(stringResource(Res.string.edit)) },
                        leadingIcon = { LIcon(Lucide.Pencil, size = 16.dp) },
                        onClick = { menuOpen = false; onEdit() },
                    )
                    DropdownMenuItem(
                        text = { Text(stringResource(Res.string.delete), color = colors.destructive) },
                        leadingIcon = { LIcon(Lucide.Trash, size = 16.dp, tint = colors.destructive) },
                        onClick = { menuOpen = false; onDelete() },
                    )
                }
            }
        }
    }
}

