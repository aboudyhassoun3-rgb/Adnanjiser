package com.ajclassa.app.ui.activities

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.ajclassa.app.R
import com.ajclassa.app.utils.DailyContentProvider
import com.google.firebase.auth.FirebaseAuth

@SuppressLint("CustomSplashScreen")
class SplashActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)
        val daily = DailyContentProvider.today()
        findViewById<TextView>(R.id.tvVerse).text = daily.text
        findViewById<TextView>(R.id.tvVerseKind).text =
            if (daily.kind == "verse") "آية اليوم" else "حديث اليوم"
        findViewById<TextView>(R.id.tvVerseSource).text = daily.source
        findViewById<TextView>(R.id.tvVerse).animate().alpha(1f).setDuration(900).start()
        Handler(Looper.getMainLooper()).postDelayed({
            val next = if (FirebaseAuth.getInstance().currentUser != null)
                Intent(this, MainActivity::class.java) else Intent(this, AuthActivity::class.java)
            startActivity(next)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
            finish()
        }, 2200)
    }
}
