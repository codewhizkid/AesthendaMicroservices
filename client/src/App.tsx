import React from 'react';
import { dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { UnifiedCalendar } from './components/Calendar/UnifiedCalendar';
import './App.css';
import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { split } from '@apollo/client';

// Create an HTTP link
const httpLink = new HttpLink({
  uri: 'http://localhost:5005/graphql'
});

// Create a WebSocket link
const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:5005/graphql',
}));

// Split links for subscriptions and queries/mutations
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

// Create Apollo Client
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache()
});

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

function App() {
  // Hardcoded tenant ID for demo purposes - in a real app this would come from authentication
  const tenantId = "tenant-1";
  
  return (
    <ApolloProvider client={client}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Aesthetenda Calendar
            </h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="h-[calc(100vh-12rem)]">
                <UnifiedCalendar
                  localizer={localizer}
                  defaultView="week"
                  defaultDate={new Date()}
                  tenantId={tenantId}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </ApolloProvider>
  );
}

export default App;