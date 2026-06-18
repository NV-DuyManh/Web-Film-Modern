import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import CategoryProvider from './contexts/CategoryProvider.jsx'
import CategoryTypeProvider from './contexts/CategoryTypeProvider.jsx'
import ActorProvider from './contexts/ActorProvider.jsx'
import AuthorProvider from './contexts/AuthorProvider.jsx'
import CharacterProvider from './contexts/CharacterProvider.jsx'
import MovieProvider from './contexts/MovieProvider.jsx'
import PlanProvider from './contexts/PlanProvider.jsx'
import PackageProvider from './contexts/PackageProvider.jsx'
import FeatureProvider from './contexts/FeatureProvider.jsx'
import EpisodeProvider from './contexts/EpisodeProvider.jsx'
import ShowTimeProvider from './contexts/ShowTimeProvider.jsx'
import { UserProvider } from './contexts/UserProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <CategoryProvider>
        <CategoryTypeProvider>
          <ActorProvider>
            <AuthorProvider>
              <CharacterProvider>
                <MovieProvider>
                  <PlanProvider>
                    <FeatureProvider>
                      <PackageProvider>
                        <EpisodeProvider>
                          <ShowTimeProvider>
                            <UserProvider>
                              <App />
                            </UserProvider>
                          </ShowTimeProvider>
                        </EpisodeProvider>
                      </PackageProvider>
                    </FeatureProvider>
                  </PlanProvider>
                </MovieProvider>
              </CharacterProvider>
            </AuthorProvider>
          </ActorProvider>
        </CategoryTypeProvider>
      </CategoryProvider>
    </BrowserRouter>
  </StrictMode>,
)
