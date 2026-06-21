import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import './index.css';
import App from './App.jsx';

import CategoryProvider from './contexts/CategoryProvider.jsx';
import CategoryTypeProvider from './contexts/CategoryTypeProvider.jsx';
import ActorProvider from './contexts/ActorProvider.jsx';
import AuthorProvider from './contexts/AuthorProvider.jsx';
import CharacterProvider from './contexts/CharacterProvider.jsx';
import MovieProvider from './contexts/MovieProvider.jsx';
import PlanProvider from './contexts/PlanProvider.jsx';
import PackageProvider from './contexts/PackageProvider.jsx';
import FeatureProvider from './contexts/FeatureProvider.jsx';
import EpisodeProvider from './contexts/EpisodeProvider.jsx';
import ShowTimeProvider from './contexts/ShowTimeProvider.jsx';
import UserProvider from './contexts/UserProvider.jsx';
import AuthProvider from './contexts/AuthProvider.jsx';

const providers = [
  CategoryProvider,
  CategoryTypeProvider,
  ActorProvider,
  AuthorProvider,
  CharacterProvider,
  MovieProvider,
  PlanProvider,
  FeatureProvider,
  PackageProvider,
  EpisodeProvider,
  ShowTimeProvider,
  UserProvider,
  AuthProvider
];

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      {providers.reduceRight((children, Provider) => {
        return <Provider>{children}</Provider>;
      }, <App />)}
    </BrowserRouter>
  </StrictMode>
);