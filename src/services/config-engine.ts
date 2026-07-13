// Configuration Engine - Real API integration
import { configApi } from "./config-api";

export const getCompanyProfile = configApi.getCompanyProfile;
export const updateCompanyProfile = configApi.updateCompanyProfile;
export const getDepartments = configApi.getDepartments;
export const getDepartmentById = configApi.getDepartmentById;
export const createDepartment = configApi.createDepartment;
export const updateDepartment = configApi.updateDepartment;
export const deleteDepartment = configApi.deleteDepartment;
export const getPositions = configApi.getPositions;
export const getPositionById = configApi.getPositionById;
export const createPosition = configApi.createPosition;
export const updatePosition = configApi.updatePosition;
export const deletePosition = configApi.deletePosition;
export const getEmployees = configApi.getEmployees;
export const getEmployeeById = configApi.getEmployeeById;
export const createEmployee = configApi.createEmployee;
export const updateEmployee = configApi.updateEmployee;
export const deleteEmployee = configApi.deleteEmployee;
export const getSettings = configApi.getSettings;
export const getSetting = configApi.getSetting;
export const updateSetting = configApi.updateSetting;
export const updateSettings = configApi.updateSettings;
export const getHolidays = configApi.getHolidays;
export const createHoliday = configApi.createHoliday;
export const updateHoliday = configApi.updateHoliday;
export const deleteHoliday = configApi.deleteHoliday;
export const getBusinessRules = configApi.getBusinessRules;
export const createBusinessRule = configApi.createBusinessRule;
export const updateBusinessRule = configApi.updateBusinessRule;
export const deleteBusinessRule = configApi.deleteBusinessRule;
export const toggleBusinessRule = configApi.toggleBusinessRule;

// Company configuration
export function resetConfiguration(): void {
  console.warn('resetConfiguration: This would reset configuration to defaults via API');
  // In production, this would call: configApi.resetConfiguration();
}

// Notification Rules (from notification-api)
import { notificationApi } from './notification-api';
export const getNotificationRules = notificationApi.getRules;
export const createNotificationRule = notificationApi.createRule;
export const updateNotificationRule = notificationApi.updateRule;
export const deleteNotificationRule = notificationApi.deleteRule;
