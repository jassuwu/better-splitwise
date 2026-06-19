const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// getDefaultConfig auto-detects the monorepo workspace root (Expo SDK 52+).
const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
