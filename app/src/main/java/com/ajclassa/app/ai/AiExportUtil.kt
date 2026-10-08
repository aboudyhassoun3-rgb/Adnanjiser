package com.ajclassa.app.ai

import android.content.Context
import android.content.Intent
import androidx.core.content.FileProvider
import com.ajclassa.app.data.models.AiMessage
import java.io.File

object AiExportUtil {
    fun exportText(messages: List<AiMessage>, title: String): String {
        val sb = StringBuilder("# $title\n\n")
        messages.forEach {
            sb.append(if (it.role == "assistant") "🤖 AI:\n" else "🧑 أنت:\n")
            sb.append(it.content).append("\n\n---\n\n")
        }
        return sb.toString()
    }
    fun shareText(ctx: Context, text: String, title: String) {
        val f = File(ctx.cacheDir, "aichat_${System.currentTimeMillis()}.txt")
        f.writeText(text)
        val uri = FileProvider.getUriForFile(ctx, ctx.packageName + ".fileprovider", f)
        val i = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"; putExtra(Intent.EXTRA_STREAM, uri); putExtra(Intent.EXTRA_SUBJECT, title)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        ctx.startActivity(Intent.createChooser(i, title))
    }
}
