import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import './index.css';
import App from './App.jsx';

import CategoryProvider from './contexts/CategoryProvider.jsx';
import CategoryTypeProvider from './contexts/CategoryTypeProvider.jsx';
import MovieProvider from './contexts/MovieProvider.jsx';
import PlanProvider from './contexts/PlanProvider.jsx';
import PackageProvider from './contexts/PackageProvider.jsx';
import FeatureProvider from './contexts/FeatureProvider.jsx';
import ShowTimeProvider from './contexts/ShowTimeProvider.jsx';
import UserProvider from './contexts/UserProvider.jsx';
import AuthProvider from './contexts/AuthProvider.jsx';
import ReviewProvider from './contexts/ReviewProvider.jsx';
import CommentProvider from './contexts/CommentProvider.jsx';
import RentMovieProvider from './contexts/RentMovieProvider.jsx';
import SubscriptionProvider from './contexts/SubscriptionProvider.jsx';

const providers = [
  CategoryProvider,
  CategoryTypeProvider,
  MovieProvider,
  PlanProvider,
  FeatureProvider,
  PackageProvider,
  ShowTimeProvider,
  UserProvider,
  ReviewProvider,
  CommentProvider,
  RentMovieProvider,
  SubscriptionProvider,
  AuthProvider
];

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        {providers.reduceRight((children, Provider) => {
          return <Provider>{children}</Provider>;
        }, <App />)}
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);
