package com.ajclassa.app.ui.activities

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.ajclassa.app.R
import com.ajclassa.app.data.models.canAccessAdmin
import com.ajclassa.app.data.repositories.AuthRepository
import com.ajclassa.app.services.PresenceService
import com.ajclassa.app.ui.fragments.*
import com.ajclassa.app.utils.NetworkObserver
import com.ajclassa.app.utils.PrefsManager
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.google.android.material.floatingactionbutton.FloatingActionButton
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    private val auth = AuthRepository()
    private lateinit var prefs: PrefsManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        prefs = PrefsManager(this)
        applyTheme(prefs.themeMode)
        setContentView(R.layout.activity_main)
        startService(Intent(this, PresenceService::class.java))

        val nav = findViewById<BottomNavigationView>(R.id.bottomNav)
        val offline = findViewById<TextView>(R.id.offlineBanner)
        nav.setOnItemSelectedListener { item ->
            val f: Fragment = when (item.itemId) {
                R.id.nav_study -> StudyFragment()
                R.id.nav_ai -> AiHomeFragment()
                R.id.nav_community -> CommunityFragment()
                R.id.nav_profile -> ProfileFragment()
                else -> HomeFragment()
            }
            supportFragmentManager.beginTransaction()
                .setCustomAnimations(android.R.anim.fade_in, android.R.anim.fade_out)
                .replace(R.id.fragmentContainer, f).commit()
            true
        }
        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction().replace(R.id.fragmentContainer, HomeFragment()).commit()
        }
        findViewById<FloatingActionButton>(R.id.fabAi).setOnClickListener {
            startActivity(Intent(this, AiChatActivity::class.java))
        }
        lifecycleScope.launch {
            NetworkObserver.observe(this@MainActivity).collectLatest { online ->
                offline.visibility = if (online) View.GONE else View.VISIBLE
            }
        }
        // Deep link from notifications
        intent.getStringExtra("route")?.let { handleRoute(it, intent.getStringExtra("targetId") ?: "") }
    }

    private fun handleRoute(route: String, id: String) {
        when (route) {
            "ai" -> startActivity(Intent(this, AiChatActivity::class.java).putExtra("chatId", id))
            "admin" -> lifecycleScope.launch {
                val u = try { auth.currentUser() } catch (_: Exception) { null }
                if (u != null && u.canAccessAdmin()) startActivity(Intent(this@MainActivity, AdminActivity::class.java))
            }
        }
    }

    private fun applyTheme(mode: String) {
        delegate.localNightMode = when (mode) {
            "light" -> androidx.appcompat.app.AppCompatDelegate.MODE_NIGHT_NO
            "system" -> androidx.appcompat.app.AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
            else -> androidx.appcompat.app.AppCompatDelegate.MODE_NIGHT_YES
        }
    }

    override fun onDestroy() {
        try { stopService(Intent(this, PresenceService::class.java)) } catch (_: Exception) {}
        super.onDestroy()
    }
}
