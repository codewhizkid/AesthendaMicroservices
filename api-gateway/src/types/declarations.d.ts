// Type declarations for modules without proper TypeScript definitions

declare module "jsonwebtoken" {
  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: string | Buffer,
    options?: any,
  ): string;

  export function verify(
    token: string,
    secretOrPublicKey: string | Buffer,
    options?: any,
  ): any;

  export function decode(
    token: string,
    options?: any,
  ): null | { [key: string]: any } | string;
}

declare module "node-fetch" {
  export interface Response {
    status: number;
    statusText: string;
    ok: boolean;
    headers: Headers;
    body: any;
    json(): Promise<any>;
    text(): Promise<string>;
    arrayBuffer(): Promise<ArrayBuffer>;
    blob(): Promise<Blob>;
  }

  export interface Headers {
    append(name: string, value: string): void;
    delete(name: string): void;
    get(name: string): string | null;
    has(name: string): boolean;
    set(name: string, value: string): void;
    forEach(callback: (value: string, name: string) => void): void;
  }

  export interface RequestInit {
    method?: string;
    headers?: { [key: string]: string } | Headers;
    body?: any;
    redirect?: "follow" | "error" | "manual";
    signal?: AbortSignal;
    timeout?: number;
  }

  function fetch(url: string | Request, init?: RequestInit): Promise<Response>;

  export default fetch;
}

declare module "passport-google-oauth20" {
  /**
   * This import is intentionally used for type augmentation
   * @see https://www.typescriptlang.org/docs/handbook/declaration-merging.html
   */
  import { Request } from "express";

  export interface Profile {
    id: string;
    displayName: string;
    name?: {
      familyName?: string;
      givenName?: string;
      middleName?: string;
    };
    emails?: Array<{
      value: string;
      type?: string;
    }>;
    photos?: Array<{
      value: string;
    }>;
    [key: string]: any;
  }

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string | string[];
    [key: string]: any;
  }

  export interface VerifyCallback {
    (error: any, user?: any, info?: any): void;
  }

  export class Strategy {
    constructor(
      options: StrategyOptions,
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
      ) => void,
    );
  }
}

declare module "passport-facebook" {
  /**
   * This import is intentionally used for type augmentation
   * @see https://www.typescriptlang.org/docs/handbook/declaration-merging.html
   */
  import { Request } from "express";

  export interface Profile {
    id: string;
    displayName: string;
    name?: {
      familyName?: string;
      givenName?: string;
      middleName?: string;
    };
    emails?: Array<{
      value: string;
      type?: string;
    }>;
    photos?: Array<{
      value: string;
    }>;
    [key: string]: any;
  }

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    profileFields?: string[];
    [key: string]: any;
  }

  export interface VerifyCallback {
    (error: any, user?: any, info?: any): void;
  }

  export class Strategy {
    constructor(
      options: StrategyOptions,
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
      ) => void,
    );
  }
}

declare module "passport" {
  import express from "express";

  export interface AuthenticateOptions {
    session?: boolean;
    scope?: string | string[];
    failureRedirect?: string;
    [key: string]: any;
  }

  export interface Authenticator {
    initialize(): express.RequestHandler;
    session(): express.RequestHandler;
    authenticate(
      strategy: string | string[],
      options?: AuthenticateOptions,
    ): express.RequestHandler;
    use(strategy: any): this;
    serializeUser(
      fn: (user: any, done: (err: any, id?: any) => void) => void,
    ): void;
    deserializeUser(
      fn: (id: any, done: (err: any, user?: any) => void) => void,
    ): void;
  }

  const passport: Authenticator;
  export default passport;
}

declare module "express-session" {
  import express from "express";

  interface SessionOptions {
    secret: string | string[];
    resave: boolean;
    saveUninitialized: boolean;
    cookie?: {
      secure?: boolean;
      maxAge?: number;
    };
    [key: string]: any;
  }

  function session(options: SessionOptions): express.RequestHandler;

  export = session;
}

declare module "cookie-parser" {
  import express from "express";

  function cookieParser(secret?: string, options?: any): express.RequestHandler;

  export = cookieParser;
}

declare module "rate-limit-redis" {
  import { Options, Store, ClientRateLimitInfo } from "express-rate-limit";

  export interface RedisStoreOptions {
    prefix?: string;
    resetExpiryOnChange?: boolean;
    expiry?: number;
    sendCommand?: SendCommandFn;
    client?: any;
  }

  export type SendCommandFn = (command: string, ...args: any[]) => Promise<any>;

  class RedisStore implements Store {
    constructor(options: RedisStoreOptions);
    init(options: Options): void;
    increment(key: string): Promise<ClientRateLimitInfo>;
    decrement(key: string): Promise<void>;
    resetKey(key: string): Promise<void>;
  }

  export default RedisStore;
}

declare module "apollo-server-core" {
  export function ApolloServerPluginLandingPageGraphQLPlayground(
    options?: any,
  ): any;
  export function ApolloServerPluginLandingPageDisabled(): any;
  export function ApolloServerPluginInlineTrace(options?: any): any;
}

// Extend request to include user in OAuth callbacks
declare namespace Express {
  interface Request {
    user?: any;
  }
}
