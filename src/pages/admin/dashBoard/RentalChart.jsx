import { useMemo } from 'react';
import { completedPayments, dailyRevenue } from '../../../utils/adminRevenue';
import RevenueTrendChart from './RevenueTrendChart';

export default function RentalChart({ rentMovies = [], currency = 'USD' }) {
    const data = useMemo(() => dailyRevenue(completedPayments(rentMovies, { currency })), [rentMovies, currency]);
    return <RevenueTrendChart data={data} currency={currency} rental />;
}
