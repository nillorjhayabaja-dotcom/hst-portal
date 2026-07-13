// Search Service - Real API integration
import { searchApi } from "./search-api";

export const searchEnterprise = searchApi.search;
export const searchEmployees = searchApi.searchEmployees;
export const searchRequests = searchApi.searchRequests;
export const searchDepartments = searchApi.searchDepartments;
export const getRecentSearches = searchApi.getRecentSearches;
export const getPopularSearches = searchApi.getPopularSearches;
export const saveSearch = searchApi.saveSearch;