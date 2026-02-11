# Android Resources

This directory will be populated when you run `npx cap add android`.

## Customization

After adding Android platform, customize:

- `android/app/src/main/res/values/strings.xml` - App name
- `android/app/src/main/res/mipmap-*` - App icons
- `android/app/src/main/res/drawable/splash.xml` - Splash screen

## Icon Generation

Use Android Studio's Image Asset tool:
1. Right-click `res` folder
2. New > Image Asset
3. Select your icon source
4. Generate all densities

Or use a tool like:
- https://romannurik.github.io/AndroidAssetStudio/
