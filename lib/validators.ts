import mongoose from 'mongoose';
import { ApiError } from '@/lib/api';

export function requireString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ApiError('BAD_REQUEST', `${fieldName} is required`);
  }

  return value.trim();
}

export function optionalString(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function requireNumber(value: unknown, fieldName: string, options?: { min?: number; max?: number }) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new ApiError('BAD_REQUEST', `${fieldName} must be a number`);
  }

  if (options?.min !== undefined && value < options.min) {
    throw new ApiError('BAD_REQUEST', `${fieldName} must be at least ${options.min}`);
  }

  if (options?.max !== undefined && value > options.max) {
    throw new ApiError('BAD_REQUEST', `${fieldName} must be at most ${options.max}`);
  }

  return value;
}

export function requireBoolean(value: unknown, fieldName: string) {
  if (typeof value !== 'boolean') {
    throw new ApiError('BAD_REQUEST', `${fieldName} must be a boolean`);
  }

  return value;
}

export function requireDateString(value: unknown, fieldName: string) {
  const stringValue = requireString(value, fieldName);
  const date = new Date(stringValue);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError('BAD_REQUEST', `${fieldName} must be a valid date`);
  }

  return date;
}

export function requireObjectId(value: unknown, fieldName: string) {
  const stringValue = requireString(value, fieldName);

  if (!mongoose.Types.ObjectId.isValid(stringValue)) {
    throw new ApiError('BAD_REQUEST', `${fieldName} must be a valid id`);
  }

  return new mongoose.Types.ObjectId(stringValue);
}

export function optionalObjectId(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return requireObjectId(value, fieldName);
}

export function requireEnumValue<T extends string>(
  value: unknown,
  fieldName: string,
  allowedValues: readonly T[]
) {
  const stringValue = requireString(value, fieldName);

  if (!allowedValues.includes(stringValue as T)) {
    throw new ApiError('BAD_REQUEST', `${fieldName} must be one of: ${allowedValues.join(', ')}`);
  }

  return stringValue as T;
}
