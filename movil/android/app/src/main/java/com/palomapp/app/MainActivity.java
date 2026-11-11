package com.palomapp.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AvisosBancoPlugin.class); // «Avisos del banco» (docs/39)
        super.onCreate(savedInstanceState);
    }
}
