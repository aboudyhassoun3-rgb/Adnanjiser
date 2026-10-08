package com.ajclassa.app.ui.activities

import android.os.Bundle
import android.os.CountDownTimer
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.ajclassa.app.R

class StudyToolsActivity : AppCompatActivity() {
    private var timer: CountDownTimer? = null
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_tools)
        findViewById<View>(R.id.btnBack).setOnClickListener { finish() }
        // Calculator
        val etCalc = findViewById<EditText>(R.id.etCalc)
        val tvCalc = findViewById<TextView>(R.id.tvCalc)
        findViewById<Button>(R.id.btnCalc).setOnClickListener {
            try { tvCalc.text = "= " + eval(etCalc.text.toString()) }
            catch (_: Exception) { tvCalc.text = "حدث خطأ. حاول مرة أخرى." }
        }
        // Pomodoro 25/5
        val tvTimer = findViewById<TextView>(R.id.tvTimer)
        findViewById<Button>(R.id.btnStart).setOnClickListener {
            timer?.cancel()
            timer = object : CountDownTimer(25 * 60 * 1000, 1000) {
                override fun onTick(m: Long) { tvTimer.text = "%02d:%02d".format(m / 60000, (m / 1000) % 60) }
                override fun onFinish() { tvTimer.text = "استراحة 5 دقائق ☕" }
            }.start()
        }
        findViewById<Button>(R.id.btnStop).setOnClickListener { timer?.cancel(); tvTimer.text = "25:00" }
        // Unit converter (km->m simple demo + extensible)
        val etUnit = findViewById<EditText>(R.id.etUnit)
        val tvUnit = findViewById<TextView>(R.id.tvUnit)
        findViewById<Button>(R.id.btnConvert).setOnClickListener {
            val v = etUnit.text.toString().toDoubleOrNull()
            tvUnit.text = if (v == null) "أدخل رقمًا" else "$v km = ${v * 1000} m"
        }
    }
    private fun eval(expr: String): Double = ExprParser(expr.replace(" ", "")).parse()

    private class ExprParser(private val s: String) {
        private var pos = 0
        fun parse(): Double = parseExpr()
        private fun parseExpr(): Double {
            var x = parseTerm()
            while (pos < s.length && (s[pos] == '+' || s[pos] == '-')) {
                val op = s[pos++]
                val y = parseTerm()
                x = if (op == '+') x + y else x - y
            }
            return x
        }
        private fun parseTerm(): Double {
            var x = parseFactor()
            while (pos < s.length && (s[pos] == '*' || s[pos] == '/')) {
                val op = s[pos++]
                val y = parseFactor()
                x = if (op == '*') x * y else x / y
            }
            return x
        }
        private fun parseFactor(): Double {
            if (pos < s.length && s[pos] == '(') { pos++; val x = parseExpr(); pos++; return x }
            val st = pos
            while (pos < s.length && (s[pos].isDigit() || s[pos] == '.')) pos++
            return s.substring(st, pos).toDouble()
        }
    }
    override fun onDestroy() { timer?.cancel(); super.onDestroy() }
}
