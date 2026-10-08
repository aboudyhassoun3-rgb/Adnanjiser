package com.ajclassa.app.utils

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import java.io.ByteArrayOutputStream

object FileUtils {
    fun compressImage(ctx: Context, uri: Uri, maxDim: Int = 1280, quality: Int = 80): ByteArray? {
        return try {
            ctx.contentResolver.openInputStream(uri)?.use { ins ->
                var bmp = BitmapFactory.decodeStream(ins) ?: return null
                val scale = maxOf(bmp.width, bmp.height).toFloat() / maxDim
                if (scale > 1f) {
                    bmp = Bitmap.createScaledBitmap(bmp, (bmp.width / scale).toInt(), (bmp.height / scale).toInt(), true)
                }
                val out = ByteArrayOutputStream()
                bmp.compress(Bitmap.CompressFormat.JPEG, quality, out)
                out.toByteArray()
            }
        } catch (_: Exception) { null }
    }
    fun kindOf(name: String): String {
        val n = name.lowercase()
        return when {
            n.endsWith(".pdf") -> "pdf"
            n.endsWith(".png") || n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".webp") -> "image"
            n.endsWith(".mp3") || n.endsWith(".m4a") || n.endsWith(".ogg") -> "voice"
            else -> "doc"
        }
    }
}
