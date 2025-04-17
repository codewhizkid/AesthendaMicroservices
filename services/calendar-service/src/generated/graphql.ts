import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { IEvent } from '../models/Event';
import { IResource } from '../models/Resource';
import { Context } from '../types';
export type Maybe<T> = T | null | undefined;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** DateTime scalar for handling dates and times in ISO 8601 format */
  DateTime: { input: Date; output: Date; }
  /** JSON scalar for handling arbitrary metadata */
  JSON: { input: Record<string, any>; output: Record<string, any>; }
};

/** Represents a time slot in a resource's weekly availability */
export type Availability = {
  __typename?: 'Availability';
  /** Day of week (0-6, where 0 is Sunday) */
  dayOfWeek: Scalars['Int']['output'];
  /** End time in 24-hour format (HH:mm) */
  endTime: Scalars['String']['output'];
  /** Start time in 24-hour format (HH:mm) */
  startTime: Scalars['String']['output'];
};

/** Input for specifying a time slot in resource availability */
export type AvailabilityInput = {
  /** Day of week (0-6, where 0 is Sunday) */
  dayOfWeek: Scalars['Int']['input'];
  /** End time in 24-hour format (HH:mm) */
  endTime: Scalars['String']['input'];
  /** Start time in 24-hour format (HH:mm) */
  startTime: Scalars['String']['input'];
};

/** Break periods during business hours */
export type BusinessBreak = {
  __typename?: 'BusinessBreak';
  /** End time of the break in 24-hour format (HH:mm) */
  endTime: Scalars['String']['output'];
  /** Optional reason for the break */
  reason?: Maybe<Scalars['String']['output']>;
  /** Start time of the break in 24-hour format (HH:mm) */
  startTime: Scalars['String']['output'];
};

/** Input for specifying break periods */
export type BusinessBreakInput = {
  /** End time of the break in 24-hour format (HH:mm) */
  endTime: Scalars['String']['input'];
  /** Optional reason for the break */
  reason?: InputMaybe<Scalars['String']['input']>;
  /** Start time of the break in 24-hour format (HH:mm) */
  startTime: Scalars['String']['input'];
};

/** Business hours for a specific day of the week */
export type BusinessHours = {
  __typename?: 'BusinessHours';
  /** Break periods during business hours */
  breaks?: Maybe<Array<BusinessBreak>>;
  /** Closing time in 24-hour format (HH:mm) */
  closeTime: Scalars['String']['output'];
  /** Day of week (0-6, where 0 is Sunday) */
  dayOfWeek: Scalars['Int']['output'];
  /** Whether business is open on this day */
  isOpen: Scalars['Boolean']['output'];
  /** Opening time in 24-hour format (HH:mm) */
  openTime: Scalars['String']['output'];
};

/** Input for specifying business hours */
export type BusinessHoursInput = {
  /** Break periods during business hours */
  breaks?: InputMaybe<Array<BusinessBreakInput>>;
  /** Closing time in 24-hour format (HH:mm) */
  closeTime: Scalars['String']['input'];
  /** Day of week (0-6, where 0 is Sunday) */
  dayOfWeek: Scalars['Int']['input'];
  /** Whether business is open on this day */
  isOpen: Scalars['Boolean']['input'];
  /** Opening time in 24-hour format (HH:mm) */
  openTime: Scalars['String']['input'];
};

/** Input for filtering events in a calendar view */
export type CalendarViewFilter = {
  /** End date for the view range */
  endDate: Scalars['DateTime']['input'];
  /** Optional event type filter */
  eventType?: InputMaybe<EventType>;
  /** Optional resource ID filter */
  resourceId?: InputMaybe<Scalars['ID']['input']>;
  /** Start date for the view range */
  startDate: Scalars['DateTime']['input'];
  /** Optional status filter */
  status?: InputMaybe<EventStatus>;
};

/**
 * Event represents a calendar event within a specific tenant's context.
 * Events can be one-time or recurring, and may involve multiple attendees.
 */
export type Event = {
  __typename?: 'Event';
  /** Indicates if the event is an all-day event */
  allDay: Scalars['Boolean']['output'];
  /** Optional list of attendee IDs */
  attendees?: Maybe<Array<Scalars['String']['output']>>;
  /** Timestamp when the event was created */
  createdAt: Scalars['DateTime']['output'];
  /** ID of the user who created the event */
  createdBy: Scalars['String']['output'];
  /** Optional detailed description of the event */
  description?: Maybe<Scalars['String']['output']>;
  /** End time of the event in ISO 8601 format */
  endTime: Scalars['DateTime']['output'];
  /** Unique identifier for the event */
  id: Scalars['ID']['output'];
  /** Optional location information for the event */
  location?: Maybe<Scalars['String']['output']>;
  /** Optional metadata for storing additional event information */
  metadata?: Maybe<Scalars['JSON']['output']>;
  /** Optional iCal-format recurring rule for repeating events */
  recurringRule?: Maybe<Scalars['String']['output']>;
  /** Start time of the event in ISO 8601 format */
  startTime: Scalars['DateTime']['output'];
  /** Current status of the event */
  status: EventStatus;
  /** Tenant identifier for multi-tenancy support */
  tenantId: Scalars['String']['output'];
  /** Title or name of the event */
  title: Scalars['String']['output'];
  /** Type of the event */
  type: EventType;
  /** Timestamp when the event was last updated */
  updatedAt: Scalars['DateTime']['output'];
};

/** Connection type for paginated events */
export type EventConnection = {
  __typename?: 'EventConnection';
  /** List of events for the current page */
  edges: Array<Event>;
  /** Pagination information */
  pageInfo: PageInfo;
};

/** Input for creating or updating an event */
export type EventInput = {
  /** Whether this is an all-day event */
  allDay?: InputMaybe<Scalars['Boolean']['input']>;
  /** Optional list of attendee IDs */
  attendees?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Optional detailed description */
  description?: InputMaybe<Scalars['String']['input']>;
  /** End time in ISO 8601 format */
  endTime: Scalars['DateTime']['input'];
  /** Optional location information */
  location?: InputMaybe<Scalars['String']['input']>;
  /** Optional additional metadata */
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  /** Optional iCal-format recurring rule */
  recurringRule?: InputMaybe<Scalars['String']['input']>;
  /** Start time in ISO 8601 format */
  startTime: Scalars['DateTime']['input'];
  /** Event status */
  status?: InputMaybe<EventStatus>;
  /** Title or name of the event */
  title: Scalars['String']['input'];
  /** Event type */
  type?: InputMaybe<EventType>;
};

/** Status options for an event */
export type EventStatus =
  /** Event has been cancelled */
  | 'CANCELLED'
  /** Event is confirmed and will take place */
  | 'CONFIRMED'
  /** Event is tentatively scheduled */
  | 'TENTATIVE';

/** Type options for an event */
export type EventType =
  /** Client appointment */
  | 'APPOINTMENT'
  /** Blocked time (unavailable) */
  | 'BLOCK'
  /** Break time */
  | 'BREAKTIME'
  /** Holiday or closed day */
  | 'HOLIDAY'
  /** Staff meeting */
  | 'MEETING'
  /** Other event type */
  | 'OTHER';

export type Mutation = {
  __typename?: 'Mutation';
  /** Batch update event statuses */
  batchUpdateEventStatus: Array<Event>;
  /** Create a new event */
  createEvent: Event;
  /** Create a new resource */
  createResource: Resource;
  /** Delete an event */
  deleteEvent: Scalars['Boolean']['output'];
  /** Delete a resource */
  deleteResource: Scalars['Boolean']['output'];
  /** Update an existing event */
  updateEvent: Event;
  /** Update an existing resource */
  updateResource: Resource;
};


export type MutationBatchUpdateEventStatusArgs = {
  ids: Array<Scalars['ID']['input']>;
  status: EventStatus;
};


export type MutationCreateEventArgs = {
  input: EventInput;
};


export type MutationCreateResourceArgs = {
  input: ResourceInput;
};


export type MutationDeleteEventArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteResourceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateEventArgs = {
  id: Scalars['ID']['input'];
  input: EventInput;
};


export type MutationUpdateResourceArgs = {
  id: Scalars['ID']['input'];
  input: ResourceInput;
};

/** Pagination information for list queries */
export type PageInfo = {
  __typename?: 'PageInfo';
  /** Current page number */
  currentPage: Scalars['Int']['output'];
  /** Whether there is a next page available */
  hasNextPage: Scalars['Boolean']['output'];
  /** Whether there is a previous page available */
  hasPreviousPage: Scalars['Boolean']['output'];
  /** Number of items per page */
  itemsPerPage: Scalars['Int']['output'];
  /** Total number of items across all pages */
  totalItems: Scalars['Int']['output'];
  /** Total number of pages available */
  totalPages: Scalars['Int']['output'];
};

/** Input for pagination parameters */
export type PaginationInput = {
  /** Number of items per page */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** Page number (1-based) */
  page?: InputMaybe<Scalars['Int']['input']>;
};

export type Query = {
  __typename?: 'Query';
  /** Get a single event by ID */
  event?: Maybe<Event>;
  /** Get a list of events with optional filtering and pagination */
  events: EventConnection;
  /** Get a single resource by ID */
  resource?: Maybe<Resource>;
  /** Get a list of resources with optional filtering and pagination */
  resources: ResourceConnection;
};


export type QueryEventArgs = {
  id: Scalars['ID']['input'];
};


export type QueryEventsArgs = {
  filter?: InputMaybe<CalendarViewFilter>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryResourceArgs = {
  id: Scalars['ID']['input'];
};


export type QueryResourcesArgs = {
  pagination?: InputMaybe<PaginationInput>;
  type?: InputMaybe<Scalars['String']['input']>;
};

/** Resource represents a bookable entity (room, equipment, etc.) within a tenant's context */
export type Resource = {
  __typename?: 'Resource';
  /** Weekly availability schedule for the resource */
  availability: Array<Availability>;
  /** Business hours for the resource */
  businessHours?: Maybe<Array<BusinessHours>>;
  /** Timestamp when the resource was created */
  createdAt: Scalars['DateTime']['output'];
  /** Optional detailed description of the resource */
  description?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for the resource */
  id: Scalars['ID']['output'];
  /** Optional metadata for storing additional resource information */
  metadata?: Maybe<Scalars['JSON']['output']>;
  /** Tenant identifier for multi-tenancy support */
  tenantId: Scalars['String']['output'];
  /** Name or title of the resource */
  title: Scalars['String']['output'];
  /** Type of resource (e.g., 'ROOM', 'EQUIPMENT') */
  type: Scalars['String']['output'];
  /** Timestamp when the resource was last updated */
  updatedAt: Scalars['DateTime']['output'];
};

/** Connection type for paginated resources */
export type ResourceConnection = {
  __typename?: 'ResourceConnection';
  /** List of resources for the current page */
  edges: Array<Resource>;
  /** Pagination information */
  pageInfo: PageInfo;
};

/** Input for creating or updating a resource */
export type ResourceInput = {
  /** Weekly availability schedule */
  availability: Array<AvailabilityInput>;
  /** Business hours */
  businessHours?: InputMaybe<Array<BusinessHoursInput>>;
  /** Optional detailed description */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Optional additional metadata */
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  /** Name or title of the resource */
  title: Scalars['String']['input'];
  /** Type of resource */
  type: Scalars['String']['input'];
};

export type Subscription = {
  __typename?: 'Subscription';
  /** Subscribe to event updates within a tenant */
  eventUpdated: Event;
  /** Subscribe to resource updates within a tenant */
  resourceUpdated: Resource;
};


export type SubscriptionEventUpdatedArgs = {
  tenantId: Scalars['String']['input'];
};


export type SubscriptionResourceUpdatedArgs = {
  tenantId: Scalars['String']['input'];
};

/** User roles for authorization */
export type UserRole =
  /** Administrator with full access */
  | 'ADMIN'
  /** Client with very limited access */
  | 'CLIENT'
  /** Guest with minimal access */
  | 'GUEST'
  /** Staff member with limited access */
  | 'STAFF';

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Availability: ResolverTypeWrapper<Availability>;
  AvailabilityInput: AvailabilityInput;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  BusinessBreak: ResolverTypeWrapper<BusinessBreak>;
  BusinessBreakInput: BusinessBreakInput;
  BusinessHours: ResolverTypeWrapper<BusinessHours>;
  BusinessHoursInput: BusinessHoursInput;
  CalendarViewFilter: CalendarViewFilter;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  Event: ResolverTypeWrapper<IEvent>;
  EventConnection: ResolverTypeWrapper<Omit<EventConnection, 'edges'> & { edges: Array<ResolversTypes['Event']> }>;
  EventInput: EventInput;
  EventStatus: EventStatus;
  EventType: EventType;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  Mutation: ResolverTypeWrapper<{}>;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  PaginationInput: PaginationInput;
  Query: ResolverTypeWrapper<{}>;
  Resource: ResolverTypeWrapper<IResource>;
  ResourceConnection: ResolverTypeWrapper<Omit<ResourceConnection, 'edges'> & { edges: Array<ResolversTypes['Resource']> }>;
  ResourceInput: ResourceInput;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subscription: ResolverTypeWrapper<{}>;
  UserRole: UserRole;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Availability: Availability;
  AvailabilityInput: AvailabilityInput;
  Boolean: Scalars['Boolean']['output'];
  BusinessBreak: BusinessBreak;
  BusinessBreakInput: BusinessBreakInput;
  BusinessHours: BusinessHours;
  BusinessHoursInput: BusinessHoursInput;
  CalendarViewFilter: CalendarViewFilter;
  DateTime: Scalars['DateTime']['output'];
  Event: IEvent;
  EventConnection: Omit<EventConnection, 'edges'> & { edges: Array<ResolversParentTypes['Event']> };
  EventInput: EventInput;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  JSON: Scalars['JSON']['output'];
  Mutation: {};
  PageInfo: PageInfo;
  PaginationInput: PaginationInput;
  Query: {};
  Resource: IResource;
  ResourceConnection: Omit<ResourceConnection, 'edges'> & { edges: Array<ResolversParentTypes['Resource']> };
  ResourceInput: ResourceInput;
  String: Scalars['String']['output'];
  Subscription: {};
}>;

export type AvailabilityResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Availability'] = ResolversParentTypes['Availability']> = ResolversObject<{
  dayOfWeek?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  endTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  startTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BusinessBreakResolvers<ContextType = Context, ParentType extends ResolversParentTypes['BusinessBreak'] = ResolversParentTypes['BusinessBreak']> = ResolversObject<{
  endTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reason?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  startTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BusinessHoursResolvers<ContextType = Context, ParentType extends ResolversParentTypes['BusinessHours'] = ResolversParentTypes['BusinessHours']> = ResolversObject<{
  breaks?: Resolver<Maybe<Array<ResolversTypes['BusinessBreak']>>, ParentType, ContextType>;
  closeTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  dayOfWeek?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  isOpen?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  openTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type EventResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Event'] = ResolversParentTypes['Event']> = ResolversObject<{
  allDay?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  attendees?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  createdBy?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  endTime?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  location?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  metadata?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  recurringRule?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  startTime?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['EventStatus'], ParentType, ContextType>;
  tenantId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['EventType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EventConnectionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['EventConnection'] = ResolversParentTypes['EventConnection']> = ResolversObject<{
  edges?: Resolver<Array<ResolversTypes['Event']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type MutationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  batchUpdateEventStatus?: Resolver<Array<ResolversTypes['Event']>, ParentType, ContextType, RequireFields<MutationBatchUpdateEventStatusArgs, 'ids' | 'status'>>;
  createEvent?: Resolver<ResolversTypes['Event'], ParentType, ContextType, RequireFields<MutationCreateEventArgs, 'input'>>;
  createResource?: Resolver<ResolversTypes['Resource'], ParentType, ContextType, RequireFields<MutationCreateResourceArgs, 'input'>>;
  deleteEvent?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteEventArgs, 'id'>>;
  deleteResource?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteResourceArgs, 'id'>>;
  updateEvent?: Resolver<ResolversTypes['Event'], ParentType, ContextType, RequireFields<MutationUpdateEventArgs, 'id' | 'input'>>;
  updateResource?: Resolver<ResolversTypes['Resource'], ParentType, ContextType, RequireFields<MutationUpdateResourceArgs, 'id' | 'input'>>;
}>;

export type PageInfoResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PageInfo'] = ResolversParentTypes['PageInfo']> = ResolversObject<{
  currentPage?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasPreviousPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  itemsPerPage?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalItems?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalPages?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  event?: Resolver<Maybe<ResolversTypes['Event']>, ParentType, ContextType, RequireFields<QueryEventArgs, 'id'>>;
  events?: Resolver<ResolversTypes['EventConnection'], ParentType, ContextType, Partial<QueryEventsArgs>>;
  resource?: Resolver<Maybe<ResolversTypes['Resource']>, ParentType, ContextType, RequireFields<QueryResourceArgs, 'id'>>;
  resources?: Resolver<ResolversTypes['ResourceConnection'], ParentType, ContextType, Partial<QueryResourcesArgs>>;
}>;

export type ResourceResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Resource'] = ResolversParentTypes['Resource']> = ResolversObject<{
  availability?: Resolver<Array<ResolversTypes['Availability']>, ParentType, ContextType>;
  businessHours?: Resolver<Maybe<Array<ResolversTypes['BusinessHours']>>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  metadata?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  tenantId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ResourceConnectionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ResourceConnection'] = ResolversParentTypes['ResourceConnection']> = ResolversObject<{
  edges?: Resolver<Array<ResolversTypes['Resource']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SubscriptionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = ResolversObject<{
  eventUpdated?: SubscriptionResolver<ResolversTypes['Event'], "eventUpdated", ParentType, ContextType, RequireFields<SubscriptionEventUpdatedArgs, 'tenantId'>>;
  resourceUpdated?: SubscriptionResolver<ResolversTypes['Resource'], "resourceUpdated", ParentType, ContextType, RequireFields<SubscriptionResourceUpdatedArgs, 'tenantId'>>;
}>;

export type Resolvers<ContextType = Context> = ResolversObject<{
  Availability?: AvailabilityResolvers<ContextType>;
  BusinessBreak?: BusinessBreakResolvers<ContextType>;
  BusinessHours?: BusinessHoursResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  Event?: EventResolvers<ContextType>;
  EventConnection?: EventConnectionResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  Mutation?: MutationResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Resource?: ResourceResolvers<ContextType>;
  ResourceConnection?: ResourceConnectionResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
}>;

