import { ExpoConfig, ConfigContext } from 'expo/config';

const projectId = process.env.COZE_PROJECT_ID || process.env.EXPO_PUBLIC_COZE_PROJECT_ID;
const slugAppName = projectId ? `app${projectId}` : 'myapp';

/**
 * 双版本机制：
 * - 国内版（默认）：EXPO_PUBLIC_EDITION=cn      → 名称「瓦砾」，BundleID com.wali.app，中文权限文案
 * - 海外版：       EXPO_PUBLIC_EDITION=intl    → 名称「value」，BundleID com.wali.value，英文权限文案
 * 构建对应版本时通过环境变量切换，例如：EXPO_PUBLIC_EDITION=intl npx expo start
 */
const EDITION = process.env.EXPO_PUBLIC_EDITION === 'intl' ? 'intl' : 'cn';
const IS_INTL = EDITION === 'intl';

const APP_NAME = IS_INTL ? 'value' : '瓦砾';
const IOS_BUNDLE_ID = IS_INTL ? 'com.wali.value' : 'com.wali.app';
const ANDROID_PACKAGE = IS_INTL ? 'com.wali.value' : 'com.wali.app';
const PERMISSION_PREFIX = IS_INTL ? 'value needs' : '瓦砾App';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    "name": APP_NAME,
    "slug": IS_INTL ? `${slugAppName}-intl` : slugAppName,
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": IOS_BUNDLE_ID
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": ANDROID_PACKAGE
    },
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      process.env.EXPO_PUBLIC_BACKEND_BASE_URL ? [
        "expo-router",
        {
          "origin": process.env.EXPO_PUBLIC_BACKEND_BASE_URL
        }
      ] : 'expo-router',
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": IS_INTL
            ? `Allow ${PERMISSION_PREFIX} to access your photo library so you can upload or save images.`
            : `允许${PERMISSION_PREFIX}访问您的相册，以便您上传或保存图片。`,
          "cameraPermission": IS_INTL
            ? `Allow ${PERMISSION_PREFIX} to use your camera so you can take photos to upload.`
            : `允许${PERMISSION_PREFIX}使用您的相机，以便您直接拍摄照片上传。`,
          "microphonePermission": IS_INTL
            ? `Allow ${PERMISSION_PREFIX} to access your microphone so you can record videos with sound.`
            : `允许${PERMISSION_PREFIX}访问您的麦克风，以便您拍摄带有声音的视频。`
        }
      ],
      [
        "expo-location",
        {
          "locationWhenInUsePermission": IS_INTL
            ? `Allow ${PERMISSION_PREFIX} to access your location to provide nearby services and navigation.`
            : `${PERMISSION_PREFIX}需要访问您的位置以提供周边服务及导航功能。`
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": IS_INTL
            ? `Allow ${PERMISSION_PREFIX} to access the camera to take photos and videos.`
            : `${PERMISSION_PREFIX}需要访问相机以拍摄照片和视频。`,
          "microphonePermission": IS_INTL
            ? `Allow ${PERMISSION_PREFIX} to access the microphone to record video sound.`
            : `${PERMISSION_PREFIX}需要访问麦克风以录制视频声音。`,
          "recordAudioAndroid": true
        }
      ],
      "@react-native-community/datetimepicker",
      "expo-font",
      "expo-web-browser"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
