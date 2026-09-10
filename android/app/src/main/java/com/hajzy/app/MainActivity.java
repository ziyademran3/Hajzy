package com.hajzy.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import org.json.JSONObject;

public class MainActivity extends BridgeActivity {
    private String pendingPaymentReturnUrl;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        capturePaymentReturn(getIntent());
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        capturePaymentReturn(intent);
    }

    private void capturePaymentReturn(Intent intent) {
        Uri url = intent == null ? null : intent.getData();
        if (url != null && "com.hajzy.app".equals(url.getScheme()) && "payment-result".equals(url.getHost())) {
            pendingPaymentReturnUrl = url.toString();
            // On a cold launch React needs a moment to register its listener.
            getWindow().getDecorView().postDelayed(this::deliverPaymentReturn, 750);
        }
    }

    private void deliverPaymentReturn() {
        if (pendingPaymentReturnUrl == null || getBridge() == null) return;
        String url = pendingPaymentReturnUrl;
        pendingPaymentReturnUrl = null;
        getBridge().triggerWindowJSEvent("hajzyPaymentReturn", "{\"url\":" + JSONObject.quote(url) + "}");
    }
}
