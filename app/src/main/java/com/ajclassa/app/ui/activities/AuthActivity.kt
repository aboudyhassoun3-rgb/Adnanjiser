package com.ajclassa.app.ui.activities

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.ajclassa.app.R
import com.ajclassa.app.data.repositories.AuthRepository
import com.ajclassa.app.utils.PrefsManager
import kotlinx.coroutines.launch

class AuthActivity : AppCompatActivity() {
    private val auth = AuthRepository()
    private lateinit var prefs: PrefsManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_auth)
        prefs = PrefsManager(this)
        val etUser = findViewById<EditText>(R.id.etUsername)
        val etPass = findViewById<EditText>(R.id.etPassword)
        val cb = findViewById<CheckBox>(R.id.cbRemember)
        val btn = findViewById<Button>(R.id.btnLogin)
        val progress = findViewById<ProgressBar>(R.id.progress)
        val err = findViewById<TextView>(R.id.tvError)
        if (prefs.rememberMe) { etUser.setText(prefs.savedUsername); cb.isChecked = true }

        btn.setOnClickListener {
            val u = etUser.text.toString().trim()
            val p = etPass.text.toString()
            if (u.isEmpty() || p.isEmpty()) {
                err.text = "أدخل اسم المستخدم وكلمة المرور"; err.visibility = View.VISIBLE; return@setOnClickListener
            }
            err.visibility = View.GONE
            progress.visibility = View.VISIBLE
            btn.isEnabled = false
            lifecycleScope.launch {
                try {
                    val user = auth.loginWithUsername(u, p)
                    prefs.rememberMe = cb.isChecked
                    if (cb.isChecked) prefs.savedUsername = u
                    startActivity(Intent(this@AuthActivity, MainActivity::class.java))
                    finish()
                } catch (e: Exception) {
                    err.text = when (e) {
                        is IllegalArgumentException -> "بيانات الدخول غير صحيحة"
                        is IllegalStateException -> e.message ?: "حدث خطأ. حاول مرة أخرى."
                        else -> "حدث خطأ. حاول مرة أخرى."
                    }
                    err.visibility = View.VISIBLE
                } finally {
                    progress.visibility = View.GONE
                    btn.isEnabled = true
                }
            }
        }
    }
}
