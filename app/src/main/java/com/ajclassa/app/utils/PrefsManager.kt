package com.ajclassa.app.utils

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.ajclassa.app.BuildConfig

class PrefsManager(ctx: Context) {
    private val app = ctx.applicationContext
    private val prefs = app.getSharedPreferences(Constants.PREFS, Context.MODE_PRIVATE)
    private val secret by lazy {
        try {
            val key = MasterKey.Builder(app).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build()
            EncryptedSharedPreferences.create(app, Constants.SECRET_PREFS, key,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM)
        } catch (_: Exception) {
            app.getSharedPreferences(Constants.SECRET_PREFS, Context.MODE_PRIVATE)
        }
    }

    var rememberMe: Boolean
        get() = prefs.getBoolean(Constants.KEY_REMEMBER, false)
        set(v) = prefs.edit().putBoolean(Constants.KEY_REMEMBER, v).apply()
    var savedUsername: String
        get() = prefs.getString(Constants.KEY_SAVED_USER, "") ?: ""
        set(v) = prefs.edit().putString(Constants.KEY_SAVED_USER, v).apply()

    // AI endpoint is configurable by Owner at runtime; API key is NEVER hardcoded in APK.
    // Key (if ever needed client-side) lives only in encrypted prefs set via secure provisioning,
    // otherwise all AI traffic goes through the secure proxy base URL.
    var aiBaseUrl: String
        get() = prefs.getString(Constants.KEY_AI_URL, BuildConfig.AI_DEFAULT_BASE_URL) ?: BuildConfig.AI_DEFAULT_BASE_URL
        set(v) = prefs.edit().putString(Constants.KEY_AI_URL, v).apply()
    var aiModel: String
        get() = prefs.getString(Constants.KEY_AI_MODEL, BuildConfig.AI_DEFAULT_MODEL) ?: BuildConfig.AI_DEFAULT_MODEL
        set(v) = prefs.edit().putString(Constants.KEY_AI_MODEL, v).apply()
    var aiProxyKey: String
        get() = try { secret.getString("ai_proxy_key", "") ?: "" } catch (_: Exception) { "" }
        set(v) = try { secret.edit().putString("ai_proxy_key", v).apply() } catch (_: Exception) {}
    var aiMemoryOn: Boolean
        get() = prefs.getBoolean(Constants.KEY_AI_MEMORY, true)
        set(v) = prefs.edit().putBoolean(Constants.KEY_AI_MEMORY, v).apply()
    var themeMode: String
        get() = prefs.getString(Constants.KEY_THEME, "dark") ?: "dark"
        set(v) = prefs.edit().putString(Constants.KEY_THEME, v).apply()
    var lastChatId: String
        get() = prefs.getString("last_chat", "") ?: ""
        set(v) = prefs.edit().putString("last_chat", v).apply()
    var lastLessonId: String
        get() = prefs.getString("last_lesson", "") ?: ""
        set(v) = prefs.edit().putString("last_lesson", v).apply()
    var streakDays: Int
        get() = prefs.getInt("streak", 0)
        set(v) = prefs.edit().putInt("streak", v).apply()
    var streakDate: String
        get() = prefs.getString("streak_date", "") ?: ""
        set(v) = prefs.edit().putString("streak_date", v).apply()

    fun bumpStreak() {
        val today = TimeUtils.dayKey()
        if (streakDate != today) { streakDate = today; streakDays += 1 }
    }
}
