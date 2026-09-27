"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// functions-src/healthz.ts
var healthz_exports = {};
__export(healthz_exports, {
  default: () => handler
});
module.exports = __toCommonJS(healthz_exports);
function handler(_req, res) {
  const safeEnvKeys = Object.keys(process.env).filter(
    (k) => k.includes("COZE") || k.includes("SUPABASE") || k === "NODE_ENV" || k === "VERCEL_REGION"
  );
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(
    JSON.stringify({
      ok: true,
      probe: "healthz",
      node: process.version,
      region: process.env.VERCEL_REGION ?? "unknown",
      envKeys: safeEnvKeys
    })
  );
}
