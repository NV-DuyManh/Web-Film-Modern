import { useEffect, useState } from 'react';
import { db } from '../config/firebaseConfig';
import { createMovieCommentService } from '../services/movieComments';

export const movieCommentService = createMovieCommentService(db);

export default function useMovieComments(movieID) {
    const [state, setState] = useState({ movieID: null, items: [], loading: true, error: null });
    useEffect(() => {
        if (!movieID) return;
        return movieCommentService.subscribe(movieID,
            items => setState({ movieID, items, loading: false, error: null }),
            error => setState(previous => ({ movieID, items: previous.movieID === movieID ? previous.items : [], loading: false, error })));
    }, [movieID]);
    return state.movieID === movieID ? state : { items: [], loading: Boolean(movieID), error: null };
}
