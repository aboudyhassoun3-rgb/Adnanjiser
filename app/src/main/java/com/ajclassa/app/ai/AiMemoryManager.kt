package com.ajclassa.app.ai

import com.ajclassa.app.data.models.AiMessage
import com.ajclassa.app.data.remote.AiMsgDto

/** Builds a bounded context window + rolling summary so long chats stay cheap and coherent. */
object AiMemoryManager {
    const val MAX_TURNS = 12
    const val SUMMARY_AFTER = 30

    fun buildMessages(
        system: String,
        history: List<AiMessage>,
        memorySummary: String,
        newPrompt: String
    ): List<AiMsgDto> {
        val out = mutableListOf(AiMsgDto("system", system))
        if (memorySummary.isNotBlank()) out += AiMsgDto("system", "ملخص المحادثة السابقة: $memorySummary")
        val tail = history.takeLast(MAX_TURNS * 2)
        tail.forEach { out += AiMsgDto(if (it.role == "assistant") "assistant" else "user", it.content) }
        out += AiMsgDto("user", newPrompt)
        return out
    }

    fun shouldSummarize(total: Int): Boolean = total >= SUMMARY_AFTER

    fun rollSummary(old: String, lastExchange: String): String {
        val merged = ((old + "\n" + lastExchange).trim()).takeLast(1200)
        return merged
    }
}
