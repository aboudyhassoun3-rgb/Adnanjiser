package com.ajclassa.app.utils

import com.ajclassa.app.data.models.DailyContent
import kotlin.math.abs

/** Rotates daily verse/hadith deterministically by date. Sources kept for hadith. */
object DailyContentProvider {
    private val verses = listOf(
        "﴿وَقُل رَّبِّ زِدْنِي عِلْمًا﴾" to "سورة طه — الآية 114",
        "﴿يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ﴾" to "سورة المجادلة — الآية 11",
        "﴿وَمَا أُوتِيتُم مِّنَ الْعِلْمِ إِلَّا قَلِيلًا﴾" to "سورة الإسراء — الآية 85"
    )
    private val hadiths = listOf(
        "«طلبُ العلمِ فريضةٌ على كلِّ مسلمٍ»" to "سنن ابن ماجه (224) — حسّنه الألباني",
        "«من سلك طريقًا يلتمس فيه علمًا سهّل الله له به طريقًا إلى الجنة»" to "صحيح مسلم (2699)",
        "«إن الملائكة لتضع أجنحتها رضًا لطالب العلم»" to "سنن أبي داود (3641) — صحيح"
    )
    fun today(): DailyContent {
        val key = TimeUtils.dayKey()
        val idx = abs(key.hashCode())
        return if ((idx % 2) == 0) {
            val (t, s) = verses[idx % verses.size]
            DailyContent("verse", t, s, key)
        } else {
            val (t, s) = hadiths[idx % hadiths.size]
            DailyContent("hadith", t, s, key)
        }
    }
}
