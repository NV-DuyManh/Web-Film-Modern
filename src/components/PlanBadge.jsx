import { getPlanAppearance } from '../utils/planAppearance';

export default function PlanBadge({ plan, className = '', children }) {
    if (!plan) return null;
    const appearance = getPlanAppearance(plan);
    return (
        <span data-plan-tier={appearance.theme} className={`inline-flex items-center gap-1.5 border rounded-md px-2 py-0.5 text-[10px] font-bold ${appearance.className} ${className}`}>
            {children || plan.name || plan.planName}
        </span>
    );
}
