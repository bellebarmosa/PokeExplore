# Setting DNS for Android Emulator

## Option 1: Configure DNS via Emulator Extended Controls (Easiest)

1. Open the Android Emulator
2. Click the **three dots (⋮)** button on the emulator toolbar (Extended Controls)
3. Go to **Settings** → **Network**
4. Set **DNS server 1** to: `8.8.8.8`
5. Set **DNS server 2** to: `8.8.4.4`
6. Click **Apply** or **Save**
7. Restart the emulator

## Option 2: Restart Emulator with DNS via Command Line

### Find your emulator name:
```bash
emulator -list-avds
```

### Start emulator with DNS settings:
```bash
emulator -avd <AVD_NAME> -dns-server 8.8.8.8,8.8.4.4
```

Replace `<AVD_NAME>` with your actual AVD name (e.g., `Pixel_5_API_33`)

## Option 3: Configure DNS in Android Studio

1. Open **Android Studio**
2. Go to **Tools** → **Device Manager**
3. Click the **pencil icon** (Edit) next to your emulator
4. Click **Show Advanced Settings**
5. Scroll down to **Network**
6. Set **DNS 1** to: `8.8.8.8`
7. Set **DNS 2** to: `8.8.4.4`
8. Click **Finish**
9. Restart the emulator

## Option 4: Quick Test - Verify DNS is Working

After setting DNS, test it:
```bash
adb shell "ping -c 2 8.8.8.8"
adb shell "getprop net.dns1"
adb shell "getprop net.dns2"
```

## For Current Running Emulator

If you can't restart right now, try:
1. Open emulator extended controls (three dots)
2. Go to Settings → Network
3. Change DNS settings there
4. The app should pick up the new DNS after a moment

## Alternative: Use Android's Network Settings

You can also try changing DNS in the emulator's Android settings:
1. Open **Settings** app in the emulator
2. Go to **Network & internet** → **Internet**
3. Long press on your network connection
4. Tap **Modify network** → **Advanced options**
5. Change **IP settings** to **Static** (if needed)
6. Set **DNS 1** to `8.8.8.8` and **DNS 2** to `8.8.4.4`
7. Save and reconnect

