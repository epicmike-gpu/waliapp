/**
 * phone_models 种子数据（来源：develop 环境全量导出，16 台机型）
 * 由后端启动自举逻辑使用：目标数据库检测到空表时自动灌入，幂等。
 * ⚠️ 该文件由脚本生成，请勿手工编辑。
 */
export interface SeedPhoneModel {
  id: number;
  name: string;
  brand: string;
  chip_name: string;
  chip_generation: number;
  release_year: number;
  support_until_year: number;
  battery_cycle_standard: number;
  reference_score: number;
  image_url: string;
  specs: Record<string, Record<string, string>> | null;
  colors: { name: string; hex: string; image: string }[] | null;
  is_latest: boolean;
  upgrade_model_id: number | null;
}

export const SEED_PHONE_MODELS: SeedPhoneModel[] = [
  {
    "id": 1,
    "name": "iPhone 11",
    "brand": "Apple",
    "chip_name": "A13",
    "chip_generation": 1,
    "release_year": 2019,
    "support_until_year": 2025,
    "battery_cycle_standard": 500,
    "reference_score": 2500,
    "image_url": "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "机身": {
        "配色": "黑 / 白 / 红 / 绿 / 黄 / 紫",
        "机身材质": "铝金属边框 + 玻璃背板",
        "防护等级": "IP68",
        "尺寸与重量": "150.9×75.7×8.3 mm，194 克"
      },
      "芯片": {
        "制程工艺": "7nm",
        "芯片型号": "A13 仿生",
        "中央处理器": "6 核",
        "图形处理器": "4 核",
        "神经网络引擎": "8 核"
      },
      "摄像头": {
        "长焦": "无",
        "超广角": "1200 万像素 ƒ/2.4（120° 视角）",
        "后置主摄": "1200 万像素 ƒ/1.8（OIS）",
        "视频拍摄": "4K 60fps",
        "前置摄像头": "1200 万像素 ƒ/2.2"
      },
      "显示屏": {
        "亮度": "625 尼特最大亮度",
        "刷新率": "60Hz",
        "屏幕尺寸": "6.1 英寸",
        "屏幕类型": "Liquid Retina HD (LCD)",
        "全面屏设计": "刘海屏",
        "分辨率与像素密度": "1792×828，326 ppi"
      },
      "内存与存储": {
        "存储容量": "64 / 128 / 256GB",
        "运行内存": "4GB"
      },
      "电池与充电": {
        "无线充电": "Qi 7.5W",
        "有线快充": "18W（约 30 分钟充至 50%）",
        "电池容量": "3110 mAh",
        "视频播放": "最长 17 小时"
      },
      "连接与其他": {
        "接口": "Lightning",
        "无线连接": "Wi-Fi 6，蓝牙 5.0",
        "生物识别": "面容 ID",
        "移动网络": "4G LTE",
        "蜂窝基带": "Intel",
        "首发系统": "iOS 13"
      }
    },
    "colors": [
      {
        "hex": "#D1CDDA",
        "name": "紫色",
        "image": "https://coze-coding-project.tos.coze.site/coze_storage_7687966160918249487/image/generate_image_b1e93478-043b-4ebf-a086-b519cb487a55.jpeg?sign=1821589639-acd2070d61-0-c8db64fafa9680a65f376b799bd412eb6645f91dcea05421bb53b99fbb7aa5c8"
      },
      {
        "hex": "#AEE1CD",
        "name": "绿色",
        "image": "https://coze-coding-project.tos.coze.site/coze_storage_7687966160918249487/image/generate_image_8bcaf9a3-6440-4e13-8589-87955ed4f327.jpeg?sign=1821589639-b37aa99219-0-2b16f13b94372ac75d3695a8943379f45aaebccdadede589a7cc122f4da29ee5"
      },
      {
        "hex": "#BA0C2E",
        "name": "红色",
        "image": "https://coze-coding-project.tos.coze.site/coze_storage_7687966160918249487/image/generate_image_761269f4-c28b-489c-ad5e-98e98f971047.jpeg?sign=1821589639-ba61062088-0-ea6d067898751070f357650002f226c5b25c2f8fc913d978314785e377a19e7a"
      }
    ],
    "is_latest": false,
    "upgrade_model_id": 9
  },
  {
    "id": 2,
    "name": "iPhone 12",
    "brand": "Apple",
    "chip_name": "A14",
    "chip_generation": 2,
    "release_year": 2020,
    "support_until_year": 2026,
    "battery_cycle_standard": 500,
    "reference_score": 2800,
    "image_url": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "机身": {
        "配色": "黑 / 白 / 红 / 绿 / 蓝 / 紫",
        "机身材质": "铝金属边框 + 超瓷晶面板",
        "防护等级": "IP68",
        "尺寸与重量": "146.7×71.5×7.4 mm，162 克"
      },
      "芯片": {
        "制程工艺": "5nm",
        "芯片型号": "A14 仿生",
        "中央处理器": "6 核",
        "图形处理器": "4 核",
        "神经网络引擎": "16 核"
      },
      "摄像头": {
        "长焦": "无",
        "超广角": "1200 万像素 ƒ/2.4",
        "后置主摄": "1200 万像素 ƒ/1.6（OIS）",
        "视频拍摄": "4K 60fps 杜比视界 HDR",
        "前置摄像头": "1200 万像素 ƒ/2.2"
      },
      "显示屏": {
        "亮度": "800 尼特典型 / 1200 尼特峰值 (HDR)",
        "刷新率": "60Hz",
        "屏幕尺寸": "6.1 英寸",
        "屏幕类型": "超视网膜 XDR (OLED)",
        "全面屏设计": "刘海屏",
        "分辨率与像素密度": "2532×1170，460 ppi"
      },
      "内存与存储": {
        "存储容量": "64 / 128 / 256GB",
        "运行内存": "4GB"
      },
      "电池与充电": {
        "无线充电": "MagSafe 15W / Qi",
        "有线快充": "20W（约 30 分钟充至 50%）",
        "电池容量": "2815 mAh",
        "视频播放": "最长 17 小时"
      },
      "连接与其他": {
        "接口": "Lightning",
        "无线连接": "Wi-Fi 6，蓝牙 5.0",
        "生物识别": "面容 ID",
        "移动网络": "5G（sub-6GHz）",
        "蜂窝基带": "高通",
        "首发系统": "iOS 14"
      }
    },
    "colors": [
      {
        "hex": "#D0C2E8",
        "name": "紫色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-12-purple-select-2021?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#B7E3C3",
        "name": "绿色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-12-green-select-2020?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#64708F",
        "name": "蓝色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-12-blue-select-2020?wid=640&hei=756&fmt=png-alpha"
      }
    ],
    "is_latest": false,
    "upgrade_model_id": 9
  },
  {
    "id": 3,
    "name": "iPhone 13",
    "brand": "Apple",
    "chip_name": "A15",
    "chip_generation": 3,
    "release_year": 2021,
    "support_until_year": 2027,
    "battery_cycle_standard": 500,
    "reference_score": 3300,
    "image_url": "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "机身": {
        "配色": "粉 / 蓝 / 午夜色 / 星光色 / 红",
        "机身材质": "铝金属边框 + 超瓷晶面板",
        "防护等级": "IP68",
        "尺寸与重量": "146.7×71.5×7.65 mm，173 克"
      },
      "芯片": {
        "制程工艺": "5nm",
        "芯片型号": "A15 仿生",
        "中央处理器": "6 核",
        "图形处理器": "4 核",
        "神经网络引擎": "16 核"
      },
      "摄像头": {
        "长焦": "无（2 倍光学品质变焦）",
        "超广角": "1200 万像素 ƒ/2.4",
        "后置主摄": "1200 万像素 ƒ/1.6（传感器位移式 OIS）",
        "视频拍摄": "4K 60fps 杜比视界 + 电影效果模式",
        "前置摄像头": "1200 万像素 ƒ/2.2"
      },
      "显示屏": {
        "亮度": "800 尼特典型 / 1200 尼特峰值 (HDR)",
        "刷新率": "60Hz",
        "屏幕尺寸": "6.1 英寸",
        "屏幕类型": "超视网膜 XDR (OLED)",
        "全面屏设计": "刘海屏",
        "分辨率与像素密度": "2532×1170，460 ppi"
      },
      "内存与存储": {
        "存储容量": "128 / 256 / 512GB",
        "运行内存": "4GB"
      },
      "电池与充电": {
        "无线充电": "MagSafe 15W / Qi",
        "有线快充": "20W（约 30 分钟充至 50%）",
        "电池容量": "3227 mAh",
        "视频播放": "最长 19 小时"
      },
      "连接与其他": {
        "接口": "Lightning",
        "无线连接": "Wi-Fi 6，蓝牙 5.0",
        "生物识别": "面容 ID",
        "移动网络": "5G（sub-6GHz）",
        "蜂窝基带": "高通 X60",
        "首发系统": "iOS 15"
      }
    },
    "colors": [
      {
        "hex": "#F6DDE2",
        "name": "粉色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-13-pink-select-2021?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#A7C1D9",
        "name": "蓝色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-13-blue-select-2021?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#1D1D1F",
        "name": "午夜色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-13-midnight-select-2021?wid=640&hei=756&fmt=png-alpha"
      }
    ],
    "is_latest": false,
    "upgrade_model_id": 9
  },
  {
    "id": 4,
    "name": "iPhone 14",
    "brand": "Apple",
    "chip_name": "A15",
    "chip_generation": 3,
    "release_year": 2022,
    "support_until_year": 2028,
    "battery_cycle_standard": 500,
    "reference_score": 3300,
    "image_url": "https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "机身": {
        "配色": "午夜色 / 星光色 / 蓝 / 紫 / 黄",
        "机身材质": "铝金属边框 + 超瓷晶面板",
        "防护等级": "IP68",
        "尺寸与重量": "146.7×71.5×7.8 mm，172 克"
      },
      "芯片": {
        "制程工艺": "5nm",
        "芯片型号": "A15 仿生（5 核 GPU）",
        "中央处理器": "6 核",
        "图形处理器": "5 核",
        "神经网络引擎": "16 核"
      },
      "摄像头": {
        "长焦": "无",
        "超广角": "1200 万像素 ƒ/2.4",
        "后置主摄": "1200 万像素 ƒ/1.5（OIS）",
        "视频拍摄": "4K 60fps + 运动模式",
        "前置摄像头": "1200 万像素 ƒ/1.9（自动对焦）"
      },
      "显示屏": {
        "亮度": "800 尼特典型 / 1200 尼特峰值 (HDR)",
        "刷新率": "60Hz",
        "屏幕尺寸": "6.1 英寸",
        "屏幕类型": "超视网膜 XDR (OLED)",
        "全面屏设计": "刘海屏",
        "分辨率与像素密度": "2532×1170，460 ppi"
      },
      "内存与存储": {
        "存储容量": "128 / 256 / 512GB",
        "运行内存": "6GB"
      },
      "电池与充电": {
        "无线充电": "MagSafe 15W / Qi",
        "有线快充": "20W（约 30 分钟充至 50%）",
        "电池容量": "3279 mAh",
        "视频播放": "最长 20 小时"
      },
      "连接与其他": {
        "接口": "Lightning",
        "其他特性": "车祸检测，卫星 SOS",
        "无线连接": "Wi-Fi 6，蓝牙 5.3",
        "生物识别": "面容 ID",
        "移动网络": "5G（sub-6GHz）",
        "蜂窝基带": "高通 X65",
        "首发系统": "iOS 16"
      }
    },
    "colors": [
      {
        "hex": "#C8BFD9",
        "name": "紫色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-14-purple-select-202209?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#F6E7A9",
        "name": "黄色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-14-yellow-select-202303?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#9BB0C8",
        "name": "蓝色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-14-blue-select-202209?wid=640&hei=756&fmt=png-alpha"
      }
    ],
    "is_latest": false,
    "upgrade_model_id": 9
  },
  {
    "id": 5,
    "name": "iPhone 15",
    "brand": "Apple",
    "chip_name": "A16",
    "chip_generation": 4,
    "release_year": 2023,
    "support_until_year": 2029,
    "battery_cycle_standard": 1000,
    "reference_score": 3600,
    "image_url": "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "机身": {
        "配色": "粉 / 黄 / 绿 / 蓝 / 黑",
        "机身材质": "铝金属边框 + 熔色玻璃背板",
        "防护等级": "IP68",
        "尺寸与重量": "147.6×71.6×7.8 mm，171 克"
      },
      "芯片": {
        "制程工艺": "4nm",
        "芯片型号": "A16 仿生",
        "中央处理器": "6 核",
        "图形处理器": "5 核",
        "神经网络引擎": "16 核"
      },
      "摄像头": {
        "长焦": "无（2 倍光学品质变焦）",
        "超广角": "1200 万像素 ƒ/2.4",
        "后置主摄": "4800 万像素 ƒ/1.6（OIS）",
        "视频拍摄": "4K 60fps 杜比视界",
        "前置摄像头": "1200 万像素 ƒ/1.9"
      },
      "显示屏": {
        "亮度": "1000 尼特典型 / 2000 尼特户外峰值",
        "刷新率": "60Hz",
        "屏幕尺寸": "6.1 英寸",
        "屏幕类型": "超视网膜 XDR (OLED)",
        "全面屏设计": "灵动岛",
        "分辨率与像素密度": "2556×1179，460 ppi"
      },
      "内存与存储": {
        "存储容量": "128 / 256 / 512GB",
        "运行内存": "6GB"
      },
      "电池与充电": {
        "无线充电": "MagSafe 15W / Qi2",
        "有线快充": "20W（约 30 分钟充至 50%）",
        "电池容量": "3349 mAh",
        "视频播放": "最长 20 小时"
      },
      "连接与其他": {
        "接口": "USB-C（USB 2）",
        "无线连接": "Wi-Fi 6，蓝牙 5.3",
        "生物识别": "面容 ID",
        "移动网络": "5G",
        "蜂窝基带": "高通 X70",
        "首发系统": "iOS 17"
      }
    },
    "colors": [
      {
        "hex": "#FBE0E2",
        "name": "粉色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-15-pink-select-202309?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#D3DAE1",
        "name": "蓝色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-15-blue-select-202309?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#F6E9B6",
        "name": "黄色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-15-yellow-select-202309?wid=640&hei=756&fmt=png-alpha"
      }
    ],
    "is_latest": false,
    "upgrade_model_id": 9
  },
  {
    "id": 6,
    "name": "iPhone 15 Pro",
    "brand": "Apple",
    "chip_name": "A17 Pro",
    "chip_generation": 5,
    "release_year": 2023,
    "support_until_year": 2029,
    "battery_cycle_standard": 1000,
    "reference_score": 4200,
    "image_url": "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "机身": {
        "配色": "原色钛 / 蓝色钛 / 白色钛 / 黑色钛",
        "机身材质": "钛金属边框 + 超瓷晶面板",
        "防护等级": "IP68",
        "尺寸与重量": "146.6×70.6×8.25 mm，187 克"
      },
      "芯片": {
        "制程工艺": "3nm",
        "芯片型号": "A17 Pro",
        "中央处理器": "6 核",
        "图形处理器": "6 核（硬件加速光线追踪）",
        "神经网络引擎": "16 核"
      },
      "摄像头": {
        "长焦": "1200 万像素 3 倍光学变焦 ƒ/2.8（77mm）",
        "超广角": "1200 万像素 ƒ/2.2（微距）",
        "后置主摄": "4800 万像素 ƒ/1.78（OIS）",
        "视频拍摄": "4K 60fps ProRes / Log",
        "前置摄像头": "1200 万像素 ƒ/1.9"
      },
      "显示屏": {
        "亮度": "1000 尼特典型 / 2000 尼特户外峰值",
        "刷新率": "ProMotion 120Hz 自适应 + 全天候显示",
        "屏幕尺寸": "6.1 英寸",
        "屏幕类型": "超视网膜 XDR (OLED)",
        "全面屏设计": "灵动岛",
        "分辨率与像素密度": "2556×1179，460 ppi"
      },
      "内存与存储": {
        "存储容量": "128 / 256 / 512GB / 1TB",
        "运行内存": "8GB"
      },
      "电池与充电": {
        "无线充电": "MagSafe 15W / Qi2",
        "有线快充": "20W（USB-C 3，约 30 分钟充至 50%）",
        "电池容量": "3274 mAh",
        "视频播放": "最长 23 小时"
      },
      "连接与其他": {
        "接口": "USB-C（USB 3，10Gb/s）",
        "其他特性": "动作按钮",
        "无线连接": "Wi-Fi 6E，蓝牙 5.3",
        "生物识别": "面容 ID",
        "移动网络": "5G",
        "蜂窝基带": "高通 X70",
        "首发系统": "iOS 17"
      }
    },
    "colors": [
      {
        "hex": "#8E8B8E",
        "name": "原色钛金属",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#39485D",
        "name": "蓝色钛金属",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-bluetitanium?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#E8E4DC",
        "name": "白色钛金属",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-whitetitanium?wid=640&hei=756&fmt=png-alpha"
      }
    ],
    "is_latest": false,
    "upgrade_model_id": 14
  },
  {
    "id": 7,
    "name": "iPhone 16",
    "brand": "Apple",
    "chip_name": "A18",
    "chip_generation": 6,
    "release_year": 2024,
    "support_until_year": 2030,
    "battery_cycle_standard": 1000,
    "reference_score": 4500,
    "image_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "机身": {
        "配色": "黑 / 白 / 粉 / 青绿色 / 群青色",
        "机身材质": "铝金属边框 + 熔色玻璃背板",
        "防护等级": "IP68",
        "尺寸与重量": "147.6×71.6×7.8 mm，170 克"
      },
      "芯片": {
        "制程工艺": "3nm",
        "芯片型号": "A18",
        "中央处理器": "6 核",
        "图形处理器": "5 核",
        "神经网络引擎": "16 核（支持 Apple 智能）"
      },
      "摄像头": {
        "长焦": "无（2 倍光学品质变焦）",
        "超广角": "1200 万像素 ƒ/2.2（微距）",
        "后置主摄": "4800 万像素融合式 ƒ/1.6",
        "视频拍摄": "4K 60fps 杜比视界",
        "前置摄像头": "1200 万像素 ƒ/1.9"
      },
      "显示屏": {
        "亮度": "1000 尼特典型 / 2000 尼特户外峰值",
        "刷新率": "60Hz",
        "屏幕尺寸": "6.1 英寸",
        "屏幕类型": "超视网膜 XDR (OLED)",
        "全面屏设计": "灵动岛",
        "分辨率与像素密度": "2556×1179，460 ppi"
      },
      "内存与存储": {
        "存储容量": "128 / 256 / 512GB",
        "运行内存": "8GB"
      },
      "电池与充电": {
        "无线充电": "MagSafe 25W（Qi2）",
        "有线快充": "20W（约 30 分钟充至 50%）",
        "电池容量": "3561 mAh",
        "视频播放": "最长 22 小时"
      },
      "连接与其他": {
        "接口": "USB-C（USB 2）",
        "其他特性": "相机控制按钮",
        "无线连接": "Wi-Fi 7，蓝牙 5.3",
        "生物识别": "面容 ID",
        "移动网络": "5G",
        "蜂窝基带": "高通",
        "首发系统": "iOS 18"
      }
    },
    "colors": [
      {
        "hex": "#5871C7",
        "name": "群青色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-16-ultramarine-select-202409?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#A8CCC9",
        "name": "青绿色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-16-teal-select-202409?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#EEB8C6",
        "name": "粉色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-16-pink-select-202409?wid=640&hei=756&fmt=png-alpha"
      }
    ],
    "is_latest": false,
    "upgrade_model_id": 9
  },
  {
    "id": 8,
    "name": "iPhone 16 Pro",
    "brand": "Apple",
    "chip_name": "A18 Pro",
    "chip_generation": 6,
    "release_year": 2024,
    "support_until_year": 2030,
    "battery_cycle_standard": 1000,
    "reference_score": 4600,
    "image_url": "https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "机身": {
        "配色": "黑色钛 / 白色钛 / 原色钛 / 沙漠钛",
        "机身材质": "钛金属边框 + 超瓷晶面板",
        "防护等级": "IP68",
        "尺寸与重量": "149.6×71.5×8.25 mm，199 克"
      },
      "芯片": {
        "制程工艺": "3nm",
        "芯片型号": "A18 Pro",
        "中央处理器": "6 核",
        "图形处理器": "6 核（硬件加速光线追踪）",
        "神经网络引擎": "16 核（支持 Apple 智能）"
      },
      "摄像头": {
        "长焦": "1200 万像素 5 倍光学变焦 ƒ/2.8（120mm）",
        "超广角": "4800 万像素 ƒ/2.2（微距）",
        "后置主摄": "4800 万像素 ƒ/1.78（OIS）",
        "视频拍摄": "4K 120fps 杜比视界",
        "前置摄像头": "1200 万像素 ƒ/1.9"
      },
      "显示屏": {
        "亮度": "1000 尼特典型 / 2000 尼特户外峰值",
        "刷新率": "ProMotion 120Hz 自适应 + 全天候显示",
        "屏幕尺寸": "6.3 英寸",
        "屏幕类型": "超视网膜 XDR (OLED)",
        "全面屏设计": "灵动岛",
        "分辨率与像素密度": "2622×1206，460 ppi"
      },
      "内存与存储": {
        "存储容量": "128 / 256 / 512GB / 1TB",
        "运行内存": "8GB"
      },
      "电池与充电": {
        "无线充电": "MagSafe 25W（Qi2）",
        "有线快充": "20W（约 30 分钟充至 50%）",
        "电池容量": "3582 mAh",
        "视频播放": "最长 27 小时"
      },
      "连接与其他": {
        "接口": "USB-C（USB 3，10Gb/s）",
        "其他特性": "相机控制按钮",
        "无线连接": "Wi-Fi 7，蓝牙 5.3",
        "生物识别": "面容 ID",
        "移动网络": "5G",
        "蜂窝基带": "高通",
        "首发系统": "iOS 18"
      }
    },
    "colors": [
      {
        "hex": "#C8A882",
        "name": "沙漠色钛金属",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-deserttitanium?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#BEB6AB",
        "name": "原色钛金属",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-naturaltitanium?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#35373A",
        "name": "黑色钛金属",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-blacktitanium?wid=640&hei=756&fmt=png-alpha"
      }
    ],
    "is_latest": false,
    "upgrade_model_id": 14
  },
  {
    "id": 9,
    "name": "iPhone 17",
    "brand": "Apple",
    "chip_name": "A19",
    "chip_generation": 7,
    "release_year": 2025,
    "support_until_year": 2031,
    "battery_cycle_standard": 1000,
    "reference_score": 4900,
    "image_url": "https://images.unsplash.com/photo-1586300154759-9ec5b3e6f2d8?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "机身": {
        "配色": "薰衣草色 / 雾蓝色 / 鼠尾草绿 / 白 / 黑",
        "机身材质": "铝金属一体成型机身",
        "防护等级": "IP68",
        "尺寸与重量": "149.6×71.95×7.95 mm，177 克"
      },
      "芯片": {
        "制程工艺": "3nm",
        "芯片型号": "A19",
        "中央处理器": "6 核",
        "图形处理器": "5 核（神经网络加速器）",
        "神经网络引擎": "16 核（支持 Apple 智能）"
      },
      "摄像头": {
        "长焦": "无（2 倍光学品质变焦）",
        "超广角": "4800 万像素融合式 ƒ/2.2（微距）",
        "后置主摄": "4800 万像素融合式 ƒ/1.6",
        "视频拍摄": "4K 60fps 杜比视界",
        "前置摄像头": "1800 万像素 Center Stage ƒ/1.9"
      },
      "显示屏": {
        "亮度": "1000 尼特典型 / 3000 尼特户外峰值",
        "刷新率": "ProMotion 120Hz 自适应 + 全天候显示",
        "屏幕尺寸": "6.3 英寸",
        "屏幕类型": "超视网膜 XDR (OLED)",
        "全面屏设计": "灵动岛",
        "分辨率与像素密度": "2622×1206，460 ppi"
      },
      "内存与存储": {
        "存储容量": "256 / 512GB",
        "运行内存": "8GB"
      },
      "电池与充电": {
        "无线充电": "MagSafe 25W（Qi2）",
        "有线快充": "20W（约 30 分钟充至 50%）",
        "电池容量": "3692 mAh",
        "视频播放": "最长 30 小时"
      },
      "连接与其他": {
        "接口": "USB-C",
        "其他特性": "相机控制按钮",
        "无线连接": "Wi-Fi 7，蓝牙 6，Apple N1 无线芯片",
        "生物识别": "面容 ID",
        "移动网络": "5G",
        "蜂窝基带": "高通",
        "首发系统": "iOS 26"
      }
    },
    "colors": [
      {
        "hex": "#AECBDD",
        "name": "迷雾蓝",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-finish-select-mistblue-202509?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#D8C7E8",
        "name": "薰衣草紫",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-finish-select-lavender-202509?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#AFBFAE",
        "name": "鼠尾草绿",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-finish-select-sage-202509?wid=640&hei=756&fmt=png-alpha"
      }
    ],
    "is_latest": false,
    "upgrade_model_id": 14
  },
  {
    "id": 10,
    "name": "iPhone 17 Pro",
    "brand": "Apple",
    "chip_name": "A19 Pro",
    "chip_generation": 7,
    "release_year": 2025,
    "support_until_year": 2031,
    "battery_cycle_standard": 1000,
    "reference_score": 5200,
    "image_url": "https://images.unsplash.com/photo-1587590227264-0ac64ce63ce8?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "机身": {
        "配色": "星宇橙 / 深蓝色 / 银色 / 深黑色",
        "机身材质": "铝金属一体成型 + 雾面玻璃背板",
        "防护等级": "IP68",
        "尺寸与重量": "150.0×71.9×8.75 mm，206 克"
      },
      "芯片": {
        "散热": "VC 均热板散热",
        "制程工艺": "3nm",
        "芯片型号": "A19 Pro",
        "中央处理器": "6 核",
        "图形处理器": "6 核",
        "神经网络引擎": "16 核（支持 Apple 智能）"
      },
      "摄像头": {
        "长焦": "4800 万像素 4 倍光学变焦 ƒ/2.8（100mm，8 倍光学品质变焦）",
        "超广角": "4800 万像素融合式 ƒ/2.2",
        "后置主摄": "4800 万像素融合式 ƒ/1.78",
        "视频拍摄": "4K 120fps 杜比视界（ProRes RAW / Genlock）",
        "前置摄像头": "1800 万像素 Center Stage ƒ/1.9"
      },
      "显示屏": {
        "亮度": "1000 尼特典型 / 3000 尼特户外峰值",
        "刷新率": "ProMotion 120Hz 自适应 + 全天候显示",
        "屏幕尺寸": "6.3 英寸",
        "屏幕类型": "超视网膜 XDR (OLED)",
        "全面屏设计": "灵动岛",
        "分辨率与像素密度": "2622×1206，460 ppi"
      },
      "内存与存储": {
        "存储容量": "256 / 512GB / 1TB",
        "运行内存": "12GB"
      },
      "电池与充电": {
        "无线充电": "MagSafe 25W（Qi2）",
        "有线快充": "40W（约 20 分钟充至 50%）",
        "电池容量": "3998 mAh",
        "视频播放": "最长 33 小时"
      },
      "连接与其他": {
        "接口": "USB-C（USB 3，10Gb/s）",
        "其他特性": "相机控制 + 动作按钮",
        "无线连接": "Wi-Fi 7，蓝牙 6，Apple N1 无线芯片",
        "生物识别": "面容 ID",
        "移动网络": "5G",
        "蜂窝基带": "高通",
        "首发系统": "iOS 26"
      }
    },
    "colors": [
      {
        "hex": "#F97A2F",
        "name": "宇宙橙色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-pro-finish-select-cosmicorange-202509?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#223C63",
        "name": "深蓝色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-pro-finish-select-deepblue-202509?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#E8E8E6",
        "name": "银色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-pro-finish-select-silver-202509?wid=640&hei=756&fmt=png-alpha"
      }
    ],
    "is_latest": false,
    "upgrade_model_id": 14
  },
  {
    "id": 11,
    "name": "iPhone 17 Pro Max",
    "brand": "Apple",
    "chip_name": "A19 Pro",
    "chip_generation": 7,
    "release_year": 2025,
    "support_until_year": 2031,
    "battery_cycle_standard": 1000,
    "reference_score": 5200,
    "image_url": "https://images.unsplash.com/photo-1607936854279-55e8a4c64888?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "机身": {
        "配色": "星宇橙 / 深蓝色 / 银色 / 深黑色",
        "机身材质": "铝金属一体成型 + 雾面玻璃背板",
        "防护等级": "IP68",
        "尺寸与重量": "163.4×78.0×8.75 mm，233 克"
      },
      "芯片": {
        "散热": "VC 均热板散热",
        "制程工艺": "3nm",
        "芯片型号": "A19 Pro",
        "中央处理器": "6 核",
        "图形处理器": "6 核",
        "神经网络引擎": "16 核（支持 Apple 智能）"
      },
      "摄像头": {
        "长焦": "4800 万像素 4 倍光学变焦 ƒ/2.8（100mm，8 倍光学品质变焦）",
        "超广角": "4800 万像素融合式 ƒ/2.2",
        "后置主摄": "4800 万像素融合式 ƒ/1.78",
        "视频拍摄": "4K 120fps 杜比视界（ProRes RAW / Genlock）",
        "前置摄像头": "1800 万像素 Center Stage ƒ/1.9"
      },
      "显示屏": {
        "亮度": "1000 尼特典型 / 3000 尼特户外峰值",
        "刷新率": "ProMotion 120Hz 自适应 + 全天候显示",
        "屏幕尺寸": "6.9 英寸",
        "屏幕类型": "超视网膜 XDR (OLED)",
        "全面屏设计": "灵动岛",
        "分辨率与像素密度": "2868×1320，460 ppi"
      },
      "内存与存储": {
        "存储容量": "256 / 512GB / 2TB",
        "运行内存": "12GB"
      },
      "电池与充电": {
        "无线充电": "MagSafe 25W（Qi2）",
        "有线快充": "40W（约 20 分钟充至 50%）",
        "电池容量": "4823 mAh",
        "视频播放": "最长 39 小时"
      },
      "连接与其他": {
        "接口": "USB-C（USB 3，10Gb/s）",
        "其他特性": "相机控制 + 动作按钮",
        "无线连接": "Wi-Fi 7，蓝牙 6，Apple N1 无线芯片",
        "生物识别": "面容 ID",
        "移动网络": "5G",
        "蜂窝基带": "高通",
        "首发系统": "iOS 26"
      }
    },
    "colors": [
      {
        "hex": "#F97A2F",
        "name": "宇宙橙色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-pro-max-finish-select-cosmicorange-202509?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#223C63",
        "name": "深蓝色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-pro-max-finish-select-deepblue-202509?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#E8E8E6",
        "name": "银色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-pro-max-finish-select-silver-202509?wid=640&hei=756&fmt=png-alpha"
      }
    ],
    "is_latest": false,
    "upgrade_model_id": 15
  },
  {
    "id": 12,
    "name": "iPhone Air",
    "brand": "Apple",
    "chip_name": "A19 Pro",
    "chip_generation": 7,
    "release_year": 2025,
    "support_until_year": 2031,
    "battery_cycle_standard": 1000,
    "reference_score": 5200,
    "image_url": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "机身": {
        "配色": "天空蓝 / 浅金色 / 云白色 / 深黑色",
        "机身材质": "钛金属框架 + 铝金属一体成型机身",
        "防护等级": "IP68",
        "尺寸与重量": "156.2×74.7×5.64 mm，165 克"
      },
      "芯片": {
        "制程工艺": "3nm",
        "芯片型号": "A19 Pro",
        "中央处理器": "6 核",
        "图形处理器": "6 核",
        "神经网络引擎": "16 核（支持 Apple 智能）"
      },
      "摄像头": {
        "长焦": "无（2 倍光学品质变焦）",
        "超广角": "无",
        "后置主摄": "4800 万像素融合式 ƒ/1.65",
        "视频拍摄": "4K 60fps 杜比视界",
        "前置摄像头": "1800 万像素 Center Stage ƒ/1.9"
      },
      "显示屏": {
        "亮度": "1000 尼特典型 / 3000 尼特户外峰值",
        "刷新率": "ProMotion 120Hz 自适应 + 全天候显示",
        "屏幕尺寸": "6.5 英寸",
        "屏幕类型": "超视网膜 XDR (OLED)",
        "全面屏设计": "灵动岛",
        "分辨率与像素密度": "2736×1260，460 ppi"
      },
      "内存与存储": {
        "存储容量": "256 / 512GB / 1TB",
        "运行内存": "8GB"
      },
      "电池与充电": {
        "无线充电": "MagSafe 25W（Qi2）",
        "有线快充": "约 30 分钟充至 50%",
        "电池容量": "3149 mAh",
        "视频播放": "最长 27 小时"
      },
      "连接与其他": {
        "接口": "USB-C",
        "无线连接": "Wi-Fi 7，蓝牙 6，Apple N1 无线芯片",
        "生物识别": "面容 ID",
        "移动网络": "5G（仅 eSIM）",
        "蜂窝基带": "Apple C1X",
        "首发系统": "iOS 26"
      }
    },
    "colors": [
      {
        "hex": "#BFD7EA",
        "name": "天蓝色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-air-finish-select-skyblue-202509?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#EFE0B8",
        "name": "浅金色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-air-finish-select-lightgold-202509?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#2B2B2E",
        "name": "深空黑",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-air-finish-select-spaceblack-202509?wid=640&hei=756&fmt=png-alpha"
      }
    ],
    "is_latest": false,
    "upgrade_model_id": 14
  },
  {
    "id": 13,
    "name": "iPhone 17e",
    "brand": "Apple",
    "chip_name": "A19",
    "chip_generation": 7,
    "release_year": 2026,
    "support_until_year": 2032,
    "battery_cycle_standard": 1000,
    "reference_score": 4900,
    "image_url": "https://images.unsplash.com/photo-1592286927505-1def25115558?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "机身": {
        "配色": "黑 / 白 / 浅粉色",
        "机身材质": "铝金属边框 + 超瓷晶面板 2 + 玻璃背板",
        "防护等级": "IP68（6 米水深）",
        "尺寸与重量": "146.7×71.5×7.80 mm，170 克"
      },
      "芯片": {
        "制程工艺": "3nm",
        "芯片型号": "A19",
        "中央处理器": "6 核",
        "图形处理器": "4 核（神经网络加速器）",
        "神经网络引擎": "16 核（支持 Apple 智能，硬件光追）"
      },
      "摄像头": {
        "长焦": "无（最高 10 倍数码变焦）",
        "超广角": "无",
        "后置主摄": "4800 万像素融合式 ƒ/1.6（OIS，2 倍光学品质变焦）",
        "视频拍摄": "4K 60fps 杜比视界",
        "前置摄像头": "1200 万像素原深感 ƒ/1.9"
      },
      "显示屏": {
        "亮度": "800 尼特典型 / 1200 尼特峰值 (HDR)",
        "刷新率": "60Hz",
        "屏幕尺寸": "6.1 英寸",
        "屏幕类型": "超视网膜 XDR (OLED)",
        "全面屏设计": "刘海屏（七层抗反射涂层）",
        "分辨率与像素密度": "2532×1170，460 ppi"
      },
      "内存与存储": {
        "存储容量": "256 / 512GB",
        "运行内存": "8GB"
      },
      "电池与充电": {
        "无线充电": "MagSafe 15W（Qi2）",
        "有线快充": "约 30 分钟充至 50%",
        "视频播放": "最长 26 小时"
      },
      "连接与其他": {
        "接口": "USB-C",
        "其他特性": "操作按钮",
        "无线连接": "Wi-Fi 7，蓝牙 6，Apple N1 无线芯片",
        "生物识别": "面容 ID",
        "移动网络": "5G",
        "蜂窝基带": "Apple C1X",
        "首发系统": "iOS 26"
      }
    },
    "colors": [
      {
        "hex": "#3A3A3C",
        "name": "黑色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17e-finish-select-black-202603?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#F5F2EC",
        "name": "白色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17e-finish-select-white-202603?wid=640&hei=756&fmt=png-alpha"
      }
    ],
    "is_latest": false,
    "upgrade_model_id": 14
  },
  {
    "id": 14,
    "name": "iPhone 18 Pro",
    "brand": "Apple",
    "chip_name": "A20 Pro",
    "chip_generation": 8,
    "release_year": 2026,
    "support_until_year": 2032,
    "battery_cycle_standard": 1000,
    "reference_score": 6000,
    "image_url": "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "机身": {
        "配色": "勃艮第酒红 / 冰川蓝 / 银色 / 黑色",
        "机身材质": "铝金属一体成型（85% 再生铝）+ 超瓷晶面板 2",
        "防护等级": "IP68",
        "尺寸与重量": "150.0×71.9×8.75 mm，211 克"
      },
      "芯片": {
        "散热": "VC 均热板（面积 3 倍于 17 Pro）",
        "制程工艺": "2nm",
        "芯片型号": "A20 Pro",
        "中央处理器": "6 核（2 性能 + 4 能效）",
        "图形处理器": "7 核（神经网络加速器）",
        "神经网络引擎": "双 16 核（32 核，硬件光追）"
      },
      "摄像头": {
        "长焦": "4800 万像素融合式 4 倍光学变焦（8 倍光学品质 / 最高 24 倍数码）",
        "超广角": "4800 万像素融合式 ƒ/2.2",
        "后置主摄": "4800 万像素融合式（四档可变光圈 ƒ/1.48 / ƒ/1.8 / ƒ/2.8 / ƒ/4.0）",
        "视频拍摄": "4K 120fps 杜比视界（Apple Log 2 / ProRes RAW / Genlock）",
        "前置摄像头": "1800 万像素 Center Stage ƒ/1.9"
      },
      "显示屏": {
        "亮度": "1000 尼特典型 / 1600 尼特 (HDR) / 3000 尼特户外峰值",
        "刷新率": "ProMotion 120Hz 自适应 + 全天候显示",
        "屏幕尺寸": "6.3 英寸",
        "屏幕类型": "超视网膜 XDR (OLED)",
        "全面屏设计": "灵动岛（面积缩小，抗反射涂层）",
        "分辨率与像素密度": "2622×1206，460 ppi"
      },
      "内存与存储": {
        "存储容量": "256 / 512GB / 1TB / 2TB",
        "运行内存": "12GB"
      },
      "电池与充电": {
        "无线充电": "MagSafe 25W（Qi2）",
        "有线快充": "60W（约 15 分钟充至 50%）",
        "电池容量": "4056 mAh",
        "视频播放": "最长 36 小时（流媒体 31 小时）"
      },
      "连接与其他": {
        "接口": "USB-C（USB 3）",
        "其他特性": "相机控制 + 动作按钮",
        "无线连接": "Wi-Fi 7，蓝牙 6，Apple N1 无线芯片，第二代超宽带",
        "生物识别": "面容 ID",
        "移动网络": "5G",
        "蜂窝基带": "Apple C2",
        "首发系统": "iOS 27"
      }
    },
    "colors": [
      {
        "hex": "#6B1F2A",
        "name": "勃艮第酒红",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-18-pro-finish-select-burgundy-202609?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#B8D2DE",
        "name": "冰川蓝",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-18-pro-finish-select-glacier-202609?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#E3E3E1",
        "name": "银色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-18-pro-finish-select-silver-202609?wid=640&hei=756&fmt=png-alpha"
      }
    ],
    "is_latest": true,
    "upgrade_model_id": null
  },
  {
    "id": 15,
    "name": "iPhone 18 Pro Max",
    "brand": "Apple",
    "chip_name": "A20 Pro",
    "chip_generation": 8,
    "release_year": 2026,
    "support_until_year": 2032,
    "battery_cycle_standard": 1000,
    "reference_score": 6000,
    "image_url": "https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "机身": {
        "配色": "勃艮第酒红 / 冰川蓝 / 银色 / 黑色",
        "机身材质": "铝金属一体成型（85% 再生铝）+ 超瓷晶面板 2",
        "防护等级": "IP68",
        "尺寸与重量": "249 克（厚度 8.75 mm）"
      },
      "芯片": {
        "散热": "VC 均热板（面积 3 倍于 17 Pro Max）",
        "制程工艺": "2nm",
        "芯片型号": "A20 Pro",
        "中央处理器": "6 核（2 性能 + 4 能效）",
        "图形处理器": "7 核（神经网络加速器）",
        "神经网络引擎": "双 16 核（32 核，硬件光追）"
      },
      "摄像头": {
        "长焦": "4800 万像素融合式 4 倍光学变焦（8 倍光学品质 / 最高 24 倍数码）",
        "超广角": "4800 万像素融合式 ƒ/2.2",
        "后置主摄": "4800 万像素融合式（四档可变光圈 ƒ/1.48 / ƒ/1.8 / ƒ/2.8 / ƒ/4.0）",
        "视频拍摄": "4K 120fps 杜比视界（Apple Log 2 / ProRes RAW / Genlock）",
        "前置摄像头": "1800 万像素 Center Stage ƒ/1.9"
      },
      "显示屏": {
        "亮度": "1000 尼特典型 / 1600 尼特 (HDR) / 3000 尼特户外峰值",
        "刷新率": "ProMotion 120Hz 自适应 + 全天候显示",
        "屏幕尺寸": "6.9 英寸",
        "屏幕类型": "超视网膜 XDR (OLED)",
        "全面屏设计": "灵动岛（面积缩小，抗反射涂层）",
        "分辨率与像素密度": "2868×1320，460 ppi"
      },
      "内存与存储": {
        "存储容量": "256 / 512GB / 1TB / 2TB",
        "运行内存": "12GB"
      },
      "电池与充电": {
        "无线充电": "MagSafe 25W（Qi2）",
        "有线快充": "60W（约 15 分钟充至 50%）",
        "电池容量": "5391 mAh",
        "视频播放": "最长 43 小时（流媒体 38 小时）"
      },
      "连接与其他": {
        "接口": "USB-C（USB 3）",
        "其他特性": "相机控制 + 动作按钮",
        "无线连接": "Wi-Fi 7，蓝牙 6，Apple N1 无线芯片，第二代超宽带",
        "生物识别": "面容 ID",
        "移动网络": "5G",
        "蜂窝基带": "Apple C2（美版为高通）",
        "首发系统": "iOS 27"
      }
    },
    "colors": [
      {
        "hex": "#6B1F2A",
        "name": "勃艮第酒红",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-18-pro-max-finish-select-burgundy-202609?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#B8D2DE",
        "name": "冰川蓝",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-18-pro-max-finish-select-glacier-202609?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#E3E3E1",
        "name": "银色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-18-pro-max-finish-select-silver-202609?wid=640&hei=756&fmt=png-alpha"
      }
    ],
    "is_latest": true,
    "upgrade_model_id": null
  },
  {
    "id": 16,
    "name": "iPhone Duo",
    "brand": "Apple",
    "chip_name": "A20 Pro",
    "chip_generation": 8,
    "release_year": 2026,
    "support_until_year": 2032,
    "battery_cycle_standard": 1000,
    "reference_score": 6000,
    "image_url": "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "机身": {
        "配色": "星光白 / 夜空色",
        "机身材质": "五级钛金属边框与铰链护壳（镜面抛光）",
        "防护等级": "IP68（6 米水深）",
        "尺寸与重量": "展开约 5.2 mm / 折叠约 11.3 mm，254 克"
      },
      "芯片": {
        "散热": "定制 VC 均热板",
        "制程工艺": "2nm",
        "芯片型号": "A20 Pro",
        "中央处理器": "6 核（2 性能 + 4 能效）",
        "图形处理器": "7 核（神经网络加速器）",
        "神经网络引擎": "双 16 核（32 核，硬件光追）"
      },
      "摄像头": {
        "长焦": "无",
        "超广角": "4800 万像素融合式",
        "后置主摄": "4800 万像素融合式",
        "视频拍摄": "4K 120fps 杜比视界",
        "前置摄像头": "1200 万像素 Center Stage + 屏下摄像头"
      },
      "显示屏": {
        "亮度": "3000 尼特户外峰值",
        "刷新率": "ProMotion 120Hz 自适应 + 全天候显示",
        "屏幕尺寸": "外屏 5.4 英寸 / 内屏 7.6 英寸",
        "屏幕类型": "超视网膜 XDR (OLED，内屏纳米纹理)",
        "全面屏设计": "竖版灵动岛 + 内屏屏下摄像头"
      },
      "内存与存储": {
        "存储容量": "512GB / 1TB",
        "运行内存": "12GB"
      },
      "电池与充电": {
        "无线充电": "MagSafe 15W（Qi2）",
        "有线快充": "60W（约 20 分钟充至 50%）",
        "视频播放": "外屏最长 44 小时 / 内屏最长 31 小时"
      },
      "连接与其他": {
        "接口": "USB-C",
        "其他特性": "支持 Apple Pencil (USB-C)，分屏多任务",
        "无线连接": "Wi-Fi 7，蓝牙 6",
        "生物识别": "侧边 Touch ID（集成于电源键）",
        "移动网络": "5G",
        "首发系统": "iOS 27（折叠定制）"
      }
    },
    "colors": [
      {
        "hex": "#1A1A1E",
        "name": "深空夜色",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-duo-finish-select-night-sky-202609?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#F2F1EC",
        "name": "星光白",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-duo-finish-select-star-white-202609?wid=640&hei=756&fmt=png-alpha"
      }
    ],
    "is_latest": true,
    "upgrade_model_id": null
  }
];
