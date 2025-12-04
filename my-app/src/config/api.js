const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export const API_ENDPOINTS = {
  CAUSAL_ANALYSIS: `${API_BASE_URL}/causal-analysis`,
  FORECAST: `${API_BASE_URL}/forecast`,
  STORE_ANALYTICS: `${API_BASE_URL}/store-analytics`,
  CAUSAL_FACTORS: `${API_BASE_URL}/causal-factors-report`,
  FULL_REPORTS: `${API_BASE_URL}/full-reports`,
  DECISION_SUPPORT: `${API_BASE_URL}/decision-support`,
  CATEGORY_ANALYSIS: `${API_BASE_URL}/category-analysis`,
  STORE_DEMAND_CAUSES: `${API_BASE_URL}/store-demand-causes`,
  SALES_QUERY: `${API_BASE_URL}/sales-query`,
};