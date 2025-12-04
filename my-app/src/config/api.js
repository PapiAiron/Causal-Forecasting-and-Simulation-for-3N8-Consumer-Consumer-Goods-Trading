// src/config/api.js
// API Configuration

// 🔴 REPLACE THIS with your actual deployed backend URL
export const API_BASE_URL = "https://causal-forecasting-and-simulation-for-ju21.onrender.com";

// Don't change these - they're the API endpoints
export const API_ENDPOINTS = {
  FORECAST: `${API_BASE_URL}/forecast`,
  DECISION_SUPPORT: `${API_BASE_URL}/decision-support`,
  CAUSAL_ANALYSIS: `${API_BASE_URL}/causal-analysis`,
  STORE_ANALYTICS: `${API_BASE_URL}/store-analytics`,
  CATEGORY_ANALYSIS: `${API_BASE_URL}/category-analysis`,
  STORE_DEMAND_CAUSES: `${API_BASE_URL}/store-demand-causes`,
  CAUSAL_FACTORS_REPORT: `${API_BASE_URL}/causal-factors-report`,
  FULL_REPORTS: `${API_BASE_URL}/full-reports`,
  SALES_QUERY: `${API_BASE_URL}/sales-query`,
  SIMULATE: `${API_BASE_URL}/simulate`,
  SKU_INFO: `${API_BASE_URL}/sku-info`,
  SKU_PRICING: `${API_BASE_URL}/sku-pricing`
};