"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// api/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => handler,
  maxDuration: () => maxDuration
});
module.exports = __toCommonJS(index_exports);

// src/app.ts
var import_express2 = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);

// src/routes/phones.ts
var import_express = require("express");
var import_zod = require("zod");

// src/storage/database/supabase-client.ts
var import_supabase_js = require("@supabase/supabase-js");
var import_child_process = require("child_process");
var import_coze_coding_dev_sdk = require("coze-coding-dev-sdk");
var envLoaded = false;
function loadEnv() {
  if (envLoaded || process.env.COZE_SUPABASE_URL && process.env.COZE_SUPABASE_ANON_KEY) {
    return;
  }
  try {
    try {
      require("dotenv").config();
      if (process.env.COZE_SUPABASE_URL && process.env.COZE_SUPABASE_ANON_KEY) {
        envLoaded = true;
        return;
      }
    } catch {
    }
    const pythonCode = `
import os
import sys
try:
    from coze_workload_identity import Client
    client = Client()
    env_vars = client.get_project_env_vars()
    client.close()
    for env_var in env_vars:
        print(f"{env_var.key}={env_var.value}")
except Exception as e:
    print(f"# Error: {e}", file=sys.stderr)
`;
    const output = (0, import_child_process.execSync)(`python3 -c '${pythonCode.replace(/'/g, `'"'"'`)}'`, {
      encoding: "utf-8",
      timeout: 1e4,
      stdio: ["pipe", "pipe", "pipe"]
    });
    const lines = output.trim().split("\n");
    for (const line of lines) {
      if (line.startsWith("#")) continue;
      const eqIndex = line.indexOf("=");
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex);
        let value = line.substring(eqIndex + 1);
        if (value.startsWith("'") && value.endsWith("'") || value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
    envLoaded = true;
  } catch {
  }
}
function getSupabaseCredentials() {
  loadEnv();
  const url = process.env.COZE_SUPABASE_URL;
  const anonKey = process.env.COZE_SUPABASE_ANON_KEY;
  if (!url) {
    throw new Error("COZE_SUPABASE_URL is not set");
  }
  if (!anonKey) {
    throw new Error("COZE_SUPABASE_ANON_KEY is not set");
  }
  return { url, anonKey };
}
function getSupabaseServiceRoleKey() {
  loadEnv();
  return process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
}
function getSupabaseClient(token) {
  const { url, anonKey } = getSupabaseCredentials();
  let key;
  if (token) {
    key = anonKey;
  } else {
    const serviceRoleKey = getSupabaseServiceRoleKey();
    key = serviceRoleKey ?? anonKey;
  }
  const globalOptions = {};
  if (token) {
    globalOptions.headers = { Authorization: `Bearer ${token}` };
  }
  try {
    const buffer = (0, import_coze_coding_dev_sdk.getReportBuffer)();
    if (buffer) {
      globalOptions.fetch = (0, import_coze_coding_dev_sdk.createWrappedFetch)(buffer, "supabase");
    }
  } catch {
  }
  return (0, import_supabase_js.createClient)(url, key, {
    global: globalOptions,
    db: {
      timeout: 6e4
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// src/services/affiliate/jd-union.ts
var import_node_crypto = require("node:crypto");
var GATEWAY = "https://api.jd.com/routerjson";
var APP_KEY = process.env.JD_UNION_APP_KEY ?? "";
var SECRET_KEY = process.env.JD_UNION_SECRET_KEY ?? "";
var UNION_ID = Number(process.env.JD_UNION_UNION_ID ?? 0);
var POSITION_ID = Number(process.env.JD_UNION_POSITION_ID ?? 0);
function isJdUnionConfigured() {
  return Boolean(APP_KEY && SECRET_KEY && UNION_ID);
}
function beijingTimestamp() {
  const d = new Date(Date.now() + 8 * 3600 * 1e3);
  return d.toISOString().slice(0, 19).replace("T", " ");
}
function sign(params) {
  const sorted = Object.keys(params).sort().map((k) => `${k}${params[k]}`).join("");
  return (0, import_node_crypto.createHash)("md5").update(`${SECRET_KEY}${sorted}${SECRET_KEY}`, "utf8").digest("hex").toUpperCase();
}
async function callApi(method, bizParams) {
  const common = {
    method,
    app_key: APP_KEY,
    timestamp: beijingTimestamp(),
    format: "json",
    v: "1.0",
    sign_method: "md5",
    "360buy_param_json": JSON.stringify(bizParams)
  };
  const body = new URLSearchParams({ ...common, sign: sign(common) }).toString();
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body
  });
  if (!res.ok) throw new Error(`\u4EAC\u4E1C\u8054\u76DF\u7F51\u5173 HTTP ${res.status}`);
  const json = await res.json();
  const nodeKey = `${method.replace(/\./g, "_")}_responce`;
  const node = json?.[nodeKey];
  if (!node || node.code !== "0") {
    throw new Error(node?.zh_desc ?? node?.msg ?? `\u4EAC\u4E1C\u8054\u76DF\u63A5\u53E3 ${method} \u8FD4\u56DE\u5F02\u5E38`);
  }
  const resultKey = Object.keys(node).find((k) => k !== "code" && k !== "zh_desc" && k !== "msg");
  const raw = node?.[resultKey ?? ""];
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}
async function queryGoods(keyword) {
  const result = await callApi("union.open.goods.query", {
    keyword,
    pageIndex: 1,
    pageSize: 8
  });
  const list = result?.list ?? result?.data ?? [];
  return list.map((g) => ({
    skuId: Number(g.skuId),
    goodsName: String(g.goodsName ?? ""),
    price: Number(g.priceInfo?.price ?? g.priceInfo?.lowestPrice ?? 0),
    image: String(
      g.imageInfo?.imageList?.[0]?.url ?? g.imageInfo?.whiteImage ?? ""
    ),
    commission: Number(g.commissionInfo?.commission ?? 0)
  }));
}
async function buildPromotionLink(skuId) {
  const result = await callApi("union.open.promotion.common.get", {
    materialId: `https://item.jd.com/${skuId}.html`,
    unionId: UNION_ID,
    ...POSITION_ID ? { positionId: POSITION_ID } : {}
  });
  const url = String(result?.clickURL ?? "");
  if (!url) throw new Error("\u4EAC\u4E1C\u8054\u76DF\u8F6C\u94FE\u7ED3\u679C\u4E3A\u7A7A");
  return url;
}
async function getJdUnionPurchaseLink(modelName, budget) {
  if (!isJdUnionConfigured()) {
    return { available: false, reason: "jd_union_not_configured" };
  }
  try {
    const goods = await queryGoods(modelName);
    const pool = budget && budget > 0 ? goods.filter((g) => g.price > 0 && g.price <= budget) : goods;
    const target = pool[0];
    if (!target) return { available: false, reason: "no_goods_matched" };
    const url = await buildPromotionLink(target.skuId);
    return {
      available: true,
      platform: "jd_union",
      url,
      goodsTitle: target.goodsName,
      price: target.price,
      image: target.image,
      commission: target.commission
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "\u4EAC\u4E1C\u8054\u76DF\u63A5\u53E3\u8C03\u7528\u5931\u8D25";
    return { available: false, reason: "jd_union_api_error", error: msg };
  }
}

// src/services/affiliate/index.ts
function affiliateConfigured() {
  return isJdUnionConfigured();
}
async function getPurchaseLink(modelName, budget) {
  return getJdUnionPurchaseLink(modelName, budget);
}

// src/services/phone-service.ts
var CURRENT_YEAR = (/* @__PURE__ */ new Date()).getFullYear();
var BATTERY_HEALTH_THRESHOLD = 80;
var USAGE_DEMAND_MAP = {
  social: 3,
  video: 4,
  game: 5,
  photo: 4,
  work: 2,
  web: 2
};
var USAGE_LABELS = {
  social: "\u793E\u4EA4\u901A\u8BAF",
  video: "\u89C6\u9891",
  game: "\u6E38\u620F",
  photo: "\u62CD\u7167\u6444\u5F71",
  work: "\u529E\u516C\u5B66\u4E60",
  web: "\u7F51\u9875\u8D2D\u7269"
};
var USAGE_LABELS_EN = {
  social: "social & messaging",
  video: "video streaming",
  game: "gaming",
  photo: "photo & camera",
  work: "work & study",
  web: "web & shopping"
};
function clamp(v, min = 0, max = 100) {
  return Math.min(max, Math.max(min, v));
}
async function listPhones() {
  const client = getSupabaseClient();
  const { data, error } = await client.from("phone_models").select("*").order("chip_generation", { ascending: true }).order("reference_score", { ascending: true });
  if (error) throw new Error(`\u67E5\u8BE2\u673A\u578B\u5931\u8D25: ${error.message}`);
  return data ?? [];
}
async function getPhoneById(id) {
  const client = getSupabaseClient();
  const { data, error } = await client.from("phone_models").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`\u67E5\u8BE2\u673A\u578B\u5931\u8D25: ${error.message}`);
  return data ?? null;
}
async function getLatestPhone() {
  const client = getSupabaseClient();
  const { data, error } = await client.from("phone_models").select("*").order("chip_generation", { ascending: false }).order("reference_score", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(`\u67E5\u8BE2\u6700\u65B0\u673A\u578B\u5931\u8D25: ${error.message}`);
  if (!data) throw new Error("\u673A\u578B\u6570\u636E\u5E93\u4E3A\u7A7A");
  return data;
}
function chipScoreByGap(gap) {
  if (gap <= 0) return 100;
  if (gap === 1) return 88;
  if (gap === 2) return 76;
  if (gap === 3) return 62;
  if (gap === 4) return 44;
  if (gap === 5) return 28;
  return 14;
}
function supportScoreByYears(remaining) {
  if (remaining >= 4) return 100;
  if (remaining >= 3) return 90;
  if (remaining >= 2) return 72;
  if (remaining >= 1) return 52;
  if (remaining >= 0) return 30;
  return 10;
}
async function analyzeDevice(input) {
  const [device, latest] = await Promise.all([getPhoneById(input.phoneId), getLatestPhone()]);
  if (!device) throw new Error("\u673A\u578B\u4E0D\u5B58\u5728");
  const effectiveBenchmark = input.benchmarkScore && input.benchmarkScore > 0 ? input.benchmarkScore : device.reference_score;
  const chipGap = Math.max(0, latest.chip_generation - device.chip_generation);
  const chipScore = chipScoreByGap(chipGap);
  const remainingSupportYears = device.support_until_year - CURRENT_YEAR;
  const supportScore = supportScoreByYears(remainingSupportYears);
  const rawRatio = latest.reference_score > 0 ? effectiveBenchmark / latest.reference_score : 0;
  const benchmarkRatio = Math.min(1, rawRatio);
  let performanceScore = clamp(benchmarkRatio * 100);
  if (input.smoothness && input.smoothness >= 1 && input.smoothness <= 5) {
    performanceScore = clamp(performanceScore + (input.smoothness - 3) * 8);
  }
  const demands = (input.usageCategories ?? []).map((c) => USAGE_DEMAND_MAP[c]).filter((d) => typeof d === "number");
  const usageDemand = demands.length > 0 ? Math.max(...demands) : 3;
  performanceScore = clamp(performanceScore + (3 - usageDemand) * 6);
  const score = Math.round(clamp(chipScore * 0.4 + supportScore * 0.3 + performanceScore * 0.3));
  const batteryNeedReplace = input.batteryHealth !== void 0 && input.batteryHealth !== null && input.batteryHealth < BATTERY_HEALTH_THRESHOLD || input.batteryCycles !== void 0 && input.batteryCycles !== null && input.batteryCycles > device.battery_cycle_standard;
  const chipObsolete = chipGap >= 4;
  const outOfSupport = remainingSupportYears <= 0;
  const perfLagging = performanceScore < 55;
  const isEn = input.lang === "en";
  const usageLabels = isEn ? USAGE_LABELS_EN : USAGE_LABELS;
  const usageLabelList = (input.usageCategories ?? []).filter((c) => usageLabels[c]).map((c) => usageLabels[c]).join(isEn ? ", " : "\u3001");
  const batteryHealthText = input.batteryHealth !== void 0 && input.batteryHealth !== null ? `${input.batteryHealth}%` : isEn ? "below the threshold" : "\u4F4E\u4E8E\u9608\u503C";
  const perfPercent = Math.round(benchmarkRatio * 100);
  let advice;
  if (chipObsolete || outOfSupport || perfLagging) {
    const reasons = [];
    if (chipObsolete) {
      reasons.push(
        isEn ? `The ${device.chip_name} chip trails the latest chip by ${chipGap} generation(s) \u2014 a clear performance gap` : `\u82AF\u7247${device.chip_name}\u6BD4\u6700\u65B0\u6B3E\u843D\u540E ${chipGap} \u4E2A\u4E16\u4EE3\uFF0C\u5904\u7406\u6027\u80FD\u5B58\u5728\u660E\u663E\u4EE3\u5DEE`
      );
    }
    if (outOfSupport) {
      reasons.push(
        isEn ? `Official software support has ended (last supported year: ${device.support_until_year}) \u2014 no more OS or security updates` : `\u5DF2\u8D85\u51FA\u5B98\u65B9\u7CFB\u7EDF\u652F\u6301\u5468\u671F\uFF08\u652F\u6301\u81F3 ${device.support_until_year} \u5E74\uFF09\uFF0C\u65E0\u6CD5\u83B7\u5F97\u6700\u65B0\u7CFB\u7EDF\u4E0E\u5B89\u5168\u66F4\u65B0`
      );
    }
    if (perfLagging) {
      reasons.push(
        isEn ? `Benchmark (${effectiveBenchmark}) is only about ${perfPercent}% of the latest model \u2014 mainstream apps will struggle` : `\u5B9E\u6D4B\u8DD1\u5206\uFF08${effectiveBenchmark}\uFF09\u76F8\u5BF9\u6700\u65B0\u6B3E\u4EC5 ${perfPercent}%\uFF0C\u8FD0\u884C\u4E3B\u6D41 App \u660E\u663E\u5403\u529B`
      );
    }
    if (usageDemand >= 4) {
      reasons.push(
        isEn ? `Your daily apps are mostly ${usageLabelList} \u2014 these scenarios demand more headroom, which older hardware struggles to deliver` : `\u5E38\u7528 App \u4EE5${usageLabelList}\u7C7B\u4E3A\u4E3B\uFF0C\u8FD9\u7C7B\u573A\u666F\u5BF9\u6027\u80FD\u4F59\u91CF\u8981\u6C42\u66F4\u9AD8\uFF0C\u8001\u65E7\u673A\u578B\u91CD\u8F7D\u65F6\u4F1A\u660E\u663E\u5403\u529B`
      );
    }
    advice = {
      type: "replace",
      title: isEn ? "Time to upgrade" : "\u5EFA\u8BAE\u6362\u673A",
      summary: isEn ? "Your device has reached the end of its lifecycle \u2014 keeping it means living with performance and security compromises." : "\u4F60\u7684\u8BBE\u5907\u5DF2\u8FDB\u5165\u751F\u547D\u5468\u671F\u5C3E\u58F0\uFF0C\u7EE7\u7EED\u4F7F\u7528\u4F1A\u9762\u4E34\u6027\u80FD\u4E0E\u5B89\u5168\u77ED\u677F\u3002",
      reasons
    };
  } else if (batteryNeedReplace) {
    advice = {
      type: "battery",
      title: isEn ? "Replace the battery" : "\u5EFA\u8BAE\u66F4\u6362\u7535\u6C60",
      summary: isEn ? "Overall performance is still fine, but battery health has dropped below the threshold \u2014 expect weaker endurance and stability." : "\u8BBE\u5907\u6574\u4F53\u6027\u80FD\u4ECD\u591F\u7528\uFF0C\u4F46\u7535\u6C60\u5065\u5EB7\u5EA6\u5DF2\u8DCC\u7834\u9608\u503C\uFF0C\u7EED\u822A\u4E0E\u7A33\u5B9A\u6027\u53D7\u5230\u5F71\u54CD\u3002",
      reasons: [
        isEn ? `Battery health is at ${batteryHealthText} (below the 80% threshold)` : `\u5F53\u524D\u7535\u6C60\u5065\u5EB7\u5EA6 ${batteryHealthText}\uFF0C\u4F4E\u4E8E 80% \u5EFA\u8BAE\u66F4\u6362`,
        isEn ? input.batteryCycles !== void 0 && input.batteryCycles !== null && input.batteryCycles > device.battery_cycle_standard ? `Charge cycles (${input.batteryCycles}) exceed the rated ${device.battery_cycle_standard} for this model` : `This model is rated for ${device.battery_cycle_standard} charge cycles` : input.batteryCycles !== void 0 && input.batteryCycles !== null && input.batteryCycles > device.battery_cycle_standard ? `\u5FAA\u73AF\u6B21\u6570\uFF08${input.batteryCycles}\uFF09\u5DF2\u8D85\u8FC7\u8BE5\u673A\u578B\u8BBE\u8BA1\u6807\u51C6\uFF08${device.battery_cycle_standard} \u6B21\uFF09` : `\u8BE5\u673A\u578B\u7535\u6C60\u8BBE\u8BA1\u5FAA\u73AF\u6807\u51C6\u4E3A ${device.battery_cycle_standard} \u6B21`,
        isEn ? "A battery swap restores full endurance and extends the life of this device" : "\u66F4\u6362\u7535\u6C60\u540E\u5373\u53EF\u6062\u590D\u6EE1\u8840\u7EED\u822A\uFF0C\u5EF6\u7EED\u4F7F\u7528"
      ]
    };
  } else {
    advice = {
      type: "keep",
      title: isEn ? "Still good for 2\u20133 years" : "\u8FD8\u80FD\u6218 2-3 \u5E74",
      summary: isEn ? "Your device has plenty of performance headroom and is still within its support window \u2014 more than enough for daily and mainstream use." : "\u4F60\u7684\u8BBE\u5907\u6027\u80FD\u5197\u4F59\u5145\u8DB3\uFF0C\u7CFB\u7EDF\u4ECD\u5728\u652F\u6301\u5468\u671F\u5185\uFF0C\u5B8C\u5168\u6EE1\u8DB3\u65E5\u5E38\u53CA\u4E3B\u6D41 App \u9700\u6C42\u3002",
      reasons: [
        isEn ? `The ${device.chip_name} chip is only ${chipGap} generation(s) behind the latest \u2014 ample headroom` : `\u82AF\u7247${device.chip_name}\u4E0E\u6700\u65B0\u6B3E\u4EC5\u76F8\u5DEE ${chipGap} \u4E2A\u4E16\u4EE3\uFF0C\u5904\u7406\u6027\u80FD\u5197\u4F59\u5145\u8DB3`,
        isEn ? `Roughly ${remainingSupportYears} year(s) of official software support remain` : `\u5B98\u65B9\u7CFB\u7EDF\u652F\u6301\u5269\u4F59\u7EA6 ${remainingSupportYears} \u5E74\uFF0C\u4ECD\u53EF\u6B63\u5E38\u66F4\u65B0`,
        isEn ? `Real-world performance is about ${perfPercent}% of the latest model \u2014 mainstream apps run smoothly` : `\u5B9E\u6D4B\u6027\u80FD\u7EA6\u8FBE\u6700\u65B0\u6B3E\u7684 ${perfPercent}%\uFF0C\u6D41\u7545\u8FD0\u884C\u4E3B\u6D41 App`,
        ...usageDemand <= 2 ? [
          isEn ? "Your daily apps are mostly lightweight \u2014 everyday use stays effortless" : "\u5E38\u7528 App \u4EE5\u8F7B\u91CF\u573A\u666F\u4E3A\u4E3B\uFF0C\u5BF9\u6027\u80FD\u8981\u6C42\u4E0D\u9AD8\uFF0C\u65E5\u5E38\u4F7F\u7528\u4F9D\u7136\u4ECE\u5BB9"
        ] : []
      ]
    };
  }
  const upgrade = !device.upgrade_model_id || device.is_latest ? null : await getPhoneById(device.upgrade_model_id);
  return {
    device,
    latest,
    upgrade,
    metrics: {
      chipGap,
      chipScore,
      supportScore,
      performanceScore: Math.round(performanceScore),
      remainingSupportYears,
      benchmarkRatio: Math.round(benchmarkRatio * 100),
      batteryNeedReplace,
      effectiveBenchmarkScore: effectiveBenchmark,
      usageDemand
    },
    components: {
      chip: Math.round(chipScore),
      support: Math.round(supportScore),
      performance: Math.round(performanceScore)
    },
    score,
    advice,
    affiliateAvailable: affiliateConfigured()
  };
}

// src/services/report-service.ts
var import_coze_coding_dev_sdk2 = require("coze-coding-dev-sdk");
var SECTIONS_ZH = ["\u7ED3\u8BBA\u5148\u884C", "\u6027\u80FD\u4E0E\u6D41\u7545\u5EA6", "\u5F71\u50CF\u7CFB\u7EDF", "\u7535\u6C60\u4E0E\u7EED\u822A", "\u7CFB\u7EDF\u652F\u6301\u5468\u671F", "\u4FDD\u503C\u4E0E\u8F6C\u552E", "\u5347\u7EA7\u6027\u4EF7\u6BD4", "\u884C\u52A8\u5EFA\u8BAE"];
var SECTIONS_EN = ["Verdict", "Performance", "Camera", "Battery", "Software Support", "Resale Value", "Upgrade Value", "Action Plan"];
function pickPhone(p) {
  return {
    name: p.name,
    brand: p.brand,
    chip: p.chip_name,
    chipGeneration: p.chip_generation,
    releaseYear: p.release_year,
    supportUntilYear: p.support_until_year,
    batteryCycleStandard: p.battery_cycle_standard,
    referenceScore: p.reference_score,
    isLatest: p.is_latest,
    specs: p.specs ?? null
  };
}
var USAGE_LABELS_ZH = {
  social: "\u793E\u4EA4\u804A\u5929",
  video: "\u89C6\u9891\u8FFD\u5267",
  game: "\u6E38\u620F",
  photo: "\u62CD\u7167\u6444\u5F71",
  work: "\u529E\u516C\u6548\u7387",
  web: "\u7F51\u9875\u9605\u8BFB"
};
var USAGE_LABELS_EN2 = {
  social: "Social & messaging",
  video: "Video streaming",
  game: "Gaming",
  photo: "Photography",
  work: "Productivity",
  web: "Web reading"
};
async function buildMessages(input) {
  const zh = input.lang !== "en";
  const sections = zh ? SECTIONS_ZH : SECTIONS_EN;
  const usageLabels = zh ? USAGE_LABELS_ZH : USAGE_LABELS_EN2;
  const usage = (input.usageCategories ?? []).map((c) => usageLabels[c] ?? c).filter(Boolean);
  const system = [
    "You are a senior mobile device review editor writing a phone upgrade comparison report. \u4F60\u7684\u8BFB\u8005\u662F\u666E\u901A\u7528\u6237\uFF0C\u4E0D\u662F\u53C2\u6570\u515A\u3002",
    zh ? "\u8BF7\u7528\u7B80\u4F53\u4E2D\u6587\u8F93\u51FA\u3002" : "Please write in English.",
    "",
    "\u6838\u5FC3\u539F\u5219\uFF1A\u4E0D\u8981\u7F57\u5217\u53C2\u6570\uFF0C\u628A\u53C2\u6570\u5DEE\u5F02\u7FFB\u8BD1\u6210\u7528\u6237\u80FD\u611F\u77E5\u7684\u4F53\u611F\u5DEE\u522B\uFF08\u5361\u987F\u3001\u7EED\u822A\u5929\u6570\u3001\u7167\u7247\u6210\u7247\u7387\u3001\u4E8C\u624B\u5356\u4EF7\u7B49\uFF09\u3002",
    "",
    "\u8F93\u51FA\u683C\u5F0F\uFF08\u4E25\u683C\u9075\u5B88\uFF0Cmarkdown\uFF09:",
    `- \u5168\u6587\u5FC5\u987B\u4E14\u53EA\u80FD\u5305\u542B\u4EE5\u4E0B ${sections.length} \u4E2A\u7AE0\u8282\uFF0C\u6BCF\u4E2A\u7AE0\u8282\u4EE5 "## \u6807\u9898" \u72EC\u7ACB\u6210\u884C\u5F00\u59CB\uFF1A${sections.map((s) => `## ${s}`).join(" \u2192 ")}`,
    "- \u6BCF\u4E2A\u7AE0\u8282\u6B63\u6587 2~4 \u53E5\u8BDD\uFF0C\u5173\u952E\u6570\u5B57\u4E0E\u673A\u578B\u540D\u7528 **\u52A0\u7C97**\uFF08\u5982 **2 \u4EE3**\u3001**87%**\u3001**A19 Pro**\uFF09",
    "- \u7B2C\u4E00\u7AE0\u8282\uFF08\u7ED3\u8BBA\u5148\u884C\uFF09\u4E0D\u8D85\u8FC7 3 \u53E5\uFF1A\u5148\u7ED9\u51FA\u660E\u786E\u7ED3\u8BBA\uFF08\u5EFA\u8BAE\u6362\u673A / \u4E0D\u5EFA\u8BAE\u6362 / \u53EF\u518D\u89C2\u671B\uFF09\uFF0C\u518D\u7528\u4E00\u53E5\u8BDD\u8BF4\u660E\u6700\u6838\u5FC3\u7406\u7531",
    "- \u6700\u540E\u4E00\u7AE0\u8282\uFF08\u884C\u52A8\u5EFA\u8BAE\uFF09\u7ED9\u51FA\u53EF\u6267\u884C\u6E05\u5355\uFF08\u7528 - \u5F00\u5934\u7684\u5217\u8868\uFF0C2~3 \u6761\uFF09",
    "- \u76F4\u63A5\u8F93\u51FA\u6B63\u6587\uFF0C\u7981\u6B62\u4EFB\u4F55\u5F00\u573A\u767D\u3001\u7ED3\u5C3E\u5BA2\u5957\u3001\u4EE3\u7801\u5757\u5305\u88F9",
    `- \u5168\u6587\u603B\u957F\u5EA6\u63A7\u5236\u5728 ${zh ? "600~900 \u5B57" : "450~650 words"}`
  ].join("\n");
  const [current, target] = await Promise.all([
    getPhoneById(input.currentPhoneId),
    getPhoneById(input.targetPhoneId)
  ]);
  if (!current) throw new Error(`\u673A\u578B\u4E0D\u5B58\u5728 (id=${input.currentPhoneId})`);
  if (!target) throw new Error(`\u673A\u578B\u4E0D\u5B58\u5728 (id=${input.targetPhoneId})`);
  const user = [
    `=== \u7528\u6237\u65E7\u673A ===`,
    JSON.stringify(pickPhone(current), null, 0),
    ``,
    `=== \u5BF9\u6BD4\u76EE\u6807\u673A ===`,
    JSON.stringify(pickPhone(target), null, 0),
    ``,
    `=== \u7528\u6237\u771F\u5B9E\u4F7F\u7528\u6570\u636E\uFF08\u53EF\u9009\uFF0C\u7F3A\u5931\u5219\u5FFD\u7565\u8BE5\u9879\u5E76\u6309\u901A\u7528\u573A\u666F\u8BC4\u4F30\uFF09===`,
    input.batteryHealth != null ? `- \u65E7\u673A\u7535\u6C60\u6700\u5927\u5BB9\u91CF\uFF1A${input.batteryHealth}%` : `- \u65E7\u673A\u7535\u6C60\u6700\u5927\u5BB9\u91CF\uFF1A\u672A\u63D0\u4F9B`,
    input.batteryCycles != null ? `- \u65E7\u673A\u5145\u7535\u5FAA\u73AF\u6B21\u6570\uFF1A${input.batteryCycles} \u6B21` : `- \u65E7\u673A\u5145\u7535\u5FAA\u73AF\u6B21\u6570\uFF1A\u672A\u63D0\u4F9B`,
    usage.length > 0 ? `- \u5E38\u7528\u573A\u666F\uFF1A${usage.join("\u3001")}` : `- \u5E38\u7528\u573A\u666F\uFF1A\u672A\u63D0\u4F9B`,
    ``,
    zh ? "\u8BF7\u57FA\u4E8E\u4EE5\u4E0A\u6570\u636E\u751F\u6210\u5BF9\u6BD4\u62A5\u544A\u3002\u82E5\u65E7\u673A\u7535\u6C60\u5065\u5EB7\u5EA6\u4F4E\u4E8E 80%\uFF0C\u5FC5\u987B\u5728\u7535\u6C60\u7AE0\u8282\u660E\u786E\u63D0\u793A\u300C\u66F4\u6362\u7535\u6C60\u53EF\u80FD\u6BD4\u6362\u673A\u66F4\u5212\u7B97\u300D\u7684\u5224\u65AD\u3002" : "Generate the comparison report based on the data above. If the old phone's battery health is below 80%, you must address in the battery section whether replacing the battery alone would be more cost-effective."
  ].join("\n");
  return [
    { role: "system", content: system },
    { role: "user", content: user }
  ];
}
async function streamReport(res, input, forwardHeaders) {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store, no-transform, must-revalidate");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
  let clientClosed = false;
  res.on("close", () => {
    clientClosed = true;
  });
  const client = new import_coze_coding_dev_sdk2.LLMClient(new import_coze_coding_dev_sdk2.Config({ timeout: 3e5 }), forwardHeaders);
  const messages = await buildMessages(input);
  const stream = client.stream(messages, {
    model: "doubao-seed-2-0-lite-260215",
    thinking: "disabled",
    temperature: 0.5
  });
  try {
    for await (const chunk of stream) {
      if (clientClosed) break;
      const text = chunk.content?.toString() ?? "";
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}

`);
      }
    }
    res.write("data: [DONE]\n\n");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "\u62A5\u544A\u751F\u6210\u5931\u8D25";
    console.error("[report] stream error:", msg);
    if (!clientClosed) {
      res.write(`data: ${JSON.stringify({ error: msg })}

`);
      res.write("data: [DONE]\n\n");
    }
  } finally {
    res.end();
  }
}

// src/routes/phones.ts
var import_coze_coding_dev_sdk3 = require("coze-coding-dev-sdk");
var phonesRouter = (0, import_express.Router)();
var analysisSchema = import_zod.z.object({
  phoneId: import_zod.z.number().int().positive(),
  benchmarkScore: import_zod.z.number().int().nonnegative().optional(),
  batteryHealth: import_zod.z.number().min(0).max(100).optional(),
  batteryCycles: import_zod.z.number().int().nonnegative().optional(),
  smoothness: import_zod.z.number().min(1).max(5).optional(),
  usageCategories: import_zod.z.array(import_zod.z.enum(["social", "video", "game", "photo", "work", "web"])).max(6).optional(),
  /** advice 输出语言（cn 版传 zh / 海外版传 en，默认 zh） */
  lang: import_zod.z.enum(["zh", "en"]).optional()
});
phonesRouter.get("/", async (_req, res) => {
  try {
    const phones = await listPhones();
    res.json({ data: phones });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "\u670D\u52A1\u5F02\u5E38";
    res.status(500).json({ error: msg });
  }
});
phonesRouter.get("/latest", async (_req, res) => {
  try {
    const latest = await getLatestPhone();
    res.json({ data: latest });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "\u670D\u52A1\u5F02\u5E38";
    res.status(500).json({ error: msg });
  }
});
phonesRouter.post("/analysis", async (req, res) => {
  try {
    const parsed = analysisSchema.parse(req.body);
    const result = await analyzeDevice(parsed);
    res.json({ data: result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "\u670D\u52A1\u5F02\u5E38";
    res.status(400).json({ error: msg });
  }
});
phonesRouter.get("/purchase-link", async (req, res) => {
  try {
    const model = String(req.query.model ?? "").trim();
    if (!model) {
      res.status(400).json({ error: "\u7F3A\u5C11 model \u53C2\u6570" });
      return;
    }
    const budgetRaw = Number(req.query.budget);
    const budget = Number.isFinite(budgetRaw) && budgetRaw > 0 ? budgetRaw : void 0;
    const result = await getPurchaseLink(model, budget);
    res.json({ data: result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "\u670D\u52A1\u5F02\u5E38";
    res.status(500).json({ error: msg });
  }
});
var reportSchema = import_zod.z.object({
  currentPhoneId: import_zod.z.number().int().positive(),
  targetPhoneId: import_zod.z.number().int().positive(),
  batteryHealth: import_zod.z.number().min(0).max(100).optional(),
  batteryCycles: import_zod.z.number().int().nonnegative().optional(),
  usageCategories: import_zod.z.array(import_zod.z.enum(["social", "video", "game", "photo", "work", "web"])).max(6).optional(),
  lang: import_zod.z.enum(["zh", "en"]).default("zh")
});
phonesRouter.post("/report", async (req, res) => {
  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "\u53C2\u6570\u4E0D\u5408\u6CD5" });
    return;
  }
  try {
    await streamReport(
      res,
      parsed.data,
      import_coze_coding_dev_sdk3.HeaderUtils.extractForwardHeaders(req.headers)
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "\u62A5\u544A\u751F\u6210\u5931\u8D25";
    res.write(`data: ${JSON.stringify({ error: msg })}

`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
});
phonesRouter.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "\u975E\u6CD5 id" });
      return;
    }
    const phone = await getPhoneById(id);
    if (!phone) {
      res.status(404).json({ error: "\u673A\u578B\u4E0D\u5B58\u5728" });
      return;
    }
    res.json({ data: phone });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "\u670D\u52A1\u5F02\u5E38";
    res.status(500).json({ error: msg });
  }
});

// src/app.ts
var app = (0, import_express2.default)();
app.use((0, import_cors.default)());
app.use(import_express2.default.json({ limit: "50mb" }));
app.use(import_express2.default.urlencoded({ limit: "50mb", extended: true }));
app.get("/api/v1/health", (_req, res) => {
  console.log("Health check success");
  res.status(200).json({ status: "ok" });
});
app.use("/api/v1/phones", phonesRouter);
var app_default = app;

// src/storage/database/seed-data.ts
var SEED_PHONE_MODELS = [
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
      "\u673A\u8EAB": {
        "\u914D\u8272": "\u9ED1 / \u767D / \u7EA2 / \u7EFF / \u9EC4 / \u7D2B",
        "\u673A\u8EAB\u6750\u8D28": "\u94DD\u91D1\u5C5E\u8FB9\u6846 + \u73BB\u7483\u80CC\u677F",
        "\u9632\u62A4\u7B49\u7EA7": "IP68",
        "\u5C3A\u5BF8\u4E0E\u91CD\u91CF": "150.9\xD775.7\xD78.3 mm\uFF0C194 \u514B"
      },
      "\u82AF\u7247": {
        "\u5236\u7A0B\u5DE5\u827A": "7nm",
        "\u82AF\u7247\u578B\u53F7": "A13 \u4EFF\u751F",
        "\u4E2D\u592E\u5904\u7406\u5668": "6 \u6838",
        "\u56FE\u5F62\u5904\u7406\u5668": "4 \u6838",
        "\u795E\u7ECF\u7F51\u7EDC\u5F15\u64CE": "8 \u6838"
      },
      "\u6444\u50CF\u5934": {
        "\u957F\u7126": "\u65E0",
        "\u8D85\u5E7F\u89D2": "1200 \u4E07\u50CF\u7D20 \u0192/2.4\uFF08120\xB0 \u89C6\u89D2\uFF09",
        "\u540E\u7F6E\u4E3B\u6444": "1200 \u4E07\u50CF\u7D20 \u0192/1.8\uFF08OIS\uFF09",
        "\u89C6\u9891\u62CD\u6444": "4K 60fps",
        "\u524D\u7F6E\u6444\u50CF\u5934": "1200 \u4E07\u50CF\u7D20 \u0192/2.2"
      },
      "\u663E\u793A\u5C4F": {
        "\u4EAE\u5EA6": "625 \u5C3C\u7279\u6700\u5927\u4EAE\u5EA6",
        "\u5237\u65B0\u7387": "60Hz",
        "\u5C4F\u5E55\u5C3A\u5BF8": "6.1 \u82F1\u5BF8",
        "\u5C4F\u5E55\u7C7B\u578B": "Liquid Retina HD (LCD)",
        "\u5168\u9762\u5C4F\u8BBE\u8BA1": "\u5218\u6D77\u5C4F",
        "\u5206\u8FA8\u7387\u4E0E\u50CF\u7D20\u5BC6\u5EA6": "1792\xD7828\uFF0C326 ppi"
      },
      "\u5185\u5B58\u4E0E\u5B58\u50A8": {
        "\u5B58\u50A8\u5BB9\u91CF": "64 / 128 / 256GB",
        "\u8FD0\u884C\u5185\u5B58": "4GB"
      },
      "\u7535\u6C60\u4E0E\u5145\u7535": {
        "\u65E0\u7EBF\u5145\u7535": "Qi 7.5W",
        "\u6709\u7EBF\u5FEB\u5145": "18W\uFF08\u7EA6 30 \u5206\u949F\u5145\u81F3 50%\uFF09",
        "\u7535\u6C60\u5BB9\u91CF": "3110 mAh",
        "\u89C6\u9891\u64AD\u653E": "\u6700\u957F 17 \u5C0F\u65F6"
      },
      "\u8FDE\u63A5\u4E0E\u5176\u4ED6": {
        "\u63A5\u53E3": "Lightning",
        "\u65E0\u7EBF\u8FDE\u63A5": "Wi-Fi 6\uFF0C\u84DD\u7259 5.0",
        "\u751F\u7269\u8BC6\u522B": "\u9762\u5BB9 ID",
        "\u79FB\u52A8\u7F51\u7EDC": "4G LTE",
        "\u8702\u7A9D\u57FA\u5E26": "Intel",
        "\u9996\u53D1\u7CFB\u7EDF": "iOS 13"
      }
    },
    "colors": [
      {
        "hex": "#D1CDDA",
        "name": "\u7D2B\u8272",
        "image": "https://coze-coding-project.tos.coze.site/coze_storage_7687966160918249487/image/generate_image_b1e93478-043b-4ebf-a086-b519cb487a55.jpeg?sign=1821589639-acd2070d61-0-c8db64fafa9680a65f376b799bd412eb6645f91dcea05421bb53b99fbb7aa5c8"
      },
      {
        "hex": "#AEE1CD",
        "name": "\u7EFF\u8272",
        "image": "https://coze-coding-project.tos.coze.site/coze_storage_7687966160918249487/image/generate_image_8bcaf9a3-6440-4e13-8589-87955ed4f327.jpeg?sign=1821589639-b37aa99219-0-2b16f13b94372ac75d3695a8943379f45aaebccdadede589a7cc122f4da29ee5"
      },
      {
        "hex": "#BA0C2E",
        "name": "\u7EA2\u8272",
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
      "\u673A\u8EAB": {
        "\u914D\u8272": "\u9ED1 / \u767D / \u7EA2 / \u7EFF / \u84DD / \u7D2B",
        "\u673A\u8EAB\u6750\u8D28": "\u94DD\u91D1\u5C5E\u8FB9\u6846 + \u8D85\u74F7\u6676\u9762\u677F",
        "\u9632\u62A4\u7B49\u7EA7": "IP68",
        "\u5C3A\u5BF8\u4E0E\u91CD\u91CF": "146.7\xD771.5\xD77.4 mm\uFF0C162 \u514B"
      },
      "\u82AF\u7247": {
        "\u5236\u7A0B\u5DE5\u827A": "5nm",
        "\u82AF\u7247\u578B\u53F7": "A14 \u4EFF\u751F",
        "\u4E2D\u592E\u5904\u7406\u5668": "6 \u6838",
        "\u56FE\u5F62\u5904\u7406\u5668": "4 \u6838",
        "\u795E\u7ECF\u7F51\u7EDC\u5F15\u64CE": "16 \u6838"
      },
      "\u6444\u50CF\u5934": {
        "\u957F\u7126": "\u65E0",
        "\u8D85\u5E7F\u89D2": "1200 \u4E07\u50CF\u7D20 \u0192/2.4",
        "\u540E\u7F6E\u4E3B\u6444": "1200 \u4E07\u50CF\u7D20 \u0192/1.6\uFF08OIS\uFF09",
        "\u89C6\u9891\u62CD\u6444": "4K 60fps \u675C\u6BD4\u89C6\u754C HDR",
        "\u524D\u7F6E\u6444\u50CF\u5934": "1200 \u4E07\u50CF\u7D20 \u0192/2.2"
      },
      "\u663E\u793A\u5C4F": {
        "\u4EAE\u5EA6": "800 \u5C3C\u7279\u5178\u578B / 1200 \u5C3C\u7279\u5CF0\u503C (HDR)",
        "\u5237\u65B0\u7387": "60Hz",
        "\u5C4F\u5E55\u5C3A\u5BF8": "6.1 \u82F1\u5BF8",
        "\u5C4F\u5E55\u7C7B\u578B": "\u8D85\u89C6\u7F51\u819C XDR (OLED)",
        "\u5168\u9762\u5C4F\u8BBE\u8BA1": "\u5218\u6D77\u5C4F",
        "\u5206\u8FA8\u7387\u4E0E\u50CF\u7D20\u5BC6\u5EA6": "2532\xD71170\uFF0C460 ppi"
      },
      "\u5185\u5B58\u4E0E\u5B58\u50A8": {
        "\u5B58\u50A8\u5BB9\u91CF": "64 / 128 / 256GB",
        "\u8FD0\u884C\u5185\u5B58": "4GB"
      },
      "\u7535\u6C60\u4E0E\u5145\u7535": {
        "\u65E0\u7EBF\u5145\u7535": "MagSafe 15W / Qi",
        "\u6709\u7EBF\u5FEB\u5145": "20W\uFF08\u7EA6 30 \u5206\u949F\u5145\u81F3 50%\uFF09",
        "\u7535\u6C60\u5BB9\u91CF": "2815 mAh",
        "\u89C6\u9891\u64AD\u653E": "\u6700\u957F 17 \u5C0F\u65F6"
      },
      "\u8FDE\u63A5\u4E0E\u5176\u4ED6": {
        "\u63A5\u53E3": "Lightning",
        "\u65E0\u7EBF\u8FDE\u63A5": "Wi-Fi 6\uFF0C\u84DD\u7259 5.0",
        "\u751F\u7269\u8BC6\u522B": "\u9762\u5BB9 ID",
        "\u79FB\u52A8\u7F51\u7EDC": "5G\uFF08sub-6GHz\uFF09",
        "\u8702\u7A9D\u57FA\u5E26": "\u9AD8\u901A",
        "\u9996\u53D1\u7CFB\u7EDF": "iOS 14"
      }
    },
    "colors": [
      {
        "hex": "#D0C2E8",
        "name": "\u7D2B\u8272",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-12-purple-select-2021?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#B7E3C3",
        "name": "\u7EFF\u8272",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-12-green-select-2020?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#64708F",
        "name": "\u84DD\u8272",
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
      "\u673A\u8EAB": {
        "\u914D\u8272": "\u7C89 / \u84DD / \u5348\u591C\u8272 / \u661F\u5149\u8272 / \u7EA2",
        "\u673A\u8EAB\u6750\u8D28": "\u94DD\u91D1\u5C5E\u8FB9\u6846 + \u8D85\u74F7\u6676\u9762\u677F",
        "\u9632\u62A4\u7B49\u7EA7": "IP68",
        "\u5C3A\u5BF8\u4E0E\u91CD\u91CF": "146.7\xD771.5\xD77.65 mm\uFF0C173 \u514B"
      },
      "\u82AF\u7247": {
        "\u5236\u7A0B\u5DE5\u827A": "5nm",
        "\u82AF\u7247\u578B\u53F7": "A15 \u4EFF\u751F",
        "\u4E2D\u592E\u5904\u7406\u5668": "6 \u6838",
        "\u56FE\u5F62\u5904\u7406\u5668": "4 \u6838",
        "\u795E\u7ECF\u7F51\u7EDC\u5F15\u64CE": "16 \u6838"
      },
      "\u6444\u50CF\u5934": {
        "\u957F\u7126": "\u65E0\uFF082 \u500D\u5149\u5B66\u54C1\u8D28\u53D8\u7126\uFF09",
        "\u8D85\u5E7F\u89D2": "1200 \u4E07\u50CF\u7D20 \u0192/2.4",
        "\u540E\u7F6E\u4E3B\u6444": "1200 \u4E07\u50CF\u7D20 \u0192/1.6\uFF08\u4F20\u611F\u5668\u4F4D\u79FB\u5F0F OIS\uFF09",
        "\u89C6\u9891\u62CD\u6444": "4K 60fps \u675C\u6BD4\u89C6\u754C + \u7535\u5F71\u6548\u679C\u6A21\u5F0F",
        "\u524D\u7F6E\u6444\u50CF\u5934": "1200 \u4E07\u50CF\u7D20 \u0192/2.2"
      },
      "\u663E\u793A\u5C4F": {
        "\u4EAE\u5EA6": "800 \u5C3C\u7279\u5178\u578B / 1200 \u5C3C\u7279\u5CF0\u503C (HDR)",
        "\u5237\u65B0\u7387": "60Hz",
        "\u5C4F\u5E55\u5C3A\u5BF8": "6.1 \u82F1\u5BF8",
        "\u5C4F\u5E55\u7C7B\u578B": "\u8D85\u89C6\u7F51\u819C XDR (OLED)",
        "\u5168\u9762\u5C4F\u8BBE\u8BA1": "\u5218\u6D77\u5C4F",
        "\u5206\u8FA8\u7387\u4E0E\u50CF\u7D20\u5BC6\u5EA6": "2532\xD71170\uFF0C460 ppi"
      },
      "\u5185\u5B58\u4E0E\u5B58\u50A8": {
        "\u5B58\u50A8\u5BB9\u91CF": "128 / 256 / 512GB",
        "\u8FD0\u884C\u5185\u5B58": "4GB"
      },
      "\u7535\u6C60\u4E0E\u5145\u7535": {
        "\u65E0\u7EBF\u5145\u7535": "MagSafe 15W / Qi",
        "\u6709\u7EBF\u5FEB\u5145": "20W\uFF08\u7EA6 30 \u5206\u949F\u5145\u81F3 50%\uFF09",
        "\u7535\u6C60\u5BB9\u91CF": "3227 mAh",
        "\u89C6\u9891\u64AD\u653E": "\u6700\u957F 19 \u5C0F\u65F6"
      },
      "\u8FDE\u63A5\u4E0E\u5176\u4ED6": {
        "\u63A5\u53E3": "Lightning",
        "\u65E0\u7EBF\u8FDE\u63A5": "Wi-Fi 6\uFF0C\u84DD\u7259 5.0",
        "\u751F\u7269\u8BC6\u522B": "\u9762\u5BB9 ID",
        "\u79FB\u52A8\u7F51\u7EDC": "5G\uFF08sub-6GHz\uFF09",
        "\u8702\u7A9D\u57FA\u5E26": "\u9AD8\u901A X60",
        "\u9996\u53D1\u7CFB\u7EDF": "iOS 15"
      }
    },
    "colors": [
      {
        "hex": "#F6DDE2",
        "name": "\u7C89\u8272",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-13-pink-select-2021?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#A7C1D9",
        "name": "\u84DD\u8272",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-13-blue-select-2021?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#1D1D1F",
        "name": "\u5348\u591C\u8272",
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
      "\u673A\u8EAB": {
        "\u914D\u8272": "\u5348\u591C\u8272 / \u661F\u5149\u8272 / \u84DD / \u7D2B / \u9EC4",
        "\u673A\u8EAB\u6750\u8D28": "\u94DD\u91D1\u5C5E\u8FB9\u6846 + \u8D85\u74F7\u6676\u9762\u677F",
        "\u9632\u62A4\u7B49\u7EA7": "IP68",
        "\u5C3A\u5BF8\u4E0E\u91CD\u91CF": "146.7\xD771.5\xD77.8 mm\uFF0C172 \u514B"
      },
      "\u82AF\u7247": {
        "\u5236\u7A0B\u5DE5\u827A": "5nm",
        "\u82AF\u7247\u578B\u53F7": "A15 \u4EFF\u751F\uFF085 \u6838 GPU\uFF09",
        "\u4E2D\u592E\u5904\u7406\u5668": "6 \u6838",
        "\u56FE\u5F62\u5904\u7406\u5668": "5 \u6838",
        "\u795E\u7ECF\u7F51\u7EDC\u5F15\u64CE": "16 \u6838"
      },
      "\u6444\u50CF\u5934": {
        "\u957F\u7126": "\u65E0",
        "\u8D85\u5E7F\u89D2": "1200 \u4E07\u50CF\u7D20 \u0192/2.4",
        "\u540E\u7F6E\u4E3B\u6444": "1200 \u4E07\u50CF\u7D20 \u0192/1.5\uFF08OIS\uFF09",
        "\u89C6\u9891\u62CD\u6444": "4K 60fps + \u8FD0\u52A8\u6A21\u5F0F",
        "\u524D\u7F6E\u6444\u50CF\u5934": "1200 \u4E07\u50CF\u7D20 \u0192/1.9\uFF08\u81EA\u52A8\u5BF9\u7126\uFF09"
      },
      "\u663E\u793A\u5C4F": {
        "\u4EAE\u5EA6": "800 \u5C3C\u7279\u5178\u578B / 1200 \u5C3C\u7279\u5CF0\u503C (HDR)",
        "\u5237\u65B0\u7387": "60Hz",
        "\u5C4F\u5E55\u5C3A\u5BF8": "6.1 \u82F1\u5BF8",
        "\u5C4F\u5E55\u7C7B\u578B": "\u8D85\u89C6\u7F51\u819C XDR (OLED)",
        "\u5168\u9762\u5C4F\u8BBE\u8BA1": "\u5218\u6D77\u5C4F",
        "\u5206\u8FA8\u7387\u4E0E\u50CF\u7D20\u5BC6\u5EA6": "2532\xD71170\uFF0C460 ppi"
      },
      "\u5185\u5B58\u4E0E\u5B58\u50A8": {
        "\u5B58\u50A8\u5BB9\u91CF": "128 / 256 / 512GB",
        "\u8FD0\u884C\u5185\u5B58": "6GB"
      },
      "\u7535\u6C60\u4E0E\u5145\u7535": {
        "\u65E0\u7EBF\u5145\u7535": "MagSafe 15W / Qi",
        "\u6709\u7EBF\u5FEB\u5145": "20W\uFF08\u7EA6 30 \u5206\u949F\u5145\u81F3 50%\uFF09",
        "\u7535\u6C60\u5BB9\u91CF": "3279 mAh",
        "\u89C6\u9891\u64AD\u653E": "\u6700\u957F 20 \u5C0F\u65F6"
      },
      "\u8FDE\u63A5\u4E0E\u5176\u4ED6": {
        "\u63A5\u53E3": "Lightning",
        "\u5176\u4ED6\u7279\u6027": "\u8F66\u7978\u68C0\u6D4B\uFF0C\u536B\u661F SOS",
        "\u65E0\u7EBF\u8FDE\u63A5": "Wi-Fi 6\uFF0C\u84DD\u7259 5.3",
        "\u751F\u7269\u8BC6\u522B": "\u9762\u5BB9 ID",
        "\u79FB\u52A8\u7F51\u7EDC": "5G\uFF08sub-6GHz\uFF09",
        "\u8702\u7A9D\u57FA\u5E26": "\u9AD8\u901A X65",
        "\u9996\u53D1\u7CFB\u7EDF": "iOS 16"
      }
    },
    "colors": [
      {
        "hex": "#C8BFD9",
        "name": "\u7D2B\u8272",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-14-purple-select-202209?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#F6E7A9",
        "name": "\u9EC4\u8272",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-14-yellow-select-202303?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#9BB0C8",
        "name": "\u84DD\u8272",
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
    "battery_cycle_standard": 1e3,
    "reference_score": 3600,
    "image_url": "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "\u673A\u8EAB": {
        "\u914D\u8272": "\u7C89 / \u9EC4 / \u7EFF / \u84DD / \u9ED1",
        "\u673A\u8EAB\u6750\u8D28": "\u94DD\u91D1\u5C5E\u8FB9\u6846 + \u7194\u8272\u73BB\u7483\u80CC\u677F",
        "\u9632\u62A4\u7B49\u7EA7": "IP68",
        "\u5C3A\u5BF8\u4E0E\u91CD\u91CF": "147.6\xD771.6\xD77.8 mm\uFF0C171 \u514B"
      },
      "\u82AF\u7247": {
        "\u5236\u7A0B\u5DE5\u827A": "4nm",
        "\u82AF\u7247\u578B\u53F7": "A16 \u4EFF\u751F",
        "\u4E2D\u592E\u5904\u7406\u5668": "6 \u6838",
        "\u56FE\u5F62\u5904\u7406\u5668": "5 \u6838",
        "\u795E\u7ECF\u7F51\u7EDC\u5F15\u64CE": "16 \u6838"
      },
      "\u6444\u50CF\u5934": {
        "\u957F\u7126": "\u65E0\uFF082 \u500D\u5149\u5B66\u54C1\u8D28\u53D8\u7126\uFF09",
        "\u8D85\u5E7F\u89D2": "1200 \u4E07\u50CF\u7D20 \u0192/2.4",
        "\u540E\u7F6E\u4E3B\u6444": "4800 \u4E07\u50CF\u7D20 \u0192/1.6\uFF08OIS\uFF09",
        "\u89C6\u9891\u62CD\u6444": "4K 60fps \u675C\u6BD4\u89C6\u754C",
        "\u524D\u7F6E\u6444\u50CF\u5934": "1200 \u4E07\u50CF\u7D20 \u0192/1.9"
      },
      "\u663E\u793A\u5C4F": {
        "\u4EAE\u5EA6": "1000 \u5C3C\u7279\u5178\u578B / 2000 \u5C3C\u7279\u6237\u5916\u5CF0\u503C",
        "\u5237\u65B0\u7387": "60Hz",
        "\u5C4F\u5E55\u5C3A\u5BF8": "6.1 \u82F1\u5BF8",
        "\u5C4F\u5E55\u7C7B\u578B": "\u8D85\u89C6\u7F51\u819C XDR (OLED)",
        "\u5168\u9762\u5C4F\u8BBE\u8BA1": "\u7075\u52A8\u5C9B",
        "\u5206\u8FA8\u7387\u4E0E\u50CF\u7D20\u5BC6\u5EA6": "2556\xD71179\uFF0C460 ppi"
      },
      "\u5185\u5B58\u4E0E\u5B58\u50A8": {
        "\u5B58\u50A8\u5BB9\u91CF": "128 / 256 / 512GB",
        "\u8FD0\u884C\u5185\u5B58": "6GB"
      },
      "\u7535\u6C60\u4E0E\u5145\u7535": {
        "\u65E0\u7EBF\u5145\u7535": "MagSafe 15W / Qi2",
        "\u6709\u7EBF\u5FEB\u5145": "20W\uFF08\u7EA6 30 \u5206\u949F\u5145\u81F3 50%\uFF09",
        "\u7535\u6C60\u5BB9\u91CF": "3349 mAh",
        "\u89C6\u9891\u64AD\u653E": "\u6700\u957F 20 \u5C0F\u65F6"
      },
      "\u8FDE\u63A5\u4E0E\u5176\u4ED6": {
        "\u63A5\u53E3": "USB-C\uFF08USB 2\uFF09",
        "\u65E0\u7EBF\u8FDE\u63A5": "Wi-Fi 6\uFF0C\u84DD\u7259 5.3",
        "\u751F\u7269\u8BC6\u522B": "\u9762\u5BB9 ID",
        "\u79FB\u52A8\u7F51\u7EDC": "5G",
        "\u8702\u7A9D\u57FA\u5E26": "\u9AD8\u901A X70",
        "\u9996\u53D1\u7CFB\u7EDF": "iOS 17"
      }
    },
    "colors": [
      {
        "hex": "#FBE0E2",
        "name": "\u7C89\u8272",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-15-pink-select-202309?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#D3DAE1",
        "name": "\u84DD\u8272",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-15-blue-select-202309?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#F6E9B6",
        "name": "\u9EC4\u8272",
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
    "battery_cycle_standard": 1e3,
    "reference_score": 4200,
    "image_url": "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "\u673A\u8EAB": {
        "\u914D\u8272": "\u539F\u8272\u949B / \u84DD\u8272\u949B / \u767D\u8272\u949B / \u9ED1\u8272\u949B",
        "\u673A\u8EAB\u6750\u8D28": "\u949B\u91D1\u5C5E\u8FB9\u6846 + \u8D85\u74F7\u6676\u9762\u677F",
        "\u9632\u62A4\u7B49\u7EA7": "IP68",
        "\u5C3A\u5BF8\u4E0E\u91CD\u91CF": "146.6\xD770.6\xD78.25 mm\uFF0C187 \u514B"
      },
      "\u82AF\u7247": {
        "\u5236\u7A0B\u5DE5\u827A": "3nm",
        "\u82AF\u7247\u578B\u53F7": "A17 Pro",
        "\u4E2D\u592E\u5904\u7406\u5668": "6 \u6838",
        "\u56FE\u5F62\u5904\u7406\u5668": "6 \u6838\uFF08\u786C\u4EF6\u52A0\u901F\u5149\u7EBF\u8FFD\u8E2A\uFF09",
        "\u795E\u7ECF\u7F51\u7EDC\u5F15\u64CE": "16 \u6838"
      },
      "\u6444\u50CF\u5934": {
        "\u957F\u7126": "1200 \u4E07\u50CF\u7D20 3 \u500D\u5149\u5B66\u53D8\u7126 \u0192/2.8\uFF0877mm\uFF09",
        "\u8D85\u5E7F\u89D2": "1200 \u4E07\u50CF\u7D20 \u0192/2.2\uFF08\u5FAE\u8DDD\uFF09",
        "\u540E\u7F6E\u4E3B\u6444": "4800 \u4E07\u50CF\u7D20 \u0192/1.78\uFF08OIS\uFF09",
        "\u89C6\u9891\u62CD\u6444": "4K 60fps ProRes / Log",
        "\u524D\u7F6E\u6444\u50CF\u5934": "1200 \u4E07\u50CF\u7D20 \u0192/1.9"
      },
      "\u663E\u793A\u5C4F": {
        "\u4EAE\u5EA6": "1000 \u5C3C\u7279\u5178\u578B / 2000 \u5C3C\u7279\u6237\u5916\u5CF0\u503C",
        "\u5237\u65B0\u7387": "ProMotion 120Hz \u81EA\u9002\u5E94 + \u5168\u5929\u5019\u663E\u793A",
        "\u5C4F\u5E55\u5C3A\u5BF8": "6.1 \u82F1\u5BF8",
        "\u5C4F\u5E55\u7C7B\u578B": "\u8D85\u89C6\u7F51\u819C XDR (OLED)",
        "\u5168\u9762\u5C4F\u8BBE\u8BA1": "\u7075\u52A8\u5C9B",
        "\u5206\u8FA8\u7387\u4E0E\u50CF\u7D20\u5BC6\u5EA6": "2556\xD71179\uFF0C460 ppi"
      },
      "\u5185\u5B58\u4E0E\u5B58\u50A8": {
        "\u5B58\u50A8\u5BB9\u91CF": "128 / 256 / 512GB / 1TB",
        "\u8FD0\u884C\u5185\u5B58": "8GB"
      },
      "\u7535\u6C60\u4E0E\u5145\u7535": {
        "\u65E0\u7EBF\u5145\u7535": "MagSafe 15W / Qi2",
        "\u6709\u7EBF\u5FEB\u5145": "20W\uFF08USB-C 3\uFF0C\u7EA6 30 \u5206\u949F\u5145\u81F3 50%\uFF09",
        "\u7535\u6C60\u5BB9\u91CF": "3274 mAh",
        "\u89C6\u9891\u64AD\u653E": "\u6700\u957F 23 \u5C0F\u65F6"
      },
      "\u8FDE\u63A5\u4E0E\u5176\u4ED6": {
        "\u63A5\u53E3": "USB-C\uFF08USB 3\uFF0C10Gb/s\uFF09",
        "\u5176\u4ED6\u7279\u6027": "\u52A8\u4F5C\u6309\u94AE",
        "\u65E0\u7EBF\u8FDE\u63A5": "Wi-Fi 6E\uFF0C\u84DD\u7259 5.3",
        "\u751F\u7269\u8BC6\u522B": "\u9762\u5BB9 ID",
        "\u79FB\u52A8\u7F51\u7EDC": "5G",
        "\u8702\u7A9D\u57FA\u5E26": "\u9AD8\u901A X70",
        "\u9996\u53D1\u7CFB\u7EDF": "iOS 17"
      }
    },
    "colors": [
      {
        "hex": "#8E8B8E",
        "name": "\u539F\u8272\u949B\u91D1\u5C5E",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#39485D",
        "name": "\u84DD\u8272\u949B\u91D1\u5C5E",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-bluetitanium?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#E8E4DC",
        "name": "\u767D\u8272\u949B\u91D1\u5C5E",
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
    "battery_cycle_standard": 1e3,
    "reference_score": 4500,
    "image_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "\u673A\u8EAB": {
        "\u914D\u8272": "\u9ED1 / \u767D / \u7C89 / \u9752\u7EFF\u8272 / \u7FA4\u9752\u8272",
        "\u673A\u8EAB\u6750\u8D28": "\u94DD\u91D1\u5C5E\u8FB9\u6846 + \u7194\u8272\u73BB\u7483\u80CC\u677F",
        "\u9632\u62A4\u7B49\u7EA7": "IP68",
        "\u5C3A\u5BF8\u4E0E\u91CD\u91CF": "147.6\xD771.6\xD77.8 mm\uFF0C170 \u514B"
      },
      "\u82AF\u7247": {
        "\u5236\u7A0B\u5DE5\u827A": "3nm",
        "\u82AF\u7247\u578B\u53F7": "A18",
        "\u4E2D\u592E\u5904\u7406\u5668": "6 \u6838",
        "\u56FE\u5F62\u5904\u7406\u5668": "5 \u6838",
        "\u795E\u7ECF\u7F51\u7EDC\u5F15\u64CE": "16 \u6838\uFF08\u652F\u6301 Apple \u667A\u80FD\uFF09"
      },
      "\u6444\u50CF\u5934": {
        "\u957F\u7126": "\u65E0\uFF082 \u500D\u5149\u5B66\u54C1\u8D28\u53D8\u7126\uFF09",
        "\u8D85\u5E7F\u89D2": "1200 \u4E07\u50CF\u7D20 \u0192/2.2\uFF08\u5FAE\u8DDD\uFF09",
        "\u540E\u7F6E\u4E3B\u6444": "4800 \u4E07\u50CF\u7D20\u878D\u5408\u5F0F \u0192/1.6",
        "\u89C6\u9891\u62CD\u6444": "4K 60fps \u675C\u6BD4\u89C6\u754C",
        "\u524D\u7F6E\u6444\u50CF\u5934": "1200 \u4E07\u50CF\u7D20 \u0192/1.9"
      },
      "\u663E\u793A\u5C4F": {
        "\u4EAE\u5EA6": "1000 \u5C3C\u7279\u5178\u578B / 2000 \u5C3C\u7279\u6237\u5916\u5CF0\u503C",
        "\u5237\u65B0\u7387": "60Hz",
        "\u5C4F\u5E55\u5C3A\u5BF8": "6.1 \u82F1\u5BF8",
        "\u5C4F\u5E55\u7C7B\u578B": "\u8D85\u89C6\u7F51\u819C XDR (OLED)",
        "\u5168\u9762\u5C4F\u8BBE\u8BA1": "\u7075\u52A8\u5C9B",
        "\u5206\u8FA8\u7387\u4E0E\u50CF\u7D20\u5BC6\u5EA6": "2556\xD71179\uFF0C460 ppi"
      },
      "\u5185\u5B58\u4E0E\u5B58\u50A8": {
        "\u5B58\u50A8\u5BB9\u91CF": "128 / 256 / 512GB",
        "\u8FD0\u884C\u5185\u5B58": "8GB"
      },
      "\u7535\u6C60\u4E0E\u5145\u7535": {
        "\u65E0\u7EBF\u5145\u7535": "MagSafe 25W\uFF08Qi2\uFF09",
        "\u6709\u7EBF\u5FEB\u5145": "20W\uFF08\u7EA6 30 \u5206\u949F\u5145\u81F3 50%\uFF09",
        "\u7535\u6C60\u5BB9\u91CF": "3561 mAh",
        "\u89C6\u9891\u64AD\u653E": "\u6700\u957F 22 \u5C0F\u65F6"
      },
      "\u8FDE\u63A5\u4E0E\u5176\u4ED6": {
        "\u63A5\u53E3": "USB-C\uFF08USB 2\uFF09",
        "\u5176\u4ED6\u7279\u6027": "\u76F8\u673A\u63A7\u5236\u6309\u94AE",
        "\u65E0\u7EBF\u8FDE\u63A5": "Wi-Fi 7\uFF0C\u84DD\u7259 5.3",
        "\u751F\u7269\u8BC6\u522B": "\u9762\u5BB9 ID",
        "\u79FB\u52A8\u7F51\u7EDC": "5G",
        "\u8702\u7A9D\u57FA\u5E26": "\u9AD8\u901A",
        "\u9996\u53D1\u7CFB\u7EDF": "iOS 18"
      }
    },
    "colors": [
      {
        "hex": "#5871C7",
        "name": "\u7FA4\u9752\u8272",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-16-ultramarine-select-202409?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#A8CCC9",
        "name": "\u9752\u7EFF\u8272",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-16-teal-select-202409?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#EEB8C6",
        "name": "\u7C89\u8272",
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
    "battery_cycle_standard": 1e3,
    "reference_score": 4600,
    "image_url": "https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "\u673A\u8EAB": {
        "\u914D\u8272": "\u9ED1\u8272\u949B / \u767D\u8272\u949B / \u539F\u8272\u949B / \u6C99\u6F20\u949B",
        "\u673A\u8EAB\u6750\u8D28": "\u949B\u91D1\u5C5E\u8FB9\u6846 + \u8D85\u74F7\u6676\u9762\u677F",
        "\u9632\u62A4\u7B49\u7EA7": "IP68",
        "\u5C3A\u5BF8\u4E0E\u91CD\u91CF": "149.6\xD771.5\xD78.25 mm\uFF0C199 \u514B"
      },
      "\u82AF\u7247": {
        "\u5236\u7A0B\u5DE5\u827A": "3nm",
        "\u82AF\u7247\u578B\u53F7": "A18 Pro",
        "\u4E2D\u592E\u5904\u7406\u5668": "6 \u6838",
        "\u56FE\u5F62\u5904\u7406\u5668": "6 \u6838\uFF08\u786C\u4EF6\u52A0\u901F\u5149\u7EBF\u8FFD\u8E2A\uFF09",
        "\u795E\u7ECF\u7F51\u7EDC\u5F15\u64CE": "16 \u6838\uFF08\u652F\u6301 Apple \u667A\u80FD\uFF09"
      },
      "\u6444\u50CF\u5934": {
        "\u957F\u7126": "1200 \u4E07\u50CF\u7D20 5 \u500D\u5149\u5B66\u53D8\u7126 \u0192/2.8\uFF08120mm\uFF09",
        "\u8D85\u5E7F\u89D2": "4800 \u4E07\u50CF\u7D20 \u0192/2.2\uFF08\u5FAE\u8DDD\uFF09",
        "\u540E\u7F6E\u4E3B\u6444": "4800 \u4E07\u50CF\u7D20 \u0192/1.78\uFF08OIS\uFF09",
        "\u89C6\u9891\u62CD\u6444": "4K 120fps \u675C\u6BD4\u89C6\u754C",
        "\u524D\u7F6E\u6444\u50CF\u5934": "1200 \u4E07\u50CF\u7D20 \u0192/1.9"
      },
      "\u663E\u793A\u5C4F": {
        "\u4EAE\u5EA6": "1000 \u5C3C\u7279\u5178\u578B / 2000 \u5C3C\u7279\u6237\u5916\u5CF0\u503C",
        "\u5237\u65B0\u7387": "ProMotion 120Hz \u81EA\u9002\u5E94 + \u5168\u5929\u5019\u663E\u793A",
        "\u5C4F\u5E55\u5C3A\u5BF8": "6.3 \u82F1\u5BF8",
        "\u5C4F\u5E55\u7C7B\u578B": "\u8D85\u89C6\u7F51\u819C XDR (OLED)",
        "\u5168\u9762\u5C4F\u8BBE\u8BA1": "\u7075\u52A8\u5C9B",
        "\u5206\u8FA8\u7387\u4E0E\u50CF\u7D20\u5BC6\u5EA6": "2622\xD71206\uFF0C460 ppi"
      },
      "\u5185\u5B58\u4E0E\u5B58\u50A8": {
        "\u5B58\u50A8\u5BB9\u91CF": "128 / 256 / 512GB / 1TB",
        "\u8FD0\u884C\u5185\u5B58": "8GB"
      },
      "\u7535\u6C60\u4E0E\u5145\u7535": {
        "\u65E0\u7EBF\u5145\u7535": "MagSafe 25W\uFF08Qi2\uFF09",
        "\u6709\u7EBF\u5FEB\u5145": "20W\uFF08\u7EA6 30 \u5206\u949F\u5145\u81F3 50%\uFF09",
        "\u7535\u6C60\u5BB9\u91CF": "3582 mAh",
        "\u89C6\u9891\u64AD\u653E": "\u6700\u957F 27 \u5C0F\u65F6"
      },
      "\u8FDE\u63A5\u4E0E\u5176\u4ED6": {
        "\u63A5\u53E3": "USB-C\uFF08USB 3\uFF0C10Gb/s\uFF09",
        "\u5176\u4ED6\u7279\u6027": "\u76F8\u673A\u63A7\u5236\u6309\u94AE",
        "\u65E0\u7EBF\u8FDE\u63A5": "Wi-Fi 7\uFF0C\u84DD\u7259 5.3",
        "\u751F\u7269\u8BC6\u522B": "\u9762\u5BB9 ID",
        "\u79FB\u52A8\u7F51\u7EDC": "5G",
        "\u8702\u7A9D\u57FA\u5E26": "\u9AD8\u901A",
        "\u9996\u53D1\u7CFB\u7EDF": "iOS 18"
      }
    },
    "colors": [
      {
        "hex": "#C8A882",
        "name": "\u6C99\u6F20\u8272\u949B\u91D1\u5C5E",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-deserttitanium?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#BEB6AB",
        "name": "\u539F\u8272\u949B\u91D1\u5C5E",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-naturaltitanium?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#35373A",
        "name": "\u9ED1\u8272\u949B\u91D1\u5C5E",
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
    "battery_cycle_standard": 1e3,
    "reference_score": 4900,
    "image_url": "https://images.unsplash.com/photo-1586300154759-9ec5b3e6f2d8?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "\u673A\u8EAB": {
        "\u914D\u8272": "\u85B0\u8863\u8349\u8272 / \u96FE\u84DD\u8272 / \u9F20\u5C3E\u8349\u7EFF / \u767D / \u9ED1",
        "\u673A\u8EAB\u6750\u8D28": "\u94DD\u91D1\u5C5E\u4E00\u4F53\u6210\u578B\u673A\u8EAB",
        "\u9632\u62A4\u7B49\u7EA7": "IP68",
        "\u5C3A\u5BF8\u4E0E\u91CD\u91CF": "149.6\xD771.95\xD77.95 mm\uFF0C177 \u514B"
      },
      "\u82AF\u7247": {
        "\u5236\u7A0B\u5DE5\u827A": "3nm",
        "\u82AF\u7247\u578B\u53F7": "A19",
        "\u4E2D\u592E\u5904\u7406\u5668": "6 \u6838",
        "\u56FE\u5F62\u5904\u7406\u5668": "5 \u6838\uFF08\u795E\u7ECF\u7F51\u7EDC\u52A0\u901F\u5668\uFF09",
        "\u795E\u7ECF\u7F51\u7EDC\u5F15\u64CE": "16 \u6838\uFF08\u652F\u6301 Apple \u667A\u80FD\uFF09"
      },
      "\u6444\u50CF\u5934": {
        "\u957F\u7126": "\u65E0\uFF082 \u500D\u5149\u5B66\u54C1\u8D28\u53D8\u7126\uFF09",
        "\u8D85\u5E7F\u89D2": "4800 \u4E07\u50CF\u7D20\u878D\u5408\u5F0F \u0192/2.2\uFF08\u5FAE\u8DDD\uFF09",
        "\u540E\u7F6E\u4E3B\u6444": "4800 \u4E07\u50CF\u7D20\u878D\u5408\u5F0F \u0192/1.6",
        "\u89C6\u9891\u62CD\u6444": "4K 60fps \u675C\u6BD4\u89C6\u754C",
        "\u524D\u7F6E\u6444\u50CF\u5934": "1800 \u4E07\u50CF\u7D20 Center Stage \u0192/1.9"
      },
      "\u663E\u793A\u5C4F": {
        "\u4EAE\u5EA6": "1000 \u5C3C\u7279\u5178\u578B / 3000 \u5C3C\u7279\u6237\u5916\u5CF0\u503C",
        "\u5237\u65B0\u7387": "ProMotion 120Hz \u81EA\u9002\u5E94 + \u5168\u5929\u5019\u663E\u793A",
        "\u5C4F\u5E55\u5C3A\u5BF8": "6.3 \u82F1\u5BF8",
        "\u5C4F\u5E55\u7C7B\u578B": "\u8D85\u89C6\u7F51\u819C XDR (OLED)",
        "\u5168\u9762\u5C4F\u8BBE\u8BA1": "\u7075\u52A8\u5C9B",
        "\u5206\u8FA8\u7387\u4E0E\u50CF\u7D20\u5BC6\u5EA6": "2622\xD71206\uFF0C460 ppi"
      },
      "\u5185\u5B58\u4E0E\u5B58\u50A8": {
        "\u5B58\u50A8\u5BB9\u91CF": "256 / 512GB",
        "\u8FD0\u884C\u5185\u5B58": "8GB"
      },
      "\u7535\u6C60\u4E0E\u5145\u7535": {
        "\u65E0\u7EBF\u5145\u7535": "MagSafe 25W\uFF08Qi2\uFF09",
        "\u6709\u7EBF\u5FEB\u5145": "20W\uFF08\u7EA6 30 \u5206\u949F\u5145\u81F3 50%\uFF09",
        "\u7535\u6C60\u5BB9\u91CF": "3692 mAh",
        "\u89C6\u9891\u64AD\u653E": "\u6700\u957F 30 \u5C0F\u65F6"
      },
      "\u8FDE\u63A5\u4E0E\u5176\u4ED6": {
        "\u63A5\u53E3": "USB-C",
        "\u5176\u4ED6\u7279\u6027": "\u76F8\u673A\u63A7\u5236\u6309\u94AE",
        "\u65E0\u7EBF\u8FDE\u63A5": "Wi-Fi 7\uFF0C\u84DD\u7259 6\uFF0CApple N1 \u65E0\u7EBF\u82AF\u7247",
        "\u751F\u7269\u8BC6\u522B": "\u9762\u5BB9 ID",
        "\u79FB\u52A8\u7F51\u7EDC": "5G",
        "\u8702\u7A9D\u57FA\u5E26": "\u9AD8\u901A",
        "\u9996\u53D1\u7CFB\u7EDF": "iOS 26"
      }
    },
    "colors": [
      {
        "hex": "#AECBDD",
        "name": "\u8FF7\u96FE\u84DD",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-finish-select-mistblue-202509?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#D8C7E8",
        "name": "\u85B0\u8863\u8349\u7D2B",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-finish-select-lavender-202509?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#AFBFAE",
        "name": "\u9F20\u5C3E\u8349\u7EFF",
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
    "battery_cycle_standard": 1e3,
    "reference_score": 5200,
    "image_url": "https://images.unsplash.com/photo-1587590227264-0ac64ce63ce8?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "\u673A\u8EAB": {
        "\u914D\u8272": "\u661F\u5B87\u6A59 / \u6DF1\u84DD\u8272 / \u94F6\u8272 / \u6DF1\u9ED1\u8272",
        "\u673A\u8EAB\u6750\u8D28": "\u94DD\u91D1\u5C5E\u4E00\u4F53\u6210\u578B + \u96FE\u9762\u73BB\u7483\u80CC\u677F",
        "\u9632\u62A4\u7B49\u7EA7": "IP68",
        "\u5C3A\u5BF8\u4E0E\u91CD\u91CF": "150.0\xD771.9\xD78.75 mm\uFF0C206 \u514B"
      },
      "\u82AF\u7247": {
        "\u6563\u70ED": "VC \u5747\u70ED\u677F\u6563\u70ED",
        "\u5236\u7A0B\u5DE5\u827A": "3nm",
        "\u82AF\u7247\u578B\u53F7": "A19 Pro",
        "\u4E2D\u592E\u5904\u7406\u5668": "6 \u6838",
        "\u56FE\u5F62\u5904\u7406\u5668": "6 \u6838",
        "\u795E\u7ECF\u7F51\u7EDC\u5F15\u64CE": "16 \u6838\uFF08\u652F\u6301 Apple \u667A\u80FD\uFF09"
      },
      "\u6444\u50CF\u5934": {
        "\u957F\u7126": "4800 \u4E07\u50CF\u7D20 4 \u500D\u5149\u5B66\u53D8\u7126 \u0192/2.8\uFF08100mm\uFF0C8 \u500D\u5149\u5B66\u54C1\u8D28\u53D8\u7126\uFF09",
        "\u8D85\u5E7F\u89D2": "4800 \u4E07\u50CF\u7D20\u878D\u5408\u5F0F \u0192/2.2",
        "\u540E\u7F6E\u4E3B\u6444": "4800 \u4E07\u50CF\u7D20\u878D\u5408\u5F0F \u0192/1.78",
        "\u89C6\u9891\u62CD\u6444": "4K 120fps \u675C\u6BD4\u89C6\u754C\uFF08ProRes RAW / Genlock\uFF09",
        "\u524D\u7F6E\u6444\u50CF\u5934": "1800 \u4E07\u50CF\u7D20 Center Stage \u0192/1.9"
      },
      "\u663E\u793A\u5C4F": {
        "\u4EAE\u5EA6": "1000 \u5C3C\u7279\u5178\u578B / 3000 \u5C3C\u7279\u6237\u5916\u5CF0\u503C",
        "\u5237\u65B0\u7387": "ProMotion 120Hz \u81EA\u9002\u5E94 + \u5168\u5929\u5019\u663E\u793A",
        "\u5C4F\u5E55\u5C3A\u5BF8": "6.3 \u82F1\u5BF8",
        "\u5C4F\u5E55\u7C7B\u578B": "\u8D85\u89C6\u7F51\u819C XDR (OLED)",
        "\u5168\u9762\u5C4F\u8BBE\u8BA1": "\u7075\u52A8\u5C9B",
        "\u5206\u8FA8\u7387\u4E0E\u50CF\u7D20\u5BC6\u5EA6": "2622\xD71206\uFF0C460 ppi"
      },
      "\u5185\u5B58\u4E0E\u5B58\u50A8": {
        "\u5B58\u50A8\u5BB9\u91CF": "256 / 512GB / 1TB",
        "\u8FD0\u884C\u5185\u5B58": "12GB"
      },
      "\u7535\u6C60\u4E0E\u5145\u7535": {
        "\u65E0\u7EBF\u5145\u7535": "MagSafe 25W\uFF08Qi2\uFF09",
        "\u6709\u7EBF\u5FEB\u5145": "40W\uFF08\u7EA6 20 \u5206\u949F\u5145\u81F3 50%\uFF09",
        "\u7535\u6C60\u5BB9\u91CF": "3998 mAh",
        "\u89C6\u9891\u64AD\u653E": "\u6700\u957F 33 \u5C0F\u65F6"
      },
      "\u8FDE\u63A5\u4E0E\u5176\u4ED6": {
        "\u63A5\u53E3": "USB-C\uFF08USB 3\uFF0C10Gb/s\uFF09",
        "\u5176\u4ED6\u7279\u6027": "\u76F8\u673A\u63A7\u5236 + \u52A8\u4F5C\u6309\u94AE",
        "\u65E0\u7EBF\u8FDE\u63A5": "Wi-Fi 7\uFF0C\u84DD\u7259 6\uFF0CApple N1 \u65E0\u7EBF\u82AF\u7247",
        "\u751F\u7269\u8BC6\u522B": "\u9762\u5BB9 ID",
        "\u79FB\u52A8\u7F51\u7EDC": "5G",
        "\u8702\u7A9D\u57FA\u5E26": "\u9AD8\u901A",
        "\u9996\u53D1\u7CFB\u7EDF": "iOS 26"
      }
    },
    "colors": [
      {
        "hex": "#F97A2F",
        "name": "\u5B87\u5B99\u6A59\u8272",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-pro-finish-select-cosmicorange-202509?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#223C63",
        "name": "\u6DF1\u84DD\u8272",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-pro-finish-select-deepblue-202509?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#E8E8E6",
        "name": "\u94F6\u8272",
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
    "battery_cycle_standard": 1e3,
    "reference_score": 5200,
    "image_url": "https://images.unsplash.com/photo-1607936854279-55e8a4c64888?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "\u673A\u8EAB": {
        "\u914D\u8272": "\u661F\u5B87\u6A59 / \u6DF1\u84DD\u8272 / \u94F6\u8272 / \u6DF1\u9ED1\u8272",
        "\u673A\u8EAB\u6750\u8D28": "\u94DD\u91D1\u5C5E\u4E00\u4F53\u6210\u578B + \u96FE\u9762\u73BB\u7483\u80CC\u677F",
        "\u9632\u62A4\u7B49\u7EA7": "IP68",
        "\u5C3A\u5BF8\u4E0E\u91CD\u91CF": "163.4\xD778.0\xD78.75 mm\uFF0C233 \u514B"
      },
      "\u82AF\u7247": {
        "\u6563\u70ED": "VC \u5747\u70ED\u677F\u6563\u70ED",
        "\u5236\u7A0B\u5DE5\u827A": "3nm",
        "\u82AF\u7247\u578B\u53F7": "A19 Pro",
        "\u4E2D\u592E\u5904\u7406\u5668": "6 \u6838",
        "\u56FE\u5F62\u5904\u7406\u5668": "6 \u6838",
        "\u795E\u7ECF\u7F51\u7EDC\u5F15\u64CE": "16 \u6838\uFF08\u652F\u6301 Apple \u667A\u80FD\uFF09"
      },
      "\u6444\u50CF\u5934": {
        "\u957F\u7126": "4800 \u4E07\u50CF\u7D20 4 \u500D\u5149\u5B66\u53D8\u7126 \u0192/2.8\uFF08100mm\uFF0C8 \u500D\u5149\u5B66\u54C1\u8D28\u53D8\u7126\uFF09",
        "\u8D85\u5E7F\u89D2": "4800 \u4E07\u50CF\u7D20\u878D\u5408\u5F0F \u0192/2.2",
        "\u540E\u7F6E\u4E3B\u6444": "4800 \u4E07\u50CF\u7D20\u878D\u5408\u5F0F \u0192/1.78",
        "\u89C6\u9891\u62CD\u6444": "4K 120fps \u675C\u6BD4\u89C6\u754C\uFF08ProRes RAW / Genlock\uFF09",
        "\u524D\u7F6E\u6444\u50CF\u5934": "1800 \u4E07\u50CF\u7D20 Center Stage \u0192/1.9"
      },
      "\u663E\u793A\u5C4F": {
        "\u4EAE\u5EA6": "1000 \u5C3C\u7279\u5178\u578B / 3000 \u5C3C\u7279\u6237\u5916\u5CF0\u503C",
        "\u5237\u65B0\u7387": "ProMotion 120Hz \u81EA\u9002\u5E94 + \u5168\u5929\u5019\u663E\u793A",
        "\u5C4F\u5E55\u5C3A\u5BF8": "6.9 \u82F1\u5BF8",
        "\u5C4F\u5E55\u7C7B\u578B": "\u8D85\u89C6\u7F51\u819C XDR (OLED)",
        "\u5168\u9762\u5C4F\u8BBE\u8BA1": "\u7075\u52A8\u5C9B",
        "\u5206\u8FA8\u7387\u4E0E\u50CF\u7D20\u5BC6\u5EA6": "2868\xD71320\uFF0C460 ppi"
      },
      "\u5185\u5B58\u4E0E\u5B58\u50A8": {
        "\u5B58\u50A8\u5BB9\u91CF": "256 / 512GB / 2TB",
        "\u8FD0\u884C\u5185\u5B58": "12GB"
      },
      "\u7535\u6C60\u4E0E\u5145\u7535": {
        "\u65E0\u7EBF\u5145\u7535": "MagSafe 25W\uFF08Qi2\uFF09",
        "\u6709\u7EBF\u5FEB\u5145": "40W\uFF08\u7EA6 20 \u5206\u949F\u5145\u81F3 50%\uFF09",
        "\u7535\u6C60\u5BB9\u91CF": "4823 mAh",
        "\u89C6\u9891\u64AD\u653E": "\u6700\u957F 39 \u5C0F\u65F6"
      },
      "\u8FDE\u63A5\u4E0E\u5176\u4ED6": {
        "\u63A5\u53E3": "USB-C\uFF08USB 3\uFF0C10Gb/s\uFF09",
        "\u5176\u4ED6\u7279\u6027": "\u76F8\u673A\u63A7\u5236 + \u52A8\u4F5C\u6309\u94AE",
        "\u65E0\u7EBF\u8FDE\u63A5": "Wi-Fi 7\uFF0C\u84DD\u7259 6\uFF0CApple N1 \u65E0\u7EBF\u82AF\u7247",
        "\u751F\u7269\u8BC6\u522B": "\u9762\u5BB9 ID",
        "\u79FB\u52A8\u7F51\u7EDC": "5G",
        "\u8702\u7A9D\u57FA\u5E26": "\u9AD8\u901A",
        "\u9996\u53D1\u7CFB\u7EDF": "iOS 26"
      }
    },
    "colors": [
      {
        "hex": "#F97A2F",
        "name": "\u5B87\u5B99\u6A59\u8272",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-pro-max-finish-select-cosmicorange-202509?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#223C63",
        "name": "\u6DF1\u84DD\u8272",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-pro-max-finish-select-deepblue-202509?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#E8E8E6",
        "name": "\u94F6\u8272",
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
    "battery_cycle_standard": 1e3,
    "reference_score": 5200,
    "image_url": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "\u673A\u8EAB": {
        "\u914D\u8272": "\u5929\u7A7A\u84DD / \u6D45\u91D1\u8272 / \u4E91\u767D\u8272 / \u6DF1\u9ED1\u8272",
        "\u673A\u8EAB\u6750\u8D28": "\u949B\u91D1\u5C5E\u6846\u67B6 + \u94DD\u91D1\u5C5E\u4E00\u4F53\u6210\u578B\u673A\u8EAB",
        "\u9632\u62A4\u7B49\u7EA7": "IP68",
        "\u5C3A\u5BF8\u4E0E\u91CD\u91CF": "156.2\xD774.7\xD75.64 mm\uFF0C165 \u514B"
      },
      "\u82AF\u7247": {
        "\u5236\u7A0B\u5DE5\u827A": "3nm",
        "\u82AF\u7247\u578B\u53F7": "A19 Pro",
        "\u4E2D\u592E\u5904\u7406\u5668": "6 \u6838",
        "\u56FE\u5F62\u5904\u7406\u5668": "6 \u6838",
        "\u795E\u7ECF\u7F51\u7EDC\u5F15\u64CE": "16 \u6838\uFF08\u652F\u6301 Apple \u667A\u80FD\uFF09"
      },
      "\u6444\u50CF\u5934": {
        "\u957F\u7126": "\u65E0\uFF082 \u500D\u5149\u5B66\u54C1\u8D28\u53D8\u7126\uFF09",
        "\u8D85\u5E7F\u89D2": "\u65E0",
        "\u540E\u7F6E\u4E3B\u6444": "4800 \u4E07\u50CF\u7D20\u878D\u5408\u5F0F \u0192/1.65",
        "\u89C6\u9891\u62CD\u6444": "4K 60fps \u675C\u6BD4\u89C6\u754C",
        "\u524D\u7F6E\u6444\u50CF\u5934": "1800 \u4E07\u50CF\u7D20 Center Stage \u0192/1.9"
      },
      "\u663E\u793A\u5C4F": {
        "\u4EAE\u5EA6": "1000 \u5C3C\u7279\u5178\u578B / 3000 \u5C3C\u7279\u6237\u5916\u5CF0\u503C",
        "\u5237\u65B0\u7387": "ProMotion 120Hz \u81EA\u9002\u5E94 + \u5168\u5929\u5019\u663E\u793A",
        "\u5C4F\u5E55\u5C3A\u5BF8": "6.5 \u82F1\u5BF8",
        "\u5C4F\u5E55\u7C7B\u578B": "\u8D85\u89C6\u7F51\u819C XDR (OLED)",
        "\u5168\u9762\u5C4F\u8BBE\u8BA1": "\u7075\u52A8\u5C9B",
        "\u5206\u8FA8\u7387\u4E0E\u50CF\u7D20\u5BC6\u5EA6": "2736\xD71260\uFF0C460 ppi"
      },
      "\u5185\u5B58\u4E0E\u5B58\u50A8": {
        "\u5B58\u50A8\u5BB9\u91CF": "256 / 512GB / 1TB",
        "\u8FD0\u884C\u5185\u5B58": "8GB"
      },
      "\u7535\u6C60\u4E0E\u5145\u7535": {
        "\u65E0\u7EBF\u5145\u7535": "MagSafe 25W\uFF08Qi2\uFF09",
        "\u6709\u7EBF\u5FEB\u5145": "\u7EA6 30 \u5206\u949F\u5145\u81F3 50%",
        "\u7535\u6C60\u5BB9\u91CF": "3149 mAh",
        "\u89C6\u9891\u64AD\u653E": "\u6700\u957F 27 \u5C0F\u65F6"
      },
      "\u8FDE\u63A5\u4E0E\u5176\u4ED6": {
        "\u63A5\u53E3": "USB-C",
        "\u65E0\u7EBF\u8FDE\u63A5": "Wi-Fi 7\uFF0C\u84DD\u7259 6\uFF0CApple N1 \u65E0\u7EBF\u82AF\u7247",
        "\u751F\u7269\u8BC6\u522B": "\u9762\u5BB9 ID",
        "\u79FB\u52A8\u7F51\u7EDC": "5G\uFF08\u4EC5 eSIM\uFF09",
        "\u8702\u7A9D\u57FA\u5E26": "Apple C1X",
        "\u9996\u53D1\u7CFB\u7EDF": "iOS 26"
      }
    },
    "colors": [
      {
        "hex": "#BFD7EA",
        "name": "\u5929\u84DD\u8272",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-air-finish-select-skyblue-202509?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#EFE0B8",
        "name": "\u6D45\u91D1\u8272",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-air-finish-select-lightgold-202509?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#2B2B2E",
        "name": "\u6DF1\u7A7A\u9ED1",
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
    "battery_cycle_standard": 1e3,
    "reference_score": 4900,
    "image_url": "https://images.unsplash.com/photo-1592286927505-1def25115558?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "\u673A\u8EAB": {
        "\u914D\u8272": "\u9ED1 / \u767D / \u6D45\u7C89\u8272",
        "\u673A\u8EAB\u6750\u8D28": "\u94DD\u91D1\u5C5E\u8FB9\u6846 + \u8D85\u74F7\u6676\u9762\u677F 2 + \u73BB\u7483\u80CC\u677F",
        "\u9632\u62A4\u7B49\u7EA7": "IP68\uFF086 \u7C73\u6C34\u6DF1\uFF09",
        "\u5C3A\u5BF8\u4E0E\u91CD\u91CF": "146.7\xD771.5\xD77.80 mm\uFF0C170 \u514B"
      },
      "\u82AF\u7247": {
        "\u5236\u7A0B\u5DE5\u827A": "3nm",
        "\u82AF\u7247\u578B\u53F7": "A19",
        "\u4E2D\u592E\u5904\u7406\u5668": "6 \u6838",
        "\u56FE\u5F62\u5904\u7406\u5668": "4 \u6838\uFF08\u795E\u7ECF\u7F51\u7EDC\u52A0\u901F\u5668\uFF09",
        "\u795E\u7ECF\u7F51\u7EDC\u5F15\u64CE": "16 \u6838\uFF08\u652F\u6301 Apple \u667A\u80FD\uFF0C\u786C\u4EF6\u5149\u8FFD\uFF09"
      },
      "\u6444\u50CF\u5934": {
        "\u957F\u7126": "\u65E0\uFF08\u6700\u9AD8 10 \u500D\u6570\u7801\u53D8\u7126\uFF09",
        "\u8D85\u5E7F\u89D2": "\u65E0",
        "\u540E\u7F6E\u4E3B\u6444": "4800 \u4E07\u50CF\u7D20\u878D\u5408\u5F0F \u0192/1.6\uFF08OIS\uFF0C2 \u500D\u5149\u5B66\u54C1\u8D28\u53D8\u7126\uFF09",
        "\u89C6\u9891\u62CD\u6444": "4K 60fps \u675C\u6BD4\u89C6\u754C",
        "\u524D\u7F6E\u6444\u50CF\u5934": "1200 \u4E07\u50CF\u7D20\u539F\u6DF1\u611F \u0192/1.9"
      },
      "\u663E\u793A\u5C4F": {
        "\u4EAE\u5EA6": "800 \u5C3C\u7279\u5178\u578B / 1200 \u5C3C\u7279\u5CF0\u503C (HDR)",
        "\u5237\u65B0\u7387": "60Hz",
        "\u5C4F\u5E55\u5C3A\u5BF8": "6.1 \u82F1\u5BF8",
        "\u5C4F\u5E55\u7C7B\u578B": "\u8D85\u89C6\u7F51\u819C XDR (OLED)",
        "\u5168\u9762\u5C4F\u8BBE\u8BA1": "\u5218\u6D77\u5C4F\uFF08\u4E03\u5C42\u6297\u53CD\u5C04\u6D82\u5C42\uFF09",
        "\u5206\u8FA8\u7387\u4E0E\u50CF\u7D20\u5BC6\u5EA6": "2532\xD71170\uFF0C460 ppi"
      },
      "\u5185\u5B58\u4E0E\u5B58\u50A8": {
        "\u5B58\u50A8\u5BB9\u91CF": "256 / 512GB",
        "\u8FD0\u884C\u5185\u5B58": "8GB"
      },
      "\u7535\u6C60\u4E0E\u5145\u7535": {
        "\u65E0\u7EBF\u5145\u7535": "MagSafe 15W\uFF08Qi2\uFF09",
        "\u6709\u7EBF\u5FEB\u5145": "\u7EA6 30 \u5206\u949F\u5145\u81F3 50%",
        "\u89C6\u9891\u64AD\u653E": "\u6700\u957F 26 \u5C0F\u65F6"
      },
      "\u8FDE\u63A5\u4E0E\u5176\u4ED6": {
        "\u63A5\u53E3": "USB-C",
        "\u5176\u4ED6\u7279\u6027": "\u64CD\u4F5C\u6309\u94AE",
        "\u65E0\u7EBF\u8FDE\u63A5": "Wi-Fi 7\uFF0C\u84DD\u7259 6\uFF0CApple N1 \u65E0\u7EBF\u82AF\u7247",
        "\u751F\u7269\u8BC6\u522B": "\u9762\u5BB9 ID",
        "\u79FB\u52A8\u7F51\u7EDC": "5G",
        "\u8702\u7A9D\u57FA\u5E26": "Apple C1X",
        "\u9996\u53D1\u7CFB\u7EDF": "iOS 26"
      }
    },
    "colors": [
      {
        "hex": "#3A3A3C",
        "name": "\u9ED1\u8272",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17e-finish-select-black-202603?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#F5F2EC",
        "name": "\u767D\u8272",
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
    "battery_cycle_standard": 1e3,
    "reference_score": 6e3,
    "image_url": "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "\u673A\u8EAB": {
        "\u914D\u8272": "\u52C3\u826E\u7B2C\u9152\u7EA2 / \u51B0\u5DDD\u84DD / \u94F6\u8272 / \u9ED1\u8272",
        "\u673A\u8EAB\u6750\u8D28": "\u94DD\u91D1\u5C5E\u4E00\u4F53\u6210\u578B\uFF0885% \u518D\u751F\u94DD\uFF09+ \u8D85\u74F7\u6676\u9762\u677F 2",
        "\u9632\u62A4\u7B49\u7EA7": "IP68",
        "\u5C3A\u5BF8\u4E0E\u91CD\u91CF": "150.0\xD771.9\xD78.75 mm\uFF0C211 \u514B"
      },
      "\u82AF\u7247": {
        "\u6563\u70ED": "VC \u5747\u70ED\u677F\uFF08\u9762\u79EF 3 \u500D\u4E8E 17 Pro\uFF09",
        "\u5236\u7A0B\u5DE5\u827A": "2nm",
        "\u82AF\u7247\u578B\u53F7": "A20 Pro",
        "\u4E2D\u592E\u5904\u7406\u5668": "6 \u6838\uFF082 \u6027\u80FD + 4 \u80FD\u6548\uFF09",
        "\u56FE\u5F62\u5904\u7406\u5668": "7 \u6838\uFF08\u795E\u7ECF\u7F51\u7EDC\u52A0\u901F\u5668\uFF09",
        "\u795E\u7ECF\u7F51\u7EDC\u5F15\u64CE": "\u53CC 16 \u6838\uFF0832 \u6838\uFF0C\u786C\u4EF6\u5149\u8FFD\uFF09"
      },
      "\u6444\u50CF\u5934": {
        "\u957F\u7126": "4800 \u4E07\u50CF\u7D20\u878D\u5408\u5F0F 4 \u500D\u5149\u5B66\u53D8\u7126\uFF088 \u500D\u5149\u5B66\u54C1\u8D28 / \u6700\u9AD8 24 \u500D\u6570\u7801\uFF09",
        "\u8D85\u5E7F\u89D2": "4800 \u4E07\u50CF\u7D20\u878D\u5408\u5F0F \u0192/2.2",
        "\u540E\u7F6E\u4E3B\u6444": "4800 \u4E07\u50CF\u7D20\u878D\u5408\u5F0F\uFF08\u56DB\u6863\u53EF\u53D8\u5149\u5708 \u0192/1.48 / \u0192/1.8 / \u0192/2.8 / \u0192/4.0\uFF09",
        "\u89C6\u9891\u62CD\u6444": "4K 120fps \u675C\u6BD4\u89C6\u754C\uFF08Apple Log 2 / ProRes RAW / Genlock\uFF09",
        "\u524D\u7F6E\u6444\u50CF\u5934": "1800 \u4E07\u50CF\u7D20 Center Stage \u0192/1.9"
      },
      "\u663E\u793A\u5C4F": {
        "\u4EAE\u5EA6": "1000 \u5C3C\u7279\u5178\u578B / 1600 \u5C3C\u7279 (HDR) / 3000 \u5C3C\u7279\u6237\u5916\u5CF0\u503C",
        "\u5237\u65B0\u7387": "ProMotion 120Hz \u81EA\u9002\u5E94 + \u5168\u5929\u5019\u663E\u793A",
        "\u5C4F\u5E55\u5C3A\u5BF8": "6.3 \u82F1\u5BF8",
        "\u5C4F\u5E55\u7C7B\u578B": "\u8D85\u89C6\u7F51\u819C XDR (OLED)",
        "\u5168\u9762\u5C4F\u8BBE\u8BA1": "\u7075\u52A8\u5C9B\uFF08\u9762\u79EF\u7F29\u5C0F\uFF0C\u6297\u53CD\u5C04\u6D82\u5C42\uFF09",
        "\u5206\u8FA8\u7387\u4E0E\u50CF\u7D20\u5BC6\u5EA6": "2622\xD71206\uFF0C460 ppi"
      },
      "\u5185\u5B58\u4E0E\u5B58\u50A8": {
        "\u5B58\u50A8\u5BB9\u91CF": "256 / 512GB / 1TB / 2TB",
        "\u8FD0\u884C\u5185\u5B58": "12GB"
      },
      "\u7535\u6C60\u4E0E\u5145\u7535": {
        "\u65E0\u7EBF\u5145\u7535": "MagSafe 25W\uFF08Qi2\uFF09",
        "\u6709\u7EBF\u5FEB\u5145": "60W\uFF08\u7EA6 15 \u5206\u949F\u5145\u81F3 50%\uFF09",
        "\u7535\u6C60\u5BB9\u91CF": "4056 mAh",
        "\u89C6\u9891\u64AD\u653E": "\u6700\u957F 36 \u5C0F\u65F6\uFF08\u6D41\u5A92\u4F53 31 \u5C0F\u65F6\uFF09"
      },
      "\u8FDE\u63A5\u4E0E\u5176\u4ED6": {
        "\u63A5\u53E3": "USB-C\uFF08USB 3\uFF09",
        "\u5176\u4ED6\u7279\u6027": "\u76F8\u673A\u63A7\u5236 + \u52A8\u4F5C\u6309\u94AE",
        "\u65E0\u7EBF\u8FDE\u63A5": "Wi-Fi 7\uFF0C\u84DD\u7259 6\uFF0CApple N1 \u65E0\u7EBF\u82AF\u7247\uFF0C\u7B2C\u4E8C\u4EE3\u8D85\u5BBD\u5E26",
        "\u751F\u7269\u8BC6\u522B": "\u9762\u5BB9 ID",
        "\u79FB\u52A8\u7F51\u7EDC": "5G",
        "\u8702\u7A9D\u57FA\u5E26": "Apple C2",
        "\u9996\u53D1\u7CFB\u7EDF": "iOS 27"
      }
    },
    "colors": [
      {
        "hex": "#6B1F2A",
        "name": "\u52C3\u826E\u7B2C\u9152\u7EA2",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-18-pro-finish-select-burgundy-202609?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#B8D2DE",
        "name": "\u51B0\u5DDD\u84DD",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-18-pro-finish-select-glacier-202609?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#E3E3E1",
        "name": "\u94F6\u8272",
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
    "battery_cycle_standard": 1e3,
    "reference_score": 6e3,
    "image_url": "https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "\u673A\u8EAB": {
        "\u914D\u8272": "\u52C3\u826E\u7B2C\u9152\u7EA2 / \u51B0\u5DDD\u84DD / \u94F6\u8272 / \u9ED1\u8272",
        "\u673A\u8EAB\u6750\u8D28": "\u94DD\u91D1\u5C5E\u4E00\u4F53\u6210\u578B\uFF0885% \u518D\u751F\u94DD\uFF09+ \u8D85\u74F7\u6676\u9762\u677F 2",
        "\u9632\u62A4\u7B49\u7EA7": "IP68",
        "\u5C3A\u5BF8\u4E0E\u91CD\u91CF": "249 \u514B\uFF08\u539A\u5EA6 8.75 mm\uFF09"
      },
      "\u82AF\u7247": {
        "\u6563\u70ED": "VC \u5747\u70ED\u677F\uFF08\u9762\u79EF 3 \u500D\u4E8E 17 Pro Max\uFF09",
        "\u5236\u7A0B\u5DE5\u827A": "2nm",
        "\u82AF\u7247\u578B\u53F7": "A20 Pro",
        "\u4E2D\u592E\u5904\u7406\u5668": "6 \u6838\uFF082 \u6027\u80FD + 4 \u80FD\u6548\uFF09",
        "\u56FE\u5F62\u5904\u7406\u5668": "7 \u6838\uFF08\u795E\u7ECF\u7F51\u7EDC\u52A0\u901F\u5668\uFF09",
        "\u795E\u7ECF\u7F51\u7EDC\u5F15\u64CE": "\u53CC 16 \u6838\uFF0832 \u6838\uFF0C\u786C\u4EF6\u5149\u8FFD\uFF09"
      },
      "\u6444\u50CF\u5934": {
        "\u957F\u7126": "4800 \u4E07\u50CF\u7D20\u878D\u5408\u5F0F 4 \u500D\u5149\u5B66\u53D8\u7126\uFF088 \u500D\u5149\u5B66\u54C1\u8D28 / \u6700\u9AD8 24 \u500D\u6570\u7801\uFF09",
        "\u8D85\u5E7F\u89D2": "4800 \u4E07\u50CF\u7D20\u878D\u5408\u5F0F \u0192/2.2",
        "\u540E\u7F6E\u4E3B\u6444": "4800 \u4E07\u50CF\u7D20\u878D\u5408\u5F0F\uFF08\u56DB\u6863\u53EF\u53D8\u5149\u5708 \u0192/1.48 / \u0192/1.8 / \u0192/2.8 / \u0192/4.0\uFF09",
        "\u89C6\u9891\u62CD\u6444": "4K 120fps \u675C\u6BD4\u89C6\u754C\uFF08Apple Log 2 / ProRes RAW / Genlock\uFF09",
        "\u524D\u7F6E\u6444\u50CF\u5934": "1800 \u4E07\u50CF\u7D20 Center Stage \u0192/1.9"
      },
      "\u663E\u793A\u5C4F": {
        "\u4EAE\u5EA6": "1000 \u5C3C\u7279\u5178\u578B / 1600 \u5C3C\u7279 (HDR) / 3000 \u5C3C\u7279\u6237\u5916\u5CF0\u503C",
        "\u5237\u65B0\u7387": "ProMotion 120Hz \u81EA\u9002\u5E94 + \u5168\u5929\u5019\u663E\u793A",
        "\u5C4F\u5E55\u5C3A\u5BF8": "6.9 \u82F1\u5BF8",
        "\u5C4F\u5E55\u7C7B\u578B": "\u8D85\u89C6\u7F51\u819C XDR (OLED)",
        "\u5168\u9762\u5C4F\u8BBE\u8BA1": "\u7075\u52A8\u5C9B\uFF08\u9762\u79EF\u7F29\u5C0F\uFF0C\u6297\u53CD\u5C04\u6D82\u5C42\uFF09",
        "\u5206\u8FA8\u7387\u4E0E\u50CF\u7D20\u5BC6\u5EA6": "2868\xD71320\uFF0C460 ppi"
      },
      "\u5185\u5B58\u4E0E\u5B58\u50A8": {
        "\u5B58\u50A8\u5BB9\u91CF": "256 / 512GB / 1TB / 2TB",
        "\u8FD0\u884C\u5185\u5B58": "12GB"
      },
      "\u7535\u6C60\u4E0E\u5145\u7535": {
        "\u65E0\u7EBF\u5145\u7535": "MagSafe 25W\uFF08Qi2\uFF09",
        "\u6709\u7EBF\u5FEB\u5145": "60W\uFF08\u7EA6 15 \u5206\u949F\u5145\u81F3 50%\uFF09",
        "\u7535\u6C60\u5BB9\u91CF": "5391 mAh",
        "\u89C6\u9891\u64AD\u653E": "\u6700\u957F 43 \u5C0F\u65F6\uFF08\u6D41\u5A92\u4F53 38 \u5C0F\u65F6\uFF09"
      },
      "\u8FDE\u63A5\u4E0E\u5176\u4ED6": {
        "\u63A5\u53E3": "USB-C\uFF08USB 3\uFF09",
        "\u5176\u4ED6\u7279\u6027": "\u76F8\u673A\u63A7\u5236 + \u52A8\u4F5C\u6309\u94AE",
        "\u65E0\u7EBF\u8FDE\u63A5": "Wi-Fi 7\uFF0C\u84DD\u7259 6\uFF0CApple N1 \u65E0\u7EBF\u82AF\u7247\uFF0C\u7B2C\u4E8C\u4EE3\u8D85\u5BBD\u5E26",
        "\u751F\u7269\u8BC6\u522B": "\u9762\u5BB9 ID",
        "\u79FB\u52A8\u7F51\u7EDC": "5G",
        "\u8702\u7A9D\u57FA\u5E26": "Apple C2\uFF08\u7F8E\u7248\u4E3A\u9AD8\u901A\uFF09",
        "\u9996\u53D1\u7CFB\u7EDF": "iOS 27"
      }
    },
    "colors": [
      {
        "hex": "#6B1F2A",
        "name": "\u52C3\u826E\u7B2C\u9152\u7EA2",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-18-pro-max-finish-select-burgundy-202609?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#B8D2DE",
        "name": "\u51B0\u5DDD\u84DD",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-18-pro-max-finish-select-glacier-202609?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#E3E3E1",
        "name": "\u94F6\u8272",
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
    "battery_cycle_standard": 1e3,
    "reference_score": 6e3,
    "image_url": "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80",
    "specs": {
      "\u673A\u8EAB": {
        "\u914D\u8272": "\u661F\u5149\u767D / \u591C\u7A7A\u8272",
        "\u673A\u8EAB\u6750\u8D28": "\u4E94\u7EA7\u949B\u91D1\u5C5E\u8FB9\u6846\u4E0E\u94F0\u94FE\u62A4\u58F3\uFF08\u955C\u9762\u629B\u5149\uFF09",
        "\u9632\u62A4\u7B49\u7EA7": "IP68\uFF086 \u7C73\u6C34\u6DF1\uFF09",
        "\u5C3A\u5BF8\u4E0E\u91CD\u91CF": "\u5C55\u5F00\u7EA6 5.2 mm / \u6298\u53E0\u7EA6 11.3 mm\uFF0C254 \u514B"
      },
      "\u82AF\u7247": {
        "\u6563\u70ED": "\u5B9A\u5236 VC \u5747\u70ED\u677F",
        "\u5236\u7A0B\u5DE5\u827A": "2nm",
        "\u82AF\u7247\u578B\u53F7": "A20 Pro",
        "\u4E2D\u592E\u5904\u7406\u5668": "6 \u6838\uFF082 \u6027\u80FD + 4 \u80FD\u6548\uFF09",
        "\u56FE\u5F62\u5904\u7406\u5668": "7 \u6838\uFF08\u795E\u7ECF\u7F51\u7EDC\u52A0\u901F\u5668\uFF09",
        "\u795E\u7ECF\u7F51\u7EDC\u5F15\u64CE": "\u53CC 16 \u6838\uFF0832 \u6838\uFF0C\u786C\u4EF6\u5149\u8FFD\uFF09"
      },
      "\u6444\u50CF\u5934": {
        "\u957F\u7126": "\u65E0",
        "\u8D85\u5E7F\u89D2": "4800 \u4E07\u50CF\u7D20\u878D\u5408\u5F0F",
        "\u540E\u7F6E\u4E3B\u6444": "4800 \u4E07\u50CF\u7D20\u878D\u5408\u5F0F",
        "\u89C6\u9891\u62CD\u6444": "4K 120fps \u675C\u6BD4\u89C6\u754C",
        "\u524D\u7F6E\u6444\u50CF\u5934": "1200 \u4E07\u50CF\u7D20 Center Stage + \u5C4F\u4E0B\u6444\u50CF\u5934"
      },
      "\u663E\u793A\u5C4F": {
        "\u4EAE\u5EA6": "3000 \u5C3C\u7279\u6237\u5916\u5CF0\u503C",
        "\u5237\u65B0\u7387": "ProMotion 120Hz \u81EA\u9002\u5E94 + \u5168\u5929\u5019\u663E\u793A",
        "\u5C4F\u5E55\u5C3A\u5BF8": "\u5916\u5C4F 5.4 \u82F1\u5BF8 / \u5185\u5C4F 7.6 \u82F1\u5BF8",
        "\u5C4F\u5E55\u7C7B\u578B": "\u8D85\u89C6\u7F51\u819C XDR (OLED\uFF0C\u5185\u5C4F\u7EB3\u7C73\u7EB9\u7406)",
        "\u5168\u9762\u5C4F\u8BBE\u8BA1": "\u7AD6\u7248\u7075\u52A8\u5C9B + \u5185\u5C4F\u5C4F\u4E0B\u6444\u50CF\u5934"
      },
      "\u5185\u5B58\u4E0E\u5B58\u50A8": {
        "\u5B58\u50A8\u5BB9\u91CF": "512GB / 1TB",
        "\u8FD0\u884C\u5185\u5B58": "12GB"
      },
      "\u7535\u6C60\u4E0E\u5145\u7535": {
        "\u65E0\u7EBF\u5145\u7535": "MagSafe 15W\uFF08Qi2\uFF09",
        "\u6709\u7EBF\u5FEB\u5145": "60W\uFF08\u7EA6 20 \u5206\u949F\u5145\u81F3 50%\uFF09",
        "\u89C6\u9891\u64AD\u653E": "\u5916\u5C4F\u6700\u957F 44 \u5C0F\u65F6 / \u5185\u5C4F\u6700\u957F 31 \u5C0F\u65F6"
      },
      "\u8FDE\u63A5\u4E0E\u5176\u4ED6": {
        "\u63A5\u53E3": "USB-C",
        "\u5176\u4ED6\u7279\u6027": "\u652F\u6301 Apple Pencil (USB-C)\uFF0C\u5206\u5C4F\u591A\u4EFB\u52A1",
        "\u65E0\u7EBF\u8FDE\u63A5": "Wi-Fi 7\uFF0C\u84DD\u7259 6",
        "\u751F\u7269\u8BC6\u522B": "\u4FA7\u8FB9 Touch ID\uFF08\u96C6\u6210\u4E8E\u7535\u6E90\u952E\uFF09",
        "\u79FB\u52A8\u7F51\u7EDC": "5G",
        "\u9996\u53D1\u7CFB\u7EDF": "iOS 27\uFF08\u6298\u53E0\u5B9A\u5236\uFF09"
      }
    },
    "colors": [
      {
        "hex": "#1A1A1E",
        "name": "\u6DF1\u7A7A\u591C\u8272",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-duo-finish-select-night-sky-202609?wid=640&hei=756&fmt=png-alpha"
      },
      {
        "hex": "#F2F1EC",
        "name": "\u661F\u5149\u767D",
        "image": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-duo-finish-select-star-white-202609?wid=640&hei=756&fmt=png-alpha"
      }
    ],
    "is_latest": true,
    "upgrade_model_id": null
  }
];

// src/storage/database/seed.ts
async function ensurePhoneModelsSeeded() {
  const client = getSupabaseClient();
  try {
    const { count, error } = await client.from("phone_models").select("id", { count: "exact", head: true });
    if (error) throw error;
    if ((count ?? 0) > 0) {
      console.log(`[seed] phone_models already has ${count} rows, skip seeding`);
      return;
    }
    console.log(`[seed] phone_models is empty, seeding ${SEED_PHONE_MODELS.length} models...`);
    const baseRows = SEED_PHONE_MODELS.map(({ upgrade_model_id, ...rest }) => rest);
    const { error: insertError } = await client.from("phone_models").insert(baseRows);
    if (insertError) throw insertError;
    for (const model of SEED_PHONE_MODELS) {
      if (model.upgrade_model_id == null) continue;
      const { error: updateError } = await client.from("phone_models").update({ upgrade_model_id: model.upgrade_model_id }).eq("id", model.id);
      if (updateError) throw updateError;
    }
    console.log(`[seed] phone_models seeded (${SEED_PHONE_MODELS.length} rows)`);
  } catch (err) {
    console.error("[seed] ensurePhoneModelsSeeded failed:", err);
  }
}

// api/index.ts
var maxDuration = 60;
var bootstrap = null;
function ensureBootstrap() {
  if (!bootstrap) {
    bootstrap = ensurePhoneModelsSeeded().catch((error) => {
      console.error("[bootstrap] seed failed:", error);
    });
  }
  return bootstrap;
}
async function handler(req, res) {
  try {
    await ensureBootstrap();
    return await app_default(req, res);
  } catch (error) {
    console.error("[handler] unhandled error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "internal error",
        detail: error instanceof Error ? error.message : String(error)
      });
    } else {
      res.end();
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  maxDuration
});
