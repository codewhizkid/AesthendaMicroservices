export interface ServiceConfig {
  url: string;
  timeout: number;
}

export interface ServerConfig {
  port: number;
  env: string;
  isDev: boolean;
  isProd: boolean;
  corsOrigins: string[];
  bodyLimit: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface RedisConfig {
  url: string;
  ttl: number;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export interface GraphqlConfig {
  introspection: boolean;
  playground: boolean;
  debug: boolean;
  tracing: boolean;
}

export interface TenantConfig {
  defaultTenantId?: string;
}

export interface ServicesConfig {
  user: ServiceConfig;
  appointment: ServiceConfig;
  notification: ServiceConfig;
  payment: ServiceConfig;
}

export interface Config {
  server: ServerConfig;
  jwt: JwtConfig;
  redis: RedisConfig;
  rateLimit: RateLimitConfig;
  services: ServicesConfig;
  graphql: GraphqlConfig;
  tenant: TenantConfig;
  getEnv: (key: string, defaultValue?: string) => string;
  getIntEnv: (key: string, defaultValue: number) => number;
  getBoolEnv: (key: string, defaultValue: boolean) => boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  stylist_id?: string;
}

export interface Context {
  user: User | null;
  headers: Record<string, string | undefined>;
}

export enum Role {
  SYSTEM_ADMIN = "system_admin",
  SALON_ADMIN = "salon_admin",
  STYLIST = "stylist",
  SALON_STAFF = "salon_staff",
  CLIENT = "client",
}

/**
 * Extended Error type for service-related errors
 */
export class ServiceError extends Error {
  code?: string;
  path?: string[];
  errors?: any[];
  service?: string;
  statusCode?: number;

  constructor(
    message: string,
    options: {
      code?: string;
      path?: string[];
      errors?: any[];
      service?: string;
      statusCode?: number;
    } = {},
  ) {
    super(message);
    this.name = "ServiceError";
    this.code = options.code;
    this.path = options.path;
    this.errors = options.errors;
    this.service = options.service;
    this.statusCode = options.statusCode;

    // Ensures proper instanceof checks work in TypeScript
    Object.setPrototypeOf(this, ServiceError.prototype);
  }
}

/**
 * Timeout-specific service error
 */
export class TimeoutError extends ServiceError {
  constructor(service: string, timeout: number) {
    super(`Service request timed out after ${timeout}ms`, {
      code: "TIMEOUT_ERROR",
      service,
    });
    this.name = "TimeoutError";

    // Ensures proper instanceof checks work in TypeScript
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}
