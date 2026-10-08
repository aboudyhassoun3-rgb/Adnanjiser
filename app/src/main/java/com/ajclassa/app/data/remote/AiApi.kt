package com.ajclassa.app.data.remote

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST
import java.util.concurrent.TimeUnit

/** Pluggable provider model — swap Provider A/B/C via baseUrl without touching app code. */
interface AiApiService {
    @POST("chat/completions")
    suspend fun chat(
        @Body req: AiChatRequest,
        @Header("Authorization") auth: String? = null
    ): AiChatResponse

    @POST("vision/analyze")
    suspend fun vision(
        @Body req: AiVisionRequest,
        @Header("Authorization") auth: String? = null
    ): AiChatResponse
}

@JsonClass(generateAdapter = true)
data class AiMsgDto(@Json(name = "role") val role: String, @Json(name = "content") val content: String)
@JsonClass(generateAdapter = true)
data class AiChatRequest(
    @Json(name = "model") val model: String,
    @Json(name = "messages") val messages: List<AiMsgDto>,
    @Json(name = "max_tokens") val maxTokens: Int = 2048,
    @Json(name = "temperature") val temperature: Double = 0.4
)
@JsonClass(generateAdapter = true)
data class AiVisionRequest(
    @Json(name = "model") val model: String,
    @Json(name = "prompt") val prompt: String,
    @Json(name = "image_base64") val imageBase64: String,
    @Json(name = "max_tokens") val maxTokens: Int = 2048
)
@JsonClass(generateAdapter = true)
data class AiChoice(@Json(name = "message") val message: AiMsgDto?)
@JsonClass(generateAdapter = true)
data class AiUsage(@Json(name = "total_tokens") val total: Int = 0)
@JsonClass(generateAdapter = true)
data class AiChatResponse(
    @Json(name = "choices") val choices: List<AiChoice> = emptyList(),
    @Json(name = "usage") val usage: AiUsage? = null
) {
    fun text(): String = choices.firstOrNull()?.message?.content?.trim().orEmpty()
}

object RetrofitClient {
    @Volatile private var cachedUrl = ""
    @Volatile private var cached: AiApiService? = null

    @Synchronized
    fun api(baseUrl: String): AiApiService {
        val url = baseUrl.trim().let { if (it.endsWith("/")) it else "$it/" }
        if (cached != null && cachedUrl == url) return cached!!
        val logging = HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.NONE }
        val client = OkHttpClient.Builder()
            .addInterceptor(logging)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(90, TimeUnit.SECONDS)
            .writeTimeout(90, TimeUnit.SECONDS)
            .build()
        val retrofit = Retrofit.Builder()
            .baseUrl(url)
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create())
            .build()
        cachedUrl = url
        cached = retrofit.create(AiApiService::class.java)
        return cached!!
    }
}
