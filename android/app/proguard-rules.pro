# Keep React Native bridge classes commonly accessed by reflection.
-keep class com.facebook.react.** { *; }
-keep class com.swmansion.reanimated.** { *; }

# Preserve source mapping metadata useful for crash diagnostics.
-keepattributes SourceFile,LineNumberTable

# Keep app model names readable in stack traces.
-keep class com.homeboxapp.** { *; }
