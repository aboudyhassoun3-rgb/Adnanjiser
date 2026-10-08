package com.ajclassa.app.ai

import android.graphics.Typeface
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.LeadingMarginSpan
import android.text.style.RelativeSizeSpan
import android.text.style.StyleSpan
import android.widget.TextView

/**
 * Lightweight renderer: headings / bold / italic / lists / quotes / code / tables-ish.
 * No WebView — fast native TextView with spans.
 */
object MarkdownRenderer {
    fun renderInto(view: TextView, raw: String) {
        view.text = render(raw)
    }

    fun render(raw: String): CharSequence {
        val sb = SpannableStringBuilder()
        var inCode = false
        val codeBuf = StringBuilder()
        for (line in raw.lines()) {
            if (line.trimStart().startsWith("```")) {
                if (inCode) {
                    val start = sb.length
                    sb.append(codeBuf.toString().trim()).append("\n")
                    sb.setSpan(Typeface.MONOSPACE, start, sb.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                    sb.setSpan(StyleSpan(Typeface.BOLD), start, sb.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                    codeBuf.clear()
                    inCode = false
                } else inCode = true
                continue
            }
            if (inCode) { codeBuf.append(line).append("\n"); continue }
            when {
                line.startsWith("### ") -> appendStyled(sb, line.removePrefix("### ") + "\n", 1.1f, true)
                line.startsWith("## ") -> appendStyled(sb, line.removePrefix("## ") + "\n", 1.2f, true)
                line.startsWith("# ") -> appendStyled(sb, line.removePrefix("# ") + "\n", 1.35f, true)
                line.trimStart().startsWith("> ") -> {
                    val s = sb.length
                    sb.append("“ ").append(inline(line.trimStart().removePrefix("> "))).append("\n")
                    sb.setSpan(LeadingMarginSpan.Standard(24), s, sb.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                    sb.setSpan(StyleSpan(Typeface.ITALIC), s, sb.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                }
                line.trimStart().matches(Regex("[-*•]\\s+.*")) -> {
                    val s = sb.length
                    sb.append("•  ").append(inline(line.trimStart().drop(2))).append("\n")
                    sb.setSpan(LeadingMarginSpan.Standard(24), s, sb.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                }
                line.trimStart().matches(Regex("\\d+[.)]\\s+.*")) -> {
                    val s = sb.length
                    sb.append(line.trimStart()).append("\n")
                    sb.setSpan(LeadingMarginSpan.Standard(24), s, sb.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                }
                line.contains("|") && line.count { it == '|' } >= 2 -> {
                    val s = sb.length
                    sb.append(line.replace("|", "  ").trim()).append("\n")
                    sb.setSpan(Typeface.MONOSPACE, s, sb.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                }
                else -> sb.append(inline(line)).append("\n")
            }
        }
        return sb
    }

    private fun appendStyled(sb: SpannableStringBuilder, t: String, size: Float, bold: Boolean) {
        val s = sb.length
        sb.append(inline(t))
        sb.setSpan(RelativeSizeSpan(size), s, sb.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        if (bold) sb.setSpan(StyleSpan(Typeface.BOLD), s, sb.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    }

    private fun inline(t: String): CharSequence {
        var s: CharSequence = t
        s = s.toString().replace(Regex("\\*\\*(.+?)\\*\\*")) { it.groupValues[1] }
        s = s.toString().replace(Regex("`(.+?)`")) { "⌨ ${it.groupValues[1]} " }
        return s
    }
}
