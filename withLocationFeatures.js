const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withLocationFeatures(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const manifest = androidManifest.manifest;

    if (!manifest['uses-feature']) {
      manifest['uses-feature'] = [];
    }

    const features = [
      'android.hardware.location',
      'android.hardware.location.network',
      'android.hardware.location.gps'
    ];

    features.forEach((feature) => {
      const existingFeature = manifest['uses-feature'].find(
        (f) => f.$['android:name'] === feature
      );
      if (existingFeature) {
        existingFeature.$['android:required'] = 'false';
      } else {
        manifest['uses-feature'].push({
          $: {
            'android:name': feature,
            'android:required': 'false',
          },
        });
      }
    });

    return config;
  });
};
