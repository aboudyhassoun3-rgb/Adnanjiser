package com.ajclassa.app.utils

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.callbackFlow

object NetworkObserver {
    fun observe(ctx: Context) = callbackFlow {
        val cm = ctx.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        fun emit() {
            val n = cm.activeNetwork
            val caps = n?.let { cm.getNetworkCapabilities(it) }
            trySend(caps?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true)
        }
        emit()
        val cb = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) { emit() }
            override fun onLost(network: Network) { emit() }
        }
        cm.registerDefaultNetworkCallback(cb)
        awaitClose { cm.unregisterNetworkCallback(cb) }
    }
}
