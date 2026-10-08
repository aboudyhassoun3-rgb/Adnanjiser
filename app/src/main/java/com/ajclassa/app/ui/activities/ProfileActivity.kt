package com.ajclassa.app.ui.activities

import android.os.Bundle
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.ajclassa.app.R
import com.ajclassa.app.data.repositories.AuthRepository
import com.ajclassa.app.utils.PrefsManager
import kotlinx.coroutines.launch

class ProfileActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_profile)
        findViewById<View>(R.id.btnBack).setOnClickListener { finish() }
        val auth = AuthRepository()
        val prefs = PrefsManager(this)
        val etNew = findViewById<EditText>(R.id.etNewPass)
        lifecycleScope.launch {
            val u = try { auth.currentUser() } catch (_: Exception) { null } ?: return@launch
            findViewById<TextView>(R.id.tvName).text = u.name.ifBlank { u.username }
            findViewById<TextView>(R.id.tvMeta).text = "${u.email}\n${u.role} • 1AS — Section A"
            if (u.mustChangePassword) Toast.makeText(this@ProfileActivity, "يجب تغيير كلمة المرور", Toast.LENGTH_LONG).show()
        }
        findViewById<Button>(R.id.btnChange).setOnClickListener {
            val p = etNew.text.toString()
            if (p.length < 6) { Toast.makeText(this, "كلمة المرور 6 أحرف على الأقل", Toast.LENGTH_SHORT).show(); return@setOnClickListener }
            lifecycleScope.launch {
                try { auth.changePassword(p); Toast.makeText(this@ProfileActivity, "تم التغيير ✅", Toast.LENGTH_SHORT).show() }
                catch (_: Exception) { Toast.makeText(this@ProfileActivity, "حدث خطأ. حاول مرة أخرى.", Toast.LENGTH_SHORT).show() }
            }
        }
        val spTheme = findViewById<Spinner>(R.id.spTheme)
        spTheme.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, listOf("dark", "light", "system"))
        spTheme.setSelection(listOf("dark", "light", "system").indexOf(prefs.themeMode).coerceAtLeast(0))
        spTheme.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(a: AdapterView<*>?, v: View?, i: Int, l: Long) {
                prefs.themeMode = listOf("dark", "light", "system")[i]
                delegate.localNightMode = when (i) {
                    1 -> androidx.appcompat.app.AppCompatDelegate.MODE_NIGHT_NO
                    2 -> androidx.appcompat.app.AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
                    else -> androidx.appcompat.app.AppCompatDelegate.MODE_NIGHT_YES
                }
            }
            override fun onNothingSelected(a: AdapterView<*>?) {}
        }
    }
}
