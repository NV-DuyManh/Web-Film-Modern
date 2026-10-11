import RevenueTrendChart from './RevenueTrendChart';

export default function RevenueChart({ currency = 'USD', data = [] }) {
    return <RevenueTrendChart data={data} currency={currency} />;
}
